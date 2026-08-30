;(function () {
  'use strict';

  var MOUSE_TWIN_MS = 1500;
  var COMMIT_PX = 3;
  var TWO_FINGER_GRACE_MS = 250;
  var PALM_AREA = 120;
  var FLAT_EPS = 0.02;
  var CEIL_FLOOR = 0.5;
  var PALM_KEY = 'garden_ink_palm';
  var PMAX_KEY = 'garden_ink_pmax';
  var BTN_KEY = 'garden_pen_buttons';

  var TILT_KEY = 'garden_ink_tilt';
  var HALF_PI = Math.PI / 2, TAU = Math.PI * 2, D2R = Math.PI / 180;

  /*@3.NOIJ2.28*/
  var _tilt = null;

  /*@3.NOIJ2.35*/
  function tiltMode() {
    if (_tilt) return _tilt;
    _tilt = 'auto';
    try {
      if (localStorage.getItem(TILT_KEY) === 'off') _tilt = 'off';
    } catch (e) {}
    return _tilt;
  }

  /*@3.NOIJ2.29*/
  function readTilt(e) {
    if (e.pointerType !== 'pen') return null;

    /*@3.NOIJ2.33*/
    var alt = e.altitudeAngle, az = e.azimuthAngle;
    if (typeof alt === 'number' && typeof az === 'number' &&
        isFinite(alt) && isFinite(az) && !(alt >= HALF_PI - 1e-6 && az === 0)) {
      return norm(alt, az);
    }

    /*@3.NOIJ2.34*/
    var tx = e.tiltX, ty = e.tiltY;
    if (typeof tx !== 'number' || typeof ty !== 'number') return null;
    if (!isFinite(tx) || !isFinite(ty)) return null;
    if (tx === 0 && ty === 0) return null;
    return norm2(tx * D2R, ty * D2R);
  }

  /*@3.NOIJ2.30*/
  function norm2(tx, ty) {
    var az, alt;
    if (Math.abs(tx) >= HALF_PI - 1e-6 || Math.abs(ty) >= HALF_PI - 1e-6) {
      alt = 0;
      az = Math.atan2(ty === 0 ? 0 : (ty > 0 ? 1 : -1), tx === 0 ? 0 : (tx > 0 ? 1 : -1));
    } else if (tx === 0) {
      az = ty > 0 ? HALF_PI : -HALF_PI;
      alt = HALF_PI - Math.abs(ty);
    } else if (ty === 0) {
      az = tx > 0 ? 0 : Math.PI;
      alt = HALF_PI - Math.abs(tx);
    } else {
      var kx = Math.tan(tx), ky = Math.tan(ty);
      az = Math.atan2(ky, kx);
      alt = Math.atan(1 / Math.sqrt(kx * kx + ky * ky));
    }
    return norm(alt, az);
  }

  /*@3.NOIJ2.31*/
  function norm(alt, az) {
    var tz = 1 - Math.max(0, Math.min(1, alt / HALF_PI));
    az = az % TAU;
    if (az < 0) az += TAU;
    return { tz: tz, az: az };
  }

  var AIR_CLICK_MS = 900;
  var BTN_DEFAULT = { barrel: 'era', tip: 'era', second: 'sel' };

  function penButtons() {
    var out = { barrel: BTN_DEFAULT.barrel, tip: BTN_DEFAULT.tip, second: BTN_DEFAULT.second };
    try {
      var a = JSON.parse(localStorage.getItem(BTN_KEY) || 'null');
      if (a && typeof a === 'object') {
        if (typeof a.barrel === 'string') out.barrel = a.barrel;
        if (typeof a.tip === 'string') out.tip = a.tip;
        if (typeof a.second === 'string') out.second = a.second;
      }
    } catch (e) {}
    return out;
  }

  /*@3.NOIJ2.10*/
  function penMods(e) {
    if (e.pointerType !== 'pen') return null;
    var b = e.buttons || 0;
    if ((b & 32) || e.button === 5) return 'tip';
    if ((b & 2) || e.button === 2) return 'barrel';
    if ((b & 4) || e.button === 1) return 'second';
    return null;
  }

  /*@3.NOIJ2.15*/
  var KEYS_KEY = 'garden_pen_keys';

  function penKeys() {
    try {
      var o = JSON.parse(localStorage.getItem(KEYS_KEY) || 'null');
      if (o && typeof o === 'object') return o;
    } catch (e) {}
    return {};
  }

  function normKey(k) {
    var s = String(k == null ? '' : k);
    if (s.length !== 1) return '';
    s = s.toLowerCase();
    return /^[a-z0-9`\-=\[\]\\;',.\/]$/.test(s) ? s : '';
  }

  /*@3.NOIJ2.16*/
  function setPenKey(key, act) {
    var k = normKey(key);
    if (!k) return null;
    var m = penKeys();
    for (var old in m) if (m[old] === act) delete m[old];
    if (act && act !== 'none') m[k] = act; else delete m[k];
    try { localStorage.setItem(KEYS_KEY, JSON.stringify(m)); } catch (e) {}
    return m;
  }

  function clearPenKey(act) {
    var m = penKeys(), hit = false;
    for (var k in m) if (m[k] === act) { delete m[k]; hit = true; }
    if (hit) { try { localStorage.setItem(KEYS_KEY, JSON.stringify(m)); } catch (e) {} }
    return m;
  }

  function keyFor(act) {
    var m = penKeys();
    for (var k in m) if (m[k] === act) return k;
    return '';
  }

  /*@3.NOIJ2.20*/
  var CODE_KEY = /^(?:Key([A-Z])|Digit([0-9]))$/;
  function keyOf(e) {
    var m = CODE_KEY.exec(e.code || '');
    if (m) return (m[1] || m[2]).toLowerCase();
    return String(e.key || '').toLowerCase();
  }

  /*@3.NOIJ2.17*/
  function capture(kind, cb) {
    var done = false;
    function stop() {
      if (done) return;
      done = true;
      window.removeEventListener('pointerdown', onPen, true);
      window.removeEventListener('pointermove', onPen, true);
      window.removeEventListener('keydown', onKey, true);
    }
    function onPen(e) {
      if (e.pointerType !== 'pen') return;
      var mod = penMods(e);
      if (!mod) return;
      e.preventDefault();
      e.stopPropagation();
      stop();
      cb({ kind: 'pen', mod: mod });
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); stop(); cb(null); return; }
      /*@3.NOIJ2.19*/
      if (kind === 'pen') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = normKey(e.key);
      if (!k) return;
      e.preventDefault();
      e.stopPropagation();
      stop();
      cb({ kind: 'key', key: k });
    }
    if (kind !== 'key') {
      window.addEventListener('pointerdown', onPen, true);
      window.addEventListener('pointermove', onPen, true);
    }
    window.addEventListener('keydown', onKey, true);
    return stop;
  }

  /*@3.NOIJ2.23*/
  function contact(e, prof) {
    if ((e.buttons & 1) === 1) return true;
    if (typeof e.pressure === 'number' && e.pressure > 0.01) return true;
    if (e.pointerType === 'pen' && prof && !prof.pMax) return true;
    return false;
  }

  function palmMode(def) {
    var d = def || 'auto';
    try { return localStorage.getItem(PALM_KEY) || d; }
    catch (e) { return d; }
  }

  function now() { return Date.now(); }

  /*@3.NOIJ2.1*/
  function Profile() {
    this.penSeen = false;
    this.lastPenAt = 0;
    this.pMin = 1;
    this.pMax = 0;
    this.pSamples = 0;
    this.areaSeen = false;
    /*@3.NOIJ2.9*/
    try {
      var v = parseFloat(localStorage.getItem(PMAX_KEY) || '0');
      if (isFinite(v) && v > 0 && v <= 1) this.pCeil = v;
    } catch (e) {}
  }

  Profile.prototype.ceiling = function () {
    return Math.max(this.pMax, this.pCeil || 0, CEIL_FLOOR);
  };

  Profile.prototype.notePen = function () {
    this.penSeen = true;
    this.lastPenAt = now();
  };

  Profile.prototype.notePressure = function (v) {
    if (typeof v !== 'number') return;
    this.pSamples++;
    if (v < this.pMin) this.pMin = v;
    if (v > this.pMax) {
      this.pMax = v;
      if (v > (this.pCeil || 0)) {
        this.pCeil = v;
        try { localStorage.setItem(PMAX_KEY, String(v)); } catch (e) {}
      }
    }
  };

  /*@3.NOIJ2.2*/
  Profile.prototype.pressureIsFlat = function () {
    return (this.pMax - this.pMin) < FLAT_EPS;
  };

  Profile.prototype.mouseIsTwin = function () {
    return this.penSeen && (now() - this.lastPenAt) < MOUSE_TWIN_MS;
  };

  function splitAct(act) {
    var want = act, mode = null;
    if (act.indexOf('era') === 0) {
      want = 'era';
      if (act === 'era:part') mode = 'part';
      else if (act === 'era:whole') mode = 'whole';
    }
    return { tool: want, mode: mode };
  }

  function Mods(a) {
    this.a = a || {};
    this.held = null;
    this.latch = null;
  }

  Mods.prototype.begin = function (act) {
    if (!act || act === 'none') return false;
    var a = this.a, s = splitAct(act);
    this.held = { tool: a.getTool(), mode: a.getEraseMode() };
    if (s.mode) a.setEraseMode(s.mode);
    if (s.tool !== a.getTool()) a.setTool(s.tool);
    else if (a.onChange) a.onChange();
    return true;
  };

  Mods.prototype.end = function (info) {
    var a = this.a;
    if (info && info.tap && info.act) {
      this.held = null;
      this.toggle(info.act);
      if (a.onChange) a.onChange();
      return 'tap';
    }
    var m = this.held;
    this.held = null;
    if (m && !(a.hasSelection && a.hasSelection())) {
      a.setEraseMode(m.mode);
      if (a.getTool() !== m.tool) a.setTool(m.tool);
    }
    if (a.onChange) a.onChange();
    return 'hold';
  };

  Mods.prototype.toggle = function (act) {
    if (!act || act === 'none') return false;
    var a = this.a, s = splitAct(act), L = this.latch;
    if (L && L.act === act) {
      this.latch = null;
      a.setEraseMode(L.mode);
      a.setTool(L.tool);
      return true;
    }
    if (L) {
      this.latch = { act: act, tool: L.tool, mode: L.mode };
    } else {
      if (s.tool === a.getTool() && (!s.mode || s.mode === a.getEraseMode())) return false;
      this.latch = { act: act, tool: a.getTool(), mode: a.getEraseMode() };
    }
    if (s.mode) a.setEraseMode(s.mode);
    a.setTool(s.tool);
    return true;
  };

  function typing(t) {
    return !!(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
  }

  function keys(spec, guard) {
    return function (e) {
      if (e.defaultPrevented) return;
      if (typing(e.target)) return;
      if (guard && guard(e) === false) return;
      var name = ((e.ctrlKey || e.metaKey) ? 'mod+' : '') +
                 (e.shiftKey ? 'shift+' : '') + keyOf(e);
      var fn = spec[name];
      if (!fn) return;
      if (fn(e) === false) return;
      e.preventDefault();
    };
  }

  function ring(host) {
    var el = null;
    return {
      at: function (x, y, r, dashed) {
        if (!host) return;
        if (!el) {
          el = document.createElement('div');
          el.className = 'gink-ring';
          el.setAttribute('aria-hidden', 'true');
          host.appendChild(el);
        }
        el.setAttribute('data-dash', dashed ? '1' : '0');
        el.style.inlineSize = el.style.blockSize = Math.max(4, r * 2) + 'px';
        el.style.insetInlineStart = '0';
        el.style.insetBlockStart = '0';
        el.style.transform = 'translate(' + (x - r) + 'px,' + (y - r) + 'px)';
        el.hidden = false;
      },
      off: function () { if (el) el.hidden = true; },
      drop: function () {
        if (el && el.parentNode) el.parentNode.removeChild(el);
        el = null;
      }
    };
  }

  function Router(opts) {
    var o = opts || {};
    this.el = o.el;
    this.onBegin = o.onBegin || function () {};
    this.onMove = o.onMove || function () {};
    this.onEnd = o.onEnd || function () {};
    this.onEndMod = o.onEndMod || null;
    this.onGesture = o.onGesture || function () {};
    this.mode = o.mode || function () { return 'draw'; };
    this.palmDef = o.palmDefault || '';
    this.profile = o.profile || new Profile();
    this.live = {};
    this.gest = {};
    this.bind();
  }

  /*@3.NOIJ2.18*/
  Router.prototype.rect = function (fresh) {
    if (fresh || !this._rect) this._rect = this.el.getBoundingClientRect();
    return this._rect;
  };

  Router.prototype.zoom = function () {
    var el = this.el;
    if (!el || !el.offsetWidth) return 1;
    var z = this.rect().width / el.offsetWidth;
    return (isFinite(z) && z > 0.05) ? z : 1;
  };

  /*@3.NOIJ2.24*/
  Router.prototype.local = function (e) {
    var r = this._cr;
    if (!r) {
      r = this.el.getBoundingClientRect();
      this._cr = r;
      var self = this;
      if (!this._crBound) {
        this._crBound = 1;
        var drop = function () { self._cr = null; };
        window.addEventListener('scroll', drop, { capture: true, passive: true });
        window.addEventListener('resize', drop, { passive: true });
      }
    }
    var z = (this.el.offsetWidth && r.width / this.el.offsetWidth) || 1;
    if (!isFinite(z) || z <= 0.05) z = 1;
    return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z };
  };

  Router.prototype.dropRect = function () { this._cr = null; };

  Router.prototype.gpt = function (e) {
    var p = this.local(e);
    p.cx = e.clientX;
    p.cy = e.clientY;
    return p;
  };

  /*@3.NOIJ2.3*/
  Router.prototype.classify = function (e) {
    var t = e.pointerType || 'mouse';
    var P = this.profile;
    var pm = palmMode(this.palmDef);

    if (t === 'pen') { P.notePen(); return 'draw'; }

    if (t === 'mouse') {
      if (P.mouseIsTwin()) return 'reject';
      return 'draw';
    }

    if (t === 'touch') {
      if (pm === 'never') return 'draw';
      if (pm === 'always') return 'gesture';
      if (P.penSeen) return 'gesture';
      if (e.width > 0) {
        P.areaSeen = true;
        if (e.width >= PALM_AREA || e.height >= PALM_AREA) return 'reject';
      }
      /*@3.NOIJ2.26*/
      if (this.gestureCount() > 0) return 'gesture';
      if (this.drawingCount() > 0) return 'gesture';
      return 'draw';
    }
    return 'draw';
  };

  Router.prototype.drawingCount = function () {
    var n = 0;
    for (var k in this.live) if (this.live[k]) n++;
    return n;
  };

  Router.prototype.gestureCount = function () {
    var n = 0;
    for (var k in this.gest) if (this.gest[k]) n++;
    return n;
  };

  /*@3.NOIJ2.4*/
  Router.prototype.effP = function (tr, pt, e) {
    var P = this.profile;
    var raw = (typeof e.pressure === 'number') ? e.pressure : 0;
    if (e.pointerType === 'pen') P.notePressure(raw);

    if (e.pointerType === 'pen' && !P.pressureIsFlat()) {
      /*@3.NOIJ2.8*/
      var denom = P.ceiling();
      return Math.max(0.05, Math.min(1, raw / denom));
    }

    var last = tr.pts[tr.pts.length - 1];
    if (!last) return 0.55;
    var dx = pt.x - last.x, dy = pt.y - last.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    var fast = Math.min(1, d / 14);
    var target = 0.85 - 0.55 * fast;
    tr.pSmooth = (tr.pSmooth == null) ? target : (tr.pSmooth * 0.72 + target * 0.28);
    return Math.max(0.12, Math.min(1, tr.pSmooth));
  };

  /*@3.NOIJ2.32*/
  Router.prototype.effTilt = function (tr, pt, e) {
    if (tiltMode() === 'off') return;
    var r = readTilt(e);
    if (!r) {
      if (tr.tilt) { pt.tz = tr.lastTz; pt.az = tr.lastAz; }
      return;
    }
    tr.tilt = 1;
    tr.lastTz = r.tz; tr.lastAz = r.az;
    pt.tz = r.tz; pt.az = r.az;
    if (!SEEN.tilt) { SEEN.tilt = 1; }
  };

  Router.prototype.points = function (e) {
    var evts = (typeof e.getCoalescedEvents === 'function')
      ? (e.getCoalescedEvents() || [e]) : [e];
    return evts.length ? evts : [e];
  };

  /*@3.NOIJ2.5*/
  /*@3.NOIJ2.25*/
  Router.prototype.cancelProvisional = function () {
    for (var id in this.live) {
      var tr = this.live[id];
      if (!tr || tr.src !== 'touch') continue;
      if (tr.committed && now() - (tr.t0 || 0) > TWO_FINGER_GRACE_MS) continue;
      this.onEnd(id, false);
      this.gest[id] = { x: tr.last.x, y: tr.last.y,
                        cx: tr.last.cx || 0, cy: tr.last.cy || 0, src: 'touch' };
      delete this.live[id];
    }
  };

  Router.prototype.bind = function () {
    var self = this;
    var el = this.el;

    /*@3.NOIJ2.12*/
    this._down = function (e) {
      /*@3.NOIJ2.27*/
      self._cr = null;
      /*@3.NOIJ2.13*/
      var mod = penMods(e);
      if (e.button > 0 && !mod) return;
      var verdict = self.classify(e);
      if (verdict === 'reject') { e.preventDefault(); return; }

      /*@3.NOIJ2.22*/
      if (!mod && (verdict === 'gesture' || self.mode() === 'pan')) {
        e.preventDefault();
        self.cancelProvisional();
        self.gest[e.pointerId] = Object.assign(self.gpt(e), { src: e.pointerType });
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        self.emitGesture('start');
        return;
      }

      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      var pt = self.local(e);
      var tr = { src: e.pointerType, pts: [], start: pt, last: pt,
                 committed: e.pointerType !== 'touch', moved: 0 };
      pt.p = self.effP(tr, pt, e);
      self.effTilt(tr, pt, e);
      tr.pts.push(pt);
      tr.mod = mod;
      tr.t0 = now();
      /*@3.NOIJ2.21*/
      tr.hold = !!mod;
      self.live[e.pointerId] = tr;
      if (!tr.hold) { tr.began = 1; self.onBegin(e.pointerId, pt, e.pointerType, null); }
      else if (contact(e, self.profile)) {
        tr.hold = false; tr.began = 1;
        self.onBegin(e.pointerId, pt, e.pointerType, penButtons()[mod]);
      }
    };

    this._move = function (e) {
      if (self.gest[e.pointerId]) {
        e.preventDefault();
        var g = self.gpt(e);
        self.gest[e.pointerId].x = g.x;
        self.gest[e.pointerId].y = g.y;
        self.gest[e.pointerId].cx = g.cx;
        self.gest[e.pointerId].cy = g.cy;
        self.emitGesture('move');
        return;
      }
      var tr = self.live[e.pointerId];
      if (!tr) return;
      e.preventDefault();

      var raw = self.points(e), out = [];
      for (var i = 0; i < raw.length; i++) {
        var p = self.local(raw[i]);
        p.cx = raw[i].clientX; p.cy = raw[i].clientY;
        var last = tr.pts[tr.pts.length - 1];
        if (last && Math.abs(p.x - last.x) < 0.35 && Math.abs(p.y - last.y) < 0.35) continue;
        p.p = self.effP(tr, p, raw[i]);
        self.effTilt(tr, p, raw[i]);
        tr.pts.push(p);
        out.push(p);
        tr.last = p;
      }
      if (!out.length) return;

      var dx = tr.last.x - tr.start.x, dy = tr.last.y - tr.start.y;
      tr.moved = Math.sqrt(dx * dx + dy * dy);
      if (!tr.committed && tr.moved >= COMMIT_PX) tr.committed = true;

      if (tr.hold) {
        if (!contact(e, self.profile)) return;
        tr.hold = false;
        tr.began = 1;
        tr.start = tr.last;
        self.onBegin(e.pointerId, tr.last, tr.src, penButtons()[tr.mod]);
      }
      self.onMove(e.pointerId, out, tr);
    };

    this._up = function (e) {
      self._cr = null;
      if (self.gest[e.pointerId]) {
        delete self.gest[e.pointerId];
        self.emitGesture(self.gestureCount() ? 'move' : 'end');
        return;
      }
      var tr = self.live[e.pointerId];
      if (!tr) return;
      delete self.live[e.pointerId];
      /*@3.NOIJ2.6*/
      var keep = !tr.hold && (tr.committed || tr.src !== 'touch');
      self.onEnd(e.pointerId, keep, tr);
      /*@3.NOIJ2.14*/
      if (tr.mod && self.onEndMod) {
        self.onEndMod({
          mod: tr.mod,
          act: penButtons()[tr.mod],
          moved: tr.moved || 0,
          held: now() - (tr.t0 || 0),
          tap: !tr.began
        });
      }
    };

    /*@3.NOIJ2.11*/
    this._ctx = function (e) { e.preventDefault(); };
    el.addEventListener('contextmenu', this._ctx);
    el.addEventListener('pointerdown', this._down);
    el.addEventListener('pointermove', this._move);
    el.addEventListener('pointerup', this._up);
    el.addEventListener('pointercancel', this._up);
    /*@3.NOIJ2.7*/
    el.addEventListener('lostpointercapture', this._up);
  };

  Router.prototype.emitGesture = function (phase) {
    var ids = Object.keys(this.gest);
    var pts = ids.map(function (k) { return this.gest[k]; }, this);
    if (!pts.length) { this.onGesture(phase, { n: 0 }); return; }
    if (pts.length === 1) {
      this.onGesture(phase, { n: 1, x: pts[0].x, y: pts[0].y,
                              cx: pts[0].cx, cy: pts[0].cy });
      return;
    }
    var a = pts[0], b = pts[1];
    var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y;
    this.onGesture(phase, { n: pts.length, x: cx, y: cy,
                            cx: ((a.cx || 0) + (b.cx || 0)) / 2,
                            cy: ((a.cy || 0) + (b.cy || 0)) / 2,
                            d: Math.sqrt(dx * dx + dy * dy) });
  };

  Router.prototype.destroy = function () {
    var el = this.el;
    el.removeEventListener('contextmenu', this._ctx);
    el.removeEventListener('pointerdown', this._down);
    el.removeEventListener('pointermove', this._move);
    el.removeEventListener('pointerup', this._up);
    el.removeEventListener('pointercancel', this._up);
    el.removeEventListener('lostpointercapture', this._up);
  };

  var SEEN = { tilt: 0 };

  window.GardenInkInput = {
    create: function (opts) { return new Router(opts); },
    tiltMode: tiltMode,
    setTiltMode: function (m) {
      _tilt = (m === 'off') ? 'off' : 'auto';
      try { localStorage.setItem(TILT_KEY, _tilt); } catch (e) {}
    },
    tiltSeen: function () { return !!SEEN.tilt; },
    readTilt: readTilt,
    tiltFromXY: norm2,
    Profile: Profile,
    palmMode: palmMode,
    setPalmMode: function (m) { try { localStorage.setItem(PALM_KEY, m); } catch (e) {} },
    penButtons: penButtons,
    setPenButtons: function (m) {
      var cur = penButtons();
      if (m && typeof m.barrel === 'string') cur.barrel = m.barrel;
      if (m && typeof m.tip === 'string') cur.tip = m.tip;
      if (m && typeof m.second === 'string') cur.second = m.second;
      try { localStorage.setItem(BTN_KEY, JSON.stringify(cur)); } catch (e) {}
      return cur;
    },
    penMods: penMods,
    mods: function (adapter) { return new Mods(adapter); },
    splitAct: splitAct,
    keys: keys,
    ring: ring,
    keyOf: keyOf,
    penKeys: penKeys,
    setPenKey: setPenKey,
    clearPenKey: clearPenKey,
    keyFor: keyFor,
    capture: capture,
    CONST: { MOUSE_TWIN_MS: MOUSE_TWIN_MS, COMMIT_PX: COMMIT_PX, PALM_AREA: PALM_AREA }
  };
})();
