/* Vista Forgy — ui-core.js (DOM helper, router, toast, modal, count-up, partikel, ikon, visual soal) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var UI = (VF.UI = VF.UI || {});

  UI.$ = function (sel, root) { return (root || document).querySelector(sel); };
  UI.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  UI.esc = VF.escapeHtml;
  UI.latex = VF.latex;

  UI.el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };

  /* ---------- ikon (inline SVG, stroke konsisten) ---------- */
  var ICONS = {
    home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
    map: 'M9 3 3 5v16l6-2 6 2 6-2V3l-6 2zM9 3v16M15 5v16',
    stats: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
    data: 'M12 3c4.4 0 8 1.3 8 3v12c0 1.7-3.6 3-8 3s-8-1.3-8-3V6c0-1.7 3.6-3 8-3zM4 6c0 1.7 3.6 3 8 3s8-1.3 8-3M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    flame: 'M12 2c1 4-4 5.5-4 10a4 4 0 0 0 8 0c0-1.5-.6-2.6-1.4-3.6.2 1.7-.6 2.6-1.6 2.6.8-2.5-.4-5-1-9z',
    zap: 'M13 2 4 14h6l-1 8 9-12h-6z',
    lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z',
    check: 'M4 12l5 5L20 6',
    x: 'M6 6l12 12M18 6 6 18',
    award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8 14l-1 8 5-3 5 3-1-8',
    play: 'M6 4l14 8-14 8z',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    download: 'M12 3v12m0 0 4-4m-4 4-4-4M4 21h16',
    upload: 'M12 21V9m0 0 4 4M12 9 8 13M4 3h16',
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8h.01M11 12h1v4h1',
    alert: 'M12 3 2 20h20zM12 9v5m0 3h.01',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    book: 'M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4zM20 4h-4a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z',
    shield: 'M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3'
  };
  UI.icon = function (name, size) {
    size = size || 20;
    return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + (ICONS[name] || ICONS.info) + '"/></svg>';
  };

  /* ---------- router (hash) ---------- */
  var routes = {};
  UI.route = function (path, fn) { routes[path] = fn; };
  UI.nav = function (path) { location.hash = '#/' + path; };
  UI.render = function () {
    var path = (location.hash || '#/home').replace('#/', '').split('?')[0] || 'home';
    try { document.documentElement.classList.toggle('route-run', path === 'run'); } catch (e) {}
    var fn = routes[path] || routes['home'];
    VF.currentPath = path;
    fn();
    UI.syncNav(path);
  };
  UI.syncNav = function (path) {
    UI.$$('.nav-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-path') === path);
    });
  };

  /* ---------- toast ---------- */
  UI.toast = function (msg, kind, ms) {
    var host = UI.$('#toasts');
    if (!host) return;
    var t = UI.el('div', 'toast ' + (kind || ''), msg);
    host.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 350); }, ms || 2600);
  };

  /* ---------- modal ---------- */
  UI.modal = function (html, cls, opts) {
    var ov = UI.el('div', 'modal-ov');
    var box = UI.el('div', 'modal ' + (cls || ''), html);
    var xbtn = UI.el('button', 'modal-x', '&times;');
    xbtn.type = 'button';
    xbtn.setAttribute('aria-label', 'Tutup');
    xbtn.addEventListener('click', function () { close(); });
    box.appendChild(xbtn);
    ov.appendChild(box);
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('show'); });
    function close() {
      ov.classList.remove('show');
      setTimeout(function () { ov.remove(); }, 250);
      document.removeEventListener('keydown', onKey);
      if (opts && opts.onClose) { try { opts.onClose(); } catch (e) {} }
    }
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    return { close: close, box: box };
  };

  /* ---------- dropdown custom (animasi + keyboard) ---------- */
  UI.dropdown = function (host, opts) {
    opts = opts || {};
    var items = opts.items || [];            // [{v, label}]
    var value = opts.value !== undefined ? opts.value : (items[0] && items[0].v);
    host.innerHTML = '';
    var btn = UI.el('button', 'dd-btn', '<span class="dd-val"></span><svg class="ic dd-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', (opts.aria ? opts.aria + ': ' : '') + labelOf(value));
    var list = UI.el('div', 'dd-list');
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', (opts.aria || 'Pilihan') + ' — daftar opsi');
    var ics = items.map(function (it) {
      var o = UI.el('button', 'dd-opt' + (it.v === value ? ' sel' : ''), UI.esc(it.label));
      o.type = 'button';
      o.setAttribute('role', 'option');
      o.setAttribute('aria-selected', it.v === value ? 'true' : 'false');
      o.dataset.v = it.v;
      list.appendChild(o);
      return o;
    });
    host.appendChild(btn); host.appendChild(list);
    var open = false, hi = -1;
    function labelOf(v) { var f = items.filter(function (i2) { return String(i2.v) === String(v); })[0]; return f ? f.label : String(v); }
    function sync() {
      btn.querySelector('.dd-val').textContent = labelOf(value);
      btn.setAttribute('aria-label', (opts.aria ? opts.aria + ': ' : '') + labelOf(value));
    }
    function setOpen(o) {
      open = o;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      host.classList.toggle('open', open);
      if (open) {
        hi = -1;
        // popover flip: kalau ruang di bawah sempit (kartu pendek / dekat dasar layar), buka ke ATAS
        try {
          var r = btn.getBoundingClientRect();
          var spaceBelow = window.innerHeight - r.bottom;
          host.classList.toggle('up', spaceBelow < 190);
        } catch (e) {}
      }
    }
    function choose(v) {
      value = v;
      sync();
      ics.forEach(function (o) {
        var sel = String(o.dataset.v) === String(value);
        o.classList.toggle('sel', sel);
        o.setAttribute('aria-selected', sel ? 'true' : 'false');
      });
      setOpen(false);
      if (opts.onChange) opts.onChange(value);
    }
    btn.addEventListener('click', function () { setOpen(!open); });
    ics.forEach(function (o) { o.addEventListener('click', function () { choose(o.dataset.v); }); });
    document.addEventListener('click', function (e) { if (!host.contains(e.target)) setOpen(false); });
    host.addEventListener('keydown', function (e) {
      if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) { e.preventDefault(); setOpen(true); return; }
      if (!open) return;
      if (e.key === 'Escape') { setOpen(false); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        hi = e.key === 'ArrowDown' ? Math.min(ics.length - 1, hi + 1) : Math.max(0, hi - 1);
        ics.forEach(function (o, i2) { o.classList.toggle('hi', i2 === hi); });
      } else if (e.key === 'Enter' && hi >= 0) { e.preventDefault(); choose(ics[hi].dataset.v); }
    });
    sync();
    return { get value() { return value; }, set: choose };
  };

  /* ---------- count-up ---------- */
  UI.countUp = function (el, target, suffix, dur) {
    dur = dur || 700;
    if (VF.reduceMotion()) { el.textContent = target + (suffix || ''); return; }
    var t0 = performance.now(), from = 0;
    function frame(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * e) + (suffix || '');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  /* ---------- partikel percikan las ---------- */
  var pcv = null, pctx = null, parts = [];
  function ensureCanvas() {
    if (pcv) return true;
    pcv = document.getElementById('particles');
    if (!pcv) return false;
    pctx = pcv.getContext('2d');
    return true;
  }
  UI.burst = function (x, y, color) {
    if (VF.reduceMotion() || !ensureCanvas()) return;
    for (var i = 0; i < 26; i++) {
      var a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 5;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 1, color: color || (Math.random() < 0.5 ? '#55E6C1' : '#F5BD67') });
    }
    if (!UI._prunning) { UI._prunning = true; requestAnimationFrame(pframe); }
  };
  function pframe() {
    if (!pctx) { UI._prunning = false; return; }
    pctx.clearRect(0, 0, pcv.width, pcv.height);
    parts = parts.filter(function (p) { return p.life > 0; });
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.025;
      pctx.globalAlpha = Math.max(0, p.life);
      pctx.fillStyle = p.color;
      pctx.fillRect(p.x - 2, p.y - 2, 3.5, 3.5);
    });
    pctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(pframe); else { UI._prunning = false; pctx.clearRect(0, 0, pcv.width, pcv.height); }
  }

  /* ---------- timer ring ---------- */
  UI.ring = function (pct, size, stroke, cls) {
    size = size || 44; stroke = stroke || 4;
    var r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return '<svg class="ring ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" class="c-grid" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="currentColor" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - Math.max(0, Math.min(1, pct)))) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg>';
  };

  /* ---------- heatmap ---------- */
  UI.heatmap = function (dailyLog, weeks) {
    weeks = weeks || 12;
    var byDate = {};
    (dailyLog || []).forEach(function (d) { byDate[d.date] = d.questions; });
    var today = new Date();
    var cells = '';
    var total = weeks * 7;
    for (var i = total - 1; i >= 0; i--) {
      var dt = new Date(today.getTime() - i * 24 * 3600 * 1000);
      var key = VF.todayStr(dt);
      var q = byDate[key] || 0;
      var lvl = q === 0 ? 0 : q < 10 ? 1 : q < 25 ? 2 : q < 50 ? 3 : 4;
      cells += '<span class="hm-cell lvl' + lvl + '" title="' + key + ': ' + q + ' soal"></span>';
    }
    return '<div class="heatmap">' + cells + '</div>' +
      '<div class="hm-legend"><span>dikit</span>' +
      [0, 1, 2, 3, 4].map(function (l) { return '<span class="hm-cell lvl' + l + '"></span>'; }).join('') +
      '<span>banyak</span></div>';
  };

  /* ---------- visual soal ---------- */
  UI.renderVisual = function (spec) {
    if (!spec) return '';
    var h = '<div class="qvisual"><div class="qvisual-cap">' + UI.esc(spec.caption || '') + '</div>';
    if (spec.type === 'table') {
      h += '<table class="datatable"><thead><tr>' + spec.head.map(function (x) { return '<th>' + UI.esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>';
      spec.rows.forEach(function (r) { h += '<tr>' + r.map(function (c) { return '<td>' + UI.esc(c) + '</td>'; }).join('') + '</tr>'; });
      h += '</tbody></table>';
    } else if (spec.type === 'bars' || spec.type === 'bars2') {
      var vals = spec.type === 'bars' ? [spec.values] : [spec.valuesA, spec.valuesB];
      var max = Math.max.apply(null, vals.reduce(function (a, v) { return a.concat(v); }, [1]));
      vals.forEach(function (series, si) {
        h += '<div class="barchart">' + series.map(function (v, i) {
          return '<div class="barcol"><div class="barwrap"><div class="bar b' + si + '" style="height:' + Math.round(v / max * 100) + '%"><span>' + v + '</span></div></div><span class="barlabel">' + UI.esc(spec.labels[i]) + '</span></div>';
        }).join('') + '</div>' + (spec.type === 'bars2' && si === 0 ? '<div class="legend"><span class="dot d0"></span>Lini A <span class="dot d1"></span>Lini B</div>' : '');
      });
    } else if (spec.type === 'line') {
      var pts = [];
      for (var x = spec.xFrom; x <= spec.xTo; x++) pts.push([x, spec.m * x + spec.c]);
      h += lineSvg([pts], spec.caption);
    } else if (spec.type === 'parabola') {
      var pp = [];
      for (var px = -6; px <= 6; px += 0.5) pp.push([px, px * px + spec.b * px + spec.c]);
      h += lineSvg([pp], spec.caption);
    } else if (spec.type === 'box') {
      var min = spec.min, max = spec.max;
      var range = max - min || 1;
      var L = function (v) { return 8 + (v - min) / range * 84; };
      h += '<svg viewBox="0 0 100 42" class="boxplot"><line x1="' + L(min) + '" y1="21" x2="' + L(max) + '" y2="21" stroke="#94A3B8" stroke-width="1"/>' +
        '<line x1="' + L(min) + '" y1="14" x2="' + L(min) + '" y2="28" stroke="#94A3B8"/>' +
        '<line x1="' + L(max) + '" y1="14" x2="' + L(max) + '" y2="28" stroke="#94A3B8"/>' +
        '<rect x="' + L(spec.q1) + '" y="12" width="' + (L(spec.q3) - L(spec.q1)) + '" height="18" rx="3" fill="rgba(126,167,255,0.18)" stroke="#7EA7FF" stroke-width="1.4"/>' +
        '<line x1="' + L(spec.med) + '" y1="12" x2="' + L(spec.med) + '" y2="30" stroke="#55E6C1" stroke-width="2.4"/>' +
        '<text x="' + L(spec.min) + '" y="38" text-anchor="middle" font-size="5" fill="#94A3B8">' + min + '</text>' +
        '<text x="' + L(spec.med) + '" y="38" text-anchor="middle" font-size="5" fill="#55E6C1">' + spec.med + '</text>' +
        '<text x="' + L(spec.max) + '" y="38" text-anchor="middle" font-size="5" fill="#94A3B8">' + max + '</text></svg>';
    } else if (spec.type === 'queue') {
      h += '<div class="queueviz" data-lam="' + spec.lam + '" data-mu="' + spec.mu + '">' +
        '<div class="q-arrive"></div><div class="q-wait"></div>' +
        '<div class="q-server"><span class="q-icon">⚙</span></div><div class="q-done"></div></div>' +
        '<div class="legend">🚶 datang → antre → ⚙ dilayani ✓ &nbsp;·&nbsp; <button class="mini-btn q-toggle" type="button">jeda</button></div>';
    } else if (spec.type === 'lp') {
      h += lpSvg(spec);
    } else if (spec.type === 'pert') {
      h += pertSvg(spec);
    } else if (spec.type === 'graph') {
      h += graphSvg(spec);
    } else if (spec.type === 'spc') {
      h += spcSvg(spec);
    } else if (spec.type === 'eoq') {
      h += eoqSvg(spec);
    }
    return h + '</div>';
  };

  /* ---------- LP: daerah layak + garis tujuan (slider) ---------- */
  function hull(pts) {
    var p = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var cross = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); };
    var lower = [], upper = [];
    p.forEach(function (pt) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop(); lower.push(pt); });
    p.reverse().forEach(function (pt) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop(); upper.push(pt); });
    lower.pop(); upper.pop();
    return lower.concat(upper);
  }
  function lpSvg(spec) {
    var W = 340, H = 210, P = 34;
    var xmax = 0, ymax = 0;
    spec.verts.forEach(function (v) { xmax = Math.max(xmax, v[0]); ymax = Math.max(ymax, v[1]); });
    xmax *= 1.1; ymax *= 1.1;
    var X = function (x) { return P + x / xmax * (W - 2 * P); };
    var Y = function (y) { return H - P - y / ymax * (H - 2 * P); };
    var hp = hull(spec.verts);
    var poly = hp.map(function (v) { return X(v[0]).toFixed(1) + ',' + Y(v[1]).toFixed(1); }).join(' ');
    var lines = '';
    spec.cons.forEach(function (c, i) {
      lines += '<line x1="' + X(c.r / c.a).toFixed(1) + '" y1="' + Y(0) + '" x2="' + X(0) + '" y2="' + Y(c.r / c.b).toFixed(1) + '" stroke="rgba(147,160,180,.55)" stroke-width="1.3" stroke-dasharray="5 4"/>' +
        '<text x="' + (X(c.r / c.a) - 4) + '" y="' + (Y(0) + 12) + '" text-anchor="end" font-size="7.5" fill="#94A3B8">C' + (i + 1) + '</text>';
    });
    var dots = spec.verts.map(function (v) {
      return '<circle cx="' + X(v[0]).toFixed(1) + '" cy="' + Y(v[1]).toFixed(1) + '" r="3.4" fill="#7EA7FF" stroke="#0B1220" stroke-width="1"/>' +
        '<text x="' + (X(v[0]) + 5) + '" y="' + (Y(v[1]) - 5) + '" font-size="7" fill="#94A3B8">(' + String(Math.round(v[0] * 10) / 10).replace('.', ',') + ',' + String(Math.round(v[1] * 10) / 10).replace('.', ',') + ')</text>';
    }).join('');
    var z0 = Math.round(spec.zmax * 0.6 * 10) / 10;
    var uid = 'lpz' + Math.floor(Math.random() * 99999);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="linesvg">' +
      '<polygon points="' + poly + '" fill="rgba(126,167,255,0.13)" stroke="#7EA7FF" stroke-width="1.4"/>' + lines +
      '<line id="' + uid + '" x1="' + X(z0 / spec.obj[0]).toFixed(1) + '" y1="' + Y(0).toFixed(1) + '" x2="' + X(0).toFixed(1) + '" y2="' + Y(z0 / spec.obj[1]).toFixed(1) + '" stroke="#55E6C1" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="' + P + '" y1="' + (H - P) + '" x2="' + (W - P) + '" y2="' + (H - P) + '" class="c-axis"/>' +
      '<line x1="' + P + '" y1="' + P + '" x2="' + P + '" y2="' + (H - P) + '" class="c-axis"/>' + dots + '</svg>' +
      '<div class="lp-slider"><span class="muted small">geser garis tujuan:</span>' +
      '<input aria-label="Garis tujuan Z" type="range" min="0" max="' + (spec.zmax * 1.15).toFixed(1) + '" value="' + z0 + '" step="0.5" data-lpuid="' + uid + '" data-obj1="' + spec.obj[0] + '" data-obj2="' + spec.obj[1] + '" data-xmax="' + xmax + '" data-ymax="' + ymax + '" data-w="' + W + '" data-h="' + H + '" data-p="' + P + '">' +
      '<b class="lp-z" data-zfor="' + uid + '">Z = ' + String(z0).replace('.', ',') + '</b></div>';
  }

  /* ---------- PERT network ---------- */
  function pertSvg(spec) {
    var W = 340, H = 240;
    var X = function (x) { return 30 + x / 320 * (W - 60); };
    var Y = function (y) { return 20 + y / 210 * (H - 50); };
    var edges = '';
    spec.acts.forEach(function (a) {
      var crit = spec.crit.indexOf(a.id) >= 0;
      var x1 = X(spec.pos[a.from][0]), y1 = Y(spec.pos[a.from][1]), x2 = X(spec.pos[a.to][0]), y2 = Y(spec.pos[a.to][1]);
      edges += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + (crit ? '#55E6C1' : 'rgba(147,160,180,.5)') + '" stroke-width="' + (crit ? 3 : 1.6) + '"/>' +
        '<text x="' + ((x1 + x2) / 2 + 4).toFixed(1) + '" y="' + ((y1 + y2) / 2 - 4).toFixed(1) + '" font-size="10" fill="' + (crit ? '#55E6C1' : '#94A3B8') + '">' + a.id + '=' + a.d + '</text>';
    });
    var nodes = '';
    spec.pos.forEach(function (p, i) {
      nodes += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="13" fill="#111C2E" stroke="#7EA7FF" stroke-width="1.6"/>' +
        '<text x="' + X(p[0]).toFixed(1) + '" y="' + (Y(p[1]) + 3.5).toFixed(1) + '" text-anchor="middle" font-size="9" fill="#E8EEF7">' + (i + 1) + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="linesvg">' + edges + nodes + '</svg>';
  }

  /* ---------- graph (dijkstra/mst) ---------- */
  function graphSvg(spec) {
    var W = 360, H = 260;
    var X = function (x) { return 26 + x / 320 * (W - 52); };
    var Y = function (y) { return 24 + y / 210 * (H - 48); };
    var hlNodes = spec.highlight && spec.highlight.length && typeof spec.highlight[0] === 'number' ? spec.highlight : null;
    var hlEdges = spec.highlight && spec.highlight.length && typeof spec.highlight[0] === 'object' ? spec.highlight : null;
    var edges = '';
    spec.edges.forEach(function (e) {
      var on = false;
      if (hlEdges) on = hlEdges.some(function (h) { return h.u === e.u && h.v === e.v; });
      if (hlNodes) {
        for (var i = 0; i < hlNodes.length - 1; i++) {
          if ((hlNodes[i] === e.u && hlNodes[i + 1] === e.v) || (hlNodes[i] === e.v && hlNodes[i + 1] === e.u)) on = true;
        }
      }
      var x1 = X(spec.pos[e.u][0]), y1 = Y(spec.pos[e.u][1]), x2 = X(spec.pos[e.v][0]), y2 = Y(spec.pos[e.v][1]);
      edges += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + (on ? '#55E6C1' : 'rgba(147,160,180,.5)') + '" stroke-width="' + (on ? 3 : 1.6) + '"/>' +
        '<text x="' + ((x1 + x2) / 2).toFixed(1) + '" y="' + ((y1 + y2) / 2 - 4).toFixed(1) + '" text-anchor="middle" font-size="9.5" fill="#94A3B8">' + e.w + '</text>';
    });
    var nodes = '';
    spec.pos.forEach(function (p, i) {
      var on = hlNodes && hlNodes.indexOf(i) >= 0;
      nodes += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="14" fill="' + (on ? 'rgba(85,230,193,.2)' : '#111C2E') + '" stroke="' + (on ? '#55E6C1' : '#7EA7FF') + '" stroke-width="1.7"/>' +
        '<text x="' + X(p[0]).toFixed(1) + '" y="' + (Y(p[1]) + 3.5).toFixed(1) + '" text-anchor="middle" font-size="10" fill="#E8EEF7">' + (i + 1) + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="linesvg">' + edges + nodes + '</svg>';
  }

  /* ---------- control chart (SPC) ---------- */
  function spcSvg(spec) {
    var W = 340, H = 170, P = 30;
    var lo = Math.min(spec.lcl, Math.min.apply(null, spec.pts)) - 1;
    var hi = Math.max(spec.ucl, Math.max.apply(null, spec.pts)) + 1;
    var Y = function (v) { return H - P - (v - lo) / (hi - lo) * (H - 2 * P); };
    var X = function (i) { return P + (i + 0.5) / spec.pts.length * (W - 2 * P); };
    function line(v, color, dash, label) {
      return '<line x1="' + P + '" y1="' + Y(v).toFixed(1) + '" x2="' + (W - P) + '" y2="' + Y(v).toFixed(1) + '" stroke="' + color + '" stroke-width="1.3" stroke-dasharray="' + dash + '"/>' +
        '<text x="' + (W - P + 1) + '" y="' + (Y(v) + 3).toFixed(1) + '" font-size="7.5" fill="' + color + '">' + label + '</text>';
    }
    var pts = spec.pts.map(function (v, i) {
      var out = v > spec.ucl || v < spec.lcl;
      return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="4" fill="' + (out ? '#FF8C8C' : '#7EA7FF') + '"/>';
    }).join('');
    var path = spec.pts.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="linesvg">' +
      line(spec.ucl, '#FF8C8C', '6 4', 'UCL') + line(spec.lcl, '#FF8C8C', '6 4', 'LCL') + line(spec.cl, '#55E6C1', '2 3', 'CL') +
      '<path d="' + path + '" fill="none" stroke="rgba(147,160,180,.5)" stroke-width="1.2"/>' + pts + '</svg>';
  }

  /* aktivasi slider LP */
  UI.activateLp = function (root) {
    UI.$$('.lp-slider input[type=range]', root || document).forEach(function (r) {
      if (r._vfinit) return; r._vfinit = true;
      var line = document.getElementById(r.getAttribute('data-lpuid'));
      var zEl = UI.$('.lp-z[data-zfor="' + r.getAttribute('data-lpuid') + '"]');
      var o1 = parseFloat(r.getAttribute('data-obj1')), o2 = parseFloat(r.getAttribute('data-obj2'));
      var xmax = parseFloat(r.getAttribute('data-xmax')), ymax = parseFloat(r.getAttribute('data-ymax'));
      var W = parseFloat(r.getAttribute('data-w')), H = parseFloat(r.getAttribute('data-h')), P = parseFloat(r.getAttribute('data-p'));
      r.addEventListener('input', function () {
        var z = parseFloat(r.value);
        if (!line) return;
        var x2 = z / o1, y2 = z / o2;
        if (y2 > ymax) { y2 = ymax; x2 = (z - o2 * y2) / o1; }
        if (x2 > xmax) { x2 = xmax; y2 = (z - o1 * x2) / o2; }
        line.setAttribute('x1', (P + x2 / xmax * (W - 2 * P)).toFixed(1));
        line.setAttribute('y1', (H - P).toFixed(1));
        line.setAttribute('x2', P.toFixed(1));
        line.setAttribute('y2', (H - P - y2 / ymax * (H - 2 * P)).toFixed(1));
        if (zEl) zEl.textContent = 'Z = ' + String(z).replace('.', ',');
      });
    });
  };

  function lineSvg(series, caption) {
    var all = [];
    series.forEach(function (s) { all = all.concat(s); });
    var xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; });
    var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
    var ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
    if (ymax === ymin) { ymax += 1; ymin -= 1; }
    var W = 300, H = 150, P = 26;
    var X = function (x) { return P + (x - xmin) / (xmax - xmin || 1) * (W - 2 * P); };
    var Y = function (y) { return H - P - (y - ymin) / (ymax - ymin) * (H - 2 * P); };
    var grid = '';
    for (var g = 0; g <= 4; g++) {
      var gy = P + g * (H - 2 * P) / 4;
      grid += '<line x1="' + P + '" y1="' + gy + '" x2="' + (W - P) + '" y2="' + gy + '" class="c-grid"/>';
    }
    var paths = '';
    series.forEach(function (s, i) {
      var d = s.map(function (p, j) { return (j ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join('');
      paths += '<path d="' + d + '" fill="none" stroke="' + (i ? '#7EA7FF' : '#55E6C1') + '" stroke-width="2.4" stroke-linecap="round"/>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="linesvg">' + grid +
      '<line x1="' + P + '" y1="' + (H - P) + '" x2="' + (W - P) + '" y2="' + (H - P) + '" class="c-axis"/>' +
      '<line x1="' + P + '" y1="' + P + '" x2="' + P + '" y2="' + (H - P) + '" class="c-axis"/>' + paths + '</svg>';
  }

  function eoqSvg(spec) {
    // kurva biaya: pesan = DS/Q, simpan = QH/2, total
    var Qmax = spec.q * 2.2;
    var ptsHold = [], ptsOrder = [], ptsTot = [];
    var maxC = Math.max(spec.D / spec.q * spec.S + spec.q / 2 * spec.H, spec.D * spec.S / (spec.q * 0.3)) * 1.05;
    for (var Q = Qmax * 0.06; Q <= Qmax; Q += Qmax / 40) {
      var o = spec.D * spec.S / Q, h = Q * spec.H / 2;
      ptsOrder.push([Q, o]); ptsHold.push([Q, h]); ptsTot.push([Q, o + h]);
    }
    var W = 320, H = 170, P = 30;
    var X = function (q) { return P + q / Qmax * (W - 2 * P); };
    var Y = function (c) { return H - P - c / maxC * (H - 2 * P); };
    function path(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(''); }
    var uid = 'eoq' + Math.floor(Math.random() * 99999);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="linesvg eoqsvg">' +
      '<path d="' + path(ptsOrder) + '" fill="none" stroke="#7EA7FF" stroke-width="2"/>' +
      '<path d="' + path(ptsHold) + '" fill="none" stroke="#55E6C1" stroke-width="2"/>' +
      '<path d="' + path(ptsTot) + '" fill="none" stroke="#55E6C1" stroke-width="2.4"/>' +
      '<line x1="' + X(spec.q) + '" y1="' + (H - P) + '" x2="' + X(spec.q) + '" y2="' + P + '" stroke="rgba(85,230,193,0.5)" stroke-dasharray="4 4"/>' +
      '<circle cx="' + X(spec.q) + '" cy="' + Y(spec.D * spec.S / spec.q + spec.q / 2 * spec.H) + '" r="5" fill="#55E6C1"/>' +
      '</svg><div class="legend"><span style="color:#7EA7FF">— biaya pesan</span> <span style="color:#55E6C1">— biaya simpan</span> <span style="color:#55E6C1">— total · minimum di Q*=' + spec.q + '</span></div>';
  }

  /* animasi antrean (dipasang setelah render) */
  UI.activateQueue = function (root) {
    UI.$$('.queueviz', root || document).forEach(function (qv) {
      if (qv._vfinit) return; qv._vfinit = true;
      var lam = parseFloat(qv.getAttribute('data-lam')) || 6;
      var mu = parseFloat(qv.getAttribute('data-mu')) || 8;
      var arrive = UI.$('.q-arrive', qv), wait = UI.$('.q-wait', qv), done = UI.$('.q-done', qv);
      var server = UI.$('.q-server', qv);
      var running = true;
      var arriveMs = Math.max(700, 3600 / lam * 1000 / 3);
      var serveMs = Math.max(500, 3600 / mu * 1000 / 3);
      function spawn() {
        if (!running) return;
        if (document.hidden) { setTimeout(spawn, 1500); return; }
        var p = UI.el('span', 'q-person', '🚶');
        arrive.appendChild(p);
        var dur = arriveMs / 1000;
        p.style.animationDuration = dur + 's';
        p.addEventListener('animationend', function () {
          p.remove();
          var w = UI.el('span', 'q-person', '🧍');
          wait.appendChild(w);
          queueCheck();
        });
        setTimeout(spawn, arriveMs * (0.6 + Math.random() * 0.8));
      }
      function queueCheck() {
        var people = UI.$$('.q-person', wait);
        if (people.length && !server.classList.contains('busy')) {
          var first = people[0];
          server.classList.add('busy');
          first.remove();
          server.classList.add('q-serving');
          setTimeout(function () {
            server.classList.remove('busy');
            server.classList.remove('q-serving');
            var d = UI.el('span', 'q-person done', '✅');
            done.appendChild(d);
            setTimeout(function () { d.remove(); }, 1400);
            queueCheck();
          }, serveMs);
        }
      }
      var btn = UI.$('.q-toggle', qv.parentNode);
      if (btn) btn.addEventListener('click', function () {
        running = !running;
        btn.textContent = running ? 'jeda' : 'lanjut';
        if (running) spawn();
      });
      spawn();
    });
  };

  /* status node → kelas warna */
  UI.statusCls = function (st) {
    if (!st || !st.attempts) return 'st-baru';
    return { belajar: 'st-belajar', lancar: 'st-lancar', mastered: 'st-mastered', memudar: 'st-memudar' }[st.status] || 'st-baru';
  };
  UI.statusLabel = function (st) {
    if (!st || !st.attempts) return 'baru';
    return { belajar: 'belajar', lancar: 'lancar', mastered: 'mastered', memudar: 'memudar ↻' }[st.status] || 'baru';
  };
})();
