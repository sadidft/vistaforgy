/* Vista Forgy — topo3d.js
   "Topologi Pengetahuan" 3D interaktif: seluruh skill tree sebagai graph di ruang 3D.
   Software-rendered (canvas 2D + proyeksi perspektif) — tanpa WebGL, deterministik, anti-bug.
   Interaksi: drag = rotasi · scroll/pinch = zoom · hover = highlight · klik simpul = buka detail. */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var T3 = (VF.TOPO3D = VF.TOPO3D || {});

  var STATUS_COL = {
    mastered: '#55E6C1', lancar: '#7EA7FF', belajar: '#F5BD67',
    memudar: '#F5BD67', baru: 'rgba(148,163,184,0.55)'
  };

  function hash32(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }

  /* layout 3D: tier = lapisan z, domain = sudut, jitter deterministik dari id */
  function buildGraph(save, focus) {
    var nodes = VF.ENGINE.allNodes();
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });
    var domains = [];
    nodes.forEach(function (n) { if (domains.indexOf(n.domain) < 0) domains.push(n.domain); });
    var domAngle = {};
    domains.forEach(function (d, i) { domAngle[d] = (i / domains.length) * Math.PI * 2; });
    var pts = [];
    nodes.forEach(function (n, i) {
      var h = hash32(n.id);
      var tierR = 78 + (n.tier * 9);
      var a = domAngle[n.domain] + ((h % 1000) / 1000) * (Math.PI * 2 / domains.length) - (Math.PI / domains.length);
      var z = -(n.tier * 74) - ((h >> 10) % 13);
      var y = (((h >> 5) % 100) / 100 - 0.5) * 46;
      var st = save && save.skills[n.id];
      pts.push({
        id: n.id, name: n.name, tier: n.tier, domain: n.domain,
        x: Math.cos(a) * tierR, y: y, z: z,
        status: st && st.attempts ? st.status : 'baru',
        idx: i
      });
    });
    var map = {};
    pts.forEach(function (p) { map[p.id] = p; });
    var edges = [];
    pts.forEach(function (p) {
      var n = byId[p.id];
      n.prereq.forEach(function (pid) {
        if (map[pid]) edges.push([map[pid], p]);
      });
    });
    // mode neighborhood: fokus + semua prereq (transitif) + dependents langsung
    var keep = null;
    if (focus) {
      keep = {};
      var stack = [focus], seen = {};
      while (stack.length) {
        var cur = stack.pop();
        if (seen[cur]) continue;
        seen[cur] = 1;
        keep[cur] = 1;
        (byId[cur].prereq || []).forEach(function (pid) { if (byId[pid]) stack.push(pid); });
      }
      pts.forEach(function (p) {
        if (byId[p.id].prereq.indexOf(focus) >= 0) keep[p.id] = 1;
      });
      keep[focus] = 1;
      pts = pts.filter(function (p) { return keep[p.id]; });
      edges = edges.filter(function (e) { return keep[e[0].id] && keep[e[1].id]; });
    }
    return { pts: pts, edges: edges, map: map, count: nodes.length };
  }

  T3.mount = function (container, opts) {
    opts = opts || {};
    var save = opts.save || VF.save;
    var W0 = opts.width || container.clientWidth || 300;
    var H0 = opts.height || 260;
    var cv;
    try {
      cv = document.createElement('canvas');
    } catch (e) { return null; }
    var dpr = 1;
    try { dpr = Math.min(2, window.devicePixelRatio || 1); } catch (e) {}
    cv.width = W0 * dpr; cv.height = H0 * dpr;
    cv.className = 'topo-cv';
    cv.style.width = '100%'; cv.style.height = H0 + 'px';
    cv.setAttribute('aria-label', 'Topologi pengetahuan 3D — drag untuk memutar, scroll untuk zoom');
    var g = null;
    try { g = cv.getContext('2d'); } catch (e) {}
    if (!g) return null;
    container.appendChild(cv);

    var graph = buildGraph(save, opts.focus || null);
    var yaw = 0.7, pitch = -0.42, zoom = opts.focus ? 1.35 : 1.0;
    var vyaw = opts.focus ? 0.0025 : 0.0042;
    var dragging = false, moved = 0, lastX = 0, lastY = 0;
    var hover = null, destroyed = false, raf = null;

    var focusPt = null;
    if (opts.focus && graph.map[opts.focus]) focusPt = graph.map[opts.focus];

    function project(p) {
      var x = p.x, y = p.y, z = p.z;
      if (focusPt) { x -= focusPt.x * 0.6; y -= focusPt.y * 0.6; z -= focusPt.z * 0.6; }
      var xz = x * Math.cos(yaw) - z * Math.sin(yaw);
      var zz = x * Math.sin(yaw) + z * Math.cos(yaw);
      var yz = y * Math.cos(pitch) - zz * Math.sin(pitch);
      var z2 = y * Math.sin(pitch) + zz * Math.cos(pitch);
      var FOC = 420;
      var s = (FOC / (FOC - z2 * 1.35)) * zoom;
      return { x: (cv.width / 2) + xz * s, y: (cv.height / 2) - yz * s, s: s, z: z2 };
    }

    function draw() {
      g.clearRect(0, 0, cv.width, cv.height);
      // medan grid halus di latar
      g.strokeStyle = 'rgba(148,163,184,0.07)'; g.lineWidth = 1;
      for (var gy = 1; gy < 4; gy++) {
        g.beginPath();
        g.ellipse(cv.width / 2, cv.height / 2, (cv.width / 5.5) * gy * zoom, (cv.width / 5.5) * gy * zoom * 0.36, 0, 0, Math.PI * 2);
        g.stroke();
      }
      // edges: urut depth, alpha by depth
      var eDraw = [];
      graph.edges.forEach(function (e) {
        var a = project(e[0]), b = project(e[1]);
        var depth = (a.z + b.z) / 2;
        eDraw.push({ a: a, b: b, z: depth });
      });
      var nodes2 = graph.pts.map(function (p) {
        var pr = project(p);
        return { p: p, pr: pr };
      });
      var zMin = -260, zMax = 60;
      eDraw.forEach(function (e) {
        var t = (e.z - zMin) / (zMax - zMin);
        var alpha = 0.10 + Math.max(0, Math.min(1, t)) * 0.30;
        var isHover = hover && (hover.p === e.a || hover.p === e.b || e.a.p === hover || e.b === hover);
        g.strokeStyle = hover && (e.a.p === hover || e.b.p === hover) ? 'rgba(85,230,193,0.85)' : 'rgba(126,167,255,' + alpha.toFixed(3) + ')';
        g.lineWidth = hover && (e.a.p === hover || e.b.p === hover) ? 1.8 : 1;
        g.beginPath(); g.moveTo(e.a.x, e.a.y); g.lineTo(e.b.x, e.b.y); g.stroke();
      });
      nodes2.sort(function (u, v) { return u.pr.z - v.pr.z; });
      nodes2.forEach(function (nd) {
        var p = nd.p, pr = nd.pr;
        var r = (p.status === 'mastered' ? 5.2 : p.status === 'lancar' ? 4.2 : 3.1) * pr.s;
        if (p === hover) r *= 1.5;
        var col = STATUS_COL[p.status] || STATUS_COL.baru;
        var glow = p === hover || p === focusPt ? 18 : (p.status === 'mastered' ? 9 : 0);
        if (glow) {
          g.save();
          g.globalAlpha = 0.35;
          g.fillStyle = col;
          g.beginPath(); g.arc(pr.x, pr.y, r + glow, 0, Math.PI * 2); g.fill();
          g.restore();
        }
        g.fillStyle = col;
        g.beginPath(); g.arc(pr.x, pr.y, r, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(11,18,32,0.85)';
        g.beginPath(); g.arc(pr.x - r * 0.25, pr.y - r * 0.25, r * 0.42, 0, Math.PI * 2); g.fill();
        // label
        if (p === hover || p === focusPt) {
          var label = p.name;
          g.font = Math.round(11 * dpr) + 'px sans-serif';
          var tw = g.measureText(label).width;
          g.fillStyle = 'rgba(7,17,23,0.9)';
          g.fillRect(pr.x + 10, pr.y - 9 * dpr, tw + 12, 18 * dpr);
          g.fillStyle = '#E8EEF7';
          g.fillText(label, pr.x + 16, pr.y + 3 * dpr);
        } else if (p.status === 'mastered' && zoom > 1.7 && pr.s > 1) {
          g.fillStyle = 'rgba(148,163,184,0.75)';
          g.font = Math.round(9 * dpr) + 'px sans-serif';
          g.fillText(p.name, pr.x + 8, pr.y + 3);
        }
      });
      if (!opts.focus) {
        g.fillStyle = 'rgba(148,163,184,0.8)';
        g.font = Math.round(10 * dpr) + 'px sans-serif';
        g.fillText(graph.pts.length + ' simpul · ' + graph.edges.length + ' relasi prasyarat', 8 * dpr, cv.height - 8 * dpr);
      }
    }

    function pick(mx, my) {
      var best = null, bd = 20 * 20 * dpr * dpr;
      var nodes2 = graph.pts.map(function (p) { return { p: p, pr: project(p) }; });
      nodes2.forEach(function (nd) {
        var dx = nd.pr.x - mx, dy = nd.pr.y - my, d2 = dx * dx + dy * dy;
        if (d2 < bd + nd.pr.s * 9) { bd = d2; best = nd.p; }
      });
      return best;
    }

    function pos(ev) {
      var r = cv.getBoundingClientRect();
      var t = ev.touches ? ev.touches[0] : ev;
      return { x: (t.clientX - r.left) * (cv.width / r.width), y: (t.clientY - r.top) * (cv.height / r.height) };
    }
    function down(ev) { dragging = true; moved = 0; var p = pos(ev); lastX = p.x; lastY = p.y; }
    function move(ev) {
      var p = pos(ev);
      if (dragging) {
        yaw += (p.x - lastX) * 0.008 / dpr;
        pitch = Math.max(-1.35, Math.min(1.0, pitch + (p.y - lastY) * 0.006 / dpr));
        moved += Math.abs(p.x - lastX) + Math.abs(p.y - lastY);
        lastX = p.x; lastY = p.y;
        if (VF.reduceMotion && VF.reduceMotion()) draw();
      } else {
        hover = pick(p.x, p.y);
        cv.style.cursor = hover ? 'pointer' : 'grab';
        if (VF.reduceMotion && VF.reduceMotion()) draw();
      }
    }
    function up(ev) {
      if (dragging && moved < 6 && hover && opts.clickToOpen) {
        if (VF.nodeModal) VF.nodeModal(hover.id);
      }
      dragging = false;
    }
    function wheel(ev) {
      ev.preventDefault();
      zoom = Math.max(0.55, Math.min(3.2, zoom * (ev.deltaY < 0 ? 1.12 : 0.89)));
      if (VF.reduceMotion && VF.reduceMotion()) draw();
    }

    try {
      cv.addEventListener('mousedown', down);
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      cv.addEventListener('touchstart', down, { passive: true });
      cv.addEventListener('touchmove', move, { passive: false });
      cv.addEventListener('touchend', up);
      cv.addEventListener('wheel', wheel, { passive: false });
      cv.addEventListener('mouseleave', function () { hover = null; });
    } catch (e) {}

    function loop() {
      if (destroyed) return;
      if (!document.hidden) {
        if (!dragging) yaw += vyaw;
        draw();
      }
      raf = requestAnimationFrame(loop);
    }
    if (VF.reduceMotion && VF.reduceMotion()) draw();
    else raf = requestAnimationFrame(loop);

    return {
      canvas: cv,
      destroy: function () {
        destroyed = true;
        if (raf) cancelAnimationFrame(raf);
        try {
          cv.removeEventListener('mousedown', down);
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
          cv.removeEventListener('touchstart', down);
          cv.removeEventListener('touchmove', move);
          cv.removeEventListener('touchend', up);
          cv.removeEventListener('wheel', wheel);
        } catch (e) {}
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      }
    };
  };
})();
