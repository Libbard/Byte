/*@3.LEDJ.1*/

;(function () {
  'use strict';

  /*@3.LEDJ.2*/
  var P = 'plan' + 'ner_';
  var PREFIXES = [P, 'study_' + 'plan_'];

  function isLegacyKey(k) {
    if (!k) return false;
    for (var i = 0; i < PREFIXES.length; i++) {
      if (k.indexOf(PREFIXES[i]) === 0) return true;
    }
    return false;
  }

  function keys() {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (isLegacyKey(k)) out.push(k);
      }
    } catch (e) { /*@3.LEDJ.3*/ }
    return out.sort();
  }

  function readJSON(k) {
    try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; }
  }

  function isAr() {
    return (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
  }
  function tx(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /*@3.LEDJ.4*/
  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' ' + tx('بايت', 'B');
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' ' + tx('كيلوبايت', 'KB');
    return (bytes / 1048576).toFixed(1) + ' ' + tx('ميغابايت', 'MB');
  }

  /*@3.LEDJ.5*/
  function countWord(n, ar4, en2) {
    if (!isAr()) return n + ' ' + (n === 1 ? en2[0] : en2[1]);
    if (n === 1) return ar4[0];
    if (n === 2) return ar4[1];
    if (n >= 3 && n <= 10) return n + ' ' + ar4[2];
    return n + ' ' + ar4[3];
  }

  /*@3.LEDJ.6*/
  function summary() {
    var ks = keys();
    var s = {
      exists: ks.length > 0,
      keyCount: ks.length,
      bytes: 0,
      levels: [],
      plans: 0,
      modules: 0,     /*@3.LEDJ.7*/
      notes: 0,       /*@3.LEDJ.8*/
      courses: 0,     /*@3.LEDJ.9*/
      keys: ks
    };
    if (!s.exists) return s;

    var seenLevel = {};
    ks.forEach(function (k) {
      s.bytes += (localStorage.getItem(k) || '').length;

      /*@3.LEDJ.10*/
      var m = /_(L(?:\d|HUB))(?:_|$)/.exec(k);
      if (m && !seenLevel[m[1]]) { seenLevel[m[1]] = 1; s.levels.push(m[1]); }

      var v = readJSON(k);
      if (!v || typeof v !== 'object') return;

      /*@3.LEDJ.11*/
      if (v.plans && typeof v.plans === 'object') {
        Object.keys(v.plans).forEach(function (id) {
          var pl = v.plans[id];
          if (pl && (pl.start_date || pl.end_date)) s.plans++;
        });
      } else if (v.start_date || v.end_date) {
        s.plans++;
      }

      if (v.module_status && typeof v.module_status === 'object') {
        s.modules += Object.keys(v.module_status).length;
      }
      if (v.module_notes && typeof v.module_notes === 'object') {
        /*@3.LEDJ.12*/
        Object.keys(v.module_notes).forEach(function (id) {
          if (String(v.module_notes[id] || '').trim()) s.notes++;
        });
      }
      if (Array.isArray(v.custom_courses)) s.courses += v.custom_courses.length;
    });

    s.levels.sort();
    return s;
  }

  /*@3.LEDJ.13*/
  function hasContent(s) {
    s = s || summary();
    return !!(s.plans || s.modules || s.notes || s.courses);
  }

  /*@3.LEDJ.14*/
  function buildExport() {
    var s = summary();
    var data = {};
    s.keys.forEach(function (k) { data[k] = localStorage.getItem(k); });
    return {
      _byte_backup: 1,
      _legacy: 1,
      at: new Date().toISOString(),
      readable: {
        what: 'بيانات نظام التخطيط السابق في «الحديقة الرقمية» — أُعيد بناؤه، ' +
              'وهذه نسخةٌ كاملة من بياناته كما كانت على الجهاز.',
        restore: 'لاستعادتها: اللوحة ← الإعدادات ← نسخة بياناتك ← استيراد نسخة.',
        levels: s.levels,
        plans: s.plans,
        modules_marked: s.modules,
        notes: s.notes,
        custom_courses: s.courses,
        keys: s.keys.length
      },
      data: data
    };
  }

  function exportFile() {
    var s = summary();
    if (!s.exists) return false;
    var blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'byte-old-plans-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return true;
  }

  /*@3.LEDJ.15*/
  function wipe() {
    var ks = keys(), n = 0;
    ks.forEach(function (k) {
      try { localStorage.removeItem(k); n++; } catch (e) { /*@3.LEDJ.16*/ }
    });
    return n;
  }

  /*@3.LEDJ.17*/
  function cardHTML(s) {
    var facts = [];
    if (s.plans)   facts.push(countWord(s.plans,
      ['خطةٌ واحدة', 'خطتان', 'خطط', 'خطة'], ['plan', 'plans']));
    if (s.modules) facts.push(countWord(s.modules,
      ['وحدةٌ معلَّمة', 'وحدتان معلَّمتان', 'وحداتٍ معلَّمة', 'وحدةً معلَّمة'], ['marked module', 'marked modules']));
    if (s.notes)   facts.push(countWord(s.notes,
      ['ملاحظةٌ واحدة', 'ملاحظتان', 'ملاحظات', 'ملاحظة'], ['note', 'notes']));
    if (s.courses) facts.push(countWord(s.courses,
      ['مادةٌ أضفتَها', 'مادتان أضفتَهما', 'موادّ أضفتَها', 'مادةً أضفتَها'], ['added course', 'added courses']));

    /*@3.LEDJ.18*/
    var lvl = s.levels.length
      ? tx('المستويات: ', 'Levels: ') + s.levels.map(function (l) {
          return l === 'LHUB' ? tx('عام', 'General') : l.replace('L', '');
        }).join(tx('، ', ', '))
      : '';

    var head = facts.length
      ? tx('وجدنا عملاً محفوظاً من نظام التخطيط السابق:',
           'We found saved work from the previous planning system:')
      : tx('بقيت على جهازك مفاتيح فارغة من نظام التخطيط السابق — بلا عملٍ داخلها.',
           'Empty leftovers from the previous planning system remain on this device — no work inside.');

    return '' +
      '<p class="dash-hint" style="margin-bottom:.6rem">' + esc(head) + '</p>' +
      (facts.length
        ? '<ul class="lg-facts">' + facts.map(function (f) {
            return '<li><i class="fa-solid fa-check"></i>' + esc(f) + '</li>';
          }).join('') + '</ul>'
        : '') +
      '<p class="dash-hint lg-meta">' +
        esc([lvl,
             countWord(s.keyCount, ['مفتاحٌ واحد', 'مفتاحان', 'مفاتيح', 'مفتاحاً'], ['key', 'keys']),
             fmtSize(s.bytes)].filter(Boolean).join(' · ')) +
      '</p>' +
      '<div class="dash-acc-actions">' +
        '<button class="dash-btn" data-lg="export">' +
          '<i class="fa-solid fa-download"></i><span>' + esc(tx('تصدير نسخة', 'Export a copy')) + '</span></button>' +
        '<button class="dash-btn lg-primary" data-lg="export-wipe">' +
          '<i class="fa-solid fa-box-archive"></i><span>' + esc(tx('صدّر ثم احذف', 'Export then delete')) + '</span></button>' +
        '<button class="dash-btn lg-danger" data-lg="wipe">' +
          '<i class="fa-solid fa-trash"></i><span>' + esc(tx('حذف بلا تصدير', 'Delete without export')) + '</span></button>' +
      '</div>' +
      '<div class="dash-hint">' + esc(tx(
        'التصدير يعطيك ملف JSON واحداً يمكن استيراده لاحقاً من «نسخة بياناتك». والحذف نهائيّ ولا يمسّ جدولك ولا مهامك ولا تقدّمك في المواد.',
        'Export gives you a single JSON file you can re-import later from “Your data”. Deleting is permanent and touches nothing in your schedule, tasks or course progress.')) +
      '</div>';
  }

  /*@3.LEDJ.19*/
  function mount(box, opts) {
    opts = opts || {};
    if (!box) return false;
    var s = summary();
    var host = opts.hideHost || box;

    if (!s.exists) {
      if (host.hasAttribute) host.setAttribute('hidden', '');
      box.innerHTML = '';
      return false;
    }
    if (host.removeAttribute) host.removeAttribute('hidden');
    box.innerHTML = cardHTML(s);

    if (!box._lgBound) {
      box._lgBound = 1;
      box.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-lg]') : null;
        if (!b) return;
        var act = b.getAttribute('data-lg');

        if (act === 'export') { exportFile(); say(opts, tx('صُدِّرت نسختك', 'Copy exported')); return; }

        if (act === 'export-wipe') {
          if (!exportFile()) return;
          /*@3.LEDJ.20*/
          setTimeout(function () {
            if (!confirm(tx('حُفظت النسخة في تنزيلاتك. أحذف البقايا الآن نهائياً؟',
                            'The copy is in your downloads. Delete the leftovers permanently now?'))) return;
            finish(wipe());
          }, 600);
          return;
        }

        if (act === 'wipe') {
          if (!confirm(tx('حذفٌ نهائيّ بلا نسخة — لا يمكن التراجع. متابعة؟',
                          'Permanent delete with no copy — this cannot be undone. Continue?'))) return;
          finish(wipe());
        }
      });
    }

    function finish(n) {
      say(opts, tx('حُذف ' + n + ' مفتاحاً — لم يبقَ شيء من النظام السابق.',
                   'Deleted ' + n + ' keys — nothing left from the previous system.'));
      mount(box, opts);
      if (typeof opts.onWipe === 'function') opts.onWipe(n);
    }
    return true;
  }

  function say(opts, msg) {
    if (typeof opts.toast === 'function') { opts.toast(msg); return; }
    alert(msg);
  }

  window.ByteLegacy = {
    keys: keys,
    summary: summary,
    hasContent: hasContent,
    exportFile: exportFile,
    wipe: wipe,
    mount: mount
  };
})();
