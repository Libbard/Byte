/*@3.REPJ2.1*/
;(function () {
  'use strict';
  if (window.GardenReport) return;

  var API = (window.GardenEndpoints && (GardenEndpoints.publicData || GardenEndpoints.sync)) || '';

  function isAr() { return (localStorage.getItem('garden_lang') || 'ar') === 'ar'; }
  function t(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /*@3.REPJ2.2*/
  var WHY = {
    spam:     ['إعلانٌ أو تكرار',       'Spam'],
    wrong:    ['معلومةٌ خاطئة',          'Wrong'],
    rude:     ['إساءة',                 'Abusive'],
    personal: ['يكشف هويّة',            'Doxxing'],
    broken:   ['رابطٌ معطوب',            'Broken link'],
    unjust:   ['لا يمثّل الواقع',        'Not true']
  };
  var FOR = {
    explain:  ['wrong', 'rude', 'spam', 'personal'],
    advice:   ['wrong', 'rude', 'spam', 'personal'],
    resource: ['broken', 'wrong', 'spam', 'personal'],
    faculty:  ['unjust', 'rude', 'personal', 'spam']
  };

  function reasons(kind) {
    return (FOR[kind] || FOR.explain).map(function (k) { return [k, WHY[k][0], WHY[k][1]]; });
  }

  function toggle(host, kind, meta) {
    var old = host.querySelector('.gd-repbox');
    if (old) { old.parentNode.removeChild(old); return null; }
    var d = document.createElement('div');
    d.className = 'gd-repbox';
    /*@3.REPJ2.7*/
    d.__gdRep = { kind: kind, target: (meta && meta.target) || '', code: (meta && meta.code) || '' };
    d.innerHTML = '<span class="gd-repq">' + esc(t('ما الخطب؟', 'What is wrong?')) + '</span>' +
      reasons(kind).map(function (w) {
        return '<button type="button" class="gsf-chip gd-repw" data-w="' + esc(w[0]) + '">' +
          esc(isAr() ? w[1] : w[2]) + '</button>';
      }).join('');
    host.appendChild(d);
    return d;
  }

  /*@3.REPJ2.3*/
  function send(opts, host) {
    var say = function (msg, bad) {
      if (host) host.innerHTML = '<span class="gd-repdone' + (bad ? ' is-bad' : '') + '">' + esc(msg) + '</span>';
    };
    if (!API || !opts || !opts.target) { say(t('تعذّر الإرسال.', 'Could not send.'), 1); return Promise.resolve(false); }
    say(t('يُرسَل…', 'Sending…'));
    var k = window.GardenSync && GardenSync.getKey && GardenSync.getKey();
    return fetch(API + '/v1/report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: opts.kind, code: opts.code || undefined,
        target: opts.target, why: opts.why,
        vault: (k && /^v[0-9a-f]{32}$/.test(k)) ? k : undefined
      })
    }).then(function (r) {
      /*@3.REPJ2.4*/
      var good = !!(r && r.ok);
      say(good ? t('وصل بلاغُك — يُراجَع يدوياً.', 'Report received — reviewed by a human.')
               : t('تعذّر الإرسال.', 'Could not send.'), !good);
      return good;
    }).catch(function () {
      say(t('تعذّر الإرسال.', 'Could not send.'), 1);
      return false;
    });
  }

  function fp(text) {
    var enc = new TextEncoder().encode(String(text == null ? '' : text).trim());
    return crypto.subtle.digest('SHA-256', enc).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (x) {
        return ('0' + x.toString(16)).slice(-2);
      }).join('').slice(0, 32);
    });
  }

  /*@3.REPJ2.6*/
  function button(kind, target, code, opts) {
    if (!target) return '';
    opts = opts || {};
    var ar = opts.ar || 'بلّغْ عن هذا التقييم';
    var en = opts.en || 'Report this rating';
    return '<button type="button" class="gsf-btn gsf-btn--ghost gd-rep"' +
      ' data-gd-rep="' + esc(kind) + '"' +
      ' data-gd-target="' + esc(target) + '"' +
      (opts.host ? ' data-gd-host="' + esc(opts.host) + '"' : '') +
      (code ? ' data-gd-code="' + esc(code) + '"' : '') +
      ' aria-label="' + esc(t(ar, en)) + '" title="' + esc(t(ar, en)) + '"' +
      ' data-ar-title="' + esc(ar) + '" data-en-title="' + esc(en) + '">' +
      '<i class="fa-solid fa-flag" aria-hidden="true"></i></button>';
  }

  /*@3.REPJ2.5*/
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-gd-rep]');
    if (b) {
      var sel = b.getAttribute('data-gd-host');
      toggle((sel && b.closest(sel)) || b.parentNode, b.getAttribute('data-gd-rep'), {
        target: b.getAttribute('data-gd-target'), code: b.getAttribute('data-gd-code') || ''
      });
      return;
    }
    var w = e.target.closest && e.target.closest('.gd-repw');
    if (!w) return;
    var box = w.closest('.gd-repbox');
    var o = box && box.__gdRep;
    if (!o || !o.target) return;
    send({ kind: o.kind, code: o.code, target: o.target, why: w.getAttribute('data-w') }, box);
  });

  window.GardenReport = {
    reasons: reasons, toggle: toggle, send: send, fp: fp, button: button, WHY: WHY
  };
})();
