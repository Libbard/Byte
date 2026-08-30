/*@3.SCDJ.1*/
;(function () {
  'use strict';
  if (window.GardenSchedDrag) return;

  var HOLD_MS = 380;      /*@3.SCDJ.2*/
  var MOVE_PX = 4;        /*@3.SCDJ.3*/
  var SLIP_PX = 8;        /*@3.SCDJ.4*/
  var TAP_PX = 6;

  function noMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  function enable(cfg) {
    var root = cfg.root;
    if (!root || root._sdrOn) return;
    root._sdrOn = true;

    var S = null;   /*@3.SCDJ.5*/

    function cardOf(t) {
      if (t && t.nodeType !== 1) t = t.parentElement;
      if (!t || !t.closest) return null;
      return t.closest(cfg.cardSel);
    }

    function colUnder(x, y) {
      var els = document.elementsFromPoint(x, y) || [];
      for (var i = 0; i < els.length; i++) {
        var c = els[i].closest ? els[i].closest(cfg.colSel) : null;
        if (c && root.contains(c)) return c;
      }
      return null;
    }

    function clear() {
      if (!S) return;
      if (S.hold) { clearTimeout(S.hold); S.hold = null; }
      if (S.el) {
        S.el.classList.remove('sch-dragging');
        S.el.style.transform = '';
        S.el.style.touchAction = '';
        try { S.el.releasePointerCapture(S.id); } catch (e) {}
      }
      if (S.ghost && S.ghost.parentNode) S.ghost.parentNode.removeChild(S.ghost);
      document.documentElement.classList.remove('sch-drag-on');
      S = null;
    }

    function arm() {
      if (!S || S.armed) return;
      S.armed = true;
      S.el.classList.add('sch-dragging');
      /*@3.SCDJ.6*/
      S.el.style.touchAction = 'none';
      try { S.el.setPointerCapture(S.id); } catch (e) {}
      document.documentElement.classList.add('sch-drag-on');
      if (window.navigator && navigator.vibrate && S.touch) {
        try { navigator.vibrate(8); } catch (e) {}
      }
      S.ghost = document.createElement('div');
      S.ghost.className = 'sch-drag-tip';
      S.ghost.setAttribute('aria-hidden', 'true');
      root.appendChild(S.ghost);
      paint(S.lastX, S.lastY);
    }

    /*@3.SCDJ.7*/
    function propose(x, y) {
      var col = colUnder(x, y) || S.col;
      var box = col.getBoundingClientRect();
      var yIn = y - box.top - S.grabY;
      var raw = cfg.minAt(Math.max(0, yIn));
      var snap = cfg.snap || 5;
      var min = Math.round(raw / snap) * snap;
      var span = S.span;
      var dayEnd = (cfg.endH != null ? cfg.endH : 24) * 60;
      var dayStart = (cfg.startH != null ? cfg.startH : 0) * 60;
      if (min < dayStart) min = dayStart;
      if (min + span > dayEnd) min = dayEnd - span;
      return { col: col, date: col.getAttribute('data-date'), min: min };
    }

    function paint(x, y) {
      var p = propose(x, y);
      S.prop = p;
      var box = p.col.getBoundingClientRect();
      var home = S.homeBox;
      var ty = box.top + cfg.yFor(p.min) - home.top;
      var tx = box.left - home.left;
      S.el.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
      if (S.ghost) {
        /*@3.SCDJ.11*/
        S.ghost.textContent = cfg.label(p.min, p.min + S.span, p.date);
        var g = root.getBoundingClientRect();
        var gw = S.ghost.offsetWidth || 90, gh = S.ghost.offsetHeight || 22;
        var lx = x - g.left + root.scrollLeft - gw / 2;
        var ly = y - g.top + root.scrollTop - gh - 14;
        var maxX = Math.max(0, root.scrollWidth - gw - 2);
        var maxY = Math.max(0, root.scrollHeight - gh - 2);
        S.ghost.style.left = Math.max(2, Math.min(lx, maxX)) + 'px';
        S.ghost.style.top = Math.max(2, Math.min(ly, maxY)) + 'px';
      }
    }

    root.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      if (S) clear();
      var el = cardOf(e.target);
      if (!el) return;
      /*@3.SCDJ.8*/
      if (e.target.closest && e.target.closest('button, a, input, select')) return;
      if (cfg.canDrag && !cfg.canDrag(el)) return;
      var col = el.closest(cfg.colSel);
      if (!col) return;

      var box = el.getBoundingClientRect();
      S = {
        el: el, col: col, id: e.pointerId,
        touch: e.pointerType !== 'mouse',
        startX: e.clientX, startY: e.clientY,
        lastX: e.clientX, lastY: e.clientY,
        lastMoveX: e.clientX, lastMoveY: e.clientY, scrolling: false,
        grabY: e.clientY - box.top,
        homeBox: box,
        span: cfg.spanOf(el),
        armed: false, moved: false, hold: null,
      };
      if (S.span == null) { S = null; return; }

      if (S.touch) {
        /*@3.SCDJ.12*/
        S.hold = setTimeout(function () { if (S) arm(); }, HOLD_MS);
      }
    });

    /*@3.SCDJ.13*/
    root.addEventListener('contextmenu', function (e) {
      if (!cfg.onMenu) return;
      var el = cardOf(e.target);
      e.preventDefault();
      if (S) clear();
      cfg.onMenu({ el: el || null, x: e.clientX, y: e.clientY, touch: false });
    });

    root.addEventListener('pointermove', function (e) {
      if (!S || e.pointerId !== S.id) return;
      S.lastX = e.clientX; S.lastY = e.clientY;
      var dx = e.clientX - S.startX, dy = e.clientY - S.startY;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (!S.armed) {
        if (S.touch) {
          /*@3.SCDJ.9*/
          if (dist > SLIP_PX) {
            S.scrolling = true;
            if (S.hold) { clearTimeout(S.hold); S.hold = null; }
          }
          if (S.scrolling) {
            var dy = e.clientY - S.lastMoveY, dx2 = e.clientX - S.lastMoveX;
            S.lastMoveY = e.clientY; S.lastMoveX = e.clientX;
            var sc = cfg.scroller ? cfg.scroller() : root;
            if (sc) { sc.scrollTop -= dy; sc.scrollLeft -= dx2; }
          }
          return;
        }
        if (dist > MOVE_PX) arm(); else return;
      }
      S.moved = true;
      e.preventDefault();
      paint(e.clientX, e.clientY);
    }, { passive: false });

    function drop(e) {
      if (!S || e.pointerId !== S.id) return;
      var st = S;
      var far = Math.abs(e.clientX - st.startX) + Math.abs(e.clientY - st.startY);
      if (st.armed && st.touch && far <= TAP_PX) {
        clear();
        if (cfg.onMenu) cfg.onMenu({ el: st.el, x: e.clientX, y: e.clientY, touch: true });
        return;
      }
      if (!st.armed || !st.moved || !st.prop) { clear(); return; }
      var p = st.prop;
      clear();
      /*@3.SCDJ.10*/
      cfg.onDrop({ el: st.el, date: p.date, startMin: p.min, span: st.span });
    }

    root.addEventListener('pointerup', drop);
    root.addEventListener('pointercancel', function () { clear(); });

    document.addEventListener('keydown', function (e) {
      if (S && e.key === 'Escape') { e.preventDefault(); clear(); }
    }, true);
  }

  /*@3.SCDJ.14*/
  function moveMode(cfg, el, onDone) {
    var root = cfg.root;
    if (!root || !el) return null;
    var span = cfg.spanOf(el);
    if (span == null) return null;
    document.documentElement.classList.add('sch-move-on');
    el.classList.add('sch-move-src');

    function pickAt(x, y) {
      var els = document.elementsFromPoint(x, y) || [];
      var col = null;
      for (var i = 0; i < els.length; i++) {
        var c = els[i].closest ? els[i].closest(cfg.colSel) : null;
        if (c && root.contains(c)) { col = c; break; }
      }
      if (!col) return null;
      var box = col.getBoundingClientRect();
      var snap = cfg.snap || 5;
      var min = Math.round(cfg.minAt(Math.max(0, y - box.top)) / snap) * snap;
      var dayEnd = (cfg.endH != null ? cfg.endH : 24) * 60;
      var dayStart = (cfg.startH != null ? cfg.startH : 0) * 60;
      if (min < dayStart) min = dayStart;
      if (min + span > dayEnd) min = dayEnd - span;
      return { date: col.getAttribute('data-date'), min: min };
    }

    function stop() {
      document.documentElement.classList.remove('sch-move-on');
      el.classList.remove('sch-move-src');
      root.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
    }
    function onClick(e) {
      e.preventDefault(); e.stopPropagation();
      var p = pickAt(e.clientX, e.clientY);
      stop();
      if (p) onDone({ el: el, date: p.date, startMin: p.min, span: span });
      else onDone(null);
    }
    function onKey(e) {
      if (e.key !== 'Escape') return;
      e.preventDefault(); stop(); onDone(null);
    }
    root.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
    return stop;
  }

  /*@3.SCDJ.15*/
  function holdMenu(root, onMenu) {
    if (!root || root._sdhOn) return;
    root._sdhOn = true;
    var H = null;

    function kill() {
      if (!H) return;
      if (H.t) clearTimeout(H.t);
      H = null;
    }

    root.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      kill();
      onMenu({ el: null, x: e.clientX, y: e.clientY, touch: false });
    });

    root.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch' || e.isPrimary === false) return;
      kill();
      H = { id: e.pointerId, x: e.clientX, y: e.clientY, fired: false, t: null };
      H.t = setTimeout(function () {
        if (!H) return;
        H.fired = true; H.t = null;
        onMenu({ el: null, x: H.x, y: H.y, touch: true });
      }, HOLD_MS);
    }, { passive: true });

    root.addEventListener('pointermove', function (e) {
      if (!H || e.pointerId !== H.id) return;
      if (Math.abs(e.clientX - H.x) + Math.abs(e.clientY - H.y) > SLIP_PX) kill();
    }, { passive: true });

    root.addEventListener('click', function (e) {
      if (!root._sdhAte) return;
      root._sdhAte = false;
      e.preventDefault(); e.stopPropagation();
    }, true);

    function up(e) {
      if (!H || e.pointerId !== H.id) return;
      if (H.fired) root._sdhAte = true;
      kill();
    }
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', function () { kill(); });
  }

  window.GardenSchedDrag = { enable: enable, noMotion: noMotion, moveMode: moveMode, holdMenu: holdMenu };
})();
