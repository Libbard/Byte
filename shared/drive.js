;(function () {
  'use strict';

  /*@3.DRIJ.1*/
  var SCOPE = 'https://www.googleapis.com/auth/drive.file';
  var API = 'https://www.googleapis.com/drive/v3';
  var UP = 'https://www.googleapis.com/upload/drive/v3';
  var GSI = 'https://accounts.google.com/gsi/client';
  var GAPI = 'https://apis.google.com/js/api.js';
  /*@3.DRIJ.12*/
  var FOLDER = 'Digital Garden';
  var MARK = { garden: '1' };
  var SLACK_MS = 60 * 1000;

  function E() { return window.GardenEndpoints || {}; }
  function clientId() { return E().googleClientId || ''; }
  /*@3.DRIJ.15*/
  /*@3.DRIJ.24*/
  function keyOff() {
    try { return /[?&]nokey=1/.test(location.search); } catch (e) { return false; }
  }
  function pickerKey() {
    if (keyOff()) return '';
    return E().googlePickerKeyOn ? (E().googlePickerKey || '') : '';
  }
  function appId() { return String(clientId()).split('-')[0] || ''; }

  function isAr() {
    return (document.documentElement.getAttribute('lang') || 'ar').indexOf('ar') === 0;
  }
  function L(a, b) { return isAr() ? a : b; }

  function enabled() { return !!clientId(); }

  /*@3.DRIJ.10*/
  function warm() {
    if (!enabled()) return Promise.resolve(false);
    var a = script(GSI, gsiReady);
    var b = script(GAPI, function () { return !!window.gapi; }).then(function (ok) {
          if (!ok || pickerReady()) return ok;
          return new Promise(function (res) {
            try { window.gapi.load('picker', { callback: function () { res(true); },
                                               onerror: function () { res(false); } }); }
            catch (e) { res(false); }
          });
        });
    return Promise.all([a, b]).then(function (r) { return r[0] && r[1]; });
  }
  /*@3.DRIJ.16*/
  function pickerEnabled() { return enabled(); }

  /*@3.DRIJ.2*/
  var scripts = {};
  function script(src, ready) {
    if (ready()) return Promise.resolve(true);
    if (scripts[src]) return scripts[src];
    scripts[src] = new Promise(function (ok) {
      var el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = function () { ok(ready()); };
      el.onerror = function () { ok(false); };
      document.head.appendChild(el);
      setTimeout(function () { ok(ready()); }, 10000);
    });
    return scripts[src];
  }
  function gsiReady() {
    return !!(window.google && window.google.accounts && window.google.accounts.oauth2);
  }
  function pickerReady() {
    return !!(window.google && window.google.picker && window.gapi);
  }

  /*@3.DRIJ.3*/
  var tok = null, exp = 0, client = null;
  /*@3.DRIJ.17*/
  var KEEP = 'garden.gd.tok';

  function vault() {
    try { return window.sessionStorage || null; } catch (e) { return null; }
  }
  function recall() {
    if (tok) return;
    var s = vault();
    if (!s) return;
    try {
      var j = JSON.parse(s.getItem(KEEP) || 'null');
      if (j && j.t && Number(j.e) > Date.now() + SLACK_MS) { tok = j.t; exp = Number(j.e); }
      else s.removeItem(KEEP);
    } catch (e) {}
  }
  function stash() {
    var s = vault();
    if (!s) return;
    try {
      if (tok) s.setItem(KEEP, JSON.stringify({ t: tok, e: exp }));
      else s.removeItem(KEEP);
    } catch (e) {}
  }

  function fresh() { recall(); return !!(tok && Date.now() < exp - SLACK_MS); }

  var tokNet = null;
  function token(interactive) {
    if (fresh()) return Promise.resolve(tok);
    if (!enabled()) return Promise.reject(err('drive_disabled'));
    if (tokNet) return interactive ? tokNet.then(function (t) { return t; }, function () { return token(true); }) : tokNet;
    /*@3.DRIJ.35*/
    var ask = linked() || (!interactive && !linkKnown());
    var via = ask ? serverToken().then(function (t) { return t; }, function () { return null; }) : Promise.resolve(null);
    tokNet = via.then(function (t0) {
      if (t0) return t0;
      /*@3.DRIJ.39*/
      if (!interactive && !activated()) throw err('no_gesture');
      /*@3.DRIJ.36*/
      if (codeFirst()) return codeToken(interactive);
      return gisToken(interactive).then(function (t1) {
        setTimeout(function () { maybeOffer(); }, 400);
        return t1;
      });
    }).then(function (t) { tokNet = null; return t; }, function (e) { tokNet = null; throw e; });
    return tokNet;
  }
  function activated() {
    var ua = navigator.userActivation;
    return !ua || typeof ua.isActive !== 'boolean' || ua.isActive;
  }
  function codeFirst() {
    return !!apiBase() && linkKnown() && !linked() && !askDeclined() && !askLater();
  }
  function codeToken(interactive) {
    return requestCode().then(function (c) {
      return askLink({ code: c.code, redirect: c.redirect }).then(function () {
        if (fresh()) return tok;
        return gisToken(interactive);
      });
    });
  }
  function gisToken(interactive) {
    return script(GSI, gsiReady).then(function (ok) {
      if (!ok) throw err('gsi_unavailable');
      return new Promise(function (res, rej) {
        if (!client) {
          client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId(),
            scope: SCOPE,
            callback: function () {}
          });
        }
        var done = false;
        client.callback = function (r) {
          if (done) return;
          done = true;
          if (!r || r.error || !r.access_token) {
            rej(err(r && r.error === 'access_denied' ? 'consent_denied' : 'no_token',
                    r && r.error_description));
            return;
          }
          tok = r.access_token;
          exp = Date.now() + (Number(r.expires_in) || 3600) * 1000;
          stash();
          res(tok);
        };
        client.error_callback = function (e) {
          if (done) return;
          done = true;
          /*@3.DRIJ.11*/
          var t = (e && e.type) || '';
          var code = t === 'popup_closed' ? 'consent_closed'
                   : t === 'popup_failed_to_open' ? 'popup_blocked' : 'no_token';
          rej(err(code, e && e.message));
        };
        try {
          client.requestAccessToken({ prompt: interactive ? 'consent' : '' });
        } catch (e) {
          done = true;
          rej(err('no_token', e && e.message));
        }
      });
    });
  }

  function forget() { tok = null; exp = 0; stash(); }

  /*@3.DRIJ.33*/
  var LINK_LS = '__gdLink';
  var ASK_LS = '__gdLinkAsk';
  var linkNet = null;

  function G() { return window.GardenSync || null; }
  function apiBase() { return E().sync || ''; }
  function linkCache() {
    try { return JSON.parse(localStorage.getItem(LINK_LS) || 'null'); } catch (e) { return null; }
  }
  function linkRemember(v) {
    try { if (v) localStorage.setItem(LINK_LS, JSON.stringify(v)); else localStorage.removeItem(LINK_LS); } catch (e) {}
  }
  function linked() { var c = linkCache(); return !!(c && c.on); }
  var KNOWN_MS = 10 * 60 * 1000;
  function linkKnown() { var c = linkCache(); return !!(c && (c.on || Date.now() - Number(c.t || 0) < KNOWN_MS)); }
  function linkOff() { linkRemember({ on: 0, t: Date.now() }); }
  var LATER_SS = '__gdLinkLater';
  function askLater() { try { return sessionStorage.getItem(LATER_SS) === '1'; } catch (e) { return false; } }
  function askLaterSet(on) { try { if (on) sessionStorage.setItem(LATER_SS, '1'); else sessionStorage.removeItem(LATER_SS); } catch (e) {} }
  function linkWarm() {
    if (!apiBase() || linkKnown()) return;
    vaultOf().then(function (vid) { if (vid) linkStatus(); });
  }
  function linkedEmail() { var c = linkCache(); return (c && c.e) || ''; }
  function askDeclined() { try { return localStorage.getItem(ASK_LS) === 'no'; } catch (e) { return false; } }
  function askDecline(on) { try { if (on) localStorage.setItem(ASK_LS, 'no'); else localStorage.removeItem(ASK_LS); } catch (e) {} }

  function vaultOf() {
    var g = G();
    if (!g || !g.vaultId) return Promise.resolve('');
    try { return Promise.resolve(g.vaultId()).then(function (v) { return v || ''; }, function () { return ''; }); }
    catch (e) { return Promise.resolve(''); }
  }
  function api(method, tail, body) {
    if (!apiBase()) return Promise.reject(err('no_endpoint'));
    return vaultOf().then(function (vid) {
      if (!vid) throw err('no_vault');
      var g = G();
      var h = body ? { 'Content-Type': 'application/json' } : {};
      if (g && g.vaultHeaders) { try { h = g.vaultHeaders(vid, h); } catch (e) {} }
      return fetch(apiBase() + '/v1/drive/' + encodeURIComponent(vid) + tail, {
        method: method, headers: h, body: body ? JSON.stringify(body) : undefined
      }).then(function (r) {
        return r.json().catch(function () { return null; }).then(function (j) {
          return { ok: r.ok, status: r.status, j: j || {} };
        });
      });
    });
  }

  function linkStatus() {
    return api('GET', '').then(function (r) {
      if (!r.ok) return { linked: linked(), email: linkedEmail(), armed: false, unknown: true };
      if (r.j.linked) linkRemember({ on: 1, e: r.j.email || '', t: Date.now() }); else linkOff();
      return { linked: !!r.j.linked, email: r.j.email || '', armed: !!r.j.armed };
    }, function () { return { linked: linked(), email: linkedEmail(), armed: false, unknown: true }; });
  }

  /*@3.DRIJ.34*/
  function serverToken() {
    if (linkNet) return linkNet;
    linkNet = api('POST', '/token').then(function (r) {
      if (r.ok && r.j.access_token) {
        tok = r.j.access_token;
        exp = Date.now() + (Number(r.j.expires_in) || 3600) * 1000;
        stash();
        if (!linked()) linkRemember({ on: 1, e: linkedEmail(), t: Date.now() });
        return tok;
      }
      if (r.status === 404 || r.status === 410) linkOff();
      throw err(r.status === 410 ? 'link_revoked' : 'link_failed', r.j && r.j.error);
    }).then(function (t) { linkNet = null; return t; }, function (e) { linkNet = null; throw e; });
    return linkNet;
  }

  function requestCode() {
    if (!enabled()) return Promise.reject(err('drive_disabled'));
    return script(GSI, gsiReady).then(function (ok) {
      if (!ok) throw err('gsi_unavailable');
      return new Promise(function (res, rej) {
        var done = false;
        var cc = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId(),
          scope: SCOPE,
          ux_mode: 'popup',
          access_type: 'offline',
          prompt: 'consent',
          callback: function (r) {
            if (done) return;
            done = true;
            if (!r || r.error || !r.code) {
              rej(err(r && r.error === 'access_denied' ? 'consent_denied' : 'no_code', r && r.error_description));
              return;
            }
            res({ code: r.code, redirect: 'postmessage' });
          },
          error_callback: function (e) {
            if (done) return;
            done = true;
            var t = (e && e.type) || '';
            rej(err(t === 'popup_closed' ? 'consent_closed' : t === 'popup_failed_to_open' ? 'popup_blocked' : 'no_code', e && e.message));
          }
        });
        try { cc.requestCode(); } catch (e) { done = true; rej(err('no_code', e && e.message)); }
      });
    });
  }

  function linkWith(code, redirect, keep) {
    return api('POST', '/link', { code: code, redirect: redirect || 'postmessage', keep: keep !== false }).then(function (r) {
      if (r.ok && !r.j.linked && r.j.access_token) {
        tok = r.j.access_token; exp = Date.now() + (Number(r.j.expires_in) || 3600) * 1000; stash();
        return { ok: true, linked: false };
      }
      if (r.ok && r.j.linked) {
        linkRemember({ on: 1, e: r.j.email || '', t: Date.now() });
        askDecline(false);
        if (r.j.access_token) {
          tok = r.j.access_token; exp = Date.now() + (Number(r.j.expires_in) || 3600) * 1000; stash();
        }
        return { ok: true, email: r.j.email || '' };
      }
      var why = (r.j && r.j.error) || ('http_' + r.status);
      if (why === 'no_refresh' && r.j.access_token) {
        tok = r.j.access_token; exp = Date.now() + (Number(r.j.expires_in) || 3600) * 1000; stash();
      }
      throw err(why);
    });
  }

  function linkNow() {
    return requestCode().then(function (c) { return linkWith(c.code, c.redirect); });
  }

  function unlink() {
    return api('DELETE', '').then(function (r) {
      linkRemember(null);
      return { ok: r.ok, revoked: !!(r.j && r.j.revoked) };
    }, function () { linkRemember(null); return { ok: false }; });
  }

  function guardArmed() {
    var g = G();
    if (!g || !g.lockInfo) return Promise.resolve(false);
    try {
      var li = g.lockInfo();
      if (li && li.armed) return Promise.resolve(true);
    } catch (e) {}
    if (!g.guardState) return Promise.resolve(false);
    try { return Promise.resolve(g.guardState()).then(function (s) { return !!(s && s.armed); }, function () { return false; }); }
    catch (e) { return Promise.resolve(false); }
  }

  var askDlg = null;
  function askLink(opts) {
    var o = opts || {};
    if (askDlg) { try { askDlg.close(); } catch (e0) {} if (askDlg.parentNode) askDlg.parentNode.removeChild(askDlg); askDlg = null; }
    return guardArmed().then(function (armed) {
      return new Promise(function (resolve) {
        var dlg = document.createElement('dialog');
        dlg.className = 'gsf gsf--snug gdl';
        dlg.setAttribute('aria-label', L('درايف على كلِّ أجهزتك', 'Drive on all your devices'));
        var settingsHref = (/\/hub\//.test(location.pathname) ? 'settings.html' : 'hub/settings.html') + '#sync-panel-host';
        dlg.innerHTML =
          '<div class="gsf-body"><div class="gsf-head">' +
            '<h2 class="gsf-title">' + esc(L('درايف على كلِّ أجهزتك؟', 'Drive on all your devices?')) + '</h2>' +
            '<p class="gsf-sub">' + esc(L('نحفظ إذنَ درايف في حسابك مشفَّراً — فتفتح ملفّاتِك من أيِّ جهازٍ بلا دخولٍ جديد. أو يبقى على هذا الجهاز لساعة.',
              'We keep your Drive permission encrypted in your account — so your files open on any device with no new sign-in. Or it stays on this device for an hour.')) + '</p></div>' +
            (armed ? '' :
              '<div class="gdl-warn"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i><div><b>' +
              esc(L('لحفظِه في حسابك احمِ حسابَك أوّلاً', 'To keep it in your account, protect it first')) + '</b><p>' +
              esc(L('ببريدٍ وكلمةِ سرّ أو بحسابِ قوقل — كي لا يدخلَه أحدٌ سواك.',
                    'With an email and password or with Google — so nobody but you can get in.')) + '</p>' +
              '<a class="gsf-btn gsf-btn--sm gsf-btn--pri gdl-protect" href="' + esc(settingsHref) + '">' + esc(L('احمِ حسابي', 'Protect my account')) + '</a></div></div>') +
            '<div class="gsf-rows">' +
              '<button type="button" class="gsf-row gdl-all"' + (armed ? '' : ' disabled') + '><i class="fa-solid fa-cloud" aria-hidden="true"></i><span>' +
                esc(L('احفظْه في حسابي — كلُّ أجهزتي', 'Keep it in my account — all my devices')) + '</span><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
              '<button type="button" class="gsf-row gdl-here"><i class="fa-solid fa-mobile-screen" aria-hidden="true"></i><span>' +
                esc(L('على هذا الجهاز فقط — لساعة', 'This device only — for an hour')) + '</span><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
            '</div>' +
            '<p class="gdl-note">' + esc(L('الفصلُ في أيِّ وقتٍ من الإعدادات ← المزامنة ← درايفي.',
              'Disconnect any time from Settings → Sync → My Drive.')) + '</p>' +
          '</div>' +
          '<div class="gsf-foot"><div class="gsf-acts"><button type="button" class="gsf-btn gsf-btn--ghost gdl-no">' + esc(L('لاحقاً', 'Later')) + '</button></div></div>';
        document.body.appendChild(dlg);
        askDlg = dlg;
        var done = false;
        function finish(v) {
          if (done) return;
          done = true;
          try { dlg.close(); } catch (e1) {}
          if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
          if (askDlg === dlg) askDlg = null;
          resolve(v);
        }
        /*@3.DRIJ.37*/
        var swapping = null;
        function swap(row) {
          if (!o.code) return Promise.resolve();
          if (!swapping) {
            dlg.classList.add('gdl-busy');
            if (row) { row.setAttribute('data-busy', '1'); row.querySelector('span').textContent = L('لحظةً…', 'One moment…'); }
            swapping = linkWith(o.code, o.redirect, false).then(function () {}, function () {});
          }
          return swapping;
        }
        function later() { askLaterSet(true); swap().then(function () { finish('later'); }); }
        dlg.addEventListener('cancel', function (e) { e.preventDefault(); later(); });
        dlg.addEventListener('click', function (e) { if (e.target === dlg) later(); });
        dlg.querySelector('.gdl-no').addEventListener('click', later);
        dlg.querySelector('.gdl-here').addEventListener('click', function () {
          askDecline(true);
          swap(dlg.querySelector('.gdl-here')).then(function () { finish('here'); });
        });
        dlg.querySelector('.gdl-all').addEventListener('click', function () {
          var b = dlg.querySelector('.gdl-all');
          b.disabled = true;
          b.querySelector('span').textContent = L('يُربط…', 'Linking…');
          (o.code ? linkWith(o.code, o.redirect, true) : linkNow()).then(function (r) {
            finish({ linked: true, email: r.email });
          }, function (e) {
            b.disabled = false;
            b.querySelector('span').textContent = L('احفظْه في حسابي — كلُّ أجهزتي', 'Keep it in my account — all my devices');
            var p = dlg.querySelector('.gdl-err') || document.createElement('p');
            p.className = 'gdl-err';
            p.textContent = linkReason(e);
            dlg.querySelector('.gsf-rows').after(p);
          });
        });
        try { dlg.showModal(); } catch (e2) { dlg.setAttribute('open', ''); }
        if (o.onOpen) o.onOpen(dlg);
      });
    });
  }

  function linkReason(e) {
    var k = (e && e.code) || '';
    if (k === 'protect_first') return L('احمِ حسابَك أوّلاً ثمّ أعِدِ المحاولة.', 'Protect your account first, then try again.');
    if (k === 'no_vault') return L('لا حسابَ مزامنةٍ على هذا الجهاز بعد — أنشئْه من الإعدادات.', 'No sync account on this device yet — create one in Settings.');
    if (k === 'vault_locked') return L('حسابُك مقفلٌ على هذا الجهاز — افتحْه من الإعدادات ثمّ أعِد.', 'Your account is locked on this device — unlock it in Settings, then retry.');
    if (k === 'no_refresh') return L('قوقلُ لم تعطِ إذناً دائماً هذه المرّة — أعِدِ المحاولةَ ووافقْ على الوصولِ الدائم.', 'Google did not grant a lasting permission this time — try again and allow ongoing access.');
    if (k === 'consent_denied' || k === 'consent_closed') return reason(e);
    if (k === 'popup_blocked') return reason(e);
    return L('تعذّر حفظُ الإذن — أعِدِ المحاولة.', 'Could not keep the permission — try again.');
  }

  function maybeOffer(pick) {
    var p = pick || {};
    if (!apiBase()) return Promise.resolve(null);
    return vaultOf().then(function (vid) {
      if (!vid) return null;
      return linkStatus();
    }).then(function (st) {
      if (!st || st.unknown) return null;
      if (linked()) return p.code ? linkWith(p.code, p.redirect, true).catch(function () { return null; }) : null;
      if (askDeclined() || askLater()) return p.code ? linkWith(p.code, p.redirect, false).catch(function () { return null; }) : null;
      return askLink(p.code ? { code: p.code, redirect: p.redirect } : {});
    });
  }
  function afterPick(pk) {
    if (!pk || !pk.code) return Promise.resolve(pk);
    return maybeOffer({ code: pk.code, redirect: backTo() }).then(function () { return pk; }, function () { return pk; });
  }


  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function err(code, why) {
    var e = new Error(code);
    e.code = code;
    if (why) e.why = String(why);
    return e;
  }

  /*@3.DRIJ.22*/
  var DBG = (function () {
    try {
      if (/[?&]dgcheck=1/.test(location.search)) localStorage.setItem('__driveCheck', '1');
      if (/[?&]dgcheck=0/.test(location.search)) localStorage.removeItem('__driveCheck');
      return localStorage.getItem('__driveCheck') === '1';
    } catch (e) { return false; }
  })();
  var dlog = [], dt0 = 0, dsaid = false;
  function note(w, m) {
    if (!DBG) return;
    dlog.push(((Date.now() - dt0) / 1000).toFixed(1) + 's ' + w +
              (m === undefined || m === null || m === '' ? '' : ' = ' + String(m).slice(0, 120)));
  }
  function dmsg(e) {
    var o = String((e && e.origin) || '');
    if (o.indexOf('google.com') < 0) return;
    var d = e.data;
    note('postMessage', o + ' | ' + (typeof d === 'string' ? d : Object.prototype.toString.call(d)));
  }
  function derr(e) {
    note('ERROR', (e && (e.message || e.reason)) || 'unknown');
  }
  function dwatch(on) {
    if (!DBG) return;
    var f = on ? 'addEventListener' : 'removeEventListener';
    window[f]('message', dmsg, true);
    window[f]('error', derr, true);
    window[f]('unhandledrejection', derr, true);
  }
  function dsay(why) {
    if (!DBG || dsaid) return;
    dsaid = true;
    dwatch(false);
    var txt = why + ' :: ' + dlog.join(' ¦ ');
    try { console.log('[drive-check]', txt); } catch (e) {}
    try { window.prompt('انسخْ هذا السطرَ كلَّه وأرسلْه', txt); } catch (e) {}
  }

  /*@3.DRIJ.4*/
  function call(method, url, body, t, extra) {
    var h = { Authorization: 'Bearer ' + t };
    var o = { method: method, headers: h };
    if (body && typeof body === 'object' && !(body instanceof Blob)) {
      h['Content-Type'] = 'application/json';
      o.body = JSON.stringify(body);
    } else if (body) {
      o.body = body;
    }
    if (extra) Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
    return fetch(url, o).then(function (r) {
      if (r.status === 401) { forget(); throw err('token_expired'); }
      if (r.status === 403) throw err('forbidden');
      if (r.status === 404) throw err('not_found');
      if (!r.ok) throw err('http_' + r.status);
      return r;
    });
  }

  function json(method, url, body, t) {
    return call(method, url, body, t).then(function (r) { return r.json(); });
  }

  /*@3.DRIJ.5*/
  function meta(id) {
    return token(false).then(function (t) {
      return json('GET', API + '/files/' + encodeURIComponent(id) +
        '?fields=id,name,size,mimeType,md5Checksum,modifiedTime,trashed', null, t);
    });
  }

  function download(id, onProgress) {
    return token(false).then(function (t) {
      return call('GET', API + '/files/' + encodeURIComponent(id) + '?alt=media', null, t);
    }).then(function (r) {
      var total = Number(r.headers.get('content-length')) || 0;
      if (!r.body || !onProgress) return r.blob();
      var reader = r.body.getReader();
      var parts = [], got = 0;
      var pump = function () {
        return reader.read().then(function (s) {
          if (s.done) return new Blob(parts, { type: r.headers.get('content-type') || '' });
          parts.push(s.value);
          got += s.value.length;
          try { onProgress(got, total); } catch (e) {}
          return pump();
        });
      };
      return pump();
    });
  }

  /*@3.DRIJ.6*/
  var folderId = null;
  function folder() {
    if (folderId) return Promise.resolve(folderId);
    return token(false).then(function (t) {
      var q = "mimeType='application/vnd.google-apps.folder' and trashed=false and " +
              "appProperties has { key='garden' and value='1' }";
      return json('GET', API + '/files?q=' + encodeURIComponent(q) +
                  '&fields=files(id,name)&pageSize=1&spaces=drive', null, t)
        .then(function (r) {
          var got = (r.files && r.files[0]) || null;
          if (got) {
            if (got.name !== FOLDER) {
              return json('PATCH', API + '/files/' + encodeURIComponent(got.id) +
                          '?fields=id', { name: FOLDER }, t)
                .then(function () { return got.id; }, function () { return got.id; });
            }
            return got.id;
          }
          return json('POST', API + '/files?fields=id', {
            name: FOLDER,
            mimeType: 'application/vnd.google-apps.folder',
            appProperties: MARK
          }, t).then(function (f) { return f.id; });
        });
    }).then(function (id) { folderId = id; return id; });
  }

  /*@3.DRIJ.7*/
  function upload(blob, opts) {
    var o = opts || {};
    var name = String(o.name || 'file');
    var mime = o.mime || blob.type || 'application/octet-stream';
    var props = { garden: '1' };
    if (o.sha) props.sha256 = String(o.sha).slice(0, 64);
    if (o.tag) props.tag = String(o.tag).slice(0, 60);
    return folder().then(function (fid) {
      return token(false).then(function (t) {
        var body = { name: name, parents: [fid], appProperties: props };
        return call('POST', UP + '/files?uploadType=resumable&fields=id,name,size',
                    body, t, { 'X-Upload-Content-Type': mime,
                               'X-Upload-Content-Length': String(blob.size) })
          .then(function (r) {
            var loc = r.headers.get('location');
            if (!loc) throw err('no_session');
            return put(loc, blob, mime, o.onProgress, o.signal);
          });
      });
    });
  }

  function put(url, blob, mime, onProgress, signal) {
    return new Promise(function (ok, no) {
      var x = new XMLHttpRequest();
      x.open('PUT', url, true);
      x.setRequestHeader('Content-Type', mime);
      if (onProgress) {
        x.upload.onprogress = function (e) {
          if (e.lengthComputable) { try { onProgress(e.loaded, e.total); } catch (e2) {} }
        };
      }
      x.onload = function () {
        if (x.status >= 200 && x.status < 300) {
          var j = null;
          try { j = JSON.parse(x.responseText || '{}'); } catch (e) {}
          ok({ id: j && j.id, name: j && j.name, size: Number(j && j.size) || blob.size });
        } else no(err('put_' + x.status));
      };
      x.onerror = function () { no(err('put_network')); };
      x.onabort = function () { no(err('put_aborted')); };
      if (signal) {
        if (signal.aborted) x.abort();
        else signal.addEventListener('abort', function () { try { x.abort(); } catch (e) {} });
      }
      x.send(blob);
    });
  }

  function trash(id) {
    if (!id) return Promise.resolve(false);
    return token(false).then(function (t) {
      return json('PATCH', API + '/files/' + encodeURIComponent(id) + '?fields=id',
                  { trashed: true }, t);
    }).then(function () { return true; }, function () { return false; });
  }

  /*@3.DRIJ.13*/
  function wayOut(shut) {
    var tries = 0;
    var t = setInterval(function () {
      var dlg = document.querySelector('.picker-dialog');
      if (!dlg) { if (++tries > 60) clearInterval(t); return; }
      clearInterval(t);
      if (dlg.getAttribute('data-garden-out')) return;
      dlg.setAttribute('data-garden-out', '1');
      var x = document.createElement('button');
      x.type = 'button';
      x.setAttribute('aria-label', L('إغلاق', 'Close'));
      x.setAttribute('data-ar-title', 'إغلاق');
      x.setAttribute('data-en-title', 'Close');
      x.textContent = '✕';
      x.style.cssText = 'position:absolute;top:6px;z-index:3;width:2rem;height:2rem;' +
        'border-radius:50%;border:1px solid rgba(0,0,0,.18);background:#fff;color:#3c4043;' +
        'font:700 14px/1 system-ui,sans-serif;cursor:pointer;display:grid;place-items:center;' +
        (isAr() ? 'left:6px' : 'right:6px');
      x.addEventListener('click', shut);
      dlg.appendChild(x);
      var bg = document.querySelector('.picker-dialog-bg');
      if (bg) bg.addEventListener('click', shut);
    }, 50);
    return function () { clearInterval(t); };
  }

  /*@3.DRIJ.26*/
  var AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
  var TOP_LS = 'garden.gd.top';
  var TOP_PREF = '__gdTopOnly';

  function backTo() { return location.origin + location.pathname; }

  /*@3.DRIJ.38*/
  function topOffline() { return !linked() && !askDeclined() && !askLater(); }
  function topUrl(mimes, state) {
    return AUTH +
      '?client_id=' + encodeURIComponent(clientId()) +
      '&redirect_uri=' + encodeURIComponent(backTo()) +
      '&response_type=code' +
      '&scope=' + encodeURIComponent(SCOPE) +
      (topOffline() ? '&access_type=offline&prompt=consent' : '') +
      '&trigger_onepick=true' +
      '&mimetypes=' + encodeURIComponent(mimes || 'application/pdf') +
      '&state=' + encodeURIComponent(state);
  }

  /*@3.DRIJ.29*/
  function standalone() {
    try {
      if (window.navigator && window.navigator.standalone) return true;
      return !!(window.matchMedia &&
                window.matchMedia('(display-mode: standalone)').matches);
    } catch (e) { return false; }
  }

  function pickTop(opts) {
    var o = opts || {};
    if (!enabled()) return Promise.reject(err('drive_disabled'));
    var st = String(Date.now()) + '.' + String(Math.random()).slice(2, 12);
    try {
      localStorage.setItem(TOP_LS, JSON.stringify({ s: st, t: Date.now() }));
    } catch (e) { return Promise.reject(err('no_store')); }
    var url = topUrl(o.mime, st);
    var w = null;
    if (!standalone()) {
      try {
        var ww = Math.min(560, (window.screen && screen.width) || 560);
        var wh = Math.min(720, (window.screen && screen.height) || 720);
        w = window.open(url, 'gardenDrivePick',
                        'width=' + ww + ',height=' + wh + ',menubar=no,toolbar=no');
      } catch (e) {}
    }
    if (!w) {
      location.href = url;
      /*@3.DRIJ.27*/
      return new Promise(function () {});
    }
    return relay(st, w);
  }

  /*@3.DRIJ.30*/
  function relay(st, w) {
    return new Promise(function (res, rej) {
      var done = false, tick = null;
      var off = function () {
        done = true;
        window.removeEventListener('message', on);
        if (tick) clearInterval(tick);
      };
      var on = function (e) {
        if (e.origin !== window.location.origin) return;
        var d = e.data;
        if (!d || d.gd !== 'pick' || d.s !== st) return;
        off();
        try { w.close(); } catch (e2) {}
        if (d.bad) {
          rej(err(d.bad === 'access_denied' ? 'consent_denied' : 'pick_failed'));
          return;
        }
        res({ id: d.ids[0], name: '', size: 0, mime: '', code: d.code || '' });
      };
      window.addEventListener('message', on);
      tick = setInterval(function () {
        if (done) return;
        var shut = false;
        try { shut = w.closed; } catch (e2) { return; }
        if (shut) { off(); rej(err('consent_closed')); }
      }, 700);
    });
  }

  function topBack() {
    var q;
    try { q = new URLSearchParams(location.search || ''); } catch (e) { return null; }
    var ids = q.get('picked_file_ids'), code = q.get('code'), bad = q.get('error');
    if (!ids && !code && !bad) return null;
    var want = null;
    try { want = JSON.parse(localStorage.getItem(TOP_LS) || 'null'); } catch (e) {}
    try { localStorage.removeItem(TOP_LS); } catch (e) {}
    try { history.replaceState(null, '', backTo()); } catch (e) {}
    if (!want || !want.s || want.s !== q.get('state')) return { error: 'state_mismatch' };
    var list = String(ids || '').split(',').filter(Boolean);
    var op = null;
    try { op = window.opener; } catch (e) {}
    if (op) {
      try {
        op.postMessage({ gd: 'pick', s: want.s, ids: list,
                         code: String(code || ''), bad: bad ? String(bad) : '' },
                       window.location.origin);
      } catch (e) {}
      try { window.close(); } catch (e) {}
      return { relayed: true };
    }
    if (bad) return { error: String(bad) };
    if (!list.length) return { error: 'no_pick' };
    return { ids: list, code: String(code || '') };
  }

  /*@3.DRIJ.28*/
  function topPreferred() {
    try { return localStorage.getItem(TOP_PREF) === '1'; } catch (e) { return false; }
  }
  function topPrefer(on) {
    try {
      if (on) localStorage.setItem(TOP_PREF, '1');
      else localStorage.removeItem(TOP_PREF);
    } catch (e) {}
  }

  /*@3.DRIJ.25*/
  var MUTE_MS = 9000;
  function muteBar(seen, toDevice) {
    var t = setTimeout(function () {
      if (seen()) return;
      var dlg = document.querySelector('.picker-dialog');
      if (!dlg || dlg.getAttribute('data-garden-mute')) return;
      dlg.setAttribute('data-garden-mute', '1');
      var bar = document.createElement('div');
      bar.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
      bar.style.cssText = 'position:absolute;inset-inline-start:0;inset-inline-end:0;' +
        'bottom:0;z-index:4;display:flex;flex-wrap:wrap;gap:.55rem;align-items:center;' +
        'justify-content:center;padding:.75rem .9rem;background:#fff8e1;' +
        'border-top:1px solid #e6d5a0;color:#5a4708;text-align:center;' +
        'font:500 13px/1.65 system-ui,sans-serif';
      var msg = document.createElement('span');
      msg.textContent = L('لم تستجبْ هذه النافذةُ على متصفّحك.',
                          'This window did not respond in your browser.');
      var go = document.createElement('button');
      go.type = 'button';
      go.textContent = L('افتحْ درايف بصفحةٍ كاملة', 'Open Drive full page');
      go.style.cssText = 'appearance:none;border:0;border-radius:8px;cursor:pointer;' +
        'padding:.45rem .95rem;background:#1a73e8;color:#fff;' +
        'font:600 13px system-ui,sans-serif';
      go.addEventListener('click', toDevice);
      bar.appendChild(msg);
      bar.appendChild(go);
      dlg.appendChild(bar);
      note('mute-bar', 'shown');
    }, MUTE_MS);
    return function () { clearTimeout(t); };
  }

  /*@3.DRIJ.8*/
  function pick(opts) {
    var o = opts || {};
    if (!pickerEnabled()) return Promise.reject(err('picker_disabled'));
    /*@3.DRIJ.18*/
    return token(false).then(function (t) {
      return script(GAPI, function () { return !!window.gapi; }).then(function (ok) {
        if (!ok) throw err('gapi_unavailable');
        return new Promise(function (res) {
          if (pickerReady()) { res(); return; }
          window.gapi.load('picker', { callback: res, onerror: res });
        });
      }).then(function () {
        if (!pickerReady()) throw err('picker_unavailable');
        return new Promise(function (res, rej) {
          var fin = res;
          var b0key = '';
          var P = window.google.picker;
          if (pickerKey()) b0key = pickerKey();
          /*@3.DRIJ.19*/
          var mimes = o.mime || 'application/pdf';
          var tree = new P.DocsView(P.ViewId.DOCS);
          tree.setMimeTypes(mimes);
          tree.setIncludeFolders(true);
          tree.setSelectFolderEnabled(false);
          try { tree.setParent('root'); } catch (e0) {}
          try { tree.setLabel(L('درايفي', 'My Drive')); } catch (e0) {}
          var mine = null;
          var fid = o.folderId || folderId;
          if (fid) {
            mine = new P.DocsView(P.ViewId.DOCS);
            mine.setMimeTypes(mimes);
            mine.setIncludeFolders(true);
            mine.setSelectFolderEnabled(false);
            try { mine.setParent(fid); } catch (e0) { mine = null; }
            if (mine) { try { mine.setLabel(FOLDER); } catch (e0) {} }
          }
          var flat = new P.DocsView(P.ViewId.DOCS);
          flat.setMimeTypes(mimes);
          try { flat.setLabel(L('بحثٌ في الكلّ', 'Search everything')); } catch (e0) {}
          /*@3.DRIJ.20*/
          var org = window.location.protocol + '//' + window.location.host;
          /*@3.DRIJ.21*/
          var vw = Math.max(320, window.innerWidth || 1024);
          var vh = Math.max(400, window.innerHeight || 768);
          var pw = Math.min(vw - 16, 1051);
          var ph = Math.min(vh - 16, 650);
          var b = new P.PickerBuilder()
            .setOAuthToken(t)
            .setAppId(appId())
            .setOrigin(org)
            .setSize(pw, ph)
            .setLocale(isAr() ? 'ar' : 'en')
            .addView(tree)
            .setTitle(o.title || L('اخترْ ملفّاً من درايف', 'Pick a file from Drive'))
            .setCallback(function (d) {
              sawCb = true;
              note('callback', d && d.action);
              if (!d || !d.action) return;
              if (d.action === P.Action.CANCEL) { fin(null); return; }
              if (d.action !== P.Action.PICKED) return;
              var f = (d.docs || [])[0];
              if (!f) { fin(null); return; }
              fin({ id: f.id, name: f.name, size: Number(f.sizeBytes) || 0,
                    mime: f.mimeType || '' });
            });
          /*@3.DRIJ.14*/
          var pk = null, shut = null, stop = null, gone = false;
          var stopBar = null, sawCb = false;
          var onKey = function (e) {
            if (e.key === 'Escape' && shut) { e.stopPropagation(); shut(); }
          };
          fin = function (v) {
            if (gone) return;
            gone = true;
            document.removeEventListener('keydown', onKey, true);
            if (stop) stop();
            if (stopBar) stopBar();
            try { if (pk) { pk.setVisible(false); pk.dispose(); } } catch (e2) {}
            note('done', v ? 'picked' : 'null');
            dsay('انتهى');
            res(v);
          };
          shut = function () { fin(null); };
          var bail = function () {
            if (gone) return;
            gone = true;
            topPrefer(true);
            /*@3.DRIJ.32*/
            var pr = pickTop(o);
            document.removeEventListener('keydown', onKey, true);
            if (stop) stop();
            if (stopBar) stopBar();
            try { if (pk) { pk.setVisible(false); pk.dispose(); } } catch (e2) {}
            note('done', 'mute→top');
            dsay('انتهى');
            pr.then(res, rej);
          };
          try {
            if (mine) b.addView(mine);
            b.addView(flat);
            if (b0key) b.setDeveloperKey(b0key);
            /*@3.DRIJ.23*/
            dlog = []; dt0 = Date.now(); dsaid = false; dwatch(true);
            note('key', b0key ? 'sent(' + b0key.slice(0, 10) + '…)' : 'NONE');
            note('appId', appId());
            note('origin', org);
            note('size', pw + 'x' + ph);
            note('views', mine ? 3 : 2);
            if (DBG) setTimeout(function () { dsay('مهلةٌ ٤٥ث'); }, 45000);
            pk = b.build();
            document.addEventListener('keydown', onKey, true);
            stop = wayOut(shut);
            stopBar = muteBar(function () { return sawCb; }, bail);
            pk.setVisible(true);
            if (DBG) setTimeout(function () {
              var dg = document.querySelector('.picker-dialog');
              var fr = document.querySelector('.picker-dialog iframe');
              note('dialog', dg ? 'found' : 'MISSING');
              note('iframe', fr ? String(fr.src).slice(0, 90) : 'MISSING');
            }, 3000);
          } catch (e) {
            if (stop) stop();
            document.removeEventListener('keydown', onKey, true);
            note('build-threw', e && e.message);
            dsay('فشلَ البناء');
            rej(err('picker_failed', e && e.message));
          }
        });
      });
    });
  }

  /*@3.DRIJ.9*/
  function reason(e) {
    var k = (e && e.code) || '';
    if (k === 'drive_disabled' || k === 'picker_disabled') {
      return L('ربطُ قوقل درايف غيرُ مفعَّلٍ بعد.', 'Google Drive is not enabled yet.');
    }
    if (k === 'popup_blocked') {
      return L('منع المتصفّحُ نافذةَ قوقل. اضغطْ مرّةً أخرى — أو اسمحْ بالنوافذِ المنبثقةِ لهذا الموقع.',
               'The browser blocked the Google window. Tap again — or allow pop-ups for this site.');
    }
    if (k === 'consent_denied' || k === 'consent_closed') {
      return L('لم يُمنح الإذنُ لدرايف — أعِدِ المحاولةَ واسمحْ بالوصول.',
               'Drive access was not granted — try again and allow access.');
    }
    if (k === 'no_gesture') {
      return L('يحتاج درايفُ إذنَك على هذا الجهاز — اضغطْ «افتحْ من درايف» ليطلبه قوقل.',
               'Drive needs your permission on this device — tap “Open from Drive” so Google can ask.');
    }
    if (k === 'picker_mute') {
      return L('تعذّر فتحُ نافذةِ درايف على هذا المتصفّح — يُفتح الملفُّ من ملفّاتِ جهازك.',
               'The Drive window could not open in this browser — opening from your device instead.');
    }
    if (k === 'not_found') {
      return L('الملفُّ لم يعد في درايفك — رُبّما حُذف أو نُقل إلى المهملات.',
               'The file is no longer in your Drive — it may have been deleted or trashed.');
    }
    if (k === 'forbidden') {
      return L('لا صلاحيّةَ لهذا الملفّ في درايف.', 'No permission for this file in Drive.');
    }
    if (/^put_/.test(k) || k === 'gsi_unavailable' || k === 'gapi_unavailable') {
      return L('تعذّر الاتّصالُ بقوقل — تحقّقْ من الشبكةِ وأعِدِ المحاولة.',
               'Could not reach Google — check the connection and try again.');
    }
    return L('تعذّر الوصولُ إلى درايف.', 'Drive could not be reached.');
  }

  /*@3.DRIJ.31*/
  (function () {
    try {
      if (!window.opener) return;
      if (!/[?&](picked_file_ids|code|error)=/.test(window.location.search || '')) return;
      topBack();
    } catch (e) {}
  })();

  (function () {
    var go = function () { setTimeout(linkWarm, 1200); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  })();

  window.GardenDrive = {
    enabled: enabled,
    folderName: function () { return FOLDER; },
    warm: warm,
    pickerEnabled: pickerEnabled,
    pickTop: pickTop,
    topBack: topBack,
    topPreferred: topPreferred,
    topPrefer: topPrefer,
    token: token,
    forget: forget,
    backTo: backTo,
    linked: linked,
    linkedEmail: linkedEmail,
    linkStatus: linkStatus,
    linkKnown: linkKnown,
    declined: askDeclined,
    declineLink: askDecline,
    linkNow: linkNow,
    askLink: askLink,
    afterPick: afterPick,
    unlink: unlink,
    linkReason: linkReason,
    pick: pick,
    meta: meta,
    download: download,
    folder: folder,
    upload: upload,
    trash: trash,
    reason: reason
  };
})();
