/*@4.LAPSJ2.1*/
(function (global) {
  'use strict';

  var PREFIX = 'garden_labs_programming-languages';
  var KEY_ARTIFACT = PREFIX + ':artifact';
  var KEY_BACKUP = PREFIX + ':backup';
  var KEY_STAGING = PREFIX + ':staging';
  var KEY_SLOTS = PREFIX + ':slots';
  var SLOT_KEY = function (id) { return PREFIX + ':slot:' + id; };
  var MAX_SLOTS = 12;
  var MAX_NAME = 60;
  var SCHEMA = 1;

  /*@4.LAPSJ2.2*/
  function fingerprint(text) {
    var hash = 0x811c9dc5;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
    }
    return hash.toString(16);
  }

  function envelope(payload) {
    var body = JSON.stringify(payload);
    return JSON.stringify({ schema: SCHEMA, at: new Date().toISOString(), sum: fingerprint(body), body: body });
  }

  function unwrap(raw) {
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.schema !== SCHEMA || typeof parsed.body !== 'string') return null;
      if (fingerprint(parsed.body) !== parsed.sum) return null;   /*@4.LAPSJ2.3*/
      return { payload: JSON.parse(parsed.body), at: parsed.at };
    } catch (error) { return null; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (error) { return false; }
  }
  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
  }
  function safeRemove(key) {
    try { localStorage.removeItem(key); } catch (error) { /*@4.LAPSJ2.4*/ }
  }

  /*@4.LAPSJ2.5*/
  function save(payload) {
    var wrapped = envelope(payload);
    if (!safeSet(KEY_STAGING, wrapped)) return false;
    if (safeGet(KEY_STAGING) !== wrapped) { safeRemove(KEY_STAGING); return false; }
    var current = safeGet(KEY_ARTIFACT);
    if (current) safeSet(KEY_BACKUP, current);
    var ok = safeSet(KEY_ARTIFACT, wrapped);
    safeRemove(KEY_STAGING);
    return ok;
  }

  /*@4.LAPSJ2.6*/
  function load() {
    return unwrap(safeGet(KEY_ARTIFACT)) || unwrap(safeGet(KEY_BACKUP));
  }

  function slots() {
    var raw = safeGet(KEY_SLOTS);
    if (!raw) return [];
    try {
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (error) { return []; }
  }

  /**
   * حفظٌ باسم. الاسمُ نفسُه يُحدِّث خانتَه — فحفظُ الطالبِ «تجربتي» مرّتين
   * يعني تحديثاً لا نسختين.
   * @returns {{ok:boolean, reason?:string, id?:string}}
   */
  function saveSlot(name, payload) {
    var clean = String(name || '').trim().slice(0, MAX_NAME);
    if (!clean) return { ok: false, reason: 'empty-name' };
    var list = slots();
    var existing = null;
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].name === clean) { existing = list[i]; break; }
    }
    if (!existing && list.length >= MAX_SLOTS) return { ok: false, reason: 'full' };
    var id = existing ? existing.id : (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    if (!safeSet(SLOT_KEY(id), envelope(payload))) return { ok: false, reason: 'storage' };
    var entry = { id: id, name: clean, at: new Date().toISOString() };
    var next = list.filter(function (item) { return item.id !== id; });
    next.unshift(entry);                                  /*@4.LAPSJ2.7*/
    if (!safeSet(KEY_SLOTS, JSON.stringify(next))) {
      safeRemove(SLOT_KEY(id));                           /*@4.LAPSJ2.8*/
      return { ok: false, reason: 'storage' };
    }
    return { ok: true, id: id };
  }

  function loadSlot(id) { return unwrap(safeGet(SLOT_KEY(id))); }

  function removeSlot(id) {
    safeRemove(SLOT_KEY(id));
    safeSet(KEY_SLOTS, JSON.stringify(slots().filter(function (item) { return item.id !== id; })));
  }

  /*@4.LAPSJ2.9*/
  var LINK_LIMIT = 6000;

  function bytesToBase64Url(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function base64UrlToBytes(text) {
    var padded = text.replace(/-/g, '+').replace(/_/g, '/');
    while (padded.length % 4) padded += '=';
    var binary = atob(padded);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  function pipeThrough(bytes, streamName) {
    if (typeof global.CompressionStream !== 'function') return Promise.resolve(null);
    var Ctor = streamName === 'deflate' ? global.CompressionStream : global.DecompressionStream;
    if (typeof Ctor !== 'function') return Promise.resolve(null);
    var stream = new Ctor('deflate-raw');
    var writer = stream.writable.getWriter();
    writer.write(bytes); writer.close();
    return new Response(stream.readable).arrayBuffer()
      .then(function (buffer) { return new Uint8Array(buffer); })
      .catch(function () { return null; });
  }

  /** @returns {Promise<{ok:boolean, fragment?:string, reason?:string}>} */
  function encodeShare(payload) {
    var json = JSON.stringify({ v: SCHEMA, p: payload });
    var raw = new TextEncoder().encode(json);
    return pipeThrough(raw, 'deflate').then(function (packed) {
      var fragment = 'code=' + bytesToBase64Url(packed || raw) + (packed ? '' : '&raw=1');
      if (fragment.length > LINK_LIMIT) return { ok: false, reason: 'too-large' };
      return { ok: true, fragment: fragment };
    });
  }

  /**
   * @returns {Promise<Object|null>}
   *
   * 🔗 **صيغتان مقبولتان**:
   * 1. `#code=<مغلَّفٌ مضغوط>` — جلسةٌ كاملةٌ من زرّ المشاركة عندنا.
   * 2. `#snippet=<كودٌ مضغوط>&lang=<لغة>` — **قصاصةٌ من مودلٍ دراسيّ**
   *    (المرحلة ٧.٥). أبسطُ لأن المودلَ يحمل كتلةَ كودٍ لا جلسةً، والفصلُ
   *    بين الصيغتين يمنع أن تُفسَّر قصاصةٌ على أنها جلسةٌ فتُمحى الجلسةُ
   *    الحقيقيةُ للطالب.
   */
  function decodeShare(fragment) {
    var params = new URLSearchParams(String(fragment).replace(/^#/, ''));
    var snippet = params.get('snippet');
    if (snippet) {
      var lang = String(params.get('lang') || '').toLowerCase().replace(/[^a-z+#]/g, '');
      var bytes;
      try { bytes = base64UrlToBytes(snippet); } catch (error) { return Promise.resolve(null); }
      var toSnippet = function (data) {
        try {
          var text = new TextDecoder().decode(data);
          if (!text.trim()) return null;
          /*@4.LAPSJ2.10*/
          var buffers = {};
          buffers[lang || 'javascript'] = text;
          return { lang: lang || 'javascript', buffers: buffers, snippet: true };
        } catch (error) { return null; }
      };
      if (params.get('raw') === '1') return Promise.resolve(toSnippet(bytes));
      return pipeThrough(bytes, 'inflate').then(function (plain) { return toSnippet(plain || bytes); });
    }
    var code = params.get('code');
    if (!code) return Promise.resolve(null);
    var bytes;
    try { bytes = base64UrlToBytes(code); } catch (error) { return Promise.resolve(null); }
    var asText = function (data) {
      try {
        var parsed = JSON.parse(new TextDecoder().decode(data));
        return parsed && parsed.v === SCHEMA ? parsed.p : null;
      } catch (error) { return null; }
    };
    if (params.get('raw') === '1') return Promise.resolve(asText(bytes));
    return pipeThrough(bytes, 'inflate').then(function (plain) {
      /*@4.LAPSJ2.11*/
      return asText(plain || bytes);
    });
  }

  /**
   * يبني رابطَ «جرّب هذا الكود في المختبر» — تُستدعى من صفحة المودل.
   * تُصدَّر لأن الخُطّافَ في `garden.js` **يجب ألّا يعرف** ضغطَنا ولا
   * ترميزَنا: يعطي كوداً ولغةً ويأخذ رابطاً.
   * @returns {Promise<string|null>}
   */
  function snippetLink(labUrl, code, lang) {
    var raw = new TextEncoder().encode(String(code));
    return pipeThrough(raw, 'deflate').then(function (packed) {
      var fragment = 'snippet=' + bytesToBase64Url(packed || raw) +
        '&lang=' + encodeURIComponent(String(lang || '')) + (packed ? '' : '&raw=1');
      if (fragment.length > LINK_LIMIT) return null;   /*@4.LAPSJ2.12*/
      return labUrl + '#' + fragment;
    });
  }

  global.GardenPLStore = {
    save: save, load: load,
    slots: slots, saveSlot: saveSlot, loadSlot: loadSlot, removeSlot: removeSlot,
    encodeShare: encodeShare, decodeShare: decodeShare, snippetLink: snippetLink,
    MAX_SLOTS: MAX_SLOTS, MAX_NAME: MAX_NAME, LINK_LIMIT: LINK_LIMIT,
    _fingerprint: fingerprint
  };
})(window);
