(function () {
  'use strict';
  var LIVE = 'https://libbard.github.io/Garden/';

  function paint() {
    if (document.getElementById('stage-bar')) return;
    var ar = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';

    var css = document.createElement('style');
    css.textContent = [
      '#stage-bar{position:sticky;top:0;z-index:2147483647;display:flex;gap:.6rem;',
      'align-items:center;justify-content:center;flex-wrap:wrap;padding:.5rem .9rem;',
      'font:600 .82rem/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;',
      'background:#7c2d12;color:#fff;text-align:center;box-shadow:0 1px 0 rgba(0,0,0,.35)}',
      '#stage-bar a{color:#fff;text-decoration:underline;text-underline-offset:2px;',
      'font-weight:800;white-space:nowrap}',
      '#stage-bar b{font-weight:800;letter-spacing:.02em}',
      '#stage-bar span{opacity:.92;font-weight:500}',
      '@media print{#stage-bar{display:none}}'
    ].join('');
    document.head.appendChild(css);

    var bar = document.createElement('div');
    bar.id = 'stage-bar';
    bar.setAttribute('role', 'alert');
    bar.dir = ar ? 'rtl' : 'ltr';

    var b = document.createElement('b');
    b.textContent = ar ? 'نسخةُ اختبار' : 'TEST BUILD';

    var msg = document.createElement('span');
    msg.textContent = ar
      ? 'لا يُحفظ عملُك هنا، ويُمحى بعد انتهاء التجربة. للاستخدام الفعليّ:'
      : 'Nothing you do here is saved; it is wiped when testing ends. For real use:';

    var a = document.createElement('a');
    a.href = LIVE;
    a.textContent = 'libbard.github.io/Garden';

    bar.appendChild(b);
    bar.appendChild(msg);
    bar.appendChild(a);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', paint, { once: true });
  } else {
    paint();
  }
})();
