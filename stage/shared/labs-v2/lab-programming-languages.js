/*@4.LAPLJ.1*/
(function () {
  'use strict';

  /*@4.LAPLJ.2*/
  var LANGS = [
    /*@4.LAPLJ.3*/
    { id: 'javascript', name: 'JavaScript', nameAr: 'جافاسكربت', ver: 'ES2023', tier: 'browser', use: 'curriculum', ext: 'js', color: '#f7df1e', dual: true, srvVer: 'Node 12', ms: 700 },
    { id: 'python', name: 'Python', nameAr: 'بايثون', ver: '3.12', tier: 'browser', use: 'curriculum', ext: 'py', color: '#3776ab', dual: true, srvVer: '3.8', ms: 700 },
    { id: 'sql', name: 'SQL', nameAr: 'إس كيو إل', ver: 'SQLite 3.45', tier: 'browser', use: 'curriculum', ext: 'sql', color: '#e38c00' },
    { id: 'web', name: 'HTML & CSS', nameAr: 'إتش تي إم إل', ver: '', tier: 'browser', use: 'curriculum', ext: 'html', color: '#e34c26' },
    { id: 'marie', name: 'MARIE', nameAr: 'ماري', ver: '', tier: 'browser', use: 'curriculum', ext: 'mas', color: '#8892bf' },

    { id: 'java', name: 'Java', nameAr: 'جافا', ver: '15', tier: 'server', use: 'curriculum', ext: 'java', color: '#e76f00', ms: 2100 },
    { id: 'c', name: 'C', nameAr: 'سي', ver: 'GCC 8.3', tier: 'server', use: 'curriculum', ext: 'c', color: '#659ad2', ms: 700 },
    { id: 'cpp', name: 'C++', nameAr: 'سي بلس بلس', ver: 'GCC 8.3', tier: 'server', use: 'curriculum', ext: 'cpp', color: '#00599c', ms: 2100 },
    { id: 'php', name: 'PHP', nameAr: 'بي إتش بي', ver: '7.4', tier: 'server', use: 'curriculum', ext: 'php', color: '#8892bf', ms: 700 },

    { id: 'kotlin', name: 'Kotlin', nameAr: 'كوتلن', ver: '1.3', tier: 'server', use: 'experiment', ext: 'kt', color: '#a97bff', ms: 3600 },
    { id: 'csharp', name: 'C#', nameAr: 'سي شارب', ver: 'Mono 6.6', tier: 'server', use: 'experiment', ext: 'cs', color: '#68217a', ms: 2100 },
    { id: 'go', name: 'Go', nameAr: 'جو', ver: '1.13', tier: 'server', use: 'experiment', ext: 'go', color: '#00add8', ms: 2100 },
    { id: 'rust', name: 'Rust', nameAr: 'رَست', ver: '1.40', tier: 'server', use: 'experiment', ext: 'rs', color: '#ce422b', ms: 2100 },
    { id: 'typescript', name: 'TypeScript', nameAr: 'تايبسكربت', ver: '3.7', tier: 'server', use: 'experiment', ext: 'ts', color: '#3178c6', ms: 2100 },
    { id: 'ruby', name: 'Ruby', nameAr: 'روبي', ver: '2.7', tier: 'server', use: 'experiment', ext: 'rb', color: '#cc342d', ms: 700 },
    { id: 'r', name: 'R', nameAr: 'آر', ver: '4.0', tier: 'server', use: 'experiment', ext: 'r', color: '#276dc3', ms: 700 },
    { id: 'scala', name: 'Scala', nameAr: 'سكالا', ver: '2.13', tier: 'server', use: 'experiment', ext: 'scala', color: '#dc322f', ms: 3500 },
    { id: 'haskell', name: 'Haskell', nameAr: 'هاسكل', ver: 'GHC 8.8', tier: 'server', use: 'experiment', ext: 'hs', color: '#5e5086', ms: 2100 },
    { id: 'elixir', name: 'Elixir', nameAr: 'إليكسير', ver: '1.9', tier: 'server', use: 'experiment', ext: 'ex', color: '#6e4a7e', ms: 700 },
    { id: 'lua', name: 'Lua', nameAr: 'لوا', ver: '5.3', tier: 'server', use: 'experiment', ext: 'lua', color: '#2c2d72', ms: 700 },
    { id: 'pascal', name: 'Pascal', nameAr: 'باسكال', ver: 'FPC 3.2', tier: 'server', use: 'experiment', ext: 'pas', color: '#e3f171', ms: 700 },
    { id: 'lisp', name: 'Common Lisp', nameAr: 'ليسب', ver: 'SBCL 1.4', tier: 'server', use: 'experiment', ext: 'lisp', color: '#93c', ms: 700 },
    { id: 'perl', name: 'Perl', nameAr: 'بيرل', ver: '5.28', tier: 'server', use: 'experiment', ext: 'pl', color: '#39457e', ms: 700 },
    { id: 'groovy', name: 'Groovy', nameAr: 'جروفي', ver: '3.0', tier: 'server', use: 'experiment', ext: 'groovy', color: '#4298b8', ms: 3600 },

    /*@4.LAPLJ.4*/
    { id: 'octave', name: 'Octave', nameAr: 'أوكتاف', ver: '5.1', tier: 'server', use: 'experiment', ext: 'm', color: '#0790c0', ms: 900 },
    { id: 'fortran', name: 'Fortran', nameAr: 'فورتران', ver: 'GFortran 9.2', tier: 'server', use: 'experiment', ext: 'f90', color: '#734f96', ms: 900 },
    { id: 'erlang', name: 'Erlang', nameAr: 'إرلانج', ver: 'OTP 22', tier: 'server', use: 'experiment', ext: 'erl', color: '#a90533', ms: 900 },
    { id: 'ocaml', name: 'OCaml', nameAr: 'أوكامل', ver: '4.09', tier: 'server', use: 'experiment', ext: 'ml', color: '#ee6a1a', ms: 700 },
    { id: 'bash', name: 'Bash', nameAr: 'باش', ver: '5.0', tier: 'server', use: 'experiment', ext: 'sh', color: '#4eaa25', ms: 700 },
    { id: 'cobol', name: 'COBOL', nameAr: 'كوبول', ver: 'GnuCOBOL 2.2', tier: 'server', use: 'experiment', ext: 'cob', color: '#005ca5', ms: 900 }
  ];

  /*@4.LAPLJ.5*/
  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function L(ar, en) { return isAr() ? ar : en; }

  var T = {
    onDevice:   ['على جهازك', 'On your device'],
    viaExternal:['باستخدام سيرفر خارجي', 'Via an external server'],
    saved:      ['محفوظ', 'Saved'],
    saving:     ['يُحفظ…', 'Saving…'],
    run:        ['شغّل', 'Run'],
    compiling:  ['يترجم…', 'Compiling…'],
    running:    ['يشغّل…', 'Running…'],
    curriculum: ['لغاتٌ درستها في علوم الحاسب', 'Languages from your CS courses'],
    experiment: ['للتجربة', 'To explore'],
    onServer:   ['على الخادم', 'On the server'],
    noOutput:   ['(لا ناتج — لم يُطبع شيء)', '(no output — nothing was printed)'],
    tooLong:    ['تجاوز البرنامجُ ٥ ثوانٍ — غالباً حلقةٌ لا تنتهي.',
                 'The program passed 5 seconds — most likely an endless loop.'],
    tooLongHint:['تحقّق من شرط الخروج في الحلقة. الحدُّ على جهازك ٥ ثوانٍ.',
                 'Check the loop exit condition. The limit on your device is 5 seconds.'],
    errHint:    ['رسالةُ المحرّك أعلاه كما هي — وأولُ سطرٍ فيها يذكر نوعَ الخطأ وموضعَه.',
                 'The engine message above is verbatim — its first line names the error and where it is.'],
    noSandbox:  ['تعذّر إنشاء بيئة التشغيل المعزولة.', 'Could not create the isolated run environment.'],
    simNote:    ['— بروتوتايبُ تصميم: هذه اللغةُ تعمل على سيرفرٍ خارجيّ، و«labs-api» تُبنى في المرحلة ٣.\nوالزمنُ المعروضُ مقيسٌ فعلاً من جرد اللغة على خادمنا. —',
                 '— Design prototype: this language runs on an external server; “labs-api” is built in phase 3.\nThe time shown is really measured from the language sweep on our server. —'],
    termOpen:   ['طرفيةٌ داخل قفصٍ بلا شبكةٍ ولا صلاحيات — تُفتح…',
                 'A shell inside a cage with no network and no privileges — opening…'],
    termReady:  ['كودُك محفوظٌ باسم {file}. اكتب أمرَك ثم Enter، أو اضغط زرّاً بالأسفل.',
                 'Your code is saved as {file}. Type a command then Enter, or press a button below.'],
    termNoCtrlC:['ولا Ctrl+C هنا: زرُّ «إيقاف» في الأعلى يُنهي الجلسة، و«exit» يخرج من الصدفة.',
                 'No Ctrl+C here: the Stop button above ends the session, and “exit” leaves the shell.'],
    termLeft:   ['خرجتَ من الصدفة — انتهت الجلسة.', 'You left the shell — the session ended.'],
    termRun:    ['ترجم وشغّل', 'Compile & run'],
    termTitle:  ['طرفية', 'Terminal'],
    liveTitle:  ['تشغيلٌ تفاعليّ', 'Interactive run'],
    liveHold:   ['اكتب ما يطلبه البرنامجُ ثم Enter…', 'Type what the program asks for, then Enter…'],
    liveOpen:   ['تُفتح جلسةٌ حيّة… أوّلُ تشغيلٍ يترجم فيأخذ ثوانيَ.',
                 'Opening a live session… the first run compiles, so it takes a few seconds.'],
    liveWait:   ['البرنامجُ يعمل — يقف عند كل طلبِ إدخالٍ وينتظرك.',
                 'The program is running — it pauses at every input request and waits for you.'],
    sessOver:   ['انتهت', 'ended'],
    sessClear:  ['مسح', 'Clear'],
    sessStop:   ['إيقاف', 'Stop'],
    sessClose:  ['إغلاق', 'Close'],
    sessBusy:   ['لديك جلسةٌ مفتوحةٌ — تُغلَق ثم تُفتح الجديدة…',
                 'You already have a session open — closing it, then opening the new one…'],
    sessReconnect:['انقطع الطريقُ لحظةً — تُستعاد الجلسة…',
                   'The connection paused — restoring your session…'],
    needsInput: ['هذا البرنامجُ يقرأ إدخالاً من لوحة المفاتيح، ولوحُ «المدخلات» فارغ — فلم يجد ما يقرؤه.',
                 'This program reads keyboard input, and the Input panel is empty — so it found nothing to read.'],
    needsInputGo:['شغّله تفاعليّاً', 'Run it interactively'],
    needsInputFill:['أو اكتب مدخلاتِه في لوح «المدخلات»، سطراً لكل إدخال.',
                 'Or type its inputs in the Input panel, one line per input.'],
    termFiles:  ['الملفات', 'Files'],
    termHold:   ['اكتب أمراً ثم Enter…', 'Type a command, then Enter…'],
    left:       ['طيُّ عمود الملفات', 'Collapse the files column'],
    aiThinking: ['يقرأ كودك…', 'Reading your code…'],
    aiOffline:  ['تعذّر الوصولُ إلى المساعد الآن — حاول بعد قليل.',
                 'The assistant is unreachable right now — try again shortly.'],
    aiCapped:   ['بلغتَ حصّتَك اليوم. تعود غداً — وتتّسع في أسابيع الاختبارات.',
                 'You have used today’s allowance. It resets tomorrow — and widens during exam weeks.'],
    aiNoCode:   ['اكتب كوداً أوّلاً ثم اطلب الشرح.', 'Write some code first, then ask.'],
    aiRunFirst: ['شغّل الكودَ أوّلاً — الشرحُ يقرأ ناتجَه أيضاً.',
                 'Run the code first — the explanation reads its output too.'],
    localTag:   ['محليّ', 'local'],
    outCopy:    ['انسخ', 'Copy'],
    outSave:    ['نزّل', 'Download'],
    outCopied:  ['نُسخ', 'Copied'],
    noSaves:    ['لا نسخَ محفوظةً بعد. احفظ عملَك باسمٍ تعرفه فتجده هنا.',
                 'No saved copies yet. Save your work under a name and it will show up here.'],
    savesCount: ['النسخُ المحفوظة', 'Saved copies'],
    openSave:   ['افتح هذه النسخة', 'Open this copy'],
    delSave:    ['احذف هذه النسخة', 'Delete this copy'],
    sessSlow:   ['تأخّر الردُّ أكثرَ من المعتاد — قد يكون السيرفرُ مشغولاً.',
                 'The reply is slower than usual — the server may be busy.'],
    sessRetry:  ['أعد المحاولة', 'Try again'],
    ownName:    ['اسمُ صفِّك ليس Main، والمُشغِّلُ السريعُ يشترط ذلك — فشُغِّل على مُشغِّلنا الكامل باسمه كما هو.',
                 'Your class is not named Main, which the quick runner requires — so it ran on our full runner under its own name.'],
    manyFiles:  ['مشروعُك أكثرُ من ملفّ — فشُغِّل على مُشغِّلنا الكامل الذي يكتب ملفّاتِك كلَّها في مساحة العمل.',
                 'Your project has more than one file — so it ran on our full runner, which writes every file into the workspace.'],
    guiTitle:   ['برنامجٌ بنافذةٍ رسومية', 'A windowed (GUI) program'],
    guiWhy:     ['كودُك يفتح نافذةَ سطحِ مكتب (Swing/AWT)، والمُشغِّلُ صندوقٌ بلا شاشةٍ ولا نظامِ نوافذ — فيرمي البرنامجُ HeadlessException. وهذا حالُ كلِّ محاكٍ على الإنترنت، لا حالُنا وحدَنا.',
                 'Your code opens a desktop window (Swing/AWT), and the runner is a box with no screen and no window system — so the program throws HeadlessException. Every online runner is the same.'],
    guiFix:     ['وما يعمل هنا: اطبع بـSystem.out، أو ارسم بالمحارف — أو بدّل إلى «HTML & CSS» فترسم في المتصفّح مباشرةً.',
                 'What works here: print with System.out, draw with characters — or switch to “HTML & CSS” and draw right in the browser.'],
    guiToWeb:   ['افتح HTML & CSS', 'Open HTML & CSS'],
    themeTitle: ['ثيمُ المحرّر والطرفية', 'Editor & terminal theme'],
    themeDark:  ['داكنة', 'Dark'],
    themeLight: ['نهارية', 'Light'],
    stripeOn:   ['تظليلُ الأسطر', 'Line striping'],
    stripeHint: ['خطٌّ خافتٌ يفرّق سطراً عن سطر — أطفئه ليخلو سطحُ الرسم.',
                 'A faint band between lines — turn it off for a clean drawing surface.']
  };
  function t(key) { return L(T[key][0], T[key][1]); }

  /**
   * تمييزُ العدد في العربية — لا «1 صفّاً» ولا «3 صفّاً».
   * القاعدة: ١ مفردٌ · ٢ مثنّى · ٣–١٠ جمعٌ مجرور · ١١+ مفردٌ منصوب.
   * @param {number} count
   * @param {[string,string,string,string]} forms [مفرد, مثنّى, جمع, تمييز]
   */
  function plural(count, forms, englishSingular, englishPlural) {
    if (!isAr()) return count + ' ' + (count === 1 ? englishSingular : englishPlural);
    if (count === 1) return forms[0];
    if (count === 2) return forms[1];
    if (count >= 3 && count <= 10) return count + ' ' + forms[2];
    return count + ' ' + forms[3];
  }

  /*@4.LAPLJ.6*/
  var FEATURES = { interactive: true, shell: true, ai: true };

  /*@4.LAPLJ.7*/
  var THEMES = [
    { id: 'garden',   ar: 'الحديقة (يتبع الموقع)', en: 'Garden (follows the site)', dark: null,
      swatch: ['var(--bg-surface)', '#c792ea', '#c3e88d', '#82aaff'] },
    { id: 'terminal', ar: 'طرفية سوداء', en: 'Black terminal', dark: true,
      swatch: ['#000000', '#5fd7ff', '#98e06a', '#ffd75f'] },
    { id: 'vsdark',   ar: 'فيجوال ستوديو — داكن', en: 'Visual Studio — Dark+', dark: true,
      swatch: ['#1e1e1e', '#569cd6', '#ce9178', '#dcdcaa'] },
    { id: 'monokai',  ar: 'مونوكاي', en: 'Monokai', dark: true,
      swatch: ['#272822', '#f92672', '#e6db74', '#a6e22e'] },
    { id: 'dracula',  ar: 'دراكولا', en: 'Dracula', dark: true,
      swatch: ['#282a36', '#ff79c6', '#f1fa8c', '#50fa7b'] },
    { id: 'vslight',  ar: 'فيجوال ستوديو — نهاريّ', en: 'Visual Studio — Light+', dark: false,
      swatch: ['#ffffff', '#0000ff', '#a31515', '#795e26'] },
    { id: 'solar',    ar: 'سولارايزد نهاريّ', en: 'Solarized Light', dark: false,
      swatch: ['#fdf6e3', '#859900', '#2aa198', '#268bd2'] }
  ];
  var THEME_KEY = 'garden_labs_pl_theme';
  var STRIPE_KEY = 'garden_labs_pl_stripe';

  function readPref(key, fallback) {
    try { var value = localStorage.getItem(key); return value === null ? fallback : value; }
    catch (error) { return fallback; }
  }
  function writePref(key, value) {
    try { localStorage.setItem(key, value); } catch (error) { /*@4.LAPLJ.8*/ }
  }

  var $ = function (id) { return document.getElementById(id); };
  var lab = document.querySelector('[data-lab-root]');
  if (!lab) return;

  var current = LANGS[5];
  var buffers = {};

  /*@4.LAPLJ.9*/
  var outTabsBar = document.querySelector('.pl-out-tabs');
  if (outTabsBar && window.ResizeObserver) {
    new ResizeObserver(function () {
      lab.style.setProperty('--pl-tabs-h', outTabsBar.offsetHeight + 'px');
    }).observe(outTabsBar);
  }

  /*@4.LAPLJ.10*/
  var header = document.querySelector('header[data-gh]');
  if (header && window.ResizeObserver) {
    new ResizeObserver(function () {
      lab.style.setProperty('--pl-shell-h', header.offsetHeight + 'px');
    }).observe(header);
  }

  /*@4.LAPLJ.11*/
  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]; });
  }

  var editor = $('plEditor'), gutter = $('plGutter'), hl = $('plHighlight');
  var syntax = window.GardenPLSyntax || null;
  /*@4.LAPLJ.12*/
  var problems = [], flashMark = null, diagnoseTimer = 0;
  /*@4.LAPLJ.13*/
  var lastOutput = [];

  function marks() {
    return flashMark ? problems.concat([flashMark]) : problems;
  }
  function paint() {
    var source = editor.value;
    hl.innerHTML = (syntax ? syntax.render(source, current.id, marks()) : esc(source)) + '\n';
    paintGutter(source);
    hl.scrollTop = editor.scrollTop;
    hl.scrollLeft = editor.scrollLeft;
    gutter.scrollTop = editor.scrollTop;
  }
  /*@4.LAPLJ.14*/
  function paintGutter(source) {
    var count = source.split('\n').length;
    var worst = {};
    problems.forEach(function (item) {
      if (!item.line) return;
      if (worst[item.line] !== 'err') worst[item.line] = item.severity;
    });
    var html = '';
    for (var line = 1; line <= count; line += 1) {
      html += worst[line] ? '<b class="pl-gl is-' + worst[line] + '">' + line + '</b>\n' : line + '\n';
    }
    gutter.innerHTML = html;
  }

  /*@4.LAPLJ.15*/
  function scheduleDiagnose() {
    clearTimeout(diagnoseTimer);
    diagnoseTimer = setTimeout(runDiagnose, 200);
  }
  function runDiagnose() {
    if (!syntax) return;
    var source = editor.value;
    var found = [];
    try { found = syntax.diagnose(source, current.id) || []; } catch (error) { found = []; }

    /*@4.LAPLJ.16*/
    if (current.id === 'javascript' && source.trim()) {
      var real = syntax.realJavaScript(source);
      if (real) {
        var at = lineRange(source, real.line);
        found = found.filter(function (item) { return item.severity !== 'warn'; });
        found.push({ start: at.start, end: at.end, line: real.line, severity: 'err',
          ar: 'خطأٌ نحويّ: ' + real.message, en: 'Syntax error: ' + real.message });
      }
    }
    if (current.id === 'marie' && window.GardenMARIE && source.trim()) {
      var built = window.GardenMARIE.assemble(source);
      if (!built.ok) {
        found = built.errors.map(function (issue) {
          var span = lineRange(source, issue.line);
          return { start: span.start, end: span.end, line: issue.line, severity: 'err',
            ar: issue.message, en: issue.message };
        });
      }
    }
    problems = found;
    paint();
    renderProblems();
  }
  function lineRange(source, line) {
    var lines = source.split('\n');
    var index = Math.min(Math.max(1, line || 1), lines.length) - 1;
    var start = 0;
    for (var i = 0; i < index; i += 1) start += lines[i].length + 1;
    var text = lines[index];
    var lead = text.length - text.replace(/^\s+/, '').length;
    return { start: start + lead, end: start + text.replace(/\s+$/, '').length || start + text.length };
  }

  editor.addEventListener('input', function () { paint(); markDirty(); scheduleDiagnose(); });
  editor.addEventListener('scroll', function () {
    hl.scrollTop = editor.scrollTop; hl.scrollLeft = editor.scrollLeft;
    gutter.scrollTop = editor.scrollTop;
  });
  editor.addEventListener('keydown', function (event) {
    if (event.key === 'Tab') { event.preventDefault(); insert('    '); }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); run(); }
  });
  function insert(text) {
    var start = editor.selectionStart, end = editor.selectionEnd;
    editor.value = editor.value.slice(0, start) + text + editor.value.slice(end);
    editor.selectionStart = editor.selectionEnd = start + text.length;
    editor.focus(); paint();
  }

  /*@4.LAPLJ.17*/
  var savedTimer;
  /*@4.LAPLJ.18*/
  var projects = {};
  var activeFile = null;

  function projectFiles() {
    if (!projects[current.id]) projects[current.id] = [];
    return projects[current.id];
  }
  function findFile(name) {
    return projectFiles().filter(function (file) { return file.name === name; })[0] || null;
  }
  /*@4.LAPLJ.19*/
  function entrySource() {
    stashEditor();
    return buffers[current.id] !== undefined ? buffers[current.id] : editor.value;
  }

  /*@4.LAPLJ.20*/
  function stashEditor() {
    if (activeFile) {
      var file = findFile(activeFile);
      if (file) file.content = editor.value;
    } else {
      buffers[current.id] = editor.value;
    }
  }

  function snapshot() {
    stashEditor();
    return {
      lang: current.id, buffers: buffers, stdin: $('plStdin').value,
      projects: projects, activeFile: activeFile
    };
  }
  function markSaved(ok) {
    var badge = $('plSaved');
    badge.className = 'pl-saved' + (ok ? '' : ' is-warn');
    badge.innerHTML = ok
      ? '<i class="fa-solid fa-check"></i> ' + t('saved')
      : '<i class="fa-solid fa-triangle-exclamation"></i> ' + L('لم يُحفظ', 'Not saved');
    badge.setAttribute('data-tip-ar', ok
      ? 'يُحفظ على جهازك تلقائياً، ويُزامَن مع بقية أجهزتك.'
      : 'تعذّر الحفظُ على هذا الجهاز — صدّر نسخةً قبل إغلاق الصفحة.');
    badge.setAttribute('data-tip-en', ok
      ? 'Saved on your device automatically, and synced to your other devices.'
      : 'Could not save on this device — export a copy before closing the page.');
  }
  function markDirty() {
    var badge = $('plSaved');
    badge.className = 'pl-saved';
    badge.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ' + t('saving');
    clearTimeout(savedTimer);
    savedTimer = setTimeout(function () {
      var store = window.GardenPLStore;
      markSaved(store ? store.save(snapshot()) : false);
    }, 700);
  }

  $('plKeys').addEventListener('click', function (event) {
    var button = event.target.closest('button[data-k]');
    if (button) insert(button.dataset.k === '\\t' ? '    ' : button.dataset.k);
  });

  /*@4.LAPLJ.21*/
  var tip = document.createElement('div');
  tip.id = 'pl-tip'; tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  var tipTimer;
  function showTip(host) {
    var text = isAr() ? host.getAttribute('data-tip-ar') : host.getAttribute('data-tip-en');
    if (!text) return;
    tip.textContent = text;
    tip.classList.add('on');
    var box = host.getBoundingClientRect();
    var width = tip.offsetWidth, height = tip.offsetHeight;
    var top = box.bottom + 8;
    if (top + height > innerHeight - 8) top = box.top - height - 8;
    var left = box.left + box.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, innerWidth - width - 8));
    tip.style.top = top + 'px'; tip.style.left = left + 'px';
  }
  function hideTip() { clearTimeout(tipTimer); tip.classList.remove('on'); }
  ['mouseenter', 'focus'].forEach(function (type) {
    lab.addEventListener(type, function (event) {
      var host = event.target.closest && event.target.closest('[data-tip-ar]');
      if (!host) return;
      clearTimeout(tipTimer);
      tipTimer = setTimeout(function () { showTip(host); }, 380);
    }, true);
  });
  ['mouseleave', 'blur', 'click'].forEach(function (type) {
    lab.addEventListener(type, hideTip, true);
  });

  /*@4.LAPLJ.22*/
  var pop = $('plLangPop'), langButton = $('plLangBtn');
  function buildPop() {
    var html = '';
    ['curriculum', 'experiment'].forEach(function (use) {
      var group = LANGS.filter(function (l) { return l.use === use; });
      if (!group.length) return;
      html += '<div class="pl-sep"><span>' + t(use) + '</span></div>';
      group.forEach(function (l) {
        html += '<button class="pl-opt' + (l.id === current.id ? ' is-on' : '') + '" data-lang="' + l.id + '" role="option">' +
          '<span class="pl-dot" style="--lang-color:' + l.color + '"></span>' +
          '<span class="pl-opt-name">' + l.name + '</span>' +
          '<span class="pl-opt-ver">' + l.ver + '</span>' +
          '<span class="pl-opt-where' + (whereOf(l) === 'browser' ? ' is-browser' : '') + '">' +
          (whereOf(l) === 'browser' ? t('onDevice') : t('onServer')) + '</span></button>';
      });
    });
    pop.innerHTML = html;
  }
  function togglePop(open) {
    var next = open === undefined ? pop.hidden : open;
    pop.hidden = !next;
    langButton.setAttribute('aria-expanded', String(next));
  }
  langButton.addEventListener('click', function (event) { event.stopPropagation(); hideTip(); togglePop(); });
  document.addEventListener('click', function () { togglePop(false); });
  pop.addEventListener('click', function (event) {
    var option = event.target.closest('[data-lang]');
    if (!option) return;
    var found = LANGS.filter(function (l) { return l.id === option.dataset.lang; })[0];
    if (found) selectLanguage(found);
    togglePop(false);
  });

  var SAMPLES = {
    java: 'public class Main {\n    public static void main(String[] args) {\n        int[] grades = {88, 92, 75, 60, 95};\n        int sum = 0;\n        for (int g : grades) sum += g;\n        System.out.println("Average = " + (sum / grades.length));\n    }\n}',
    javascript: 'const grades = [88, 92, 75, 60, 95];\nconst sum = grades.reduce((a, b) => a + b, 0);\nconsole.log("المتوسط =", sum / grades.length);\n\nfor (const g of grades) {\n  console.log(g >= 80 ? `${g} ناجح بتفوق` : `${g} مقبول`);\n}',
    python: '# متوسّطُ الدرجات\ngrades = [88, 92, 75, 60, 95]\nprint("المتوسط =", sum(grades) / len(grades))',
    sql: 'CREATE TABLE student(id INTEGER, name TEXT, grade INTEGER);\nINSERT INTO student VALUES (1, \'Sara\', 92), (2, \'Omar\', 75);\nSELECT name, grade FROM student WHERE grade > 80;',
    c: '#include <stdio.h>\n\nint main(void) {\n    int grades[] = {88, 92, 75, 60, 95};\n    int sum = 0;\n    for (int i = 0; i < 5; i++) sum += grades[i];\n    printf("Average = %d\\n", sum / 5);\n    return 0;\n}',
    web: "<!doctype html>\n<meta charset=\"utf-8\">\n<style>\n  body { font-family: system-ui; padding: 1.2rem; }\n  .card { border: 1px solid #ddd; border-radius: 10px; padding: 1rem; }\n  h1 { color: #7c3aed; margin: 0 0 .4rem; }\n</style>\n\n<div class=\"card\">\n  <h1>مرحباً بالحديقة</h1>\n  <p>عدّل هذا الكود واضغط شغّل — المعاينة تتغيّر فوراً.</p>\n  <button onclick=\"this.textContent = 'ضُغِط!'\">اضغطني</button>\n</div>",
    marie: '/ اجمع عددين من لوح المدخلات\nINPUT\nSTORE X\nINPUT\nADD X\nOUTPUT\nHALT\nX, DEC 0',

    /*@4.LAPLJ.23*/
    cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> grades = {88, 92, 75, 60, 95};\n    int sum = 0;\n    for (int g : grades) sum += g;\n    cout << "Average = " << sum / grades.size() << endl;\n    return 0;\n}',
    php: '<?php\n$grades = [88, 92, 75, 60, 95];\n$avg = array_sum($grades) / count($grades);\necho "Average = $avg\\n";\n\nforeach ($grades as $g) {\n    echo $g . ($g >= 80 ? " ناجح بتفوق" : " مقبول") . "\\n";\n}',
    kotlin: 'fun main() {\n    val grades = listOf(88, 92, 75, 60, 95)\n    println("Average = " + grades.average())\n    grades.forEach { g ->\n        println("$g -> " + if (g >= 80) "ناجح بتفوق" else "مقبول")\n    }\n}',
    csharp: 'using System;\nusing System.Linq;\n\nclass Program {\n    static void Main() {\n        int[] grades = { 88, 92, 75, 60, 95 };\n        Console.WriteLine("Average = " + grades.Average());\n        foreach (var g in grades)\n            Console.WriteLine(g + " -> " + (g >= 80 ? "ناجح بتفوق" : "مقبول"));\n    }\n}',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tgrades := []int{88, 92, 75, 60, 95}\n\tsum := 0\n\tfor _, g := range grades {\n\t\tsum += g\n\t}\n\tfmt.Println("Average =", sum/len(grades))\n\tfor _, g := range grades {\n\t\tif g >= 80 {\n\t\t\tfmt.Println(g, "ناجح بتفوق")\n\t\t} else {\n\t\t\tfmt.Println(g, "مقبول")\n\t\t}\n\t}\n}',
    rust: 'fn main() {\n    let grades = [88, 92, 75, 60, 95];\n    let sum: i32 = grades.iter().sum();\n    println!("Average = {}", sum / grades.len() as i32);\n\n    for g in grades.iter() {\n        println!("{} -> {}", g, if *g >= 80 { "ناجح بتفوق" } else { "مقبول" });\n    }\n}',
    typescript: 'const grades: number[] = [88, 92, 75, 60, 95];\nconst sum: number = grades.reduce((a, b) => a + b, 0);\nconsole.log("Average =", sum / grades.length);\n\ngrades.forEach((g: number) => {\n  console.log(g, g >= 80 ? "ناجح بتفوق" : "مقبول");\n});',
    ruby: 'grades = [88, 92, 75, 60, 95]\nputs "Average = #{grades.sum / grades.size}"\n\ngrades.each do |g|\n  puts "#{g} -> #{g >= 80 ? \'ناجح بتفوق\' : \'مقبول\'}"\nend',
    r: 'grades <- c(88, 92, 75, 60, 95)\ncat("Average =", mean(grades), "\\n")\n\nfor (g in grades) {\n  cat(g, ifelse(g >= 80, "ناجح بتفوق", "مقبول"), "\\n")\n}',
    scala: 'object Main extends App {\n  val grades = List(88, 92, 75, 60, 95)\n  println("Average = " + grades.sum / grades.size)\n\n  grades.foreach { g =>\n    println(g + " -> " + (if (g >= 80) "ناجح بتفوق" else "مقبول"))\n  }\n}',
    haskell: 'main :: IO ()\nmain = do\n  let grades = [88, 92, 75, 60, 95] :: [Int]\n  putStrLn ("Average = " ++ show (sum grades `div` length grades))\n  mapM_ report grades\n\nreport :: Int -> IO ()\nreport g = putStrLn (show g ++ " -> " ++ if g >= 80 then "ناجح بتفوق" else "مقبول")',
    elixir: 'grades = [88, 92, 75, 60, 95]\navg = Enum.sum(grades) / length(grades)\nIO.puts("Average = #{avg}")\n\nEnum.each(grades, fn g ->\n  IO.puts("#{g} -> #{if g >= 80, do: "ناجح بتفوق", else: "مقبول"}")\nend)',
    lua: 'local grades = {88, 92, 75, 60, 95}\nlocal sum = 0\nfor _, g in ipairs(grades) do sum = sum + g end\nprint("Average = " .. sum / #grades)\n\nfor _, g in ipairs(grades) do\n  print(g .. " -> " .. (g >= 80 and "ناجح بتفوق" or "مقبول"))\nend',
    pascal: 'program Averages;\nvar\n  grades: array[1..5] of integer = (88, 92, 75, 60, 95);\n  i, sum: integer;\nbegin\n  sum := 0;\n  for i := 1 to 5 do\n    sum := sum + grades[i];\n  writeln(\'Average = \', sum div 5);\n  for i := 1 to 5 do\n    if grades[i] >= 80 then\n      writeln(grades[i], \' -> pass with honours\')\n    else\n      writeln(grades[i], \' -> pass\');\nend.',
    lisp: '(defvar grades \'(88 92 75 60 95))\n\n(format t "Average = ~a~%" (floor (reduce #\'+ grades) (length grades)))\n\n(dolist (g grades)\n  (format t "~a -> ~a~%" g (if (>= g 80) "ناجح بتفوق" "مقبول")))',
    perl: 'use strict;\nuse warnings;\nuse utf8;\nbinmode(STDOUT, \':encoding(UTF-8)\');\n\nmy @grades = (88, 92, 75, 60, 95);\nmy $sum = 0;\n$sum += $_ for @grades;\nprintf("Average = %d\\n", $sum / scalar(@grades));\n\nfor my $g (@grades) {\n    print "$g -> " . ($g >= 80 ? "ناجح بتفوق" : "مقبول") . "\\n";\n}',
    groovy: 'def grades = [88, 92, 75, 60, 95]\nprintln "Average = " + (grades.sum() / grades.size())\n\ngrades.each { g ->\n    println "$g -> " + (g >= 80 ? "ناجح بتفوق" : "مقبول")\n}',
    /*@4.LAPLJ.24*/
    octave: '% متوسّطُ الدرجات\ngrades = [88 92 75 60 95];\nprintf("Average = %d\\n", mean(grades));\nfor g = grades\n  if g >= 80\n    printf("%d -> ناجح بتفوق\\n", g);\n  else\n    printf("%d -> مقبول\\n", g);\n  end\nend',
    fortran: 'program averages\n  implicit none\n  integer :: grades(5) = (/ 88, 92, 75, 60, 95 /)\n  integer :: i\n  print *, "Average =", sum(grades) / size(grades)\n  do i = 1, 5\n    if (grades(i) >= 80) then\n      print *, grades(i), " -> ناجح بتفوق"\n    else\n      print *, grades(i), " -> مقبول"\n    end if\n  end do\nend program averages',
    erlang: '%% coding: utf-8\n-module(main).\n-export([main/1]).\n\nmain(_) ->\n    io:setopts(standard_io, [{encoding, unicode}]),\n    Grades = [88, 92, 75, 60, 95],\n    io:format("Average = ~p~n", [lists:sum(Grades) div length(Grades)]),\n    lists:foreach(fun(G) ->\n        Verdict = case G >= 80 of\n            true -> "ناجح بتفوق";\n            false -> "مقبول"\n        end,\n        io:format("~p -> ~ts~n", [G, Verdict])\n    end, Grades).',
    ocaml: 'let () =\n  let grades = [88; 92; 75; 60; 95] in\n  let sum = List.fold_left (+) 0 grades in\n  Printf.printf "Average = %d\\n" (sum / List.length grades);\n  List.iter (fun g ->\n    Printf.printf "%d -> %s\\n" g (if g >= 80 then "ناجح بتفوق" else "مقبول")\n  ) grades',
    bash: '#!/usr/bin/env bash\ngrades=(88 92 75 60 95)\nsum=0\nfor g in "${grades[@]}"; do sum=$((sum + g)); done\necho "Average = $((sum / ${#grades[@]}))"\n\nfor g in "${grades[@]}"; do\n  if (( g >= 80 )); then\n    echo "$g -> ناجح بتفوق"\n  else\n    echo "$g -> مقبول"\n  fi\ndone',
    cobol: 'IDENTIFICATION DIVISION.\nPROGRAM-ID. AVERAGES.\nDATA DIVISION.\nWORKING-STORAGE SECTION.\n01 GRADES-TABLE.\n   05 GRADE-ITEM PIC 9(3) OCCURS 5 TIMES.\n01 IDX      PIC 9(2).\n01 TOTAL    PIC 9(5) VALUE 0.\n*> صورةُ العرض ZZ9 تُبدّل الأصفارَ البادئةَ فراغاً — وهذه هي فكرةُ PIC\n01 AVERAGE-GRADE PIC ZZ9.\n01 GRADE-OUT     PIC ZZ9.\nPROCEDURE DIVISION.\n    MOVE 88 TO GRADE-ITEM(1)\n    MOVE 92 TO GRADE-ITEM(2)\n    MOVE 75 TO GRADE-ITEM(3)\n    MOVE 60 TO GRADE-ITEM(4)\n    MOVE 95 TO GRADE-ITEM(5)\n    PERFORM VARYING IDX FROM 1 BY 1 UNTIL IDX > 5\n        ADD GRADE-ITEM(IDX) TO TOTAL\n    END-PERFORM\n    DIVIDE TOTAL BY 5 GIVING AVERAGE-GRADE\n    DISPLAY "Average = " AVERAGE-GRADE\n    PERFORM VARYING IDX FROM 1 BY 1 UNTIL IDX > 5\n        MOVE GRADE-ITEM(IDX) TO GRADE-OUT\n        IF GRADE-ITEM(IDX) >= 80\n            DISPLAY GRADE-OUT " -> ناجح بتفوق"\n        ELSE\n            DISPLAY GRADE-OUT " -> مقبول"\n        END-IF\n    END-PERFORM\n    STOP RUN.\n'
  };
  /*@4.LAPLJ.25*/
  var READS_INPUT = {
    java: /new\s+Scanner|BufferedReader|System\.in/,
    python: /\binput\s*\(/,
    c: /\bscanf|\bgets\b|fgets\s*\(|getchar\s*\(/,
    cpp: /\bcin\s*>>|getline\s*\(\s*cin/,
    php: /fgets\s*\(\s*STDIN|readline\s*\(|STDIN/,
    csharp: /Console\.Read/,
    go: /fmt\.Scan|bufio\.NewScanner\s*\(\s*os\.Stdin|bufio\.NewReader\s*\(\s*os\.Stdin/,
    rust: /read_line|stdin\s*\(/,
    typescript: /readline|process\.stdin/,
    javascript: /\bprompt\s*\(|process\.stdin/,
    ruby: /\bgets\b|STDIN/,
    kotlin: /readLine\s*\(/,
    scala: /readLine|StdIn\./,
    r: /readLines\s*\(|scan\s*\(/,
    haskell: /getLine|getContents|interact\b/,
    elixir: /IO\.gets/,
    lua: /io\.read/,
    pascal: /\bread(ln)?\s*\(/i,
    lisp: /read-line/,
    perl: /<STDIN>/,
    groovy: /System\.in|readLine\s*\(/,
    marie: /^\s*INPUT\b/mi,
    /*@4.LAPLJ.26*/
    bash: /\bread\s+(-[rp]\s+)*[A-Za-z_]/,
    erlang: /io:get_line|io:fread/,
    fortran: /\bread\s*\(\s*\*/i,
    ocaml: /read_line\s*\(\s*\)|read_int\s*\(\s*\)|Scanf\./,
    octave: /\binput\s*\(|\bkeyboard\b/,
    cobol: /\bACCEPT\b/i
  };
  /*@4.LAPLJ.27*/
  function outputText() {
    return lastOutput.join('\n');
  }
  function outputCopyButton() {
    var copy = document.createElement('button');
    copy.className = 'pl-mini';
    copy.innerHTML = '<i class="fa-regular fa-copy"></i>';
    copy.setAttribute('data-tip-ar', 'انسخ الناتجَ كاملاً');
    copy.setAttribute('data-tip-en', 'Copy the whole output');
    copy.addEventListener('click', function () {
      try {
        navigator.clipboard.writeText(outputText());
        copy.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(function () { copy.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 1400);
      } catch (error) { /*@4.LAPLJ.28*/ }
    });
    return copy;
  }
  function outputSaveButton() {
    var save = document.createElement('button');
    save.className = 'pl-mini';
    save.innerHTML = '<i class="fa-solid fa-download"></i>';
    save.setAttribute('data-tip-ar', 'نزّل الناتجَ ملفَّ نصّ');
    save.setAttribute('data-tip-en', 'Download the output as a text file');
    save.addEventListener('click', function () {
      var stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      downloadText((current ? current.id : 'output') + '-' + stamp + '.txt', outputText());
    });
    return save;
  }
  /*@4.LAPLJ.29*/
  function downloadText(name, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function readsInput(langId, code) {
    var pattern = READS_INPUT[langId];
    return !!pattern && pattern.test(code);
  }
  /*@4.LAPLJ.30*/
  function inputHint() {
    var host = document.querySelector('[data-out-panel="stdout"]');
    if (!host || host.querySelector('.pl-hint-input')) return;
    var box = document.createElement('div');
    box.className = 'pl-hint pl-hint-input';
    box.setAttribute('dir', 'auto');
    box.innerHTML = '<i class="fa-solid fa-keyboard"></i>';
    box.appendChild(document.createTextNode(t('needsInput')));
    var row = document.createElement('div');
    row.className = 'pl-hint-row';
    if (runWhere() === 'server' && FEATURES.interactive) {
      var go = document.createElement('button');
      go.type = 'button';
      go.className = 'pl-hint-go';
      go.innerHTML = '<i class="fa-solid fa-keyboard"></i>';
      go.appendChild(document.createTextNode(t('needsInputGo')));
      go.addEventListener('click', function () { startSession('run'); });
      row.appendChild(go);
    }
    var fill = document.createElement('button');
    fill.type = 'button';
    fill.className = 'pl-hint-alt';
    fill.textContent = t('needsInputFill');
    fill.addEventListener('click', function () {
      var tab = document.querySelector('.pl-out-tab[data-out="stdin"]');
      if (tab) tab.click();
      var field = $('plStdin');
      if (field) field.focus();
    });
    row.appendChild(fill);
    box.appendChild(row);
    host.appendChild(box);
  }

  /*@4.LAPLJ.31*/
  var SAMPLE_STDIN = { marie: '12 30' };

  function sampleFor(lang) {
    return SAMPLES[lang.id] || '// ' + lang.name + (lang.ver ? ' ' + lang.ver : '') + '\n';
  }
  /*@4.LAPLJ.32*/
  function seedStdin(langId, isSample) {
    var field = $('plStdin');
    if (!field || !isSample) return;
    var seed = SAMPLE_STDIN[langId];
    if (seed && !field.value.trim()) field.value = seed;
  }

  /*@4.LAPLJ.33*/
  var WHERE_KEY = 'garden_labs_pl_where';
  var wherePref = {};
  try { wherePref = JSON.parse(localStorage.getItem(WHERE_KEY) || '{}') || {}; } catch (error) { wherePref = {}; }

  function whereOf(lang) {
    if (!lang) return 'browser';
    return (lang.dual && wherePref[lang.id] === 'server') ? 'server' : lang.tier;
  }
  /*@4.LAPLJ.34*/
  function runWhere() { return whereOf(current); }

  function setWhere(lang, place) {
    if (place === lang.tier) delete wherePref[lang.id];
    else wherePref[lang.id] = place;
    try { localStorage.setItem(WHERE_KEY, JSON.stringify(wherePref)); } catch (error) { /*@4.LAPLJ.35*/ }
  }

  /*@4.LAPLJ.36*/
  function paintPlace() {
    if (!current) return;
    var lang = current;
    var here = whereOf(lang) === 'browser';
    var tier = $('plTier');
    tier.className = 'pl-tier' + (here ? ' is-browser' : '') + (lang.dual ? ' is-switch' : '');
    tier.innerHTML = (here
      ? '<i class="fa-solid fa-microchip"></i> <span>' + t('onDevice') + '</span>'
      : '<i class="fa-solid fa-server"></i> <span>' + t('viaExternal') + '</span>') +
      (lang.dual ? ' <i class="fa-solid fa-right-left pl-tier-swap"></i>' : '');
    tier.disabled = !lang.dual;
    tier.setAttribute('data-tip-ar', lang.dual
      ? (here ? 'تعمل على جهازك: بلا انتظارٍ وبلا حصّة. اضغط لتشغيلها على الخادم فتكسب ملفّاتٍ حقيقيةً وجلسةً تفاعليةً وطرفية.'
              : 'تعمل على الخادم: ملفّاتٌ حقيقيةٌ ومكتبةٌ قياسيةٌ كاملةٌ وطرفية. اضغط لتعود إلى جهازك — أسرع، وبلا حصّة.')
      : (here ? 'تعمل على جهازك مباشرةً: بلا انتظارٍ وبلا حصّة، وتعمل ولو كان السيرفر متوقفاً.'
              : 'تُرسَل إلى سيرفرٍ خارجيٍّ يترجمها ويشغّلها في قفصٍ بلا شبكة، ثم يعود الناتج.'));
    tier.setAttribute('data-tip-en', lang.dual
      ? (here ? 'Runs on your device: no wait, no quota. Tap to run it on the server for real files, a live session and a terminal.'
              : 'Runs on the server: real files, the full standard library and a terminal. Tap to go back to your device — faster, no quota.')
      : (here ? 'Runs right on your device: no wait, no quota, and it works even if the server is down.'
              : 'Sent to an external server that compiles and runs it in a network-less cage, then returns the output.'));
    /*@4.LAPLJ.37*/
    $('plLangVer').textContent = (!here && lang.srvVer) ? lang.srvVer : lang.ver;
    /*@4.LAPLJ.38*/
    var live = $('plInteractive');
    if (live) live.hidden = !FEATURES.interactive || here;
    var term = $('plTerm');
    if (term) term.hidden = !FEATURES.shell || here;
  }

  function selectLanguage(lang) {
    if (current && current.id !== lang.id) buffers[current.id] = editor.value;
    current = lang;
    $('plLangName').textContent = lang.name;
    lab.style.setProperty('--lang-color', lang.color);
    activeFile = null;                 /*@4.LAPLJ.39*/
    var fresh = buffers[lang.id] === undefined;
    editor.value = fresh ? sampleFor(lang) : buffers[lang.id];
    seedStdin(lang.id, fresh);
    paintPlace();
    renderFilesPanel();
    paint(); buildPop(); scheduleDiagnose();
    /*@4.LAPLJ.40*/
    if (libraryOpened) {
      loadIndex().then(function (index) {
        return index.languages[lang.id] ? loadLang(lang.id) : [];
      }).then(function () {
        if (current.id === lang.id) renderExamplesPanel();
      }, function () { });
      renderExamplesPanel();
    }
  }

  /*@4.LAPLJ.41*/
  var tierChip = $('plTier');
  if (tierChip) {
    tierChip.addEventListener('click', function () {
      if (!current || !current.dual) return;
      var next = whereOf(current) === 'browser' ? 'server' : 'browser';
      setWhere(current, next);
      paintPlace();
      renderFilesPanel();
      toast(next === 'server'
        ? L(current.name + ' ' + (current.srvVer || '') + ' على الخادم — ملفّاتٌ وجلسةٌ وطرفية.',
            current.name + ' ' + (current.srvVer || '') + ' on the server — files, a live session and a terminal.')
        : L(current.name + ' ' + current.ver + ' على جهازك — فوريٌّ وبلا حصّة.',
            current.name + ' ' + current.ver + ' on your device — instant, no quota.'));
    });
  }

  /*@4.LAPLJ.42*/
  var runButton = $('plRun');
  function runLabel(state) {
    var icon = state ? '<i class="fa-solid fa-circle-notch fa-spin"></i> ' : '<i class="fa-solid fa-play"></i> ';
    var text = state || t('run');
    runButton.innerHTML = icon + '<span>' + text + '</span>' +
      (state ? '' : ' <kbd class="ltr">Ctrl↵</kbd>');
  }
  /*@4.LAPLJ.43*/

  /*@4.LAPLJ.44*/
  var ANSI_FG = { 30: 'k', 31: 'r', 32: 'g', 33: 'y', 34: 'b', 35: 'm', 36: 'c', 37: 'w',
                  90: 'k1', 91: 'r1', 92: 'g1', 93: 'y1', 94: 'b1', 95: 'm1', 96: 'c1', 97: 'w1' };
  var ANSI_RE = /\[([0-9;]*)([A-Za-z])/g;
  function hasAnsi(text) { ANSI_RE.lastIndex = 0; return ANSI_RE.test(String(text)); }
  function ansiParts(text) {
    var source = String(text), parts = [], at = 0, match;
    var state = { fg: '', bold: false, dim: false, under: false };
    var pushText = function (slice) {
      if (slice) parts.push({ text: slice, fg: state.fg, bold: state.bold, dim: state.dim, under: state.under });
    };
    ANSI_RE.lastIndex = 0;
    while ((match = ANSI_RE.exec(source)) !== null) {
      pushText(source.slice(at, match.index));
      at = match.index + match[0].length;
      if (match[2] !== 'm') continue;
      var codes = match[1].split(';');
      for (var i = 0; i < codes.length; i += 1) {
        var code = parseInt(codes[i] || '0', 10);
        if (code === 0) state = { fg: '', bold: false, dim: false, under: false };
        else if (code === 1) state.bold = true;
        else if (code === 2) state.dim = true;
        else if (code === 4) state.under = true;
        else if (code === 22) { state.bold = false; state.dim = false; }
        else if (code === 24) state.under = false;
        else if (code === 39) state.fg = '';
        else if (ANSI_FG[code]) state.fg = ANSI_FG[code];
      }
    }
    pushText(source.slice(at));
    return parts;
  }
  /*@4.LAPLJ.45*/
  function stripAnsi(text) {
    return String(text).replace(/\[[0-9;]*[A-Za-z]/g, '');
  }

  /*@4.LAPLJ.46*/
  var AT_PATTERNS = [
    /(?:^|[\s(])([A-Za-z0-9_.\-]+\.[A-Za-z]{1,6}):(\d+)(?::(\d+))?/,
    /\bline\s+(\d+)\b/i,
    /\bالسطر\s+(\d+)\b/
  ];
  function findLineNumber(text) {
    for (var i = 0; i < AT_PATTERNS.length; i += 1) {
      var found = text.match(AT_PATTERNS[i]);
      if (found) {
        var value = parseInt(i === 0 ? found[2] : found[1], 10);
        if (value > 0) return value;
      }
    }
    return 0;
  }

  /*@4.LAPLJ.47*/
  function jumpToLine(lineNumber) {
    var lines = editor.value.split('\n');
    if (lineNumber < 1 || lineNumber > lines.length) return;
    var offset = 0;
    for (var i = 0; i < lineNumber - 1; i += 1) offset += lines[i].length + 1;
    editor.focus();
    editor.setSelectionRange(offset, offset + lines[lineNumber - 1].length);
    /*@4.LAPLJ.48*/
    var lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 20;
    editor.scrollTop = Math.max(0, (lineNumber - 3) * lineHeight);
    hl.scrollTop = editor.scrollTop;
    gutter.scrollTop = editor.scrollTop;
    flashLine(lineNumber);
  }
  var flashTimer = 0;
  function flashLine(lineNumber) {
    var span = lineRange(editor.value, lineNumber);
    flashMark = { start: span.start, end: span.end, severity: 'flash' };
    paint();
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { flashMark = null; paint(); }, 1200);
  }

  /*@4.LAPLJ.49*/
  function renderProblems() {
    var host = $('plProblems');
    if (!host) return;
    var badge = $('plProblemN');
    var errors = problems.filter(function (item) { return item.severity === 'err'; }).length;
    if (badge) {
      badge.textContent = problems.length ? String(problems.length) : '';
      badge.hidden = !problems.length;
      badge.classList.toggle('is-err', errors > 0);
    }
    host.textContent = '';
    if (!problems.length) {
      var clean = document.createElement('div');
      clean.className = 'pl-empty';
      clean.innerHTML = '<i class="fa-regular fa-circle-check"></i>';
      var note = document.createElement('p');
      note.textContent = L('لا مشاكل — الكودُ سليمٌ في بنيته.',
        'No problems — the code is structurally sound.');
      clean.appendChild(note);
      host.appendChild(clean);
      return;
    }
    problems.forEach(function (item) {
      var row = document.createElement('button');
      row.className = 'pl-problem is-' + item.severity;
      row.type = 'button';
      var icon = document.createElement('i');
      icon.className = 'fa-solid ' + (item.severity === 'err' ? 'fa-circle-exclamation' : 'fa-triangle-exclamation');
      row.appendChild(icon);
      var text = document.createElement('span');
      text.setAttribute('dir', 'auto');
      text.textContent = isAr() ? item.ar : item.en;
      row.appendChild(text);
      var where = document.createElement('em');
      where.className = 'ltr';
      where.textContent = L('سطر ', 'line ') + (item.line || 1);
      row.appendChild(where);
      row.addEventListener('click', function () { jumpToLine(item.line || 1); });
      host.appendChild(row);
    });
  }

  /**
   * @param {{verdict?:string, ms?:number, memory?:string, exit?:number}} status
   * @param {Array<{text:string, kind?:string}>} lines
   */
  /*@4.LAPLJ.50*/
  var lastResult = null, lastHint = null;

  function showResult(status, lines, meta) {
    /*@4.LAPLJ.51*/
    dropConsole();
    var bar = $('plStatus');
    if (status) {
      bar.hidden = false;
      bar.textContent = '';
      var verdict = document.createElement('span');
      var kind = status.verdict || 'ok';
      verdict.className = 'pl-verdict ' + kind;
      verdict.innerHTML = '<i class="fa-solid ' +
        (kind === 'ok' ? 'fa-circle-check' : kind === 'warn' ? 'fa-clock' : 'fa-circle-xmark') +
        '"></i> ' + L(
          kind === 'ok' ? 'انتهى بنجاح' : kind === 'warn' ? 'انتهت المهلة' : 'انتهى بخطأ',
          kind === 'ok' ? 'Finished' : kind === 'warn' ? 'Timed out' : 'Finished with an error');
      bar.appendChild(verdict);
      var stat = function (icon, text, tipAr, tipEn, tint) {
        var node = document.createElement('span');
        node.className = 'pl-stat' + (tint ? ' pl-tint' : '');
        if (tint) node.style.setProperty('--tint', tint);
        node.innerHTML = '<i class="fa-solid ' + icon + '"></i>';
        node.appendChild(document.createTextNode(text));
        if (tipAr) { node.setAttribute('data-tip-ar', tipAr); node.setAttribute('data-tip-en', tipEn); }
        bar.appendChild(node);
      };
      if (status.ms !== undefined) {
        stat('fa-stopwatch', status.ms < 1000 ? status.ms + 'ms' : (status.ms / 1000).toFixed(1) + 's',
          'زمنُ التنفيذ الفعليّ', 'Actual execution time');
      }
      if (status.memory) stat('fa-memory', status.memory, 'الذاكرةُ المستهلكة', 'Memory used');
      if (status.where) stat(status.where === 'browser' ? 'fa-microchip' : 'fa-server',
        status.where === 'browser' ? t('onDevice') : t('onServer'),
        status.where === 'browser' ? 'يعمل على جهازك مباشرةً' : 'تُرسَل إلى سيرفرٍ خارجيّ يشغّلها في قفص',
        status.where === 'browser' ? 'Runs right on your device' : 'Sent to an external server that runs it in a cage',
        status.where === 'browser' ? 'var(--tint-ok)' : 'var(--tint-run)');
      var spacer = document.createElement('span');
      spacer.className = 'pl-spacer';
      bar.appendChild(spacer);
      bar.appendChild(outputCopyButton());
      bar.appendChild(outputSaveButton());
    } else {
      bar.hidden = true;
    }

    $('plEmpty').hidden = true;
    /*@4.LAPLJ.52*/
    var preview = $('plPreview');
    if (preview) preview.hidden = true;
    showPreviewBar(false);
    var out = $('plStdout');
    out.hidden = false;
    out.textContent = '';
    var previous = document.querySelector('[data-out-panel="stdout"] .pl-hint');
    if (previous) previous.remove();

    lastOutput = lines.map(function (line) { return stripAnsi(line.text); });
    /*@4.LAPLJ.53*/
    var CAP = 4000;
    /*@4.LAPLJ.54*/
    out.classList.remove('is-numbered');
    lines.slice(0, CAP).forEach(function (line) {
      out.appendChild(buildLine(line, 0, false));
    });
    if (lines.length > CAP) {
      var more = document.createElement('div');
      more.className = 'pl-line pl-note';
      more.textContent = L('… وبقيةُ الأسطر (' + (lines.length - CAP) + ') محفوظةٌ في النسخ والتصدير.',
        '… the remaining ' + (lines.length - CAP) + ' lines are kept in copy and export.');
      out.appendChild(more);
    }
    stripeLines(out, '.pl-line');
    prettyJson(out, lastOutput);

    var badge = $('plMetrics');
    badge.hidden = true;
    if (wantsInput && status) inputHint();
    lastResult = { status: status, lines: lines, meta: meta || null };
    selectOutTab('stdout');
  }

  /*@4.LAPLJ.55*/
  function repaintResult() {
    if (!lastResult) return;
    var keep = lastHint;
    if (lastResult.meta && lastResult.meta.noteKey) {
      showResult(null, t(lastResult.meta.noteKey).split('\n').map(function (line) {
        return { text: line, kind: lastResult.meta.kind };
      }), lastResult.meta);
    } else {
      showResult(lastResult.status, lastResult.lines, lastResult.meta);
    }
    if (keep) appendHint(keep);
  }

  /*@4.LAPLJ.56*/
  var RTL_CHARS = /[֐-׿؀-ٟ٪-ۯۺ-ࣿיִ-﷿ﹰ-﻿]/;
  function hasRtl(text) { return RTL_CHARS.test(String(text)); }

  /*@4.LAPLJ.57*/
  function buildLine(line, number, numbered) {
    var raw0 = stripAnsi(String(line.text));
    var node = document.createElement('div');
    /*@4.LAPLJ.58*/
    var prose = line.prose === true || line.kind === 'note' || line.kind === 'warn';
    node.className = 'pl-line' + (line.kind ? ' pl-' + line.kind : '') + (prose ? ' is-prose' : '');
    if (numbered) {
      var index = document.createElement('span');
      index.className = 'pl-ln';
      index.setAttribute('aria-hidden', 'true');
      index.textContent = number;
      node.appendChild(index);
    }
    /*@4.LAPLJ.59*/
    node.setAttribute('dir', hasRtl(raw0) ? 'auto' : 'ltr');
    var body = document.createElement('span');
    body.className = 'pl-line-t';
    node.appendChild(body);
    var raw = String(line.text);
    if (hasAnsi(raw)) {
      ansiParts(raw).forEach(function (part) {
        var span = document.createElement('span');
        span.className = 'pl-a' + (part.fg ? ' fg-' + part.fg : '') +
          (part.bold ? ' is-b' : '') + (part.dim ? ' is-d' : '') + (part.under ? ' is-u' : '');
        span.textContent = part.text;
        body.appendChild(span);
      });
    } else {
      body.appendChild(document.createTextNode(stripAnsi(raw)));
    }
    /*@4.LAPLJ.60*/
    var at = line.at || (line.kind === 'err' ? findLineNumber(stripAnsi(raw)) : 0);
    if (at > editor.value.split('\n').length) at = 0;
    if (at) {
      body.appendChild(document.createTextNode('  '));
      var jump = document.createElement('span');
      jump.className = 'pl-at';
      jump.textContent = L('↩ اذهب للسطر ' + at, '↩ go to line ' + at);
      jump.addEventListener('click', function () { jumpToLine(at); });
      body.appendChild(jump);
    }
    return node;
  }

  /*@4.LAPLJ.61*/
  function prettyJson(host, textLines) {
    var joined = textLines.join('\n').trim();
    if (joined.length < 24 || joined.length > 120000) return;
    if (!/^[[{]/.test(joined) || !/[\]}]$/.test(joined)) return;
    var value;
    try { value = JSON.parse(joined); } catch (error) { return; }
    if (typeof value !== 'object' || value === null) return;
    var box = document.createElement('div');
    box.className = 'pl-json';
    var title = document.createElement('div');
    title.className = 'pl-json-head';
    title.innerHTML = '<i class="fa-solid fa-code"></i>';
    title.appendChild(document.createTextNode(L('مُهيكلاً', 'Structured')));
    box.appendChild(title);
    var body = document.createElement('pre');
    body.className = 'pl-json-body ltr';
    body.innerHTML = colourJson(JSON.stringify(value, null, 2));
    box.appendChild(body);
    host.appendChild(box);
  }
  function colourJson(text) {
    return esc(text).replace(
      /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      function (whole, string, colon, literal, number) {
        if (string) return '<span class="' + (colon ? 'tok-attr' : 'tok-str') + '">' + string + '</span>' + (colon || '');
        if (literal) return '<span class="tok-lit">' + literal + '</span>';
        return '<span class="tok-num">' + number + '</span>';
      });
  }

  /*@4.LAPLJ.62*/
  function showText(text, kind) {
    showResult(null, String(text).split('\n').map(function (line) {
      return { text: line, kind: kind };
    }));
  }
  /*@4.LAPLJ.63*/
  function showNote(key, kind) {
    showResult(null, t(key).split('\n').map(function (line) {
      return { text: line, kind: kind };
    }), { noteKey: key, kind: kind });
  }

  /*@4.LAPLJ.64*/
  function entryClass(code) {
    var clean = String(code)
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/[^\n]*/g, ' ')
      .replace(/"(?:\\.|[^"\\])*"/g, '""');
    var open = /\bpublic\s+(?:final\s+|abstract\s+)?(?:class|interface|enum|record)\s+([A-Za-z_$][\w$]*)/.exec(clean);
    if (open) return open[1];
    /*@4.LAPLJ.65*/
    var declare = /\b(?:class|object)\s+([A-Za-z_$][\w$]*)/g;
    var mainAt = clean.search(/\bmain\s*\(/);
    var first = null, holder = null, hit;
    while ((hit = declare.exec(clean))) {
      if (first === null) first = hit[1];
      if (mainAt >= 0 && hit.index < mainAt) holder = hit[1];
    }
    return holder || first || 'Main';
  }
  /*@4.LAPLJ.66*/
  var GUI_HINTS = {
    java: /\bjavax?\.(?:swing|awt)\b|\bJFrame\b|\bJPanel\b|\bSwingUtilities\b|\bjavafx\b/,
    csharp: /\bSystem\.Windows\.Forms\b|\bSystem\.Drawing\b/,
    kotlin: /\bjavax\.swing\b|\bJFrame\b/,
    python: /\bimport\s+tkinter\b|\bfrom\s+tkinter\b|\bpygame\b/,
    cpp: /\bQApplication\b|<GL\/|\bSDL_Init\b/
  };
  function usesWindows(langId, code) {
    var pattern = GUI_HINTS[langId];
    return !!pattern && pattern.test(String(code));
  }
  /*@4.LAPLJ.67*/
  function guiNote() {
    var host = document.querySelector('[data-out-panel="stdout"]');
    if (!host || host.querySelector('.pl-hint-gui')) return;
    var box = document.createElement('div');
    box.className = 'pl-hint pl-hint-input pl-hint-gui';
    box.setAttribute('dir', 'auto');
    box.innerHTML = '<i class="fa-solid fa-window-restore"></i>';
    var head = document.createElement('b');
    head.textContent = t('guiTitle');
    box.appendChild(head);
    var why = document.createElement('p');
    why.className = 'pl-hint-p';
    why.textContent = t('guiWhy');
    box.appendChild(why);
    var fix = document.createElement('p');
    fix.className = 'pl-hint-p';
    fix.textContent = t('guiFix');
    box.appendChild(fix);
    var row = document.createElement('div');
    row.className = 'pl-hint-row';
    var web = document.createElement('button');
    web.type = 'button';
    web.className = 'pl-hint-go';
    web.innerHTML = '<i class="fa-solid fa-code"></i>';
    web.appendChild(document.createTextNode(t('guiToWeb')));
    web.addEventListener('click', function () {
      var lang = LANGS.filter(function (item) { return item.id === 'web'; })[0];
      if (lang) selectLanguage(lang);
    });
    row.appendChild(web);
    box.appendChild(row);
    host.appendChild(box);
  }

  function needsOwnRunner() {
    /*@4.LAPLJ.68*/
    if (runWhere() === 'server' && projectFiles().length) return true;
    if (current.id !== 'java' && current.id !== 'kotlin') return false;
    return entryClass(entrySource()) !== 'Main';
  }

  var wantsInput = false;
  function run() {
    if (runButton.disabled) return;
    runButton.disabled = true;
    /*@4.LAPLJ.69*/
    wantsInput = readsInput(current.id, editor.value) && !$('plStdin').value.trim();
    focusOutput();
    /*@4.LAPLJ.70*/
    var place = runWhere();
    if (usesWindows(current.id, editor.value)) {
      runButton.disabled = false;
      runLabel(null);
      showResult({ verdict: 'warn', where: place },
        [{ text: t('guiTitle'), kind: 'note' }]);
      guiNote();
      return;
    }
    var started = performance.now();
    runLabel(place === 'browser' ? t('running') : t('compiling'));

    /*@4.LAPLJ.71*/
    if (needsOwnRunner() && aiBase() && FEATURES.interactive) {
      runButton.disabled = false;
      startSession('run', projectFiles().length ? t('manyFiles') : t('ownName'));
      return;
    }
    /*@4.LAPLJ.72*/
    if (place === 'browser') {
      if (current.id === 'javascript') return runJavaScriptForReal(started);
      if (current.id === 'marie') return runMarieForReal(started);
      if (current.id === 'web') return runWebForReal(started);
      if (current.id === 'sql') return runSqlForReal(started);
      if (current.id === 'python') return runPythonForReal(started);
    }

    if (place === 'server') return runOnServer(started);
    /*@4.LAPLJ.73*/
    setTimeout(function () {
      finish();
      showResult(null, t('simNote').split('\n').map(function (line) { return { text: line, kind: 'note' }; }));
    }, 120);
  }
  function finish() { runButton.disabled = false; runLabel(null); }

  /*@4.LAPLJ.74*/
  function runJavaScriptForReal(started) {
    var worker;
    /*@4.LAPLJ.75*/
    var inspectSource = (window.GardenPLInspect && window.GardenPLInspect.source) || 'String';
    var code = 'var inspect=' + inspectSource + ';self.onmessage=function(e){var out=[];' +
      'var log=function(){out.push(Array.prototype.map.call(arguments,function(v){' +
      'try{return inspect(v,0)}catch(x){return String(v)}}).join(" "))};' +
      'var console={log:log,info:log,warn:log,error:log};' +
      /*@4.LAPLJ.76*/
      'try{ (new Function("console",e.data))(console); self.postMessage({ok:true,out:out}); }' +
      'catch(err){ var at=0; try{ var m=String(err&&err.stack||"").match(/<anonymous>:(\\d+):(\\d+)/);' +
      'if(m) at=Math.max(1,parseInt(m[1],10)-2); }catch(x){}' +
      'self.postMessage({ok:false,out:out,err:String(err),at:at}); }};';
    try {
      worker = new Worker(URL.createObjectURL(new Blob([code], { type: 'text/javascript' })));
    } catch (error) {
      finish(); showText(t('noSandbox'), 'err'); return;
    }
    var killer = setTimeout(function () {
      worker.terminate(); finish();
      showResult({ verdict: 'warn', ms: 5000, where: 'browser' }, [{ text: t('tooLong'), kind: 'err', prose: true }]);
      appendHint(function () { return t('tooLongHint'); });
    }, 5000);

    worker.onmessage = function (event) {
      clearTimeout(killer); worker.terminate(); finish();
      var elapsed = Math.round(performance.now() - started);
      var data = event.data;
      var lines = data.out.length
        ? data.out.join('\n').split('\n').map(function (line) { return { text: line }; })
        : [];
      if (!data.ok) lines.push({ text: data.err, kind: 'err', at: data.at || 0 });
      if (!lines.length) lines.push({ text: t('noOutput'), kind: 'note' });
      showResult({ verdict: data.ok ? 'ok' : 'bad', ms: elapsed, where: 'browser' }, lines);
      if (!data.ok) appendHint(function () { return t('errHint'); });
    };
    worker.postMessage(editor.value);
  }
  /*@4.LAPLJ.77*/
  var JUDGE0_IDS = {
    java: 62, c: 49, cpp: 53, php: 68,
    csharp: 51, lisp: 55, elixir: 57, go: 60, haskell: 61, lua: 64, pascal: 67,
    ruby: 72, rust: 73, typescript: 74, kotlin: 78, r: 80, scala: 81, perl: 85, groovy: 88,
    /*@4.LAPLJ.78*/
    bash: 46, erlang: 58, fortran: 59, ocaml: 65, octave: 66, cobol: 77,
    /*@4.LAPLJ.79*/
    javascript: 63, python: 71
  };
  var IDENTITY_KEY = 'garden_labs_identity';

  /*@4.LAPLJ.80*/
  function identity() {
    var vault = null;
    try { vault = localStorage.getItem('garden_vault_id'); } catch (error) { /*@4.LAPLJ.81*/ }
    if (vault && /^v[0-9a-f]{32}$/.test(vault)) return vault;
    var stored = null;
    try { stored = localStorage.getItem(IDENTITY_KEY); } catch (error) { /*@4.LAPLJ.82*/ }
    if (stored && /^p[0-9a-f]{32}$/.test(stored)) return stored;
    var bytes = new Uint8Array(16);
    (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(bytes)
      : bytes.forEach(function (_, index) { bytes[index] = Math.floor(Math.random() * 256); });
    var made = 'p' + Array.prototype.map.call(bytes, function (byte) {
      return ('0' + byte.toString(16)).slice(-2);
    }).join('');
    try { localStorage.setItem(IDENTITY_KEY, made); } catch (error) { /*@4.LAPLJ.83*/ }
    return made;
  }

  function labsBase() {
    var endpoints = window.GardenEndpoints || {};
    return String(endpoints.labs || '').replace(/\/+$/, '');
  }

  function runOnServer(started) {
    var base = labsBase();
    if (!base) {                       /*@4.LAPLJ.84*/
      finish();
      showResult(null, t('simNote').split('\n').map(function (line) { return { text: line, kind: 'note' }; }));
      return;
    }
    var headers = { 'Content-Type': 'application/json', 'X-Garden-Identity': identity() };
    fetch(base + '/v1/jobs', {
      method: 'POST', headers: headers,
      body: JSON.stringify({
        language_id: JUDGE0_IDS[current.id],
        source_code: editor.value,
        stdin: $('plStdin').value || ''
      })
    }).then(function (response) {
      return response.json().then(function (data) { return { status: response.status, data: data }; });
    }).then(function (reply) {
      if (reply.status === 202) return poll(base, headers, reply.data.job_id, started);
      finish();
      /*@4.LAPLJ.85*/
      if (reply.data.suggestExternal) {
        var external = EXTERNAL_FALLBACK[current.id];
        var lines = [{ text: L('السيرفرُ مزدحمٌ الآن. عد بعد ربع ساعةٍ تقريباً —',
          'The server is busy right now. Come back in about fifteen minutes —'), kind: 'warn' }];
        if (external) {
          lines.push({ text: L('أو جرّب ' + current.name + ' على محاكٍ مجانيٍّ الآن:', 'or try ' + current.name + ' on a free runner now:'), kind: 'note' });
          lines.push({ text: external, kind: 'note' });
        }
        showResult({ verdict: 'warn', where: 'server' }, lines);
        return;
      }
      var reason = reply.data.error;
      var seconds = Math.ceil((reply.data.retryAfterMs || 3000) / 1000);
      showResult({ verdict: 'warn', where: 'server' }, [{
        text: reason === 'too-fast'
          ? L('أمهِل ثانيةً أو ثانيتين بين تشغيلين.', 'Give it a second or two between runs.')
          : reason === 'one-at-a-time'
            ? L('تشغيلٌ واحدٌ في كل مرّة — انتظر انتهاءَ السابق.', 'One run at a time — wait for the previous one.')
            : reason === 'rate'
              ? L('استهلكتَ دفعتَك — جرّب بعد ' + seconds + ' ثانية.', 'You used your burst — try again in ' + seconds + 's.')
              : reason === 'language_not_allowed'
                ? L('هذه اللغةُ لا تعمل على السيرفر.', 'This language does not run on the server.')
                : reason === 'source_too_large'
                  ? L('الكودُ أكبرُ من الحدّ المسموح.', 'The code is larger than the allowed limit.')
                  : L('تعذّر إرسالُ الكود.', 'Could not submit the code.'),
        kind: 'err', prose: true
      }]);
    }).catch(function () {
      finish();
      showResult({ verdict: 'bad', where: 'server' }, [{
        text: L('تعذّر الوصولُ إلى السيرفر — تحقّق من اتصالك ثم شغّل مرّةً أخرى.',
          'Could not reach the server — check your connection and run again.'), kind: 'err', prose: true
      }]);
    });
  }

  var EXTERNAL_FALLBACK = {
    java: 'https://www.jdoodle.com/online-java-compiler',
    c: 'https://www.programiz.com/c-programming/online-compiler/',
    cpp: 'https://www.programiz.com/cpp-programming/online-compiler/',
    php: 'https://onecompiler.com/php',
    /*@4.LAPLJ.86*/
    csharp: 'https://onecompiler.com/csharp',
    kotlin: 'https://onecompiler.com/kotlin',
    go: 'https://onecompiler.com/go',
    rust: 'https://onecompiler.com/rust',
    typescript: 'https://onecompiler.com/typescript',
    ruby: 'https://onecompiler.com/ruby',
    r: 'https://onecompiler.com/r',
    scala: 'https://onecompiler.com/scala',
    haskell: 'https://onecompiler.com/haskell',
    lua: 'https://onecompiler.com/lua',
    perl: 'https://onecompiler.com/perl',
    pascal: 'https://onecompiler.com/pascal',
    groovy: 'https://onecompiler.com/groovy',
    elixir: 'https://onecompiler.com/elixir',
    lisp: 'https://onecompiler.com/commonlisp',
    bash: 'https://onecompiler.com/bash',
    fortran: 'https://onecompiler.com/fortran',
    erlang: 'https://onecompiler.com/erlang',
    ocaml: 'https://onecompiler.com/ocaml',
    octave: 'https://onecompiler.com/octave',
    cobol: 'https://onecompiler.com/cobol'
  };

  /*@4.LAPLJ.87*/
  function poll(base, headers, jobId, started, attempt) {
    var round = attempt || 0;
    if (round === 0) runLabel(t('running'));
    if (round > 45) {
      finish();
      showResult({ verdict: 'warn', where: 'server' }, [{
        text: L('طال التنفيذُ أكثرَ من المتوقّع — أعد المحاولة.',
          'This is taking longer than expected — please try again.'), kind: 'err', prose: true }]);
      return;
    }
    setTimeout(function () {
      fetch(base + '/v1/jobs/' + jobId, { headers: headers })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          if (data.status !== 'done') return poll(base, headers, jobId, started, round + 1);
          finish();
          var result = data.result || {};
          var accepted = result.status && result.status.id === 3;
          var lines = [];
          (result.stdout || '').replace(/\n$/, '').split('\n').forEach(function (line) {
            if (line.length || lines.length) lines.push({ text: line });
          });
          [result.compile_output, result.stderr, result.message].forEach(function (stream) {
            if (!stream) return;
            String(stream).replace(/\n$/, '').split('\n').forEach(function (line) {
              lines.push({ text: line, kind: 'err' });
            });
          });
          if (!lines.length) lines.push({ text: t('noOutput'), kind: 'note' });
          showResult({
            verdict: accepted ? 'ok' : 'bad',
            ms: result.time ? Math.round(parseFloat(result.time) * 1000) : Math.round(performance.now() - started),
            memory: result.memory ? Math.round(result.memory / 1024) + ' MB' : undefined,
            where: 'server'
          }, lines);
          if (!accepted && result.status) {
            appendHint(function () { return L('حالةُ المُشغِّل: ', 'Runner status: ') + result.status.description; });
          }
        })
        .catch(function () { poll(base, headers, jobId, started, round + 1); });
    }, round === 0 ? 700 : (round < 12 ? 1000 : round < 30 ? 2000 : 3000));
  }

  /*@4.LAPLJ.88*/
  function runPythonForReal(started) {
    var api = window.GardenPython;
    if (!api) { finish(); showText(L('لم يُحمَّل محرّكُ بايثون.', 'The Python engine did not load.'), 'err'); return; }
    api.run(editor.value, $('plStdin').value, function (stage, packages) {
      /*@4.LAPLJ.89*/
      runLabel(stage === 'script'
        ? L('يُحمّل بايثون…', 'Loading Python…')
        : stage === 'packages'
          ? L('يُحمّل ' + (packages || []).join(' و') + '…', 'Loading ' + (packages || []).join(', ') + '…')
          : L('يُهيّئ بايثون…', 'Starting Python…'));
    }).then(function (outcome) {
      finish();
      var lines = [];
      outcome.out.forEach(function (chunk) {
        String(chunk.text).replace(/\n$/, '').split('\n').forEach(function (line) {
          lines.push({ text: line, kind: chunk.kind });
        });
      });
      /*@4.LAPLJ.90*/
      if (!outcome.ok) {
        String(outcome.error).split('\n').forEach(function (line) {
          lines.push({ text: line, kind: 'err' });
        });
      }
      if (!lines.length) lines.push({ text: t('noOutput'), kind: 'note' });
      showResult({ verdict: outcome.ok ? 'ok' : 'bad', ms: outcome.ms, where: 'browser' }, lines);
      if (!outcome.ok) {
        appendHint(function () { return L('أثرُ بايثون أعلاه — وآخرُ سطرٍ فيه هو نوعُ الخطأ ورسالتُه.',
          'The Python traceback above — its last line is the error type and message.'); });
      }
    }).catch(function (error) {
      finish();
      showResult({ verdict: 'bad', where: 'browser' }, [{
        text: String(error && error.message) === 'offline'
          ? L('تعذّر تحميلُ بايثون — تحقّق من اتصالك ثم شغّل مرّةً أخرى.',
              'Could not load Python — check your connection and run again.')
          : L('تعذّر تشغيلُ بايثون في هذا المتصفّح.', 'Python could not start in this browser.'),
        kind: 'err', prose: true
      }]);
    });
  }

  /*@4.LAPLJ.91*/
  function runSqlForReal(started) {
    var api = window.GardenSQL;
    if (!api) { finish(); showText(L('لم يُحمَّل محرّكُ SQL.', 'The SQL engine did not load.'), 'err'); return; }
    if (!api.isReady()) runLabel(L('يُحمّل SQLite…', 'Loading SQLite…'));
    var source = editor.value;
    api.run(source).then(function (outcome) {
      finish();
      if (!outcome.ok) {
        showResult({ verdict: 'bad', ms: outcome.ms, where: 'browser' },
          [{ text: outcome.error, kind: 'err' }]);
        appendHint(function () { return L('رسالةُ SQLite أعلاه كما هي — وغالباً تذكر الكلمةَ التي توقّفت عندها.',
          'The SQLite message above is verbatim — it usually names the token it stopped at.'); });
        return;
      }
      var tables = outcome.results || [];
      showResult({
        verdict: 'ok', ms: outcome.ms, where: 'browser',
        memory: tables.length
          ? plural(tables.reduce(function (sum, table) { return sum + table.values.length; }, 0),
              ['صفٌّ واحد', 'صفّان', 'صفوف', 'صفّاً'], 'row', 'rows')
          : plural(outcome.changes, ['صفٌّ واحدٌ تغيّر', 'صفّان تغيّرا', 'صفوفٍ تغيّرت', 'صفّاً تغيّر'],
              'row changed', 'rows changed')
      }, tables.length ? [] : [{ text: L('نُفِّذت العباراتُ ولم يُرجع استعلامٌ صفوفاً.',
        'Statements ran; no query returned rows.'), kind: 'note' }]);
      if (tables.length) renderSqlTables(tables);
    }).catch(function (error) {
      finish();
      var why = String(error && error.message);
      showResult({ verdict: 'bad', where: 'browser' }, [{
        text: why === 'offline'
          ? L('تعذّر تحميلُ محرّك SQLite — تحقّق من اتصالك ثم شغّل مرّةً أخرى.',
              'Could not load the SQLite engine — check your connection and run again.')
          : L('تعذّر تشغيلُ محرّك SQLite في هذا المتصفّح.',
              'The SQLite engine could not start in this browser.'),
        kind: 'err', prose: true
      }]);
    });
  }

  /*@4.LAPLJ.92*/
  function renderSqlTables(tables) {
    var host = $('plStdout');
    host.hidden = false;
    tables.forEach(function (table, index) {
      if (tables.length > 1) {
        var caption = document.createElement('div');
        caption.className = 'pl-sql-title';
        caption.textContent = L('نتيجة ', 'result ') + (index + 1);
        host.appendChild(caption);
      }
      var wrap = document.createElement('div');
      wrap.className = 'pl-sql-wrap';
      var grid = document.createElement('table');
      grid.className = 'pl-sql';
      var head = document.createElement('thead');
      var headRow = document.createElement('tr');
      table.columns.forEach(function (column) {
        var cell = document.createElement('th');
        cell.textContent = column;
        headRow.appendChild(cell);
      });
      head.appendChild(headRow);
      grid.appendChild(head);
      var body = document.createElement('tbody');
      table.values.forEach(function (row) {
        var line = document.createElement('tr');
        row.forEach(function (value) {
          var cell = document.createElement('td');
          if (value === null || value === undefined) {
            cell.className = 'is-null'; cell.textContent = 'NULL';
          } else {
            if (typeof value === 'number') cell.className = 'is-num';
            cell.textContent = String(value);
            cell.setAttribute('dir', 'auto');
          }
          line.appendChild(cell);
        });
        body.appendChild(line);
      });
      grid.appendChild(body);
      wrap.appendChild(grid);
      host.appendChild(wrap);
    });
  }

  /*@4.LAPLJ.93*/
  function runWebForReal(started) {
    var frame = $('plPreview');
    /*@4.LAPLJ.94*/
    var fresh = frame.cloneNode(false);
    frame.parentNode.replaceChild(fresh, frame);
    fresh.hidden = false;
    fresh.srcdoc = editor.value;
    $('plEmpty').hidden = true;
    $('plStdout').hidden = true;
    var previous = document.querySelector('[data-out-panel="stdout"] .pl-hint');
    if (previous) previous.remove();
    var bar = $('plStatus');
    bar.hidden = true;
    finish();
    selectOutTab('stdout');
    showPreviewBar(true);
    /*@4.LAPLJ.95*/
    fresh.addEventListener('load', function () {
      showResult({ verdict: 'ok', ms: Math.round(performance.now() - started), where: 'browser' }, []);
      $('plStdout').hidden = true;
      fresh.hidden = false;
      showPreviewBar(true);
    }, { once: true });
  }

  /*@4.LAPLJ.96*/
  function showPreviewBar(on) {
    var bar = $('plPrevBar');
    if (bar) bar.hidden = !on;
  }

  /*@4.LAPLJ.97*/
  function runMarieForReal(started) {
    var engine = window.GardenMARIE;
    if (!engine) {
      finish();
      showResult({ verdict: 'bad', where: 'browser' },
        [{ text: L('لم يُحمَّل محاكي MARIE.', 'The MARIE simulator did not load.'), kind: 'err', prose: true }]);
      return;
    }
    var built = engine.assemble(editor.value);
    if (!built.ok) {
      finish();
      showResult({ verdict: 'bad', ms: Math.round(performance.now() - started), where: 'browser' },
        built.errors.map(function (issue) {
          return { text: L('السطر ', 'line ') + issue.line + ': ' + issue.message, kind: 'err', at: issue.line };
        }));
      appendHint(function () { return L('التجميعُ يقف قبل التشغيل — أصلح ما فوق ثم شغّل.',
        'Assembly stops before running — fix the above, then run.'); });
      return;
    }
    /*@4.LAPLJ.98*/
    var inputs = $('plStdin').value.split(/[\s,]+/)
      .filter(function (token) { return token.length; })
      .map(function (token) { return parseInt(token, 10); })
      .filter(function (value) { return !isNaN(value); });

    var state = engine.run(built.memory, inputs, { start: built.start });
    var elapsed = Math.round(performance.now() - started);
    finish();

    var lines = state.output.map(function (value) { return { text: String(value) }; });
    if (state.error) lines.push({ text: state.error.message, kind: 'err' });
    if (!lines.length) lines.push({ text: t('noOutput'), kind: 'note' });
    showResult({
      verdict: state.error ? (state.error.kind === 'steps' ? 'warn' : 'bad') : 'ok',
      ms: elapsed, where: 'browser',
      memory: plural(state.steps, ['خطوةٌ واحدة', 'خطوتان', 'خطوات', 'خطوة'], 'step', 'steps')
    }, lines);
    if (!state.error) {
      appendHint(function () { return L('AC = ' + state.acSigned + ' · PC = ' + state.pc + ' · نُفِّذت ' + plural(state.steps, ['خطوةٌ واحدة', 'خطوتان', 'خطوات', 'خطوة'], '', '') + '.',
        'AC = ' + state.acSigned + ' · PC = ' + state.pc + ' · ' + state.steps + ' steps executed.'); });
    }
  }

  /*@4.LAPLJ.99*/
  function appendHint(source) {
    lastHint = source;
    var text = typeof source === 'function' ? source() : source;
    var host = document.querySelector('[data-out-panel="stdout"]');
    /*@4.LAPLJ.100*/
    var old = host.querySelector('.pl-hint:not(.pl-hint-input)');
    if (old) old.remove();
    var node = document.createElement('div');
    node.className = 'pl-hint';
    node.setAttribute('dir', 'auto');
    node.innerHTML = '<i class="fa-solid fa-lightbulb"></i>';
    node.appendChild(document.createTextNode(text));
    host.appendChild(node);
  }
  runButton.addEventListener('click', run);

  /*@4.LAPLJ.101*/
  var session = { id: null, seq: 0, abort: null, alive: false, mode: 'run', ended: false,
    retryTimer: null, retryCount: 0, streamToken: 0 };
  var live = { box: null, body: null, field: null, dot: null, hint: null, stop: null, tail: null };
  var echoLeft = '';

  /*@4.LAPLJ.102*/
  function expectEcho(line) {
    echoLeft = session.mode === 'shell' ? String(line).replace(/[;\s]+$/, '') : '';
  }
  function stripEcho(raw) {
    if (!echoLeft) return raw;
    if (raw.indexOf('\n') !== -1) { echoLeft = ''; return raw; }
    if (echoLeft.indexOf(raw) === 0) { echoLeft = echoLeft.slice(raw.length); return ''; }
    if (raw.indexOf(echoLeft) === 0) {
      var rest = raw.slice(echoLeft.length);
      echoLeft = '';
      return rest;
    }
    echoLeft = '';
    return raw;
  }

  function sessionBusy(busy) {
    ['plRun', 'plInteractive', 'plTerm'].forEach(function (id) {
      var node = $(id);
      if (node) node.disabled = busy;
    });
  }

  function headButton(icon, label, tipAr, tipEn) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'pl-c-btn';
    button.innerHTML = '<i class="fa-solid ' + icon + '"></i>';
    var text = document.createElement('span');
    text.textContent = label;
    button.appendChild(text);
    button.setAttribute('data-tip-ar', tipAr);
    button.setAttribute('data-tip-en', tipEn);
    return button;
  }

  /*@4.LAPLJ.103*/
  function openConsole() {
    dropConsole();
    var host = document.querySelector('[data-out-panel="stdout"]');
    ['plStatus', 'plEmpty', 'plStdout', 'plPreview', 'plPrevBar'].forEach(function (id) {
      var node = $(id);
      if (node) node.hidden = true;
    });
    /*@4.LAPLJ.104*/
    host.querySelectorAll('.pl-hint').forEach(function (node) { node.remove(); });
    var box = document.createElement('div');
    box.className = 'pl-console' + (session.mode === 'shell' ? ' is-shell' : '');
    box.id = 'plConsole';

    var head = document.createElement('div');
    head.className = 'pl-c-head';
    live.dot = document.createElement('span');
    live.dot.className = 'pl-c-dot';
    head.appendChild(live.dot);
    var title = document.createElement('b');
    title.className = 'pl-c-title';
    title.textContent = (session.mode === 'shell' ? t('termTitle') : t('liveTitle')) + ' · ' + current.name;
    head.appendChild(title);
    live.hint = document.createElement('span');
    live.hint.className = 'pl-c-hint';
    head.appendChild(live.hint);
    var spacer = document.createElement('span');
    spacer.className = 'pl-spacer';
    head.appendChild(spacer);

    /*@4.LAPLJ.105*/
    var tools = document.createElement('div');
    tools.className = 'pl-c-tools';
    head.appendChild(tools);

    var copy = headButton('fa-copy', t('outCopy'), 'انسخ سجلَّ الجلسة كاملاً',
      'Copy the whole session transcript');
    copy.addEventListener('click', function () {
      try {
        navigator.clipboard.writeText(consoleText());
        copy.querySelector('span').textContent = t('outCopied');
        setTimeout(function () { copy.querySelector('span').textContent = t('outCopy'); }, 1400);
      } catch (error) { /*@4.LAPLJ.106*/ }
    });
    tools.appendChild(copy);
    var save = headButton('fa-download', t('outSave'), 'نزّل سجلَّ الجلسة ملفَّ نصّ',
      'Download the session transcript as a text file');
    save.addEventListener('click', function () {
      var stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      downloadText((session.mode === 'shell' ? 'terminal-' : 'session-') + stamp + '.txt', consoleText());
    });
    tools.appendChild(save);
    var clear = headButton('fa-eraser', t('sessClear'), 'امسح ما ظهر — الجلسةُ تبقى مفتوحة',
      'Clear what is shown — the session stays open');
    clear.addEventListener('click', function () {
      live.body.textContent = '';
      live.tail = null;
      focusField();
    });
    tools.appendChild(clear);
    /*@4.LAPLJ.107*/
    live.stop = headButton('fa-stop', t('sessStop'), 'أوقف الجلسة وأغلق الحاوية',
      'Stop the session and close the container');
    live.stop.classList.add('is-stop');
    live.stop.addEventListener('click', function () {
      if (session.alive) endSession(L('أُوقفت الجلسة.', 'Session stopped.'));
      else { dropConsole(); $('plEmpty').hidden = false; }
    });
    tools.appendChild(live.stop);
    box.appendChild(head);

    /*@4.LAPLJ.108*/
    live.body = document.createElement('div');
    live.body.className = 'pl-c-body';
    live.body.setAttribute('dir', 'ltr');
    box.appendChild(live.body);
    host.appendChild(box);
    live.box = box;
    return box;
  }

  /*@4.LAPLJ.109*/
  function consoleText() {
    if (!live.body) return '';
    return [].map.call(live.body.querySelectorAll('.pl-c-line'), function (line) {
      var mark = line.querySelector('.pl-c-mark');
      var body = line.querySelector('.pl-c-t');
      return (mark ? mark.textContent + ' ' : '') + (body ? body.textContent : '');
    }).join('\n');
  }

  function dropConsole() {
    var old = $('plConsole');
    if (old) old.remove();
    live = { box: null, body: null, field: null, dot: null, hint: null, stop: null, tail: null };
  }

  function focusField() {
    if (live.field) { try { live.field.focus(); } catch (error) { } }
  }

  /*@4.LAPLJ.110*/
  function consoleLine(kind, text) {
    var line = document.createElement('div');
    line.className = 'pl-c-line' + (kind ? ' is-' + kind : '');
    /*@4.LAPLJ.111*/
    line.setAttribute('dir', hasRtl(stripAnsi(String(text))) ? 'auto' : 'ltr');
    if (kind === 'in') {
      var mark = document.createElement('span');
      mark.className = 'pl-c-mark';
      mark.textContent = session.mode === 'shell' ? '$' : '❯';
      line.appendChild(mark);
    }
    var body = document.createElement('span');
    body.className = 'pl-c-t';
    var raw = String(text);
    if (hasAnsi(raw)) {
      ansiParts(raw).forEach(function (part) {
        var span = document.createElement('span');
        span.className = 'pl-a' + (part.fg ? ' fg-' + part.fg : '') +
          (part.bold ? ' is-b' : '') + (part.dim ? ' is-d' : '') + (part.under ? ' is-u' : '');
        span.textContent = part.text;
        body.appendChild(span);
      });
    } else {
      body.textContent = stripAnsi(raw);
    }
    line.appendChild(body);
    live.body.appendChild(line);
    stripeLines(live.body, '.pl-c-line');
    live.body.scrollTop = live.body.scrollHeight;
    return line;
  }

  /*@4.LAPLJ.112*/
  function appendSessionLine(stream, text) {
    if (!live.body) return;
    var raw = String(text);
    if (stream === 'sys') {
      live.tail = null;
      raw.split('\n').forEach(function (piece) { consoleLine('sys', piece); });
      return;
    }
    if (stream === 'in') {
      live.tail = null;
      expectEcho(raw);
      consoleLine('in', raw === '' ? ' ' : raw);
      return;
    }
    raw = stripEcho(raw);
    if (raw === '') return;
    if (live.tail && live.tail.kind !== stream) live.tail = null;
    if (live.tail) { raw = live.tail.text + raw; live.tail.node.remove(); live.tail = null; }
    var pieces = raw.split('\n');
    var open = pieces.pop();
    pieces.forEach(function (piece) { consoleLine(stream, piece); });
    if (open !== '') live.tail = { kind: stream, text: open, node: consoleLine(stream, open) };
  }

  function endSession(reason) {
    if (session.abort) { try { session.abort.abort(); } catch (error) { } }
    if (session.retryTimer) clearTimeout(session.retryTimer);
    if (session.id && aiBase()) {
      fetch(aiBase() + '/v1/sessions/' + session.id, {
        method: 'DELETE', headers: { 'X-Garden-Identity': identity() }, keepalive: true
      }).catch(function () { });
    }
    clearOpenTimer();
    var mode = session.mode;
    session = { id: null, seq: 0, abort: null, alive: false, mode: mode, ended: false,
      retryTimer: null, retryCount: 0, streamToken: 0 };
    echoLeft = '';
    if (reason) appendSessionLine('sys', reason);
    consoleFinished();
    sessionBusy(false);
    runLabel(null);
  }

  /*@4.LAPLJ.113*/
  function consoleFinished() {
    live.tail = null;
    var row = $('plStdinLive');
    if (row) row.remove();
    var chips = $('plTermChips');
    if (chips) chips.remove();
    live.field = null;
    if (!live.box) return;
    live.box.classList.add('is-done');
    if (live.dot) live.dot.classList.add('is-off');
    if (live.hint) live.hint.textContent = t('sessOver');
    if (live.stop) {
      live.stop.classList.remove('is-stop');
      live.stop.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      var label = document.createElement('span');
      label.textContent = t('sessClose');
      live.stop.appendChild(label);
      live.stop.setAttribute('data-tip-ar', 'أغلق الطرفيةَ وعُد إلى لوح النتائج');
      live.stop.setAttribute('data-tip-en', 'Close the console and go back to the results panel');
    }
  }
  /*@4.LAPLJ.114*/
  window.addEventListener('pagehide', function () { if (session.alive) endSession(null); });

  /*@4.LAPLJ.115*/
  function sendLine(line) {
    if (!session.id) return;
    fetch(aiBase() + '/v1/sessions/' + session.id + '/in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Garden-Identity': identity() },
      body: JSON.stringify({ line: line })
    }).catch(function () { });
  }

  /*@4.LAPLJ.116*/
  function termChips(hints) {
    var row = document.createElement('div');
    row.className = 'pl-term-chips';
    row.id = 'plTermChips';
    var items = [];
    if (hints && hints.run) items.push({ label: t('termRun'), cmd: hints.run, icon: 'fa-play' });
    if (hints && hints.repl) items.push({ label: hints.repl.label, cmd: hints.repl.cmd, icon: 'fa-rotate' });
    items.push({ label: t('termFiles'), cmd: 'ls -l', icon: 'fa-folder-open' });
    items.forEach(function (item) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'pl-term-chip';
      chip.innerHTML = '<i class="fa-solid ' + item.icon + '"></i>';
      chip.appendChild(document.createTextNode(item.label));
      chip.setAttribute('data-tip-ar', item.cmd);
      chip.setAttribute('data-tip-en', item.cmd);
      chip.addEventListener('click', function () { sendLine(item.cmd); focusField(); });
      row.appendChild(chip);
    });
    live.box.appendChild(row);
  }

  function inputRow() {
    var row = document.createElement('div');
    row.className = 'pl-c-in';
    row.id = 'plStdinLive';
    var mark = document.createElement('span');
    mark.className = 'pl-c-mark';
    mark.textContent = session.mode === 'shell' ? '$' : '❯';
    row.appendChild(mark);
    var field = document.createElement('input');
    field.type = 'text';
    field.className = 'pl-c-field';
    field.setAttribute('dir', 'auto');
    field.setAttribute('autocomplete', 'off');
    field.setAttribute('autocapitalize', 'off');
    field.setAttribute('spellcheck', 'false');
    field.placeholder = session.mode === 'shell' ? t('termHold') : t('liveHold');
    row.appendChild(field);
    /*@4.LAPLJ.117*/
    var send = document.createElement('button');
    send.type = 'button';
    send.className = 'pl-c-send';
    send.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    send.setAttribute('data-tip-ar', 'أرسل السطر إلى البرنامج');
    send.setAttribute('data-tip-en', 'Send the line to the program');
    row.appendChild(send);

    var history = [];
    var at = -1;
    function submit() {
      if (!session.id) return;
      var line = field.value;
      field.value = '';
      if (line.trim()) { history.unshift(line); at = -1; }
      sendLine(line);
      field.focus();
    }
    send.addEventListener('click', submit);
    /*@4.LAPLJ.118*/
    field.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        if (!history.length) return;
        event.preventDefault();
        at = event.key === 'ArrowUp'
          ? Math.min(at + 1, history.length - 1)
          : Math.max(at - 1, -1);
        field.value = at < 0 ? '' : history[at];
        return;
      }
      if (event.key === 'Enter') { event.preventDefault(); submit(); }
    });
    live.box.appendChild(row);
    live.field = field;
    field.focus();
    return row;
  }

  function startSession(mode, note) {
    if (session.alive) return;
    var base = aiBase();
    if (!base) { showNote('simNote', 'note'); return; }
    /*@4.LAPLJ.119*/
    if (mode !== 'shell' && !editor.value.trim()) return;

    echoLeft = '';
    session.mode = mode === 'shell' ? 'shell' : 'run';
    session.ended = false;
    openConsole();
    sessionBusy(true);
    if (session.mode !== 'shell') runLabel(t('running'));
    if (note) appendSessionLine('sys', note);
    appendSessionLine('sys', session.mode === 'shell' ? t('termOpen') : t('liveOpen'));
    /*@4.LAPLJ.120*/
    openTimer = setTimeout(function () {
      if (session.alive || !live.box) return;
      appendSessionLine('sys', t('sessSlow'));
      retryRow(base);
    }, 20000);
    askSession(base, false);
  }

  /*@4.LAPLJ.121*/
  var openTimer = null;
  function clearOpenTimer() {
    if (openTimer) { clearTimeout(openTimer); openTimer = null; }
  }

  /*@4.LAPLJ.122*/
  function retryRow(base) {
    if (!live.box || $('plSessRetry')) return;
    var row = document.createElement('div');
    row.className = 'pl-term-chips';
    row.id = 'plSessRetry';
    var again = document.createElement('button');
    again.type = 'button';
    again.className = 'pl-term-chip';
    again.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
    again.appendChild(document.createTextNode(t('sessRetry')));
    again.addEventListener('click', function () {
      row.remove();
      askSession(base, false);
    });
    row.appendChild(again);
    live.box.appendChild(row);
  }

  function askSession(base, retried) {
    fetch(base + '/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Garden-Identity': identity() },
      body: JSON.stringify({ lang: current.id, code: entrySource(), mode: session.mode,
        files: projectFiles() })
    }).then(function (response) {
      return response.json().then(function (data) { return { status: response.status, data: data }; });
    }).then(function (reply) {
      if (reply.status !== 201) {
        var reason = reply.data && reply.data.error;
        if (reason === 'session_already_open' && !retried) {
          appendSessionLine('sys', t('sessBusy'));
          fetch(base + '/v1/sessions', { method: 'DELETE', headers: { 'X-Garden-Identity': identity() } })
            .then(function () { askSession(base, true); }, function () { askSession(base, true); });
          return;
        }
        endSession(reason === 'language_not_interactive'
          ? L('هذه اللغةُ تعمل على جهازك مباشرةً — شغّلها بزرّ «شغّل».',
              'This language runs on your device — use the Run button.')
          : reason === 'pool_full' || reason === 'busy-new'
            ? L('السيرفرُ مزدحمٌ الآن — جرّب بعد دقيقة.', 'The server is busy — try again in a minute.')
            : reason === 'session_already_open'
              ? L('لديك جلسةٌ مفتوحةٌ في نافذةٍ أخرى — أغلقها ثم أعد المحاولة.',
                  'You have a session open in another window — close it and try again.')
              : L('تعذّر فتحُ الجلسة.', 'Could not open the session.'));
        return;
      }
      clearOpenTimer();
      var stale = $('plSessRetry');
      if (stale) stale.remove();
      session.id = reply.data.id;
      session.alive = true;
      session.retryCount = 0;
      var hints = reply.data.hints;
      if (live.hint) live.hint.textContent = session.mode === 'shell' ? t('termHold') : t('liveWait');
      if (session.mode === 'shell') {
        appendSessionLine('sys', t('termReady').replace('{file}', (hints && hints.file) || 'main'));
        appendSessionLine('sys', t('termNoCtrlC'));
      }
      if (session.mode === 'shell') termChips(hints);
      inputRow();
      streamSession(base);
    }, function () {
      clearOpenTimer();
      endSession(L('تعذّر الوصولُ إلى السيرفر.', 'Could not reach the server.'));
    }).catch(function (error) {
      /*@4.LAPLJ.123*/
      clearOpenTimer();
      endSession(L('تعثّر فتحُ الجلسة: ', 'The session failed to open: ') + (error && error.message));
    });
  }

  /*@4.LAPLJ.196*/
  function retrySessionStream(base, id, token) {
    if (!session.alive || session.id !== id || session.streamToken !== token) return;
    session.retryCount += 1;
    if (live.hint) live.hint.textContent = t('sessReconnect');
    var delay = Math.min(10000, 750 * Math.pow(2, Math.min(session.retryCount - 1, 4)));
    session.retryTimer = setTimeout(function () {
      session.retryTimer = null;
      if (session.alive && session.id === id && session.streamToken === token) streamSession(base);
    }, delay);
  }

  function streamSession(base) {
    if (!session.alive || !session.id) return;
    var id = session.id;
    var token = ++session.streamToken;
    session.abort = new AbortController();
    fetch(base + '/v1/sessions/' + id + '/stream?from=' + session.seq, {
      headers: { 'X-Garden-Identity': identity() },
      signal: session.abort.signal
    }).then(function (response) {
      if (response.status === 404) {
        if (session.alive && session.id === id && session.streamToken === token) {
          endSession(L('لم تعد الجلسةُ موجودةً على الخادم.', 'The server session no longer exists.'));
        }
        return null;
      }
      if (!response.ok || !response.body) throw new Error('stream');
      session.retryCount = 0;
      if (live.hint) live.hint.textContent = session.mode === 'shell' ? t('termHold') : t('liveWait');
      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var carry = '';
      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) {
            if (session.alive && session.id === id && session.streamToken === token) {
              retrySessionStream(base, id, token);
            }
            return;
          }
          carry += decoder.decode(chunk.value, { stream: true });
          var parts = carry.split('\n\n');
          carry = parts.pop() || '';
          parts.forEach(function (part) {
            part.split('\n').forEach(function (line) {
              if (line.indexOf('data:') !== 0) return;
              var event;
              try { event = JSON.parse(line.slice(5).trim()); } catch (error) { return; }
              if (event.seq) session.seq = event.seq;
              if (event.stream === 'closed') {
                /*@4.LAPLJ.124*/
                endSession(session.ended ? null : L('انتهت الجلسة.', 'The session ended.'));
                return;
              }
              if (event.stream === 'exit') {
                session.ended = true;
                appendSessionLine('sys', session.mode === 'shell' ? t('termLeft')
                  : L('انتهى البرنامجُ برمز ' + event.text + '.',
                      'The program exited with code ' + event.text + '.'));
                return;
              }
              appendSessionLine(event.stream, event.text);
            });
          });
          return pump();
        });
      }
      return response.body ? pump() : null;
    }).catch(function (error) {
      if (error && error.name === 'AbortError') return;
      if (session.alive && session.id === id && session.streamToken === token) {
        retrySessionStream(base, id, token);
      }
    });
  }

  $('plInteractive').addEventListener('click', function () { startSession('run'); });
  $('plTerm').addEventListener('click', function () { startSession('shell'); });

  /*@4.LAPLJ.125*/
  var overlay = null;
  function closeModal() {
    if (overlay) { overlay.remove(); overlay = null; }
    document.removeEventListener('keydown', onModalKey);
  }
  function onModalKey(event) { if (event.key === 'Escape') closeModal(); }
  /**
   * @param {string} title
   * @param {function(HTMLElement):void} fill يملأ الجسم
   * @param {Array<{label:string, primary?:boolean, act:function():boolean|void}>} actions
   */
  function openModal(title, fill, actions) {
    closeModal();
    overlay = document.createElement('div');
    overlay.className = 'pl-overlay';
    var box = document.createElement('div');
    box.className = 'pl-modal';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    var head = document.createElement('div');
    head.className = 'pl-modal-head';
    var heading = document.createElement('h2');
    heading.textContent = title;
    var close = document.createElement('button');
    close.className = 'pl-modal-close';
    close.setAttribute('aria-label', L('إغلاق', 'Close'));
    close.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    close.addEventListener('click', closeModal);
    head.appendChild(heading); head.appendChild(close);
    var body = document.createElement('div');
    body.className = 'pl-modal-body';
    fill(body);
    box.appendChild(head); box.appendChild(body);
    if (actions && actions.length) {
      var foot = document.createElement('div');
      foot.className = 'pl-modal-foot';
      actions.forEach(function (action) {
        var button = document.createElement('button');
        button.className = action.primary ? 'pl-primary' : 'pl-ghost';
        button.textContent = action.label;
        button.addEventListener('click', function () { if (action.act() !== false) closeModal(); });
        foot.appendChild(button);
      });
      box.appendChild(foot);
    }
    overlay.appendChild(box);
    /*@4.LAPLJ.126*/
    overlay.addEventListener('click', function (event) { if (event.target === overlay) closeModal(); });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onModalKey);
    var focusable = box.querySelector('input, button.pl-primary, button');
    if (focusable) focusable.focus();
  }

  function choice(body, icon, label, hint, act) {
    var button = document.createElement('button');
    button.className = 'pl-choice';
    button.innerHTML = '<i class="fa-solid ' + icon + '"></i>';
    var text = document.createElement('span');
    text.textContent = label;
    button.appendChild(text);
    if (hint) { var small = document.createElement('small'); small.textContent = hint; button.appendChild(small); }
    button.addEventListener('click', function () { closeModal(); act(); });
    body.appendChild(button);
  }

  /*@4.LAPLJ.127*/
  function renderSavesPanel() {
    var host = document.querySelector('[data-panel="saves"]');
    var store = window.GardenPLStore;
    if (!host || !store) return;
    host.querySelectorAll('.pl-save, .pl-saves-empty, .pl-sep').forEach(function (node) { node.remove(); });
    var button = $('plSaveAs');
    var list = store.slots();
    if (!list.length) {
      var empty = document.createElement('p');
      empty.className = 'pl-saves-empty';
      empty.textContent = t('noSaves');
      host.insertBefore(empty, button);
      return;
    }
    var head = document.createElement('div');
    head.className = 'pl-sep';
    head.innerHTML = '<span>' + t('savesCount') + ' (' + list.length + '/' + store.MAX_SLOTS + ')</span>';
    host.insertBefore(head, button);
    list.forEach(function (entry) {
      var row = document.createElement('div');
      row.className = 'pl-save';
      row.setAttribute('data-tip-ar', 'افتح هذه النسخة');
      row.setAttribute('data-tip-en', 'Open this copy');
      var name = document.createElement('span');
      name.setAttribute('dir', 'auto');
      name.textContent = entry.name;
      var when = document.createElement('em');
      when.textContent = relativeTime(entry.at);
      var remove = document.createElement('button');
      remove.className = 'pl-slot-del';
      remove.setAttribute('aria-label', t('delSave'));
      remove.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
      remove.addEventListener('click', function (event) {
        event.stopPropagation();
        store.removeSlot(entry.id);
        renderSavesPanel();
        toast(L('حُذفت: ', 'Deleted: ') + entry.name);
      });
      row.addEventListener('click', function () { openSlot(entry); });
      row.appendChild(name); row.appendChild(when); row.appendChild(remove);
      host.insertBefore(row, button);
    });
  }

  function openSlot(entry) {
    var store = window.GardenPLStore;
    var loaded = store.loadSlot(entry.id);
    if (loaded && loaded.payload) { adopt(loaded.payload); toast(L('فُتحت: ', 'Opened: ') + entry.name); }
    else toast(L('تعذّرت قراءةُ هذه النسخة.', 'This copy could not be read.'));
  }

  /*@4.LAPLJ.128*/
  function openSaves() {
    var store = window.GardenPLStore;
    if (!store) return;
    openModal(L('محفوظاتي', 'My saves'), function (body) {
      var field = document.createElement('input');
      field.className = 'pl-field';
      field.maxLength = store.MAX_NAME;
      field.placeholder = L('اسمُ النسخة…', 'Name this copy…');
      body.appendChild(field);
      var note = document.createElement('p');
      note.className = 'pl-note-line';
      note.textContent = L('الحفظُ التلقائيُّ يبقى يعمل بجانبها — النسخُ المسمّاةُ مستقلّةٌ عنه.',
        'Autosave keeps running alongside — named copies are independent of it.');
      body.appendChild(note);
      var list = store.slots();
      if (list.length) {
        var sep = document.createElement('div');
        sep.className = 'pl-sep';
        sep.innerHTML = '<span>' + L('النسخُ المحفوظة', 'Saved copies') + ' (' + list.length + '/' + store.MAX_SLOTS + ')</span>';
        body.appendChild(sep);
      }
      list.forEach(function (entry) {
        var row = document.createElement('div');
        row.className = 'pl-slot-row';
        var name = document.createElement('b');
        name.textContent = entry.name;
        name.setAttribute('dir', 'auto');
        var when = document.createElement('em');
        when.textContent = relativeTime(entry.at);
        var remove = document.createElement('button');
        remove.className = 'pl-slot-del';
        remove.setAttribute('aria-label', L('احذف', 'Delete'));
        remove.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
        remove.addEventListener('click', function (event) {
          event.stopPropagation();
          store.removeSlot(entry.id);
          renderSavesPanel();
          closeModal(); openSaves();
        });
        row.addEventListener('click', function () {
          closeModal();
          openSlot(entry);
        });
        row.appendChild(name); row.appendChild(when); row.appendChild(remove);
        body.appendChild(row);
      });
    }, [
      { label: L('إلغاء', 'Cancel'), act: function () { } },
      {
        label: L('احفظ باسم', 'Save as'), primary: true, act: function () {
          var field = overlay.querySelector('.pl-field');
          var result = store.saveSlot(field.value, snapshot());
          if (!result.ok) {
            toast(result.reason === 'full'
              ? L('بلغتَ اثنتي عشرة نسخة — احذف واحدةً أولاً.', 'You have twelve copies — delete one first.')
              : result.reason === 'empty-name'
                ? L('اكتب اسماً للنسخة.', 'Give the copy a name.')
                : L('تعذّر الحفظُ على هذا الجهاز.', 'Could not save on this device.'));
            return false;
          }
          toast(L('حُفظت: ', 'Saved: ') + field.value.trim());
          renderSavesPanel();
        }
      }
    ]);
  }

  function relativeTime(iso) {
    var minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return L('الآن', 'now');
    if (minutes < 60) return plural(minutes, ['قبل دقيقة', 'قبل دقيقتين', 'دقائق', 'دقيقة'], 'min ago', 'min ago');
    var hours = Math.round(minutes / 60);
    if (hours < 24) return plural(hours, ['قبل ساعة', 'قبل ساعتين', 'ساعات', 'ساعة'], 'h ago', 'h ago');
    var days = Math.round(hours / 24);
    return plural(days, ['أمس', 'قبل يومين', 'أيام', 'يوماً'], 'd ago', 'd ago');
  }

  /*@4.LAPLJ.129*/
  var RAW_ACCEPT = '.java,.py,.c,.cpp,.php,.sql,.html,.css,.js,.ts,.kt,.cs,.go,.rs,.rb,.r,.scala,.hs,.ex,.lua,.pas,.lisp,.pl,.groovy,.mas,.txt';
  function openIO() {
    var io = window.GardenPLIO;
    if (!io) return;
    openModal(L('استيراد وتصدير', 'Import & export'), function (body) {
      choice(body, 'fa-file-arrow-down', L('صدّر الملفَّ الحاليّ', 'Export the current file'),
        (current.id === 'java' ? 'Main' : 'main') + '.' + current.ext, function () {
          io.exportSource((current.id === 'java' ? 'Main' : 'main') + '.' + current.ext, editor.value);
        });
      choice(body, 'fa-box-archive', L('صدّر الجلسةَ كاملة', 'Export the whole session'),
        '.gardenpl.json', function () { io.exportSession(snapshot()); });
      if (current.id === 'python') {
        choice(body, 'fa-book', L('صدّر دفترَ Jupyter', 'Export a Jupyter notebook'), '.ipynb', function () {
          var lines = lastOutput.slice();
          io.exportNotebook(editor.value, lines);
        });
      }
      var sep = document.createElement('div');
      sep.className = 'pl-sep';
      sep.innerHTML = '<span>' + L('استيراد', 'Import') + '</span>';
      body.appendChild(sep);
      choice(body, 'fa-file-import', L('افتح ملفَّ لغة', 'Open a source file'),
        L('يُستدلّ على اللغة من امتداده', 'language inferred from its extension'), importSource);
      choice(body, 'fa-box-open', L('افتح جلسةً محفوظة', 'Open a saved session'), '.gardenpl.json', importSession);
      choice(body, 'fa-book-open', L('افتح دفترَ Jupyter', 'Open a Jupyter notebook'), '.ipynb', importNotebook);
    }, null);
  }

  var EXT_TO_LANG = {};
  LANGS.forEach(function (item) { if (!EXT_TO_LANG[item.ext]) EXT_TO_LANG[item.ext] = item.id; });
  EXT_TO_LANG.css = 'web'; EXT_TO_LANG.htm = 'web'; EXT_TO_LANG.py3 = 'python';

  function importSource() {
    window.GardenPLIO.pickFile(RAW_ACCEPT).then(function (file) {
      if (!file) return;
      var ext = (file.name.split('.').pop() || '').toLowerCase();
      var langId = EXT_TO_LANG[ext];
      if (langId) {
        var lang = LANGS.filter(function (item) { return item.id === langId; })[0];
        if (lang) selectLanguage(lang);
      }
      editor.value = file.text;
      buffers[current.id] = file.text;
      paint(); markDirty();
      /*@4.LAPLJ.130*/
      toast(langId
        ? L('فُتح ', 'Opened ') + file.name
        : L('فُتح ' + file.name + ' — اختر لغتَه بنفسك.', 'Opened ' + file.name + ' — pick its language yourself.'));
    });
  }

  function importSession() {
    window.GardenPLIO.pickFile('.json,.gardenpl.json').then(function (file) {
      if (!file) return;
      var parsed = window.GardenPLIO.parseSession(file.text);
      if (!parsed.ok) {
        toast(parsed.reason === 'version'
          ? L('هذه الجلسةُ من إصدارٍ لا نقرؤه.', 'This session is from a version we cannot read.')
          : L('هذا ليس ملفَّ جلسةٍ من الحديقة.', 'This is not a Garden session file.'));
        return;
      }
      adopt(parsed.payload); markDirty();
      toast(L('استُؤنفت الجلسةُ المستوردة.', 'Imported session restored.'));
    });
  }

  function importNotebook() {
    window.GardenPLIO.pickFile('.ipynb').then(function (file) {
      if (!file) return;
      var parsed = window.GardenPLIO.parseNotebook(file.text);
      if (!parsed.ok) {
        toast(parsed.reason === 'empty'
          ? L('لا خلايا كودٍ في هذا الدفتر.', 'No code cells in this notebook.')
          : L('تعذّرت قراءةُ هذا الدفتر.', 'This notebook could not be read.'));
        return;
      }
      var python = LANGS.filter(function (item) { return item.id === 'python'; })[0];
      selectLanguage(python);
      editor.value = parsed.code;
      buffers.python = parsed.code;
      paint(); markDirty();
      toast(plural(parsed.cells, ['فُتحت خليةٌ واحدة', 'فُتحت خليتان', 'خلايا فُتحت', 'خليةً فُتحت'],
        'cell opened', 'cells opened'));
    });
  }

  $('plIO').addEventListener('click', openIO);
  $('plSaveAs').addEventListener('click', openSaves);
  /*@4.LAPLJ.131*/
  function renderFilesPanel() {
    var host = document.querySelector('[data-panel="files"]');
    if (!host) return;
    var button = $('plNewFile');
    [].slice.call(host.querySelectorAll('.pl-file, .pl-note-line, .pl-sep'))
      .forEach(function (node) { node.remove(); });

    var rows = [{ name: entryFileName(), entry: true }].concat(projectFiles().map(function (file) {
      return { name: file.name, entry: false };
    }));
    rows.forEach(function (row) {
      var line = document.createElement('div');
      line.className = 'pl-file' + ((activeFile === null) === row.entry && (row.entry || activeFile === row.name) ? ' is-on' : '');
      line.setAttribute('data-tip-ar', row.entry ? 'ملفُّ التشغيل — اسمُه يتبع صفَّك' : 'افتح هذا الملفّ');
      line.setAttribute('data-tip-en', row.entry ? 'The entry file — its name follows your class' : 'Open this file');
      var icon = document.createElement('i');
      icon.className = 'fa-regular fa-file-code';
      line.appendChild(icon);
      var name = document.createElement('span');
      name.className = 'ltr';
      name.textContent = row.name;
      if (row.entry) name.id = 'plMainFile';
      line.appendChild(name);
      if (!row.entry) {
        var remove = document.createElement('button');
        remove.className = 'pl-slot-del';
        remove.setAttribute('aria-label', L('احذف الملفّ', 'Delete the file'));
        remove.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        remove.addEventListener('click', function (event) {
          event.stopPropagation();
          projects[current.id] = projectFiles().filter(function (file) { return file.name !== row.name; });
          if (activeFile === row.name) openFile(null);
          else renderFilesPanel();
          markDirty();
        });
        line.appendChild(remove);
      }
      line.addEventListener('click', function () { openFile(row.entry ? null : row.name); });
      host.insertBefore(line, button);
    });

    /*@4.LAPLJ.132*/
    if (current && runWhere() === 'browser') {
      host.insertBefore(noteLine(current.dual
        ? L('التشغيلُ على جهازك يقرأ هذا الملفَّ وحدَه. اضغط «على جهازك» في الأعلى لتشغيلها على الخادم — فتصير المشاريعُ متعدّدةَ الملفّات متاحة.',
            'Running on your device reads this file only. Tap “On your device” above to run on the server — then multi-file projects become available.')
        : L('لغةٌ تعمل على جهازك: التشغيلُ يقرأ هذا الملفَّ وحدَه. المشاريعُ متعدّدةُ الملفّات للغات الخادم.',
            'A device language: the run reads this file only. Multi-file projects are for the server languages.')), button);
    }
    button.hidden = !current || runWhere() !== 'server';
  }

  function entryFileName() {
    if (!current) return 'main';
    if (current.id === 'java' || current.id === 'kotlin') {
      var name = entryClass(buffers[current.id] !== undefined ? buffers[current.id] : editor.value);
      if (name) return name + '.' + current.ext;
    }
    return (current.id === 'java' ? 'Main' : 'main') + '.' + current.ext;
  }

  /*@4.LAPLJ.133*/
  function openFile(name) {
    stashEditor();
    activeFile = name;
    editor.value = name ? ((findFile(name) || {}).content || '')
      : (buffers[current.id] !== undefined ? buffers[current.id] : sampleFor(current));
    paint(); scheduleDiagnose(); renderFilesPanel(); markDirty();
  }

  var MAX_PROJECT_FILES = 12;
  /*@4.LAPLJ.134*/
  function safeFileName(name) {
    return /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,63}$/.test(String(name || '')) &&
      String(name).indexOf('..') === -1;
  }

  $('plNewFile').addEventListener('click', function () {
    openModal(L('ملفٌّ جديد', 'New file'), function (body) {
      var field = document.createElement('input');
      field.className = 'pl-field';
      field.maxLength = 64;
      field.placeholder = current.id === 'java' ? 'Student.java' : 'helper.' + current.ext;
      body.appendChild(field);
      var note = document.createElement('p');
      note.className = 'pl-note-line';
      note.textContent = L('يُكتب بجانب ملفِّ التشغيل في مساحة العمل — كما على جهازك. حروفٌ وأرقامٌ ونقطةٌ وشرطة، بلا مسارات.',
        'It is written beside the entry file in the workspace — just like on your machine. Letters, digits, dot and dash; no paths.');
      body.appendChild(note);
      var row = document.createElement('div');
      row.className = 'pl-hint-row';
      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'pl-hint-go';
      add.textContent = L('أضِف', 'Add');
      add.addEventListener('click', function () {
        var name = field.value.trim();
        if (!safeFileName(name)) {
          note.textContent = L('اسمٌ غيرُ صالح — حروفٌ وأرقامٌ ونقطةٌ وشرطة، ولا يبدأ بنقطة.',
            'Not a valid name — letters, digits, dot and dash, and it may not start with a dot.');
          return;
        }
        if (name === entryFileName() || findFile(name)) {
          note.textContent = L('هذا الاسمُ مستعملٌ بالفعل.', 'That name is already taken.');
          return;
        }
        if (projectFiles().length >= MAX_PROJECT_FILES) {
          note.textContent = L('بلغتَ الحدَّ: اثنا عشرَ ملفّاً للمشروع.', 'You have reached the limit: twelve project files.');
          return;
        }
        projectFiles().push({ name: name, content: '' });
        closeModal();
        openFile(name);
      });
      row.appendChild(add);
      body.appendChild(row);
      setTimeout(function () { field.focus(); }, 40);
    });
  });
  renderFilesPanel();
  /*@4.LAPLJ.135*/
  renderSavesPanel();

  /*@4.LAPLJ.136*/
  var LIB = { index: null, byLang: {}, open: {}, pending: {}, query: '' };

  var AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  function num(value) {
    return isAr() ? String(value).replace(/[0-9]/g, function (d) { return AR_DIGITS.charAt(+d); }) : String(value);
  }

  function libBase() {
    /*@4.LAPLJ.137*/
    var tag = [].slice.call(document.scripts).filter(function (item) {
      return item.src.indexOf('lab-programming-languages.js') !== -1;
    })[0];
    var url = tag ? tag.src.replace(/lab-programming-languages\.js.*$/, '') : '../shared/labs-v2/';
    var version = tag ? (tag.src.split('?v=')[1] || '') : '';
    return url + 'pl-lib/' + '@' + (version ? '?v=' + version : '');
  }
  function fetchLib(name) {
    var parts = libBase().split('@');
    return fetch(parts[0] + name + '.json' + parts[1], { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('http ' + response.status);
        return response.json();
      });
  }
  function loadIndex() {
    if (LIB.index) return Promise.resolve(LIB.index);
    if (!LIB.pending.index) {
      LIB.pending.index = fetchLib('index').then(function (data) {
        LIB.index = data; return data;
      }, function (error) { LIB.pending.index = null; throw error; });
    }
    return LIB.pending.index;
  }
  function loadLang(lang) {
    if (LIB.byLang[lang]) return Promise.resolve(LIB.byLang[lang]);
    if (!LIB.pending[lang]) {
      LIB.pending[lang] = fetchLib(lang).then(function (data) {
        LIB.byLang[lang] = data.examples || []; return LIB.byLang[lang];
      }, function (error) { LIB.pending[lang] = null; throw error; });
    }
    return LIB.pending[lang];
  }

  var libraryOpened = false;
  function loadLibrary() {
    libraryOpened = true;
    renderExamplesPanel();
    loadIndex()
      .then(function (index) {
        return index.languages[current.id] ? loadLang(current.id) : [];
      })
      .then(function () { renderExamplesPanel(); })
      .catch(function () {
        var host = $('plExHost');
        if (!host) return;
        host.textContent = '';
        host.appendChild(noteLine(L('تعذّر تحميلُ الأمثلة — حاول مرّةً أخرى.',
          'Could not load the examples — try again.')));
      });
  }
  function noteLine(text) {
    var note = document.createElement('p');
    note.className = 'pl-note-line';
    note.textContent = text;
    return note;
  }

  /*@4.LAPLJ.138*/
  function renderExamplesPanel() {
    var host = $('plExHost');
    if (!host) return;
    host.textContent = '';
    var list = LIB.byLang[current.id];
    if (!LIB.index || !list) {
      host.appendChild(noteLine(L('يُحمَّل…', 'Loading…')));
      return;
    }

    var head = document.createElement('div');
    head.className = 'pl-lib-head';
    var title = document.createElement('span');
    title.innerHTML = '<i class="fa-solid fa-layer-group"></i>';
    title.appendChild(document.createTextNode(
      L('أمثلةُ ' + current.nameAr, current.name + ' examples')));
    head.appendChild(title);
    var count = document.createElement('em');
    count.textContent = num(list.length);
    head.appendChild(count);
    host.appendChild(head);

    var browse = document.createElement('button');
    browse.className = 'pl-dashed';
    browse.type = 'button';
    browse.innerHTML = '<i class="fa-solid fa-book-open"></i>';
    browse.appendChild(Object.assign(document.createElement('span'), {
      textContent: L('تصفّح المكتبة كاملةً', 'Browse the whole library')
    }));
    browse.setAttribute('data-tip-ar', 'بطاقاتُ كل الفئات وكل اللغات في نافذةٍ واسعة');
    browse.setAttribute('data-tip-en', 'Every category and language, in one wide window');
    browse.addEventListener('click', openGallery);
    host.appendChild(browse);

    if (!list.length) {
      host.appendChild(noteLine(L('لا أمثلةَ لهذه اللغة بعد — وستصلها.',
        'No examples for this language yet — they are coming.')));
      return;
    }
    if (LIB.query) { renderSearch(host, list); return; }

    var groups = {};
    list.forEach(function (example) {
      (groups[example.category] = groups[example.category] || []).push(example);
    });
    LIB.index.categories.forEach(function (meta) {
      if (!groups[meta.id]) return;
      host.appendChild(categoryCard(meta, groups[meta.id]));
    });
  }

  function categoryCard(meta, items) {
    var card = document.createElement('div');
    card.className = 'pl-cat';
    /*@4.LAPLJ.139*/
    if (meta.color) card.style.setProperty('--tint', meta.color);
    var head = document.createElement('button');
    head.className = 'pl-cat-head';
    head.type = 'button';
    head.setAttribute('aria-expanded', LIB.open[meta.id] ? 'true' : 'false');
    head.innerHTML =
      '<span class="pl-cat-ic"><i class="fa-solid ' + meta.icon + '"></i></span>' +
      '<span class="pl-cat-t"><b></b><em></em></span>' +
      '<span class="pl-cat-n"></span>' +
      '<i class="fa-solid fa-chevron-down pl-car"></i>';
    head.querySelector('b').textContent = isAr() ? meta.ar : meta.en;
    head.querySelector('em').textContent = isAr() ? meta.hintAr : meta.hintEn;
    head.querySelector('.pl-cat-n').textContent = num(items.length);
    card.appendChild(head);

    var body = document.createElement('div');
    body.className = 'pl-cat-body';
    body.hidden = !LIB.open[meta.id];
    card.appendChild(body);
    if (LIB.open[meta.id]) fillCategory(body, meta, items);

    head.addEventListener('click', function () {
      var open = !LIB.open[meta.id];
      /*@4.LAPLJ.140*/
      if (open) {
        Object.keys(LIB.open).forEach(function (id) { LIB.open[id] = false; });
        var host = card.parentNode;
        [].slice.call(host.querySelectorAll('.pl-cat')).forEach(function (other) {
          if (other === card) return;
          other.classList.remove('is-open');
          var otherHead = other.querySelector('.pl-cat-head');
          var otherBody = other.querySelector('.pl-cat-body');
          if (otherHead) otherHead.setAttribute('aria-expanded', 'false');
          if (otherBody) otherBody.hidden = true;
        });
      }
      LIB.open[meta.id] = open;
      head.setAttribute('aria-expanded', String(open));
      card.classList.toggle('is-open', open);
      body.hidden = !open;
      if (open && !body.childElementCount) fillCategory(body, meta, items);
      if (open) {
        head.focus();
        /*@4.LAPLJ.141*/
        card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
    card.classList.toggle('is-open', !!LIB.open[meta.id]);
    return card;
  }

  function fillCategory(body, meta, items) {
    if (meta.id !== 'curriculum') {
      items.forEach(function (example) { body.appendChild(exampleRow(example)); });
      stripeExamples(body);
      return;
    }
    /*@4.LAPLJ.142*/
    var courses = {};
    items.forEach(function (example) {
      (courses[example.course || '—'] = courses[example.course || '—'] || []).push(example);
    });
    Object.keys(courses).sort().forEach(function (code) {
      var info = (LIB.index.courses || {})[code];
      var wrap = document.createElement('div');
      wrap.className = 'pl-course';
      var head = document.createElement('button');
      head.className = 'pl-course-head';
      head.type = 'button';
      head.innerHTML = '<b class="ltr"></b><span></span><em></em><i class="fa-solid fa-chevron-down pl-car"></i>';
      head.querySelector('b').textContent = code;
      head.querySelector('span').textContent = info ? (isAr() ? info.ar : info.en) : '';
      head.querySelector('em').textContent = num(courses[code].length);
      wrap.appendChild(head);
      var inner = document.createElement('div');
      inner.className = 'pl-course-body';
      inner.hidden = true;
      wrap.appendChild(inner);
      head.addEventListener('click', function () {
        inner.hidden = !inner.hidden;
        wrap.classList.toggle('is-open', !inner.hidden);
        if (!inner.childElementCount) fillCourse(inner, code, courses[code], info);
      });
      body.appendChild(wrap);
    });
  }

  function fillCourse(host, code, items, info) {
    var modules = {};
    items.forEach(function (example) {
      (modules[example.module || '—'] = modules[example.module || '—'] || []).push(example);
    });
    Object.keys(modules).sort().forEach(function (moduleId) {
      var label = document.createElement('div');
      label.className = 'pl-mod';
      var order = /^M(\d+)$/.exec(moduleId);
      var titles = info && info.modules && info.modules[moduleId];
      label.textContent = (order ? L('الوحدة ' + num(parseInt(order[1], 10)), 'Module ' + parseInt(order[1], 10)) : moduleId) +
        (titles ? ' · ' + (isAr() ? titles.ar : titles.en) : '');
      host.appendChild(label);
      modules[moduleId].forEach(function (example) { host.appendChild(exampleRow(example)); });
    });
    stripeExamples(host);
  }

  /*@4.LAPLJ.143*/
  function stripeExamples(host) {
    [].forEach.call(host.querySelectorAll('.pl-ex'), function (row, index) {
      row.classList.toggle('is-alt', index % 2 === 1);
    });
  }

  function exampleRow(example) {
    var row = document.createElement('button');
    row.className = 'pl-ex';
    row.type = 'button';
    row.dataset.libId = example.id;
    var tint = (LIB.index && (LIB.index.categories.filter(function (item) { return item.id === example.category; })[0] || {}).color);
    if (tint) row.style.setProperty('--tint', tint);
    var title = document.createElement('span');
    title.setAttribute('dir', 'auto');
    title.textContent = isAr() ? example.titleAr : example.titleEn;
    row.appendChild(title);
    var icon = document.createElement('i');
    icon.className = 'fa-solid fa-play';
    row.appendChild(icon);
    if (example.descAr) {
      row.setAttribute('data-tip-ar', example.descAr);
      row.setAttribute('data-tip-en', example.descEn || example.descAr);
    }
    row.addEventListener('click', function () { openExample(example, row); });
    return row;
  }

  /*@4.LAPLJ.144*/
  function renderSearch(host, list) {
    var needle = normalizeArabic(LIB.query);
    var hits = list.filter(function (example) {
      return normalizeArabic([example.titleAr, example.titleEn, example.descAr, example.descEn,
        example.course, example.category].join(' ')).indexOf(needle) !== -1;
    });
    var label = document.createElement('div');
    label.className = 'pl-sep';
    label.innerHTML = '<span></span>';
    label.querySelector('span').textContent = hits.length
      ? plural(hits.length, ['نتيجةٌ واحدة', 'نتيجتان', 'نتائج', 'نتيجة'], 'result', 'results')
      : L('لا نتائج', 'No results');
    host.appendChild(label);
    hits.slice(0, 120).forEach(function (example) {
      var row = exampleRow(example);
      var meta = (LIB.index.categories.filter(function (item) { return item.id === example.category; })[0]);
      if (meta) {
        var tag = document.createElement('em');
        tag.className = 'pl-ex-tag';
        tag.textContent = isAr() ? meta.ar : meta.en;
        row.insertBefore(tag, row.lastChild);
      }
      host.appendChild(row);
    });
    stripeExamples(host);
  }

  function openExample(example, row) {
    document.querySelectorAll('.pl-ex').forEach(function (other) { other.classList.remove('is-on'); });
    if (row) row.classList.add('is-on');
    var lang = LANGS.filter(function (item) { return item.id === example.lang; })[0];
    if (lang && lang.id !== current.id) selectLanguage(lang);
    editor.value = example.code;
    buffers[current.id] = example.code;
    $('plStdin').value = example.stdin || '';
    paintStdin();
    paint(); markDirty(); scheduleDiagnose();
    if (runWhere() === 'browser') run();
  }

  /*@4.LAPLJ.145*/
  var libraryButton = $('plLibraryBtn');
  if (libraryButton) {
    libraryButton.addEventListener('click', function () {
      /*@4.LAPLJ.146*/
      loadIndex().then(function () { return loadLang(current.id).catch(function () { }); })
        .then(function () { libraryOpened = true; openGallery(); },
              function () { toast(L('تعذّر تحميلُ المكتبة الآن.', 'The library could not load right now.')); });
    });
  }
  var savesButton = $('plSavesBtn');
  if (savesButton) savesButton.addEventListener('click', function () { openSaves(); });

  function openGallery() {
    var state = { lang: current.id, category: null };
    openModal(L('مكتبةُ الأمثلة', 'Example library'), function (body) {
      body.classList.add('pl-gallery');
      var chips = document.createElement('div');
      chips.className = 'pl-chips';
      body.appendChild(chips);
      var stage = document.createElement('div');
      stage.className = 'pl-stage';
      body.appendChild(stage);

      function drawChips() {
        chips.textContent = '';
        LANGS.forEach(function (lang) {
          var info = LIB.index.languages[lang.id];
          if (!info) return;
          var chip = document.createElement('button');
          chip.className = 'pl-chip' + (state.lang === lang.id ? ' is-on' : '');
          chip.type = 'button';
          chip.innerHTML = '<i class="pl-dot" style="background:' + lang.color + '"></i>';
          chip.appendChild(document.createTextNode(lang.name));
          var badge = document.createElement('em');
          badge.textContent = num(info.total);
          chip.appendChild(badge);
          chip.addEventListener('click', function () {
            state.lang = lang.id; state.category = null;
            drawChips(); draw();
          });
          chips.appendChild(chip);
        });
      }

      function draw() {
        stage.textContent = '';
        var list = LIB.byLang[state.lang];
        if (!list) {
          stage.appendChild(noteLine(L('يُحمَّل…', 'Loading…')));
          loadLang(state.lang).then(draw, function () {
            stage.textContent = '';
            stage.appendChild(noteLine(L('تعذّر التحميل.', 'Could not load.')));
          });
          return;
        }
        var groups = {};
        list.forEach(function (example) {
          (groups[example.category] = groups[example.category] || []).push(example);
        });

        if (!state.category) {
          var grid = document.createElement('div');
          grid.className = 'pl-grid';
          LIB.index.categories.forEach(function (meta) {
            if (!groups[meta.id]) return;
            var card = document.createElement('button');
            card.className = 'pl-tile';
            card.type = 'button';
            if (meta.color) card.style.setProperty('--tint', meta.color);
            card.innerHTML = '<span class="pl-tile-ic"><i class="fa-solid ' + meta.icon + '"></i></span>' +
              '<b></b><em></em><span class="pl-tile-n"></span>';
            card.querySelector('b').textContent = isAr() ? meta.ar : meta.en;
            card.querySelector('em').textContent = isAr() ? meta.hintAr : meta.hintEn;
            card.querySelector('.pl-tile-n').textContent =
              plural(groups[meta.id].length, ['مثالٌ واحد', 'مثالان', 'أمثلة', 'مثالاً'], 'example', 'examples');
            card.addEventListener('click', function () { state.category = meta.id; draw(); });
            grid.appendChild(card);
          });
          stage.appendChild(grid);
          return;
        }

        var meta = LIB.index.categories.filter(function (item) { return item.id === state.category; })[0];
        var back = document.createElement('button');
        back.className = 'pl-back';
        back.type = 'button';
        back.innerHTML = '<i class="fa-solid fa-arrow-right-long"></i>';
        back.appendChild(document.createTextNode(isAr() ? meta.ar : meta.en));
        back.addEventListener('click', function () { state.category = null; draw(); });
        stage.appendChild(back);

        var rows = document.createElement('div');
        rows.className = 'pl-rows';
        groups[state.category].forEach(function (example) {
          var item = document.createElement('button');
          item.className = 'pl-row';
          item.type = 'button';
          var head = document.createElement('b');
          head.setAttribute('dir', 'auto');
          head.textContent = isAr() ? example.titleAr : example.titleEn;
          item.appendChild(head);
          if (example.descAr) {
            var desc = document.createElement('span');
            desc.setAttribute('dir', 'auto');
            desc.textContent = isAr() ? example.descAr : (example.descEn || example.descAr);
            item.appendChild(desc);
          }
          if (example.course) {
            var tag = document.createElement('em');
            tag.className = 'ltr';
            tag.textContent = example.course + (example.module ? ' · ' + example.module : '');
            item.appendChild(tag);
          }
          item.addEventListener('click', function () { closeModal(); openExample(example, null); });
          rows.appendChild(item);
        });
        stage.appendChild(rows);
      }

      drawChips();
      draw();
    }, [{ label: L('إغلاق', 'Close'), act: function () { } }]);
  }

  /*@4.LAPLJ.147*/
  function normalizeArabic(text) {
    return String(text).toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  }
  document.querySelector('.pl-ex-search input').addEventListener('input', function (event) {
    LIB.query = event.target.value.trim();
    renderExamplesPanel();
  });
  /*@4.LAPLJ.148*/
  var aiState = { busy: false, used: null, limit: null, mode: 'explain' };

  function aiHost() { return document.querySelector('[data-out-panel="explain"]'); }

  function renderAiPanel() {
    var host = aiHost();
    if (!host) return;
    host.textContent = '';

    var bar = document.createElement('div');
    bar.className = 'pl-ai-bar';
    [['explain', 'fa-wand-magic-sparkles', 'اشرح كودي', 'Explain my code'],
     ['fix', 'fa-bug-slash', 'ما الخطأ؟', 'What is wrong?'],
     ['evaluate', 'fa-clipboard-check', 'قيّم أسلوبي', 'Review my style'],
     ['exercise', 'fa-dumbbell', 'تمرينٌ مشابه', 'A similar exercise']
    ].forEach(function (spec) {
      var button = document.createElement('button');
      button.className = 'pl-ai-mode' + (aiState.mode === spec[0] ? ' is-on' : '');
      button.type = 'button';
      button.innerHTML = '<i class="fa-solid ' + spec[1] + '"></i>';
      button.appendChild(document.createTextNode(L(spec[2], spec[3])));
      button.addEventListener('click', function () { askAi(spec[0]); });
      bar.appendChild(button);
    });
    host.appendChild(bar);

    var quota = document.createElement('div');
    quota.className = 'pl-ai-quota';
    quota.id = 'plAiQuota';
    host.appendChild(quota);
    paintQuota();

    var body = document.createElement('div');
    body.className = 'pl-ai-body';
    body.id = 'plAiBody';
    host.appendChild(body);

    var empty = document.createElement('div');
    empty.className = 'pl-empty';
    empty.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
    var note = document.createElement('p');
    note.textContent = L('اختر ما تريد: شرحاً لكودك، أو تشخيصاً لخطأ، أو تقييماً لأسلوبك، أو تمريناً مشابهاً.',
      'Pick one: explain your code, diagnose an error, review your style, or get a similar exercise.');
    empty.appendChild(note);
    body.appendChild(empty);
  }

  function paintQuota() {
    var node = $('plAiQuota');
    if (!node) return;
    if (aiState.used === null) { node.textContent = ''; return; }
    node.textContent = L(
      'استُخدم ' + num(aiState.used) + ' من ' + num(aiState.limit) + ' اليوم',
      'Used ' + aiState.used + ' of ' + aiState.limit + ' today');
  }

  function aiBase() {
    var base = labsBase();
    return base ? base.replace(/\/$/, '') : '';
  }

  function loadQuota() {
    var base = aiBase();
    if (!base) return;
    fetch(base + '/v1/ai/quota', { headers: { 'X-Garden-Identity': identity() } })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (!data) return;
        aiState.used = data.used; aiState.limit = data.limit;
        paintQuota();
      }, function () { });
  }

  function askAi(mode) {
    if (aiState.busy) return;
    aiState.mode = mode;
    renderAiPanel();
    selectOutTab('explain');
    var body = $('plAiBody');
    var code = editor.value;
    if (!code.trim()) { aiMessage(t('aiNoCode'), 'note'); return; }

    var base = aiBase();
    if (!base) { aiMessage(t('aiOffline'), 'err', true); return; }

    aiState.busy = true;
    body.textContent = '';
    var article = document.createElement('div');
    article.className = 'pl-ai-answer';
    article.setAttribute('dir', 'auto');
    body.appendChild(article);
    var pending = document.createElement('div');
    pending.className = 'pl-ai-wait';
    pending.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    pending.appendChild(document.createTextNode(t('aiThinking')));
    body.appendChild(pending);

    var errText = lastOutput.filter(function (line) { return /error|exception|traceback|خطأ/i.test(line); }).join('\n');
    fetch(base + '/v1/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Garden-Identity': identity() },
      body: JSON.stringify({
        mode: mode, lang: current.id, code: code,
        stdout: lastOutput.join('\n').slice(0, 6000),
        stderr: errText.slice(0, 2000)
      })
    }).then(function (response) {
      if (response.status === 429) {
        return response.json().then(function (data) {
          aiState.used = data.used; aiState.limit = data.limit; paintQuota();
          throw new Error('capped');
        });
      }
      if (!response.ok || !response.body) throw new Error('offline');
      return streamAnswer(response, article, pending);
    }).then(function () {
      aiState.busy = false;
      loadQuota();
    }, function (error) {
      aiState.busy = false;
      pending.remove();
      var capped = String(error && error.message) === 'capped';
      aiMessage(capped ? t('aiCapped') : t('aiOffline'), capped ? 'note' : 'err', true);
    });
  }

  /*@4.LAPLJ.149*/
  function streamAnswer(response, article, pending) {
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var carry = '', text = '';
    function pump() {
      return reader.read().then(function (chunk) {
        if (chunk.done) { pending.remove(); renderMarkdown(article, text); return; }
        carry += decoder.decode(chunk.value, { stream: true });
        var parts = carry.split('\n\n');
        carry = parts.pop() || '';
        parts.forEach(function (part) {
          part.split('\n').forEach(function (line) {
            if (line.indexOf('data:') !== 0) return;
            try {
              var data = JSON.parse(line.slice(5).trim());
              if (data.t) { text += data.t; renderMarkdown(article, text); }
              if (data.done) { aiState.used = data.used; aiState.limit = data.limit; paintQuota(); }
            } catch (error) { /*@4.LAPLJ.150*/ }
          });
        });
        if (pending.parentNode && text) pending.remove();
        return pump();
      });
    }
    return pump();
  }

  /*@4.LAPLJ.151*/
  function renderMarkdown(host, text) {
    host.textContent = '';
    var blocks = String(text).split(/```/);
    blocks.forEach(function (block, index) {
      if (index % 2 === 1) {
        var pre = document.createElement('pre');
        pre.className = 'pl-ai-code ltr';
        var firstBreak = block.indexOf('\n');
        pre.textContent = firstBreak === -1 ? block : block.slice(firstBreak + 1);
        host.appendChild(pre);
        return;
      }
      block.split('\n').forEach(function (line) {
        var trimmed = line.trim();
        if (!trimmed) return;
        var node, text;
        if (/^#{1,4}\s/.test(trimmed)) {
          node = document.createElement('h4');
          text = trimmed.replace(/^#{1,4}\s+/, '');
        } else if (/^[-·*]\s/.test(trimmed)) {
          node = document.createElement('div');
          node.className = 'pl-ai-li';
          text = trimmed.replace(/^[-·*]\s+/, '');
        } else {
          node = document.createElement('p');
          text = trimmed;
        }
        /*@4.LAPLJ.197*/
        if (window.GardenAIIcons) window.GardenAIIcons.into(node, text);
        else node.textContent = text;
        node.setAttribute('dir', 'auto');
        host.appendChild(node);
      });
    });
    host.scrollTop = host.scrollHeight;
  }

  function aiMessage(text, kind, offer) {
    var body = $('plAiBody');
    if (!body) return;
    body.textContent = '';
    var note = document.createElement('div');
    note.className = 'pl-ai-note' + (kind === 'err' ? ' is-err' : '');
    note.setAttribute('dir', 'auto');
    note.textContent = text;
    body.appendChild(note);
    /*@4.LAPLJ.198*/
    if (offer) body.appendChild(aiFallback());
  }

  /*@4.LAPLJ.199*/
  function aiFence(parts) {
    var longest = 0;
    parts.forEach(function (part) {
      String(part || '').replace(/`+/g, function (run) {
        longest = Math.max(longest, run.length); return run;
      });
    });
    return new Array(Math.max(3, longest + 1) + 1).join('`');
  }

  /*@4.LAPLJ.200*/
  var AI_ASK = {
    explain: ['اشرح ما يفعله هذا الكود ولماذا أعطى هذا الناتج: ماذا يفعل، ثم كيف يعمل خطوةً خطوةً بأسماء المتغيّرات الحقيقية، ثم لماذا ظهر هذا الناتج تحديداً.',
              'Explain what this code does and why it produced this output: what it does, then how it works step by step using the real variable names, then why this exact output appeared.'],
    fix: ['هذا الكود لم يعمل. اشرح ما الخطأ، وأين هو بالضبط، ولماذا هو خطأ في هذه اللغة، وكيف أُصلحه — ولا تكتب لي الملفّ كاملاً مصحَّحاً.',
          'This code does not work. Explain what the error is, exactly where, why it is wrong in this language, and how to fix it — do not write the whole corrected file for me.'],
    evaluate: ['قيّم هذا الكود كما يقيّمه مصحّحٌ منصف: الصحّة، ثم الأسلوب والتسمية، ثم التعقيد الزمنيّ والمكانيّ بصيغة O الكبرى، ثم أهمّ تحسينٍ واحد.',
               'Review this code as a fair grader would: correctness, then style and naming, then time and space complexity in big-O, then the single most valuable improvement.'],
    exercise: ['ولّد لي تمريناً مشابهاً أتدرّب به على الفكرة نفسِها، مع مثالٍ للمدخلات والمخرجات المتوقّعة وتلميحٍ واحد — ولا تكتب الحلّ.',
               'Give me a similar exercise to practise the same idea, with one concrete input/output example and a single hint — do not write the solution.']
  };

  /*@4.LAPLJ.201*/
  function aiPromptText() {
    var code = editor.value || '';
    var out = lastOutput.join('\n').slice(0, 4000);
    var err = lastOutput.filter(function (line) {
      return /error|exception|traceback|خطأ/i.test(line);
    }).join('\n').slice(0, 1500);
    var ask = AI_ASK[aiState.mode] || AI_ASK.explain;
    var fence = aiFence([code, out, err]);
    var lines = [];
    lines.push(L('أنا طالبُ علوم حاسبٍ جامعيّ، وهذا كودي بلغة ' + current.id + '.',
                 'I am a university computer science student, and this is my ' + current.id + ' code.'));
    lines.push(L(ask[0], ask[1]));
    lines.push(L('أجب بالعربية الفصيحة، والمصطلحاتُ التقنية والكودُ بالإنجليزية كما هي.',
                 'Answer in clear English.'));
    lines.push('');
    lines.push(fence + current.id);
    lines.push(code);
    lines.push(fence);
    if (out) {
      lines.push('');
      lines.push(L('ناتجُ التشغيل:', 'Program output:'));
      lines.push(fence + 'text');
      lines.push(out);
      lines.push(fence);
    }
    if (err) {
      lines.push('');
      lines.push(L('رسالةُ الخطأ:', 'Error message:'));
      lines.push(fence + 'text');
      lines.push(err);
      lines.push(fence);
    }
    return lines.join('\n');
  }

  /*@4.LAPLJ.202*/
  function aiCopy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return aiCopyLegacy(text); });
    }
    return Promise.resolve(aiCopyLegacy(text));
  }
  function aiCopyLegacy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.insetInlineStart = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) { return false; }
  }

  /*@4.LAPLJ.203*/
  var AI_SERVICES = [
    ['Gemini', 'https://gemini.google.com/app'],
    ['ChatGPT', 'https://chatgpt.com/'],
    ['Qwen', 'https://chat.qwen.ai/']
  ];

  /*@4.LAPLJ.204*/
  function aiFallback() {
    var box = document.createElement('div');
    box.className = 'pl-ai-fb';

    var hint = document.createElement('p');
    hint.className = 'pl-ai-fb-h';
    hint.textContent = L('انسخ سؤالَك كاملاً والصقه في أيِّ مساعدٍ مجّاني — كودُك وناتجُه معه.',
                         'Copy the full question and paste it into any free assistant — your code and its output come along.');
    box.appendChild(hint);

    var row = document.createElement('div');
    row.className = 'pl-ai-fb-row';

    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'pl-ai-fb-copy';
    copy.innerHTML = '<i class="fa-solid fa-clipboard" aria-hidden="true"></i>';
    copy.appendChild(document.createTextNode(L('انسخ السؤال', 'Copy the question')));
    copy.addEventListener('click', function () {
      aiCopy(aiPromptText()).then(function (ok) {
        copy.classList.add('is-done');
        copy.textContent = '';
        copy.innerHTML = '<i class="fa-solid ' + (ok === false ? 'fa-xmark' : 'fa-check') + '" aria-hidden="true"></i>';
        copy.appendChild(document.createTextNode(
          ok === false ? L('تعذّر النسخ', 'Copy failed') : L('نُسخ', 'Copied')));
        setTimeout(function () {
          copy.classList.remove('is-done');
          copy.textContent = '';
          copy.innerHTML = '<i class="fa-solid fa-clipboard" aria-hidden="true"></i>';
          copy.appendChild(document.createTextNode(L('انسخ السؤال', 'Copy the question')));
        }, 2400);
      });
    });
    row.appendChild(copy);

    AI_SERVICES.forEach(function (svc) {
      var a = document.createElement('a');
      a.className = 'pl-ai-fb-svc';
      a.href = svc[1];
      a.target = '_blank';
      a.rel = 'noopener';
      a.title = L('انسخ السؤالَ وافتح ' + svc[0], 'Copy the question and open ' + svc[0]);
      a.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>';
      a.appendChild(document.createTextNode(svc[0]));
      /*@4.LAPLJ.205*/
      a.addEventListener('click', function () { aiCopy(aiPromptText()); });
      row.appendChild(a);
    });

    box.appendChild(row);
    return box;
  }

  if (FEATURES.ai) { renderAiPanel(); loadQuota(); }

  /*@4.LAPLJ.152*/
  function applyTheme(id) {
    var host = document.body;
    if (!id || id === 'garden') host.removeAttribute('data-pl-theme');
    else host.setAttribute('data-pl-theme', id);
    writePref(THEME_KEY, id || 'garden');
  }
  function applyStripe(on) {
    var out = $('plOut');
    if (out) out.classList.toggle('is-striped', !!on);
    writePref(STRIPE_KEY, on ? '1' : '0');
  }
  /*@4.LAPLJ.153*/
  function stripeLines(host, selector) {
    if (!host) return;
    [].forEach.call(host.querySelectorAll(selector), function (line, index) {
      line.classList.toggle('is-alt', index % 2 === 1);
    });
  }

  function themeMenu(button) {
    var open = $('plThemePop');
    if (open) { open.remove(); return; }
    var pop = document.createElement('div');
    pop.className = 'pl-theme-pop';
    pop.id = 'plThemePop';
    var current = readPref(THEME_KEY, 'garden');

    var title = document.createElement('div');
    title.className = 'pl-theme-sep';
    title.textContent = t('themeTitle');
    pop.appendChild(title);

    var group = null;
    THEMES.forEach(function (theme) {
      if (theme.dark !== null && theme.dark !== group) {
        group = theme.dark;
        var sep = document.createElement('div');
        sep.className = 'pl-theme-sep';
        sep.textContent = group ? t('themeDark') : t('themeLight');
        pop.appendChild(sep);
      }
      var option = document.createElement('button');
      option.type = 'button';
      option.className = 'pl-theme-opt' + (theme.id === current ? ' is-on' : '');
      var swatch = document.createElement('span');
      swatch.className = 'pl-theme-swatch';
      swatch.style.background = theme.swatch[0];
      theme.swatch.slice(1).forEach(function (colour) {
        var bar = document.createElement('i');
        bar.style.background = colour;
        swatch.appendChild(bar);
      });
      option.appendChild(swatch);
      var name = document.createElement('span');
      name.textContent = isAr() ? theme.ar : theme.en;
      option.appendChild(name);
      option.addEventListener('click', function () {
        applyTheme(theme.id);
        pop.remove();
        paint();
      });
      pop.appendChild(option);
    });

    var stripe = document.createElement('button');
    stripe.type = 'button';
    stripe.className = 'pl-theme-toggle';
    var on = readPref(STRIPE_KEY, '0') === '1';
    var label = document.createElement('b');
    label.textContent = t('stripeOn');
    stripe.appendChild(label);
    var state = document.createElement('span');
    state.textContent = on ? L('مُفعّل', 'On') : L('مُطفأ', 'Off');
    stripe.appendChild(state);
    stripe.setAttribute('data-tip-ar', t('stripeHint'));
    stripe.setAttribute('data-tip-en', t('stripeHint'));
    stripe.addEventListener('click', function () {
      on = !on;
      applyStripe(on);
      state.textContent = on ? L('مُفعّل', 'On') : L('مُطفأ', 'Off');
    });
    pop.appendChild(stripe);

    button.parentNode.appendChild(pop);
    var away = function (event) {
      if (pop.contains(event.target) || event.target === button) return;
      pop.remove();
      document.removeEventListener('click', away, true);
    };
    setTimeout(function () { document.addEventListener('click', away, true); }, 0);
  }

  (function initTheme() {
    applyTheme(readPref(THEME_KEY, 'garden'));
    applyStripe(readPref(STRIPE_KEY, '0') === '1');
    var button = $('plTheme');
    if (button) button.addEventListener('click', function () { themeMenu(button); });
  })();

  /*@4.LAPLJ.154*/
  function selectOutTab(name) {
    lab.classList.remove('is-side-open');
    document.querySelectorAll('.pl-out-tab').forEach(function (tab) {
      var on = !tab.dataset.sideTab && tab.dataset.out === name;
      tab.classList.toggle('is-on', on);
      tab.setAttribute('aria-selected', String(on));
    });
    document.querySelectorAll('[data-out-panel]').forEach(function (panel) {
      panel.hidden = panel.dataset.outPanel !== name;
    });
  }
  document.querySelector('.pl-out-tabs').addEventListener('click', function (event) {
    var tab = event.target.closest('.pl-out-tab');
    if (!tab) return;
    /*@4.LAPLJ.155*/
    if (tab.dataset.sideTab) { openSidePane(tab.dataset.sideTab, tab); return; }
    lab.classList.remove('is-side-open');
    selectOutTab(tab.dataset.out);
  });

  /*@4.LAPLJ.156*/
  function focusOutput() {
    var openTab = document.querySelector('.pl-out-tab[data-out="stdout"]');
    if (lab.classList.contains('is-side-open')) {
      lab.classList.remove('is-side-open');
      document.querySelectorAll('.pl-side-tab').forEach(function (other) {
        other.classList.remove('is-on');
        other.setAttribute('aria-selected', 'false');
      });
    }
    if (openTab) selectOutTab('stdout');
  }

  function openSidePane(name, tab) {
    /*@4.LAPLJ.157*/
    if (outTabsBar) lab.style.setProperty('--pl-tabs-h', outTabsBar.offsetHeight + 'px');
    lab.classList.add('is-side-open');
    document.querySelectorAll('.pl-out-tab').forEach(function (other) {
      var on = other === tab;
      other.classList.toggle('is-on', on);
      other.setAttribute('aria-selected', String(on));
    });
    document.querySelectorAll('[data-panel]').forEach(function (panel) {
      panel.hidden = panel.dataset.panel !== name;
    });
    document.querySelectorAll('.pl-side-tab').forEach(function (other) {
      var on = other.dataset.side === name;
      other.classList.toggle('is-on', on);
      other.setAttribute('aria-selected', String(on));
    });
    if (name === 'examples') loadLibrary();
  }
  document.querySelector('.pl-side-tabs').addEventListener('click', function (event) {
    var tab = event.target.closest('.pl-side-tab');
    if (!tab) return;
    document.querySelectorAll('.pl-side-tab').forEach(function (other) {
      var on = other === tab;
      other.classList.toggle('is-on', on);
      other.setAttribute('aria-selected', String(on));
    });
    document.querySelectorAll('[data-panel]').forEach(function (panel) {
      panel.hidden = panel.dataset.panel !== tab.dataset.side;
    });
    if (tab.dataset.side === 'examples') loadLibrary();
  });

  /*@4.LAPLJ.158*/
  function syncArrow(button, collapsed, side) {
    var rightToLeft = document.documentElement.getAttribute('dir') !== 'ltr';
    var towardsStart = collapsed ? side === 'start' : side === 'end';
    button.textContent = (rightToLeft ? !towardsStart : towardsStart) ? '‹' : '›';
  }
  var sideToggle = $('plSideToggle'), outToggle = $('plOutToggle');
  sideToggle.addEventListener('click', function () {
    syncArrow(sideToggle, lab.classList.toggle('is-side-collapsed'), 'start');
  });
  outToggle.addEventListener('click', function () {
    lab.classList.toggle('is-out-collapsed');
    syncOutToggle();
  });
  /*@4.LAPLJ.159*/
  function syncOutToggle() {
    var collapsed = lab.classList.contains('is-out-collapsed');
    if (dockedBottom()) outToggle.textContent = collapsed ? '▴' : '▾';
    else syncArrow(outToggle, collapsed, 'end');
    outToggle.setAttribute('data-tip-ar', collapsed ? 'أظهِر لوحَ الناتج' : 'اطوِ لوحَ الناتج');
    outToggle.setAttribute('data-tip-en', collapsed ? 'Show the output panel' : 'Collapse the output panel');
  }

  /*@4.LAPLJ.160*/
  var GRIP_KEY = 'garden_pl_panes';
  /*@4.LAPLJ.161*/
  var PANE_DEFAULTS = { side: 236, out: 366, outH: 34 };
  var panes = { side: PANE_DEFAULTS.side, out: PANE_DEFAULTS.out, outH: PANE_DEFAULTS.outH, bottom: false };
  try {
    var saved = JSON.parse(localStorage.getItem(GRIP_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (saved.side) panes.side = saved.side;
      if (saved.out) panes.out = saved.out;
      if (saved.outH) panes.outH = saved.outH;
      panes.bottom = saved.bottom === true;
    }
  } catch (error) { /*@4.LAPLJ.162*/ }

  /*@4.LAPLJ.163*/
  function narrowRows() { return window.matchMedia('(max-width: 780px)').matches; }
  function dockedBottom() { return panes.bottom && !narrowRows(); }
  function gripIsRow(which) { return narrowRows() || (which === 'out' && panes.bottom); }

  function clamp(value, low, high) { return Math.min(high, Math.max(low, value)); }
  /*@4.LAPLJ.164*/
  function maxOutPercent() {
    var height = lab.getBoundingClientRect().height || 600;
    return clamp(((height - 280) / height) * 100, 20, 80);
  }
  function applyPanes() {
    lab.style.setProperty('--pl-side-w', panes.side + 'px');
    lab.style.setProperty('--pl-out-w', panes.out + 'px');
    /*@4.LAPLJ.165*/
    lab.style.setProperty('--pl-out-h', Math.min(panes.outH, maxOutPercent()) + '%');
  }
  function savePanes() {
    try { localStorage.setItem(GRIP_KEY, JSON.stringify(panes)); } catch (error) { }
  }

  /*@4.LAPLJ.166*/
  var outGrip = lab.querySelector('.pl-grip[data-grip="out"]');
  var dockButton = $('plOutDock');
  function applyDock() {
    var bottom = dockedBottom();
    lab.classList.toggle('is-out-bottom', bottom);
    if (outGrip) {
      outGrip.setAttribute('aria-orientation', gripIsRow('out') ? 'horizontal' : 'vertical');
      outGrip.setAttribute('aria-label', gripIsRow('out')
        ? L('اسحب لرفع لوح النتائج أو خفضه', 'Drag to raise or lower the results panel')
        : L('اسحب لتوسيع لوح النتائج', 'Drag to widen the results panel'));
    }
    if (dockButton) {
      dockButton.innerHTML = '<i class="fa-solid ' + (bottom ? 'fa-table-columns' : 'fa-down-long') + '"></i>';
      dockButton.setAttribute('aria-pressed', String(bottom));
      dockButton.setAttribute('data-tip-ar', bottom
        ? 'أعِد لوحَ الناتج عموداً جانبياً'
        : 'أنزِل لوحَ الناتج إلى الأسفل بعرض المختبر');
      dockButton.setAttribute('data-tip-en', bottom
        ? 'Dock the output back to the side column'
        : 'Dock the output to the bottom, full width');
    }
    syncOutToggle();
  }
  if (dockButton) {
    dockButton.addEventListener('click', function () {
      panes.bottom = !panes.bottom;
      applyDock(); applyPanes(); savePanes();
      paint();                       /*@4.LAPLJ.167*/
      toast(panes.bottom
        ? L('الناتجُ في الأسفل — اسحب حافّتَه العليا لترفعه.',
            'Output docked at the bottom — drag its top edge to raise it.')
        : L('الناتجُ عمودٌ جانبيّ.', 'Output docked to the side column.'));
    });
  }
  /*@4.LAPLJ.168*/
  try {
    window.matchMedia('(max-width: 780px)')
      .addEventListener('change', function () { applyDock(); });
  } catch (error) { /*@4.LAPLJ.169*/ }

  applyPanes();
  applyDock();

  lab.querySelectorAll('.pl-grip').forEach(function (grip) {
    var which = grip.dataset.grip;
    grip.addEventListener('pointerdown', function (event) {
      if (event.button) return;
      var rows = gripIsRow(which);
      var rtl = document.documentElement.getAttribute('dir') !== 'ltr';
      var startX = event.clientX, startY = event.clientY;
      var from = rows ? panes.outH : (which === 'side' ? panes.side : panes.out);
      /*@4.LAPLJ.170*/
      try { grip.setPointerCapture(event.pointerId); } catch (error) { }
      grip.classList.add('is-dragging');
      lab.classList.add('is-resizing');
      lab.classList.toggle('is-rows', rows);
      var move = function (moveEvent) {
        if (rows) {
          /*@4.LAPLJ.171*/
          var height = lab.getBoundingClientRect().height || 1;
          panes.outH = clamp(from + ((startY - moveEvent.clientY) / height) * 100, 14, maxOutPercent());
        } else {
          var delta = moveEvent.clientX - startX;
          if (which === 'side') panes.side = clamp(from + (rtl ? -delta : delta), 180, 460);
          else panes.out = clamp(from + (rtl ? delta : -delta), 260, 720);
        }
        applyPanes();
      };
      var up = function () {
        grip.removeEventListener('pointermove', move);
        grip.removeEventListener('pointerup', up);
        grip.removeEventListener('pointercancel', up);
        grip.classList.remove('is-dragging');
        lab.classList.remove('is-resizing', 'is-rows');
        savePanes();
        paint();                       /*@4.LAPLJ.172*/
      };
      grip.addEventListener('pointermove', move);
      grip.addEventListener('pointerup', up);
      grip.addEventListener('pointercancel', up);
      event.preventDefault();
    });
    /*@4.LAPLJ.173*/
    grip.addEventListener('dblclick', function () {
      var rows = gripIsRow(which);
      if (rows) panes.outH = PANE_DEFAULTS.outH;
      else if (which === 'side') panes.side = PANE_DEFAULTS.side;
      else panes.out = PANE_DEFAULTS.out;
      applyPanes();
      savePanes();
      paint();
      toast(L('أُعيد المقاسُ الافتراضيّ.', 'Default size restored.'));
    });
    /*@4.LAPLJ.174*/
    grip.addEventListener('keydown', function (event) {
      var step = event.shiftKey ? 40 : 12;
      var rows = gripIsRow(which);
      if (rows) {
        if (event.key === 'ArrowUp') panes.outH = clamp(panes.outH + 4, 14, maxOutPercent());
        else if (event.key === 'ArrowDown') panes.outH = clamp(panes.outH - 4, 14, maxOutPercent());
        else return;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        var rtl = document.documentElement.getAttribute('dir') !== 'ltr';
        var towards = (event.key === 'ArrowRight') === rtl ? -1 : 1;
        if (which === 'side') panes.side = clamp(panes.side + towards * step, 180, 460);
        else panes.out = clamp(panes.out - towards * step, 260, 720);
      } else return;
      applyPanes(); savePanes(); paint();
      event.preventDefault();
    });
  });

  /*@4.LAPLJ.175*/
  var outFull = false;
  function setOutFull(on) {
    outFull = on;
    lab.classList.toggle('is-out-full', on);
    var button = $('plOutExpand');
    if (!button) return;
    button.innerHTML = '<i class="fa-solid ' + (on ? 'fa-compress' : 'fa-expand') + '"></i>';
    button.setAttribute('data-tip-ar', on ? 'أعِد اللوحَ إلى حجمه' : 'وسّع لوحَ الناتج ليملأ الشاشة');
    button.setAttribute('data-tip-en', on ? 'Restore the panel' : 'Expand the output to fill the screen');
  }
  var expandButton = $('plOutExpand');
  if (expandButton) {
    expandButton.addEventListener('click', function () {
      if (lab.classList.contains('is-out-collapsed')) {
        lab.classList.remove('is-out-collapsed');
        syncOutToggle();
      }
      setOutFull(!outFull);
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && outFull) setOutFull(false);
  });

  /*@4.LAPLJ.176*/
  var previewBar = $('plPrevBar');
  if (previewBar) {
    previewBar.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-w]');
      if (!button) return;
      previewBar.querySelectorAll('button[data-w]').forEach(function (other) {
        other.classList.toggle('is-on', other === button);
      });
      var width = button.dataset.w;
      var frame = $('plPreview');
      frame.style.width = width === '0' ? '' : width + 'px';
      frame.style.marginInline = width === '0' ? '' : 'auto';
    });
  }

  /*@4.LAPLJ.177*/
  var stdinBox = $('plStdin'), stdinRuler = $('plStdinRuler');
  function paintStdin() {
    if (!stdinRuler) return;
    var lines = stdinBox.value.split('\n');
    stdinRuler.textContent = '';
    lines.forEach(function (text, index) {
      var row = document.createElement('div');
      row.className = 'pl-in-line';
      var badge = document.createElement('span');
      badge.className = 'pl-in-n';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = index + 1;
      row.appendChild(badge);
      row.appendChild(document.createTextNode(text.length ? text : ' '));
      stdinRuler.appendChild(row);
    });
    var count = $('plStdinCount');
    if (count) {
      var real = stdinBox.value.replace(/\n+$/, '');
      var many = real.length ? real.split('\n').length : 0;
      count.textContent = many
        ? plural(many, ['سطرُ إدخالٍ واحد', 'سطرا إدخال', 'أسطرِ إدخال', 'سطرَ إدخال'], 'input line', 'input lines')
        : L('لا مدخلات', 'No input');
    }
    stdinRuler.scrollTop = stdinBox.scrollTop;
  }
  if (stdinBox) {
    stdinBox.addEventListener('input', paintStdin);
    stdinBox.addEventListener('scroll', function () { stdinRuler.scrollTop = stdinBox.scrollTop; });
  }

  /*@4.LAPLJ.178*/
  function applyLanguage() {
    /*@4.LAPLJ.179*/
    applyDock();
    lab.querySelectorAll('[data-ar]').forEach(function (node) {
      var text = isAr() ? node.getAttribute('data-ar') : node.getAttribute('data-en');
      /*@4.LAPLJ.180*/
      var slot = node.querySelector(':scope > span:last-of-type');
      if (slot && node.children.length) slot.textContent = text; else node.textContent = text;
    });
    lab.querySelectorAll('[data-ph-ar]').forEach(function (node) {
      node.placeholder = isAr() ? node.getAttribute('data-ph-ar') : node.getAttribute('data-ph-en');
    });
    lab.querySelectorAll('[data-tip-ar]').forEach(function (node) {
      node.setAttribute('aria-label', isAr() ? node.getAttribute('data-tip-ar') : node.getAttribute('data-tip-en'));
    });
    $('plSaved').innerHTML = '<i class="fa-solid fa-check"></i> ' + t('saved');
    $('plQuotaN').textContent = isAr() ? '٨٠' : '80';
    runLabel(null);
    syncArrow(sideToggle, lab.classList.contains('is-side-collapsed'), 'start');
    /*@4.LAPLJ.181*/
    syncOutToggle();
    selectLanguage(current);
    repaintResult();
    renderProblems();
    paintStdin();
  }
  /*@4.LAPLJ.182*/
  document.addEventListener('garden:languageChanged', applyLanguage);

  /*@4.LAPLJ.183*/
  (function applyFeatures() {
    if (!FEATURES.interactive) { var run = $('plInteractive'); if (run) run.hidden = true; }
    if (!FEATURES.shell) { var term = $('plTerm'); if (term) term.hidden = true; }
    if (!FEATURES.ai) {
      var tab = document.querySelector('.pl-out-tab[data-out="explain"]');
      if (tab) tab.hidden = true;
      var panel = document.querySelector('[data-out-panel="explain"]');
      if (panel) panel.hidden = true;
      var quota = $('plQuota');
      if (quota) quota.hidden = true;
    }
  })();

  /*@4.LAPLJ.184*/
  function restore() {
    var store = window.GardenPLStore;
    if (!store) return;
    /*@4.LAPLJ.185*/
    var shortId = (location.hash.match(/(?:^|[#&])s=([a-z2-9]{6,16})/) || [])[1];
    if (shortId) {
      var base = aiBase();
      history.replaceState(null, '', location.pathname + location.search);
      if (base) {
        fetch(base + '/v1/snips/' + shortId, { headers: { 'X-Garden-Identity': identity() } })
          .then(function (response) { return response.ok ? response.json() : null; })
          .then(function (data) {
            if (!data || !data.code) throw new Error('gone');
            adopt({ lang: data.lang, buffers: (function () {
              var map = {}; map[data.lang] = data.code; return map;
            })(), stdin: data.stdin || '' });
            toast(L('فُتح كودٌ مشارَك — عدّله كما تشاء.', 'Opened a shared snippet — edit freely.'));
          }, function () {
            toast(L('هذا الرابطُ لم يعد متاحاً.', 'That link is no longer available.'));
            var fallback = store.load();
            if (fallback && fallback.payload) adopt(fallback.payload);
          });
        return;
      }
    }
    var shared = location.hash && /(^|[#&])(code|snippet)=/.test(location.hash);
    if (shared) {
      store.decodeShare(location.hash).then(function (payload) {
        history.replaceState(null, '', location.pathname + location.search);
        if (!payload) return;
        adopt(payload);
        toast(payload.snippet
          ? L('فُتحت القصاصةُ من المودل — شغّلها وعدّلها كما تشاء.',
              'Opened the snippet from your module — run it and edit freely.')
          : L('فُتح كودٌ مشارَك — عدّله كما تشاء.', 'Opened a shared snippet — edit freely.'));
      });
      return;
    }
    var saved = store.load();
    if (saved && saved.payload) adopt(saved.payload);
  }
  function adopt(payload) {
    if (payload.buffers) {
      Object.keys(payload.buffers).forEach(function (id) { buffers[id] = payload.buffers[id]; });
    }
    /*@4.LAPLJ.186*/
    if (payload.projects && typeof payload.projects === 'object') {
      Object.keys(payload.projects).forEach(function (id) {
        var list = payload.projects[id];
        if (!Array.isArray(list)) return;
        projects[id] = list.filter(function (file) {
          return file && safeFileName(file.name);
        }).slice(0, MAX_PROJECT_FILES).map(function (file) {
          return { name: String(file.name), content: String(file.content || '') };
        });
      });
    }
    activeFile = null;
    if (payload.stdin !== undefined) $('plStdin').value = payload.stdin;
    var lang = LANGS.filter(function (item) { return item.id === payload.lang; })[0];
    if (lang) selectLanguage(lang);
    else paint();
  }

  /*@4.LAPLJ.187*/
  function toast(text) {
    var node = document.createElement('div');
    node.className = 'pl-toast';
    /*@4.LAPLJ.188*/
    node.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    node.textContent = text;
    document.body.appendChild(node);
    /*@4.LAPLJ.189*/
    void node.offsetHeight;
    node.classList.add('on');
    setTimeout(function () {
      node.classList.remove('on');
      setTimeout(function () { node.remove(); }, 260);
    }, 2600);
  }

  /*@4.LAPLJ.190*/
  function copyLink(link, note) {
    try {
      navigator.clipboard.writeText(link);
      toast(note);
    } catch (error) { showText(link, 'note'); }
  }

  function shareLongLink() {
    var store = window.GardenPLStore;
    if (!store) return;
    store.encodeShare(snapshot()).then(function (result) {
      if (!result.ok) {
        showText(L('عملُك أكبرُ من أن يُحمَل في رابط — صدّره ملفاً بدلاً من ذلك.',
          'Your work is too large for a link — export it as a file instead.'), 'note');
        return;
      }
      copyLink(location.origin + location.pathname + '#' + result.fragment,
        L('نُسخ الرابط — كودُك فيه ولا يمرّ بأي خادم.',
          'Link copied — your code travels inside it, never through a server.'));
    });
  }

  $('plShare').addEventListener('click', function () {
    var base = aiBase();
    if (!base) return shareLongLink();
    fetch(base + '/v1/snips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Garden-Identity': identity() },
      body: JSON.stringify({ lang: current.id, code: editor.value, stdin: $('plStdin').value || '' })
    }).then(function (response) {
      if (!response.ok) throw new Error('no-snip');
      return response.json();
    }).then(function (data) {
      if (!data || !data.id) throw new Error('no-snip');
      copyLink(location.origin + location.pathname + '#s=' + data.id,
        L('نُسخ رابطٌ قصير — يفتح كودَك عند من ترسله له بلا حساب.',
          'Short link copied — it opens your code for anyone, no account needed.'));
    }, function () { shareLongLink(); });
  });

  /*@4.LAPLJ.191*/
  window.__plVerify = function (list) {
    var items = list || LIB.byLang[current.id] || [];
    var results = [];
    return items.reduce(function (chain, example) {
      return chain.then(function () {
        var lang = LANGS.filter(function (item) { return item.id === example.lang; })[0];
        if (!lang) { results.push({ id: example.id, ok: false, why: 'unknown-language' }); return; }
        if (example.lang === 'web') return verifyWeb(example, lang, results);
        return new Promise(function (done) {
          selectLanguage(lang);
          editor.value = example.code;
          $('plStdin').value = example.stdin || '';
          paint();
          var watchdog = setTimeout(function () {
            results.push({ id: example.id, ok: false, why: 'timeout' }); done();
          }, 20000);
          var settle = function () {
            if (runButton.disabled) { setTimeout(settle, 120); return; }
            clearTimeout(watchdog);
            /*@4.LAPLJ.192*/
            var tables = $('plStdout').querySelectorAll('table.pl-sql');
            var actual = tables.length
              ? [].slice.call(tables).map(function (table) {
                  return [].slice.call(table.querySelectorAll('tbody tr')).map(function (row) {
                    return [].slice.call(row.children).map(function (cell) { return cell.textContent; }).join(' ');
                  }).join('\n');
                }).join('\n').trim()
              : lastOutput.join('\n').trim();
            var expected = String(example.expectedStdout).trim();
            results.push(actual === expected
              ? { id: example.id, ok: true }
              : { id: example.id, ok: false, why: 'mismatch', expected: expected, actual: actual.slice(0, 90) });
            done();
          };
          run();
          setTimeout(settle, 200);
        });
      });
    }, Promise.resolve()).then(function () {
      return { total: items.length, passed: results.filter(function (r) { return r.ok; }).length, results: results };
    });
  };

  /*@4.LAPLJ.193*/
  function verifyWeb(example, lang, results) {
    return new Promise(function (done) {
      /*@4.LAPLJ.194*/
      var probe = '\n<script>(function(){var send=function(){' +
        'var out=[];(function walk(node){' +
        'if(node.nodeType===3){out.push(node.nodeValue);return;}' +
        'if(node.nodeType!==1)return;' +
        'var tag=node.tagName;' +
        'if(tag==="SCRIPT"||tag==="STYLE"||tag==="NOSCRIPT"||tag==="TEMPLATE")return;' +
        'if(tag==="BR"){out.push("\\n");return;}' +
        'for(var c=node.firstChild;c;c=c.nextSibling)walk(c);' +
        'if(/^(DIV|P|LI|TR|H1|H2|H3|H4|H5|H6|SECTION|ARTICLE|HEADER|FOOTER|MAIN|ASIDE|NAV|PRE|TABLE|UL|OL|FORM|FIGURE|BLOCKQUOTE|BUTTON|LABEL)$/.test(tag))out.push("\\n");' +
        '})(document.body||document.documentElement);' +
        'parent.postMessage({__plProbe:out.join("")},"*");};' +
        'if(document.readyState==="complete")setTimeout(send,60);' +
        'else window.addEventListener("load",function(){setTimeout(send,60);});})();<\/script>';
      var finished = false;
      var listener = function (event) {
        if (!event.data || typeof event.data.__plProbe !== 'string' || finished) return;
        finished = true;
        window.removeEventListener('message', listener);
        clearTimeout(watchdog);
        var actual = flattenText(event.data.__plProbe);
        var expected = flattenText(example.expectedStdout);
        results.push(actual === expected
          ? { id: example.id, ok: true }
          : { id: example.id, ok: false, why: 'mismatch', expected: expected.slice(0, 90), actual: actual.slice(0, 90) });
        done();
      };
      var watchdog = setTimeout(function () {
        if (finished) return;
        finished = true;
        window.removeEventListener('message', listener);
        results.push({ id: example.id, ok: false, why: 'timeout' });
        done();
      }, 8000);
      window.addEventListener('message', listener);
      selectLanguage(lang);
      editor.value = example.code + probe;
      paint();
      run();
    });
  }
  function flattenText(text) {
    return String(text).split('\n')
      .map(function (line) { return line.replace(/\s+/g, ' ').trim(); })
      .filter(function (line) { return line.length; })
      .join('\n');
  }

  applyLanguage();
  restore();
  /*@4.LAPLJ.195*/
  loadLibrary();
})();
