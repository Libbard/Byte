;(function () {
  'use strict';

  /*@3.DRIJ.1*/
  var SCOPE = 'https://www.googleapis.com/auth/drive.file';
  var API = 'https://www.googleapis.com/drive/v3';
  var UP = 'https://www.googleapis.com/upload/drive/v3';
  var GSI = 'https://accounts.google.com/gsi/client';
  var GAPI = 'https://apis.google.com/js/api.js';
  var FOLDER = 'الحديقة الرقمية';
  var MARK = { garden: '1' };
  var SLACK_MS = 60 * 1000;

  function E() { return window.GardenEndpoints || {}; }
  function clientId() { return E().googleClientId || ''; }
  function pickerKey() { return E().googlePickerKey || ''; }
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
    var b = pickerKey()
      ? script(GAPI, function () { return !!window.gapi; }).then(function (ok) {
          if (!ok || pickerReady()) return ok;
          return new Promise(function (res) {
            try { window.gapi.load('picker', { callback: function () { res(true); },
                                               onerror: function () { res(false); } }); }
            catch (e) { res(false); }
          });
        })
      : Promise.resolve(true);
    return Promise.all([a, b]).then(function (r) { return r[0] && r[1]; });
  }
  function pickerEnabled() { return enabled() && !!pickerKey(); }

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

  function fresh() { return !!(tok && Date.now() < exp - SLACK_MS); }

  function token(interactive) {
    if (fresh()) return Promise.resolve(tok);
    if (!enabled()) return Promise.reject(err('drive_disabled'));
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

  function forget() { tok = null; exp = 0; }

  function err(code, why) {
    var e = new Error(code);
    e.code = code;
    if (why) e.why = String(why);
    return e;
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
          if (r.files && r.files.length) return r.files[0].id;
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

  /*@3.DRIJ.8*/
  function pick(opts) {
    var o = opts || {};
    if (!pickerEnabled()) return Promise.reject(err('picker_disabled'));
    return token(true).then(function (t) {
      return script(GAPI, function () { return !!window.gapi; }).then(function (ok) {
        if (!ok) throw err('gapi_unavailable');
        return new Promise(function (res) {
          if (pickerReady()) { res(); return; }
          window.gapi.load('picker', { callback: res, onerror: res });
        });
      }).then(function () {
        if (!pickerReady()) throw err('picker_unavailable');
        return new Promise(function (res, rej) {
          var P = window.google.picker;
          var view = new P.DocsView(P.ViewId.DOCS);
          view.setMimeTypes(o.mime || 'application/pdf');
          view.setIncludeFolders(true);
          var b = new P.PickerBuilder()
            .setOAuthToken(t)
            .setDeveloperKey(pickerKey())
            .setAppId(appId())
            .setLocale(isAr() ? 'ar' : 'en')
            .addView(view)
            .setTitle(o.title || L('اخترْ ملفّاً من درايف', 'Pick a file from Drive'))
            .setCallback(function (d) {
              if (!d || !d.action) return;
              if (d.action === P.Action.CANCEL) { res(null); return; }
              if (d.action !== P.Action.PICKED) return;
              var f = (d.docs || [])[0];
              if (!f) { res(null); return; }
              res({ id: f.id, name: f.name, size: Number(f.sizeBytes) || 0,
                    mime: f.mimeType || '' });
            });
          try { b.build().setVisible(true); }
          catch (e) { rej(err('picker_failed', e && e.message)); }
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

  window.GardenDrive = {
    enabled: enabled,
    warm: warm,
    pickerEnabled: pickerEnabled,
    token: token,
    forget: forget,
    pick: pick,
    meta: meta,
    download: download,
    folder: folder,
    upload: upload,
    trash: trash,
    reason: reason
  };
})();
