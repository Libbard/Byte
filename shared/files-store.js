/*@3.FISJ2.1*/
;(function () {
  'use strict';

  var PUT_RETRY = 2;

  /*@3.FISJ2.6*/
  var MIMES = [
    'application/pdf',
    'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/opus',
    'audio/x-m4a', 'audio/aac', 'audio/mpeg', 'audio/wav', 'audio/x-wav',
    'audio/3gpp', 'audio/amr', 'audio/flac', 'audio/x-caf',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/3gpp'
  ];

  /*@3.FISJ2.7*/
  var ALIAS = {
    'audio/mp3': 'audio/mpeg', 'audio/mpeg3': 'audio/mpeg',
    'audio/x-mpeg': 'audio/mpeg', 'audio/x-mp3': 'audio/mpeg',
    'audio/m4a': 'audio/x-m4a', 'audio/mp4a-latm': 'audio/mp4',
    'audio/wave': 'audio/wav', 'audio/vnd.wave': 'audio/wav',
    'audio/x-pn-wav': 'audio/wav',
    'audio/x-aac': 'audio/aac', 'audio/x-hx-aac-adts': 'audio/aac',
    'audio/aacp': 'audio/aac', 'audio/vnd.dlna.adts': 'audio/aac',
    'audio/oga': 'audio/ogg', 'audio/vorbis': 'audio/ogg',
    'audio/x-vorbis+ogg': 'audio/ogg', 'audio/x-ogg': 'audio/ogg',
    'audio/x-flac': 'audio/flac', 'audio/3gpp2': 'audio/3gpp',
    'audio/amr-wb': 'audio/amr', 'audio/3gpp2': 'audio/3gpp',
    'video/3gpp2': 'video/3gpp', 'video/mp4v-es': 'video/mp4'
  };

  /*@3.FISJ2.8*/
  function normMime(m) {
    var v = String(m || '').split(';')[0].trim().toLowerCase();
    if (ALIAS[v]) v = ALIAS[v];
    return MIMES.indexOf(v) >= 0 ? v : '';
  }

  function endpoint() {
    var e = window.GardenEndpoints;
    return (e && e.sync) || '';
  }

  function vaultId() {
    var G = window.GardenSync;
    if (!G || !G.vaultId) return Promise.resolve(null);
    try { return Promise.resolve(G.vaultId()).catch(function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }

  function headers(id, extra) {
    var G = window.GardenSync;
    var h = Object.assign({}, extra || {});
    if (G && G.vaultHeaders) { try { return G.vaultHeaders(id, h); } catch (e) {} }
    return h;
  }

  function base(id) { return endpoint() + '/v1/files/' + encodeURIComponent(id); }

  function jreq(method, url, id, body) {
    return fetch(url, {
      method: method,
      headers: headers(id, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return null; })
        .then(function (j) { return { status: r.status, ok: r.ok, body: j || {} }; });
    });
  }

  function emit(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
    catch (e) {}
  }

  /*@3.FISJ2.2*/
  function xhrPut(url, blob, onProgress, signal) {
    return new Promise(function (ok, no) {
      var x = new XMLHttpRequest();
      x.open('PUT', url, true);
      x.setRequestHeader('Content-Type', blob.type || 'application/octet-stream');
      if (x.upload && onProgress) {
        x.upload.onprogress = function (e) {
          if (e.lengthComputable) onProgress(e.loaded, e.total);
        };
      }
      x.onload = function () {
        if (x.status >= 200 && x.status < 300) ok(true);
        else no(new Error('put_' + x.status));
      };
      x.onerror = function () { no(new Error('put_network')); };
      x.onabort = function () { no(new Error('put_aborted')); };
      if (signal) {
        if (signal.aborted) { try { x.abort(); } catch (e) {} }
        else signal.addEventListener('abort', function () { try { x.abort(); } catch (e) {} });
      }
      x.send(blob);
    });
  }

  function hashOf(blob, onProgress) {
    var D = window.GardenPdfDoc;
    if (D && D.hash) return D.hash(blob, onProgress);
    return Promise.reject(new Error('no_hasher'));
  }

  /*@3.FISJ2.3*/
  function upload(blob, opts) {
    var o = opts || {};
    var refId = o.refId || ('f_' + Date.now().toString(36) + '_' +
                            Math.random().toString(36).slice(2, 8));
    var name = String(o.name || 'file.pdf');
    /*@3.FISJ2.9*/
    var mime = normMime(o.mime) || normMime(blob.type);
    var stage = function (s, extra) {
      emit('garden:fileProgress', Object.assign({ ref_id: refId, stage: s }, extra || {}));
    };

    return vaultId().then(function (id) {
      if (!id) throw new Error('no_vault');
      /*@3.FISJ2.10*/
      if (!mime) {
        stage('error', { error: 'bad_mime' });
        throw Object.assign(new Error('bad_mime'),
                            { error: 'bad_mime', mime: o.mime || blob.type || '' });
      }

      stage('hash', { at: 0, of: blob.size });
      return hashOf(blob, function (at, of) { stage('hash', { at: at, of: of }); })
        .then(function (h) {
          stage('probe');
          return jreq('POST', base(id) + '/probe', id, {
            h: h.hash, bytes: blob.size, mime: mime, over: !!o.over
          }).then(function (r) {
            if (!r.ok) throw Object.assign(new Error(r.body.error || 'probe_failed'), r.body);
            return { h: h.hash, probe: r.body };
          });
        })
        .then(function (st) {
          if (st.probe.hit) { stage('deduped'); return st; }
          stage('upload', { at: 0, of: blob.size });
          var tries = 0;
          var go = function () {
            return xhrPut(st.probe.put, blob, function (at, of) {
              stage('upload', { at: at, of: of });
            }, o.signal).catch(function (e) {
              /*@3.FISJ2.4*/
              if (++tries > PUT_RETRY || /aborted/.test(e.message)) throw e;
              return go();
            });
          };
          return go().then(function () { return st; });
        })
        .then(function (st) {
          stage('commit');
          return jreq('POST', base(id) + '/commit', id, {
            h: st.h, ref_id: refId, name: name, mime: mime,
            course: o.course || null, over: !!o.over
          }).then(function (r) {
            if (!r.ok) throw Object.assign(new Error(r.body.error || 'commit_failed'), r.body);
            stage('done', { deduped: !!r.body.deduped, bytes: r.body.bytes });
            return { ref_id: refId, key: r.body.key, bytes: r.body.bytes,
                     deduped: !!r.body.deduped };
          });
        })
        .catch(function (e) {
          stage('error', { error: e && e.message });
          throw e;
        });
    });
  }

  function list() {
    return vaultId().then(function (id) {
      if (!id) return { files: [], used: 0 };
      return jreq('GET', base(id), id).then(function (r) {
        return r.ok ? r.body : { files: [], used: 0, error: r.body.error };
      });
    });
  }

  function link(refId) {
    return vaultId().then(function (id) {
      if (!id) throw new Error('no_vault');
      return jreq('GET', base(id) + '/f/' + encodeURIComponent(refId), id)
        .then(function (r) {
          if (!r.ok) throw new Error(r.body.error || 'link_failed');
          return r.body;
        });
    });
  }

  /*@3.FISJ2.5*/
  function fetchBytes(refId, onProgress) {
    return link(refId).then(function (l) {
      return fetch(l.url).then(function (r) {
        if (!r.ok) throw new Error('download_' + r.status);
        var total = Number(r.headers.get('content-length') || l.bytes || 0);
        if (!r.body || !onProgress) return r.blob().then(function (b) {
          return { blob: b, name: l.name, mime: l.mime };
        });
        var reader = r.body.getReader();
        var parts = [], got = 0;
        var pump = function () {
          return reader.read().then(function (s) {
            if (s.done) {
              return { blob: new Blob(parts, { type: l.mime }), name: l.name, mime: l.mime };
            }
            parts.push(s.value); got += s.value.length;
            onProgress(got, total);
            return pump();
          });
        };
        return pump();
      });
    });
  }

  function remove(refId) {
    return vaultId().then(function (id) {
      if (!id) throw new Error('no_vault');
      return jreq('DELETE', base(id) + '/f/' + encodeURIComponent(refId), id)
        .then(function (r) { return r.ok; });
    });
  }

  /*@3.FISJ2.11*/
  var WHY = { 404: 'not_enrolled', 503: 'not_configured', 401: 'locked',
              429: 'rate_limited', 403: 'origin', 400: 'bad_vault' };

  /*@3.FISJ2.12*/
  function state() {
    return vaultId().then(function (id) {
      if (!id) return { ok: false, why: 'no_vault', files: [] };
      return jreq('GET', base(id), id).then(function (r) {
        if (r.ok) {
          return { ok: true, why: '', files: r.body.files || [],
                   used: Number(r.body.used || 0), max: Number(r.body.max || 0),
                   max_audio: Number(r.body.max_audio || 0),
                   max_vault: Number(r.body.max_vault || 0) };
        }
        return { ok: false, status: r.status, files: [],
                 why: WHY[r.status] || (r.body && r.body.error) || ('http_' + r.status),
                 pw: !!(r.body && r.body.pw), google: !!(r.body && r.body.google) };
      }, function () { return { ok: false, why: 'offline', files: [] }; });
    });
  }

  function available() { return state(); }

  window.GardenFiles = {
    mimes: MIMES,
    normMime: normMime,
    state: state,
    upload: upload,
    list: list,
    link: link,
    fetchBytes: fetchBytes,
    remove: remove,
    available: available
  };
})();
