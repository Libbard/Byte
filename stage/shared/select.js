/*@3.SELJ.1*/
;(function () {
  'use strict';

  /*@3.SELJ.2*/
  var SEARCH_MIN = 14;

  function finePointer() {
    return !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
  }
  var openOne = null;          /*@3.SELJ.3*/
  var uid = 0;

  function isAr() {
    return (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
  }
  function L(ar, en) { return isAr() ? ar : en; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /*@3.SELJ.4*/
  function readOptions(sel) {
    var out = [];
    for (var i = 0; i < sel.options.length; i++) {
      var o = sel.options[i];
      var grp = o.parentNode && o.parentNode.tagName === 'OPTGROUP'
        ? (o.parentNode.label || '') : '';
      out.push({
        value: o.value,
        label: o.textContent,
        disabled: !!o.disabled,
        group: grp,
        /*@3.SELJ.5*/
        meta: o.getAttribute('data-meta') || '',
        mono: o.hasAttribute('data-mono'),
        selected: o.selected,
        index: i
      });
    }
    return out;
  }

  function currentLabel(sel) {
    if (!sel.multiple) {
      var o = sel.options[sel.selectedIndex];
      return o ? o.textContent : '';
    }
    /*@3.SELJ.6*/
    var on = [];
    for (var i = 0; i < sel.options.length; i++) if (sel.options[i].selected) on.push(sel.options[i].textContent);
    /*@3.SELJ.7*/
    if (!on.length) {
      var pair = sel.getAttribute('data-gs-all-' + (isAr() ? 'ar' : 'en'));
      return pair || sel.getAttribute('data-gs-all') || L('الكل', 'All');
    }
    if (on.length === 1) return on[0];
    return on.length + ' ' + L('مختارة', 'selected');
  }

  /*@3.SELJ.8*/
  function Enhanced(sel) {
    this.sel = sel;
    this.id = 'gs' + (++uid);
    this.open = false;
    this.items = [];
    this.active = -1;
    this.build();
  }

  Enhanced.prototype.build = function () {
    var self = this, sel = this.sel;
    this.multi = !!sel.multiple;

    var wrap = document.createElement('div');
    wrap.className = 'gs';
    /*@3.SELJ.9*/
    if (sel.className) wrap.className += ' gs-of-' + sel.className.trim().split(/\s+/).join(' gs-of-');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gs-btn';
    btn.id = this.id + '-b';
    btn.setAttribute('role', 'combobox');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    /*@3.SELJ.10*/
    var ico = sel.getAttribute('data-gs-icon');
    btn.innerHTML = (ico ? '<i class="fa-solid ' + esc(ico) + ' gs-ico" aria-hidden="true"></i>' : '') +
      '<span class="gs-lbl"></span><i class="fa-solid fa-chevron-down gs-car" aria-hidden="true"></i>';

    /*@3.SELJ.11*/
    var lbl = sel.id ? document.querySelector('label[for="' + sel.id + '"]') : null;
    if (lbl) btn.setAttribute('aria-labelledby', (lbl.id || (lbl.id = this.id + '-l')) + ' ' + btn.id);
    else if (sel.getAttribute('aria-label')) btn.setAttribute('aria-label', sel.getAttribute('aria-label'));
    else if (sel.title) btn.setAttribute('aria-label', sel.title);
    /*@3.SELJ.49*/
    else if (sel.getAttribute('data-gs-name-ar')) {
      var nAr = sel.getAttribute('data-gs-name-ar');
      var nEn = sel.getAttribute('data-gs-name-en') || nAr;
      var isAr = (document.documentElement.lang || 'ar') === 'ar';
      btn.setAttribute('aria-label', isAr ? nAr : nEn);
      btn.setAttribute('data-ar-title', nAr);
      btn.setAttribute('data-en-title', nEn);
    }

    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(btn);
    wrap.appendChild(sel);
    sel.classList.add('gs-native');
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');

    this.wrap = wrap;
    this.btn = btn;

    btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); self.toggle(); });
    btn.addEventListener('keydown', function (e) { self.onBtnKey(e); });

    /*@3.SELJ.12*/
    if (window.MutationObserver) {
      this.mo = new MutationObserver(function () { self.sync(); });
      this.mo.observe(sel, { childList: true, subtree: true, attributes: true, attributeFilter: ['value', 'disabled'] });
    }
    /*@3.SELJ.13*/
    sel.addEventListener('change', function () { self.sync(); });

    this.sync();
  };

  /*@3.SELJ.14*/
  Enhanced.prototype.sync = function () {
    var sel = this.sel;
    var t = currentLabel(sel);
    var l = this.btn.querySelector('.gs-lbl');
    l.textContent = t;
    l.classList.toggle('is-empty', !t);
    this.btn.disabled = sel.disabled;
    this.wrap.classList.toggle('is-disabled', sel.disabled);
    /*@3.SELJ.15*/
    if (this.open && !this.multi) this.paint();
  };

  Enhanced.prototype.toggle = function () { this.open ? this.close() : this.opens(); };

  Enhanced.prototype.opens = function () {
    if (this.open || this.sel.disabled) return;
    if (openOne && openOne !== this) openOne.close();
    openOne = this;
    this.open = true;
    this.btn.setAttribute('aria-expanded', 'true');
    this.wrap.classList.add('is-open');

    var pop = document.createElement('div');
    pop.className = 'gs-pop';
    pop.id = this.id + '-p';
    pop.setAttribute('role', 'listbox');
    if (this.multi) pop.setAttribute('aria-multiselectable', 'true');
    /*@3.SELJ.16*/
    pop.setAttribute('dir', document.documentElement.getAttribute('dir') || 'rtl');
    /*@3.SELJ.38*/
    var host = (this.sel.closest && this.sel.closest('dialog[open]')) || document.body;
    host.appendChild(pop);
    this.pop = pop;

    this.items = readOptions(this.sel);
    this.query = '';
    /*@3.SELJ.17*/
    this.useSearch = this.items.length >= SEARCH_MIN &&
                     !(this.sel.closest && this.sel.closest('.sch-timepick'));
    this.active = this.sel.selectedIndex;
    this.paint();
    this.place();

    var self = this;
    this._onDoc = function (e) {
      var t = e && e.target;
      if (!(t instanceof Node)) return;
      if (!pop.contains(t) && !self.wrap.contains(t)) self.close();
    };
    this._onKey = function (e) { self.onPopKey(e); };
    /*@3.SELJ.18*/
    /*@3.SELJ.45*/
    /*@3.SELJ.48*/
    this._onScroll = function (e) {
      var t = e && e.target;
      if (t instanceof Node && t !== pop && pop.contains(t)) return;
      self.place();
    };
    document.addEventListener('mousedown', this._onDoc, true);
    document.addEventListener('keydown', this._onKey, true);
    window.addEventListener('scroll', this._onScroll, true);
    window.addEventListener('resize', this._onScroll);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this._onScroll);
      window.visualViewport.addEventListener('scroll', this._onScroll);
    }

    /*@3.SELJ.37*/
    if (this.useSearch && finePointer()) {
      var inp = pop.querySelector('.gs-search-i');
      if (inp) inp.focus();
    }
    this.scrollActiveIntoView();
  };

  Enhanced.prototype.close = function () {
    if (!this.open) return;
    this.open = false;
    this.btn.setAttribute('aria-expanded', 'false');
    this.btn.removeAttribute('aria-activedescendant');
    this.wrap.classList.remove('is-open');
    document.removeEventListener('mousedown', this._onDoc, true);
    document.removeEventListener('keydown', this._onKey, true);
    window.removeEventListener('scroll', this._onScroll, true);
    window.removeEventListener('resize', this._onScroll);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this._onScroll);
      window.visualViewport.removeEventListener('scroll', this._onScroll);
    }
    if (this.pop && this.pop.parentNode) this.pop.parentNode.removeChild(this.pop);
    this.pop = null;
    if (openOne === this) openOne = null;
  };

  /*@3.SELJ.19*/
  Enhanced.prototype.paint = function () {
    if (!this.pop) return;
    /*@3.SELJ.46*/
    this._ph = 0;
    var self = this;
    var q = (this.query || '').trim().toLowerCase();
    var shown = this.items.filter(function (it) {
      return !q || it.label.toLowerCase().indexOf(q) !== -1 ||
             String(it.value).toLowerCase().indexOf(q) !== -1;
    });

    var html = '';
    if (this.useSearch) {
      html += '<div class="gs-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
        '<input class="gs-search-i" type="text" autocomplete="off" spellcheck="false" ' +
        'placeholder="' + esc(L('ابحث…', 'Search…')) + '" value="' + esc(this.query || '') + '"></div>';
    }
    html += '<div class="gs-list">';
    if (!shown.length) {
      html += '<div class="gs-empty">' + esc(L('لا نتيجة', 'No match')) + '</div>';
    } else {
      var lastGroup = null;
      shown.forEach(function (it) {
        if (it.group !== lastGroup) {
          lastGroup = it.group;
          if (it.group) html += '<div class="gs-grp">' + esc(it.group) + '</div>';
        }
        var on = self.multi ? self.sel.options[it.index].selected : (it.index === self.sel.selectedIndex);
        var act = it.index === self.active;
        html += '<div class="gs-opt' + (on ? ' is-on' : '') + (act ? ' is-active' : '') +
          (it.disabled ? ' is-disabled' : '') + '" role="option" ' +
          'id="' + self.id + '-o' + it.index + '" ' +
          'aria-selected="' + (on ? 'true' : 'false') + '" ' +
          /*@3.SELJ.20*/
          'data-i="' + it.index + '">' +
          '<i class="fa-solid fa-check gs-opt-c" aria-hidden="true"></i>' +
          '<span class="gs-opt-t' + (it.mono ? ' is-mono' : '') + '">' + esc(it.label) + '</span>' +
          (it.meta ? '<span class="gs-opt-n">' + esc(it.meta) + '</span>' : '') + '</div>';
      });
    }
    html += '</div>';
    /*@3.SELJ.21*/
    if (this.foot) html += '<div class="gs-foot">' + this.foot + '</div>';
    this.pop.innerHTML = html;
    if (this.foot && this.footTap) {
      var fw = this.pop.querySelector('.gs-foot'), me = this;
      fw.addEventListener('mousedown', function (e) { e.preventDefault(); });
      fw.addEventListener('click', function (e) { me.footTap(e, me); });
    }

    this.pop.querySelectorAll('.gs-opt').forEach(function (el) {
      el.addEventListener('mousedown', function (e) { e.preventDefault(); });
      el.addEventListener('click', function () {
        if (el.classList.contains('is-disabled')) return;
        self.choose(Number(el.getAttribute('data-i')));
      });
      el.addEventListener('mousemove', function () {
        self.active = Number(el.getAttribute('data-i'));
        self.markActive();
      });
    });
    var inp = this.pop.querySelector('.gs-search-i');
    if (inp) {
      inp.addEventListener('input', function () {
        self.query = this.value;
        var vis = self.visibleIndexes();
        self.active = vis.length ? vis[0] : -1;
        self.paint();
        var again = self.pop.querySelector('.gs-search-i');
        if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
        self.place();
      });
    }
    this.markActive();
  };

  Enhanced.prototype.visibleIndexes = function () {
    if (!this.pop) return [];
    return [].map.call(this.pop.querySelectorAll('.gs-opt:not(.is-disabled)'), function (el) {
      return Number(el.getAttribute('data-i'));
    });
  };

  Enhanced.prototype.markActive = function () {
    if (!this.pop) return;
    var self = this;
    this.pop.querySelectorAll('.gs-opt').forEach(function (el) {
      var on = Number(el.getAttribute('data-i')) === self.active;
      el.classList.toggle('is-active', on);
      if (on) self.btn.setAttribute('aria-activedescendant', el.id);
    });
  };

  Enhanced.prototype.scrollActiveIntoView = function () {
    if (!this.pop) return;
    var el = this.pop.querySelector('.gs-opt.is-active') || this.pop.querySelector('.gs-opt.is-on');
    if (!el) return;
    var list = this.pop.querySelector('.gs-list');
    if (!list) return;
    var er = el.getBoundingClientRect(), lr = list.getBoundingClientRect();
    if (er.top < lr.top) list.scrollTop -= (lr.top - er.top);
    else if (er.bottom > lr.bottom) list.scrollTop += (er.bottom - lr.bottom);
  };

  Enhanced.prototype.choose = function (i) {
    var sel = this.sel;
    if (i < 0 || i >= sel.options.length) return;
    if (sel.options[i].disabled) return;

    /*@3.SELJ.22*/
    if (this.multi) {
      var on = !sel.options[i].selected;
      sel.options[i].selected = on;
      /*@3.SELJ.23*/
      var row = this.pop && this.pop.querySelector('.gs-opt[data-i="' + i + '"]');
      if (row) {
        row.classList.toggle('is-on', on);
        row.setAttribute('aria-selected', on ? 'true' : 'false');
      }
      this.active = i;
      this.markActive();
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      /*@3.SELJ.24*/
      var l = this.btn.querySelector('.gs-lbl');
      var txt = currentLabel(sel);
      l.textContent = txt;
      l.classList.toggle('is-empty', !txt);
      return;
    }

    if (sel.selectedIndex !== i) {
      sel.selectedIndex = i;
      /*@3.SELJ.25*/
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    this.sync();
    this.close();
    this.btn.focus();
  };

  /*@3.SELJ.26*/
  /*@3.SELJ.36*/
  Enhanced.prototype.place = function () {
    if (!this.pop) return;
    var r = this.btn.getBoundingClientRect();
    var vv = window.visualViewport;
    var vh = (vv && vv.height) ? vv.height : window.innerHeight;
    var vw = (vv && vv.width) ? vv.width : window.innerWidth;

    if (!document.body.contains(this.btn) ||
        (r.width === 0 && r.height === 0) ||
        r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) {
      this.close();
      return;
    }

    var pop = this.pop;

    /*@3.SELJ.39*/
    var host = pop.parentNode;
    var hr = (host && host.tagName === 'DIALOG') ? host.getBoundingClientRect() : null;
    var padT = hr ? Math.max(8, hr.top + 8) : 8;
    var padB = hr ? Math.min(vh - 8, hr.bottom - 8) : (vh - 8);
    var padL = hr ? Math.max(8, hr.left + 8) : 8;
    var padR = hr ? Math.min(vw - 8, hr.right - 8) : (vw - 8);

    pop.style.minWidth = Math.round(r.width) + 'px';
    pop.style.maxWidth = Math.round(Math.min(padR - padL, Math.max(r.width, 340))) + 'px';

    /*@3.SELJ.41*/
    /*@3.SELJ.43*/
    var probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;top:0;left:0;width:100px;height:100px;visibility:hidden;pointer-events:none';
    (host || document.body).appendChild(probe);
    var pb = probe.getBoundingClientRect();
    /*@3.SELJ.47*/
    var ox = pb.left, oy = pb.top;
    var sx = pb.width / 100 || 1, sy = pb.height / 100 || 1;
    probe.parentNode.removeChild(probe);

    /*@3.SELJ.44*/
    if (!this._ph) {
      var keep = pop.style.maxHeight;
      pop.style.maxHeight = 'none';
      this._ph = pop.getBoundingClientRect().height;
      pop.style.maxHeight = keep;
    }
    var ph = this._ph, w = pop.getBoundingClientRect().width;

    /*@3.SELJ.40*/
    var CAP = 320;
    var below = padB - r.bottom - 4, above = r.top - padT - 4;
    var flip = below < Math.min(ph, 180) && above > below;
    var room = Math.max(120, Math.min(CAP, flip ? above : below));
    var top = flip ? (r.top - Math.min(ph, room) - 4) : (r.bottom + 4);
    top = Math.max(padT, Math.min(top, padB - Math.min(ph, room)));
    pop.classList.toggle('is-up', flip);
    pop.style.maxHeight = Math.round(room) + 'px';

    /*@3.SELJ.28*/
    var rtl = (document.documentElement.getAttribute('dir') || 'rtl') === 'rtl';
    var left = rtl ? (r.right - w) : r.left;
    left = Math.max(padL, Math.min(left, padR - w));

    /*@3.SELJ.42*/
    pop.style.top = Math.round((top - oy) / sy) + 'px';
    pop.style.left = Math.round((left - ox) / sx) + 'px';
  };

  /*@3.SELJ.29*/
  Enhanced.prototype.onBtnKey = function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.opens();
    }
  };

  Enhanced.prototype.onPopKey = function (e) {
    if (!this.open) return;
    var vis = this.visibleIndexes();
    var at = vis.indexOf(this.active);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); this.btn.focus(); return; }
    if (e.key === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      if (this.active >= 0) this.choose(this.active);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation();
      if (!vis.length) return;
      if (at === -1) at = e.key === 'ArrowDown' ? -1 : vis.length;
      var next = e.key === 'ArrowDown' ? at + 1 : at - 1;
      if (next < 0) next = vis.length - 1;
      if (next >= vis.length) next = 0;
      this.active = vis[next];
      this.markActive();
      this.scrollActiveIntoView();
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      if (!vis.length) return;
      e.preventDefault();
      this.active = e.key === 'Home' ? vis[0] : vis[vis.length - 1];
      this.markActive(); this.scrollActiveIntoView();
      return;
    }
    if (e.key === 'Tab') { this.close(); }
  };

  /*@3.SELJ.30*/
  var SEL = 'select.sch-select, select.gs-me, .sch-timepick select, select[data-gs]';

  function enhance(root) {
    var scope = root || document;
    var list = scope.querySelectorAll ? scope.querySelectorAll(SEL) : [];
    [].forEach.call(list, function (sel) {
      if (sel.__gs) return;                       /*@3.SELJ.31*/
      sel.__gs = new Enhanced(sel);
    });
  }

  /*@3.SELJ.32*/
  function sync(root) {
    var scope = root || document;
    [].forEach.call(scope.querySelectorAll ? scope.querySelectorAll(SEL) : [], function (sel) {
      if (sel.__gs) sel.__gs.sync();
    });
  }

  function closeAll() { if (openOne) openOne.close(); }

  /*@3.SELJ.33*/
  function foot(sel, html, onTap) {
    var el = (typeof sel === 'string') ? document.querySelector(sel) : sel;
    if (!el || !el.__gs) return null;
    el.__gs.foot = html || '';
    el.__gs.footTap = onTap || null;
    if (el.__gs.open) el.__gs.paint();
    return el.__gs;
  }
  /*@3.SELJ.34*/
  function footPaint(sel) {
    var el = (typeof sel === 'string') ? document.querySelector(sel) : sel;
    if (el && el.__gs && el.__gs.open) el.__gs.paint();
  }

  window.GardenSelect = { enhance: enhance, sync: sync, closeAll: closeAll,
                          foot: foot, footPaint: footPaint };

  /*@3.SELJ.35*/
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhance(document); });
  } else {
    enhance(document);
  }
  document.addEventListener('garden:languageChanged', function () { sync(document); });
})();
