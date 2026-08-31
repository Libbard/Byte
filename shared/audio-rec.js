/*@3.AURJ.1*/
;(function () {
  'use strict';

  /*@3.AURJ.2*/
  var CAND = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ];

  function pickType() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
    for (var i = 0; i < CAND.length; i++) {
      if (MediaRecorder.isTypeSupported(CAND[i])) return CAND[i];
    }
    return '';
  }

  function support() {
    var md = navigator.mediaDevices || {};
    return {
      mic: !!md.getUserMedia,
      system: !!md.getDisplayMedia,
      recorder: !!window.MediaRecorder,
      type: pickType(),
      secure: window.isSecureContext !== false
    };
  }

  /*@3.AURJ.3*/
  var MIC_CONSTRAINTS = {
    channelCount: 1,
    sampleRate: 48000,
    echoCancellation: false,
    noiseSuppression: true,
    /*@3.AURJ.9*/
    autoGainControl: false
  };

  function micStream() {
    return navigator.mediaDevices.getUserMedia({ audio: MIC_CONSTRAINTS, video: false });
  }

  /*@3.AURJ.4*/
  function systemStream() {
    if (!navigator.mediaDevices.getDisplayMedia) {
      return Promise.reject(new Error('no_display_media'));
    }
    return navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false,
               autoGainControl: false },
      systemAudio: 'include',
      selfBrowserSurface: 'include'
    }).then(function (s) {
      if (!s.getAudioTracks().length) {
        s.getTracks().forEach(function (t) { t.stop(); });
        throw new Error('no_system_audio');
      }
      /*@3.AURJ.8*/
      s.getVideoTracks().forEach(function (t) { t.stop(); });
      return s;
    });
  }

  /*@3.AURJ.5*/
  function mix(streams) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return streams[0];
    var ctx = new AC({ sampleRate: 48000 });
    var dst = ctx.createMediaStreamDestination();
    streams.forEach(function (s) {
      if (!s || !s.getAudioTracks().length) return;
      var src = ctx.createMediaStreamSource(s);
      var g = ctx.createGain();
      g.gain.value = 1 / Math.max(1, streams.length - 0.5);
      src.connect(g).connect(dst);
    });
    dst.stream._ctx = ctx;
    dst.stream._srcs = streams;
    return dst.stream;
  }

  function Recorder(opts) {
    var o = opts || {};
    this.bps = o.bps || 24000;
    this.source = o.source || 'mic';
    this.chunks = [];
    this.bytes = 0;
    this.rec = null;
    this.stream = null;
    this.raw = [];
    this.t0 = 0;
    this.paused = 0;
  }

  Recorder.prototype.open = function () {
    var self = this;
    var want = [];
    if (this.source === 'mic' || this.source === 'both') want.push(micStream());
    if (this.source === 'system' || this.source === 'both') want.push(systemStream());
    return Promise.all(want).then(function (list) {
      self.raw = list;
      self.stream = list.length > 1 ? mix(list) : list[0];
      return self;
    });
  };

  /*@3.AURJ.6*/
  Recorder.prototype.start = function (onTick) {
    var self = this;
    var type = pickType();
    var mr = new MediaRecorder(this.stream, type
      ? { mimeType: type, audioBitsPerSecond: this.bps }
      : { audioBitsPerSecond: this.bps });
    this.rec = mr;
    this.type = mr.mimeType || type;
    mr.ondataavailable = function (e) {
      if (!e.data || !e.data.size) return;
      self.chunks.push(e.data);
      self.bytes += e.data.size;
      if (onTick) onTick(self.stats());
    };
    this.t0 = Date.now();
    mr.start(5000);
    return this;
  };

  Recorder.prototype.stats = function () {
    var sec = (Date.now() - this.t0) / 1000;
    return {
      sec: sec,
      bytes: this.bytes,
      kbps: sec > 0 ? (this.bytes * 8 / 1000) / sec : 0,
      mbPerHour: sec > 0 ? (this.bytes / sec) * 3600 / 1048576 : 0,
      type: this.type
    };
  };

  Recorder.prototype.stop = function () {
    var self = this;
    return new Promise(function (ok) {
      if (!self.rec || self.rec.state === 'inactive') { ok(self.result()); return; }
      self.rec.onstop = function () { ok(self.result()); };
      self.rec.stop();
    }).then(function (r) { self.release(); return r; });
  };

  Recorder.prototype.result = function () {
    var st = this.stats();
    return {
      blob: new Blob(this.chunks, { type: (this.type || 'audio/webm').split(';')[0] }),
      sec: st.sec, bytes: st.bytes, kbps: st.kbps,
      mbPerHour: st.mbPerHour, type: this.type
    };
  };

  Recorder.prototype.release = function () {
    (this.raw || []).forEach(function (s) {
      try { s.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    });
    if (this.stream && this.stream._ctx) { try { this.stream._ctx.close(); } catch (e) {} }
    this.rec = null; this.stream = null; this.raw = [];
  };

  /*@3.AURJ.7*/
  function probe(seconds, bpsList, source) {
    var list = bpsList || [16000, 24000, 32000, 48000];
    var out = [];
    var step = function (i) {
      if (i >= list.length) return Promise.resolve(out);
      var r = new Recorder({ bps: list[i], source: source || 'mic' });
      return r.open().then(function () {
        r.start();
        return new Promise(function (ok) { setTimeout(ok, (seconds || 20) * 1000); });
      }).then(function () {
        return r.stop();
      }).then(function (res) {
        out.push({
          asked_kbps: list[i] / 1000,
          real_kbps: Math.round(res.kbps * 10) / 10,
          mb_per_hour: Math.round(res.mbPerHour * 100) / 100,
          mb_50min: Math.round(res.mbPerHour * (50 / 60) * 100) / 100,
          sec: Math.round(res.sec),
          type: res.type,
          blob: res.blob
        });
        return step(i + 1);
      });
    };
    return step(0);
  }

  window.GardenAudioRec = {
    support: support,
    Recorder: Recorder,
    probe: probe,
    pickType: pickType
  };
})();
