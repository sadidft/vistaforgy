/* Vista Forgy — ui-screens.js (Beranda, Peta, Statistik, Pengaturan, Data, Onboarding, modal konsep) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var UI = VF.UI, E = VF.ENGINE, S = VF.SCHED, P = VF.PROG, STORE = VF.STORE;
  var $ = UI.$, esc = UI.esc, ic = UI.icon;
  var DF = null;
  try { DF = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) {}
  function fmtDate(ts) { if (!ts) return '–'; try { return DF.format(new Date(ts)); } catch (e) { return new Date(ts).toLocaleDateString(); } }

  VF.BADGES = [
    { id: 'first', name: 'Nyala Pertama', icon: 'zap', cond: function (s) { return s.stats.totalSessions >= 1; } },
    { id: 'streak7', name: 'Gear Panas (7 hari)', icon: 'flame', cond: function (s) { return s.streak.best >= 7; } },
    { id: 'streak30', name: 'Mesin Tak Berhenti (30 hari)', icon: 'flame', cond: function (s) { return s.streak.best >= 30; } },
    { id: 'q100', name: '100 Soal', icon: 'check', cond: function (s) { return s.stats.totalQuestions >= 100; } },
    { id: 'q500', name: '500 Soal', icon: 'check', cond: function (s) { return s.stats.totalQuestions >= 500; } },
    { id: 'q1000', name: '1.000 Soal — di luar kepala', icon: 'award', cond: function (s) { return s.stats.totalQuestions >= 1000; } },
    { id: 'boss1', name: 'Boss Pertama Tumbang', icon: 'shield', cond: function (s) { return (s.stats.bossWins || 0) >= 1; } },
    { id: 'sharp800', name: 'Otak Tempa (Sharpness 800)', icon: 'zap', cond: function (s) { return (s.stats.sharpHistory.length && s.stats.sharpHistory[s.stats.sharpHistory.length - 1].s >= 800); } },
    { id: 'tier1', name: 'Naik Tier: Dasar', icon: 'arrow', cond: function (s) { return s.tiers.unlocked >= 1; } },
    { id: 'tier2', name: 'Naik Tier: Tanpa Alat', icon: 'arrow', cond: function (s) { return s.tiers.unlocked >= 2; } },
    { id: 'tier3', name: 'Naik Tier: Langkah', icon: 'arrow', cond: function (s) { return s.tiers.unlocked >= 3; } },
    { id: 'tier4', name: 'Naik Tier: Kasus', icon: 'arrow', cond: function (s) { return s.tiers.unlocked >= 4; } }
  ];
  VF.checkBadges = function (save) {
    var fresh = [];
    VF.BADGES.forEach(function (b) {
      if (save.badges.indexOf(b.id) < 0 && b.cond(save)) { save.badges.push(b.id); fresh.push(b); }
    });
    return fresh;
  };

  /* ================= PABRIK ISOMETRIK (progres visual) ================= */
  VF.drawFactory = function (cv, save) {
    var g = cv.getContext('2d');
    var W = cv.width = 640, H = cv.height = 300;
    g.clearRect(0, 0, W, H);
    // lantai grid
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1;
    for (var i = 0; i <= 10; i++) {
      g.beginPath(); g.moveTo(W / 2 - i * 46, 210 + i * 23); g.lineTo(W / 2 + i * 46, 210 + i * 23); g.stroke();
      g.beginPath(); g.moveTo(W / 2 - i * 46, 210 - i * 23 + 46); g.lineTo(W / 2 - i * 46, 210 + i * 23 + 46); g.stroke();
    }
    function cube(cx, cy, s, h, hue) {
      // proyeksi isometrik: kanan=(s, s/2), kiri=(-s, s/2), atas=(0,-h)
      var R = [s, s * 0.5], L = [-s, s * 0.5];
      function face(p1, p2, p3, p4, fill) {
        g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.lineTo(p3[0], p3[1]); g.lineTo(p4[0], p4[1]);
        g.closePath(); g.fillStyle = fill; g.fill();
      }
      var b = [cx, cy];
      var t = [cx, cy - h];
      face(t, [t[0] + R[0], t[1] + R[1]], [t[0] + R[0] + L[0], t[1] + R[1] + L[1]], [t[0] + L[0], t[1] + L[1]], 'hsl(' + hue + ',80%,62%)'); // atas
      face(b, [b[0] + R[0], b[1] + R[1]], [b[0] + R[0], b[1] + R[1] - h], [b[0], b[1] - h], 'hsl(' + hue + ',70%,40%)'); // kanan
      face(b, [b[0] + L[0], b[1] + L[1]], [b[0] + L[0], b[1] + L[1] - h], [b[0], b[1] - h], 'hsl(' + hue + ',70%,30%)'); // kiri
    }
    var hues = [165, 42, 210, 165, 42];
    var any = false;
    for (var t = 0; t <= 4; t++) {
      var nodes = P.nodesInTier(t, save.profile.track);
      var mastered = nodes.filter(function (n) { var st = save.skills[n.id]; return st && (st.status === 'mastered' || st.status === 'memudar'); }).length;
      var learned = nodes.filter(function (n) { var st = save.skills[n.id]; return st && st.attempts > 0; }).length;
      var count = Math.min(6, mastered) + (learned > mastered ? 1 : 0);
      for (var k = 0; k < count; k++) {
        any = true;
        var cx = 90 + t * 112 + (k % 3) * 34;
        var cy = 235 - Math.floor(k / 3) * 24 - (t % 2) * 10;
        var h = 18 + t * 10 + (k === 0 ? 14 : 0);
        cube(cx, cy, 15, h, hues[t]);
      }
    }
    if (!any) {
      g.fillStyle = '#94A3B8'; g.font = '14px sans-serif'; g.textAlign = 'center';
      g.fillText('Lantai masih kosong — mulai sesi pertama untuk membangun pabrik otakmu 🔨', W / 2, 150);
    }
    // judul kecil
    g.fillStyle = 'rgba(232,236,243,.8)'; g.font = '600 12px sans-serif'; g.textAlign = 'left';
    g.fillText('Pabrik Otak — tiap kubus = skill yang dikuasai (kiri→kanan: Tier 0–4)', 14, 20);
  };

  /* ================= BERANDA ================= */
  UI.route('home', function () {
    var save = VF.save;
    var h = new Date().getHours();
    var greet = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam';
    var due = S.dailyQueue(save, E.allNodes());
    var focus = VF.focusSuggestion(save);
    var sharp = P.sharpness(save);
    var proj = P.projection(save);
    var gate = null;
    for (var t = 0; t <= 4; t++) { var g = P.tierGate(save, t); if (g.allOk) { gate = g; break; } }
    var html =
      '<section class="screen home">' +
      '<div class="home-top">' +
        '<div class="greet"><h1>' + greet + (save.profile.name ? ', ' + esc(save.profile.name) : '') + '</h1>' +
        '<p class="muted">' + (due.length ? due.length + ' review due · siap tempa hari ini' : 'Antrian review kosong — segar.') + '</p></div>' +
        '<div class="logo-hero"><div class="logo-ring"><img src="assets/vista-192.png" alt="Logo Vista Academy" draggable="false"></div></div>' +
      '</div>' +
      '<div class="bento">' +
        '<div class="panel p-main">' +
          '<div class="p-head">' + ic('play') + '<span>Antrian Hari Ini</span></div>' +
          '<div class="p-big">' + (focus ? 'Fokus: <b>' + esc(focus.name) + '</b>' : 'Semua node terkuasai yang terdaftar — latihan bebas') + '</div>' +
          '<div class="p-sub">' + due.length + ' review · ' + (focus ? '1 skill baru/lanjutan' : '–') + ' · ± ' + save.profile.dailyGoalMin + ' menit</div>' +
          '<button class="btn primary big" id="btnStart">' + ic('play') + ' MULAI HARI INI</button>' +
          '<div class="btn-row"><button class="btn ghost" id="btnQuick">' + ic('zap') + ' Quick 5</button>' +
          (P.bossAvailable(save) ? '<button class="btn amber" id="btnBoss">' + ic('shield') + ' Boss Mingguan!</button>' : '') +
          (save.tiers.unlocked >= 2 ? '<button class="btn ghost" id="btnExamSim">' + ic('clock') + ' Exam Sim (Tier 5)</button>' : '') + '</div>' +
        '</div>' +
        '<div class="panel p-streak"><div class="p-head">' + ic('flame') + '<span>Streak</span></div>' +
          '<div class="stat-big" id="streakNum">0</div><div class="muted">hari beruntun · terbaik ' + save.streak.best + '</div>' +
          '<div class="shield-row">' + ic('shield') + ' streak shield × ' + save.streak.shields + '</div></div>' +
        '<div class="panel p-sharp"><div class="p-head">' + ic('zap') + '<span>Sharpness</span></div>' +
          '<div class="sharp-ring">' + UI.ring(sharp / 1000, 92, 8, 'amber') + '<div class="sharp-num" id="sharpNum">0</div></div>' +
          (proj ? '<div class="muted small">Proyeksi jalur inti: ± ' + fmtDate(proj.etaDate.getTime()) + '</div>' : '<div class="muted small">Mulai latihan untuk melihat proyeksi</div>') + '</div>' +
        (gate ? '<div class="panel p-gate pulse-soft"><div class="p-head">' + ic('award') + '<span>Gerbang Promosi Terbuka!</span></div>' +
          '<div class="p-sub">Semua syarat Tier ' + gate.tier + ' ("' + VF.TIERS[gate.tier].name + '") terpenuhi. Ujian promosi menunggu.</div>' +
          '<button class="btn amber" id="btnExam">' + ic('award') + ' Ujian Promosi Tier ' + gate.tier + '</button></div>' : '') +
        '<div class="panel p-heat"><div class="p-head">' + ic('stats') + '<span>Konsistensi 12 minggu</span></div>' + UI.heatmap(save.stats.dailyLog, 12) + '</div>' +
        '<div class="panel p-factory"><div class="p-head">' + ic('gear') + '<span>Pabrik Otak</span></div><div class="factory-wrap"><canvas class="factory-cv" id="factoryCv"></canvas></div></div>' +
        '<div class="panel p-topo"><div class="p-head">' + ic('map') + '<span>Topologi Pengetahuan 3D</span></div>' +
        '<p class="muted small">Seluruh ' + E.allNodes().length + ' skill sebagai jaringan 3D — hubungan prasyarat antar materi terlihat utuh. Drag untuk memutar · scroll untuk zoom · klik simpul untuk detail.</p>' +
        '<div id="topoHost"></div></div>' +
      '</div>' +
      (save.stats.lastExportTs && (Date.now() - save.stats.lastExportTs > 14 * 86400000) && STORE.persistent() ?
        '<div class="warn">' + ic('alert') + ' Backup terakhirmu ' + Math.round((Date.now() - save.stats.lastExportTs) / 86400000) + ' hari lalu — export file .fgy di menu Data biar progress aman 5 tahun.</div>' : '') +
      (!STORE.persistent() ? '<div class="warn">' + ic('alert') + ' Mode preview: penyimpanan browser tidak tersedia di konteks ini — progress hanya bertahan selama sesi. Buka aplikasi via server/http untuk penyimpanan permanen.</div>' : '') +
      '</section>';
    UI.$('#app').innerHTML = html;
    UI.countUp(UI.$('#streakNum'), save.streak.current);
    UI.countUp(UI.$('#sharpNum'), sharp);
    var fcv = UI.$('#factoryCv');
    if (fcv) { try { VF.drawFactory(fcv, save); } catch (e) {} }
    if (VF._topo) { try { VF._topo.destroy(); } catch (e) {} VF._topo = null; }
    var topoHost = UI.$('#topoHost');
    if (topoHost) {
      try {
        VF._topo = VF.TOPO3D.mount(topoHost, { height: 300, clickToOpen: true, save: save });
        if (!VF._topo) topoHost.innerHTML = '<div class="muted small">Topologi tidak didukung browser ini.</div>';
      } catch (e) { topoHost.innerHTML = '<div class="muted small">Topologi tidak didukung browser ini.</div>'; }
    }
    UI.$('#btnStart').onclick = function () { UI.nav('run?mode=daily'); };
    UI.$('#btnQuick').onclick = function () { UI.nav('run?mode=quick'); };
    var bb = UI.$('#btnBoss'); if (bb) bb.onclick = function () { UI.nav('run?mode=boss'); };
    var be = UI.$('#btnExam'); if (be) be.onclick = function () { UI.nav('run?mode=exam&tier=' + gate.tier); };
    var bs = UI.$('#btnExamSim'); if (bs) bs.onclick = function () { UI.nav('run?mode=sim'); };

  });

  /* ================= PETA SKILL ================= */
  UI.route('map', function () {
    if (VF._topo) { try { VF._topo.destroy(); } catch (e) {} VF._topo = null; }
    var save = VF.save;
    var html = '<section class="screen"><h1>Peta Skill</h1><p class="muted">Naik tier = naik cara belajar. Kunci gerbang: mastery 90%, volume, dan ujian promosi.</p>' +
      '<div class="field map-search"><span>Cari skill / domain</span><input id="mapSearch" type="text" placeholder="mis. turunan, LP, antrean, statistik…"></div>';
    var nodes = E.allNodes();
    // universal pack
    var uni = nodes.filter(function (n) { return n.track === 'uni'; });
    VF.TIERS.forEach(function (T) {
      var list = nodes.filter(function (n) { return n.tier === T.n && n.track === 'ti'; });
      if (!list.length) return;
      var locked = T.n > save.tiers.unlocked;
      var stats = P.tierStats(save, T.n);
      var g = P.tierGate(save, T.n);
      html += '<div class="tier-sec' + (locked ? ' locked' : '') + '">' +
        '<div class="tier-head"><div class="tier-badge">' + T.n + '</div>' +
        '<div><h2>' + T.name + '</h2><div class="muted">' + T.desc + '</div></div>' +
        '<div class="tier-meta">' + (locked ? ic('lock') + ' terkunci' : stats.mastered + '/' + stats.total + ' mastered · ' + stats.attempts + ' soal') + '</div></div>';
      if (locked) {
        html += '<div class="gate-info">' +
          '<div class="' + (g.masteredOk ? 'ok' : '') + '">' + ic(g.masteredOk ? 'check' : 'x') + ' Mastery: ' + g.masteredTxt + '</div>' +
          '<div class="' + (g.volumeOk ? 'ok' : '') + '">' + ic(g.volumeOk ? 'check' : 'x') + ' Volume: ' + g.volumeTxt + '</div>' +
          '<div class="' + (g.healthyOk ? 'ok' : '') + '">' + ic(g.healthyOk ? 'check' : 'x') + ' Sehat: ' + (g.healthyOk ? 'tidak ada skill memudar' : g.fading + ' skill memudar') + '</div>' +
          '<div class="muted small">Ujian promosi: ' + VF.TIERS[T.n].examSize + ' soal · lulus ≥ ' + VF.TIERS[T.n].passPct + '% · cooldown 48 jam bila gagal</div></div>';
      }
      html += '<div class="node-grid">';
      var byDom = {};
      list.forEach(function (n) { (byDom[n.domain] = byDom[n.domain] || []).push(n); });
      Object.keys(byDom).forEach(function (dom) {
        html += '<div class="dom-group"><div class="dom-name">' + esc(dom) + '</div>';
        byDom[dom].forEach(function (n) {
          var st = save.skills[n.id];
          var unlocked = P.isUnlocked(save, n);
          html += '<button class="node-chip ' + UI.statusCls(st) + (unlocked ? '' : ' nodelock') + '" data-node="' + n.id + '">' +
            (unlocked ? '' : ic('lock', 13)) + '<span class="nn">' + esc(n.name) + '</span><span class="ns">' + UI.statusLabel(st) + '</span></button>';
        });
        html += '</div>';
      });
      html += '</div></div>';
    });
    html += '<div class="tier-sec uni"><div class="tier-head"><div class="tier-badge">U</div><div><h2>Pack Universal</h2><div class="muted">Untuk semua jurusan — manajemen, akuntansi, bisnis, informatika.</div></div></div><div class="node-grid">';
    uni.forEach(function (n) {
      var st = save.skills[n.id];
      html += '<button class="node-chip ' + UI.statusCls(st) + '" data-node="' + n.id + '"><span class="nn">' + esc(n.name) + '</span><span class="ns">' + UI.statusLabel(st) + '</span></button>';
    });
    html += '</div></div></section>';
    UI.$('#app').innerHTML = html;
    UI.$$('.node-chip').forEach(function (b) {
      b.onclick = function () { VF.nodeModal(b.getAttribute('data-node')); };
    });
    var searchIn = UI.$('#mapSearch');
    if (searchIn) searchIn.addEventListener('input', function () {
      var q = this.value.trim().toLowerCase();
      UI.$$('.node-chip').forEach(function (b) {
        var n = E.getNode(b.getAttribute('data-node')) || {};
        var hit = !q || (n.name || '').toLowerCase().indexOf(q) >= 0 || (n.domain || '').indexOf(q) >= 0 || (n.id || '').indexOf(q) >= 0;
        b.style.display = hit ? '' : 'none';
      });
      var total = 0;
      UI.$$('.dom-group').forEach(function (dg) {
        var any = UI.$$('.node-chip', dg).some(function (c) { return c.style.display !== 'none'; });
        dg.style.display = any ? '' : 'none';
        if (any) total++;
      });
      var sec = UI.$('.screen');
      var msg = UI.$('#mapEmpty');
      if (total === 0 && !msg && sec) {
        msg = UI.el('div', 'map-empty', 'Tidak ada skill yang cocok dengan "' + UI.esc(q) + '" — coba kata lain (mis. turunan, antrean, LP).');
        msg.id = 'mapEmpty';
        sec.appendChild(msg);
      } else if (msg && total > 0) msg.remove();
    });
  });

  /* modal detail node */
  VF.nodeModal = function (id) {
    var save = VF.save;
    var n = E.getNode(id);
    if (!n) return;
    var st = save.skills[id];
    var hist = (st && st.hist) ? st.hist.join('') : '';
    var dots = (st && st.hist) ? st.hist.map(function (x) { return '<span class="dot' + (x ? ' ok' : ' no') + '"></span>'; }).join('') : '<span class="muted">belum ada percobaan</span>';
    var medTxt = st && st.medianMs ? Math.round(st.medianMs / 1000) + ' dtk (target ' + Math.round(n.targetMs / 1000) + ' dtk)' : '–';
    var html = '<div class="nodemodal">' +
      '<div class="nm-head"><div><div class="muted small">' + esc(n.domain) + ' · Tier ' + n.tier + '</div><h2>' + esc(n.name) + '</h2></div>' +
      '<span class="status-pill ' + UI.statusCls(st) + '">' + UI.statusLabel(st) + '</span></div>' +
      '<div class="nm-stats"><div>Elo <b>' + (st ? st.elo : 1200) + '</b></div><div>R <b>' + (st ? Math.round(S.retrievability(st, Date.now()) * 100) + '%' : '–') + '</b></div><div>Median <b>' + medTxt + '</b></div><div>S <b>' + (st ? U2(st.S) : '–') + '</b></div></div>' +
      '<div class="nm-hist"><div class="muted small">10 terakhir</div><div class="dots">' + dots + '</div></div>' +
      '<div class="btn-row">' + (P.isUnlocked(save, n)
        ? '<button class="btn primary" id="nmDrill">' + ic('play') + ' Latihan (Zeno)</button>'
        : '<button class="btn primary" disabled title="Selesaikan prasyarat dulu">' + ic('lock') + ' Terkunci</button>') +
      '<button class="btn ghost" id="nmCard">' + ic('book') + ' Konsep</button></div>' +
      (st && st.status === 'memudar' ? '<div class="warn small">' + ic('alert') + ' Skill ini memudar — review untuk memulihkan sebelum ujian promosi.</div>' : '') +
      '</div>';
    var m = UI.modal(html, 'wide');
    var drill = UI.$('#nmDrill', m.box);
    if (drill) drill.onclick = function () { m.close(); UI.nav('run?mode=zeno&node=' + id); };
    UI.$('#nmCard', m.box).onclick = function () { VF.conceptModal(id); };
    function U2(v) { return v ? v.toFixed(1) + ' hari' : '–'; }
  };

  VF.conceptModal = function (id) {
    var n = E.getNode(id);
    var c = n.card;
    var related = E.allNodes().filter(function (x) { return x.prereq.indexOf(id) >= 0; }).length;
    var hasGraph = (n.prereq.length + related) >= 2;
    var html = '<div class="concept"><div class="muted small">' + esc(n.domain) + '</div><h2>' + esc(c.title) + '</h2>' +
      (hasGraph ? '<div class="topo-mini" id="topoMini"></div><p class="muted small">Posisi materi ini di topologi pengetahuan (drag untuk memutar).</p>' : '') +
      '<p>' + esc(c.body) + '</p>' +
      (c.latex ? '<div class="formula">' + UI.latex(c.latex) + '</div>' : '') +
      '<div class="miss">' + ic('alert') + ' Miskonsepsi umum: ' + esc(c.miss) + '</div>' +
      '<div class="why">' + ic('info') + ' ' + esc(c.why) + '</div>' +
      '<div class="btn-row"><button class="btn primary" onclick="this.closest(\'.modal-ov\').remove()">Mengerti — gas drill</button></div></div>';
    var topoMini = null;
    var m = UI.modal(html, 'wide', {
      onClose: function () { if (topoMini) { try { topoMini.destroy(); } catch (e) {} } }
    });
    var host = UI.$('#topoMini', m.box);
    if (host) {
      try {
        topoMini = VF.TOPO3D.mount(host, { height: 180, focus: id, clickToOpen: false, save: VF.save });
        if (!topoMini) host.style.display = 'none';
      } catch (e) { host.style.display = 'none'; }
    }
  };

  /* ================= STATISTIK ================= */
  UI.route('stats', function () {
    var save = VF.save;
    var sharp = P.sharpness(save);
    var hist = save.stats.sharpHistory || [];
    var dom = {};
    E.allNodes().forEach(function (n) {
      var st = save.skills[n.id];
      if (st && st.attempts) {
        var d = dom[n.domain] = dom[n.domain] || { c: 0, n: 0 };
        d.n += st.hist ? st.hist.length : 0;
        d.c += st.hist ? st.hist.reduce(function (a, b) { return a + b; }, 0) : 0;
      }
    });
    var html = '<section class="screen"><h1>Statistik</h1>' +
      '<div class="btn-row" style="margin-bottom:12px"><button class="btn ghost small" id="btnCsv">' + ic('download') + ' Export CSV</button></div>' +
      '<div class="bento bento-stats">' +
      '<div class="panel s-sharp"><div class="p-head">' + ic('zap') + '<span>Sharpness Score</span></div><div class="stat-big" id="statSharp">0</div><div class="muted">/ 1000 · coverage + retensi + kecepatan + konsistensi</div>' +
      (hist.length > 1 ? sparkline(hist.map(function (h) { return h.s; })) : '<div class="muted small">Grafik muncul setelah beberapa hari.</div>') + '</div>' +
      '<div class="panel s-total"><div class="p-head">' + ic('stats') + '<span>Total</span></div>' +
      '<div class="kv"><span>Soal dikerjakan</span><b>' + save.stats.totalQuestions.toLocaleString('id-ID') + '</b></div>' +
      '<div class="kv"><span>Sesi tuntas</span><b>' + save.stats.totalSessions + '</b></div>' +
      '<div class="kv"><span>Streak terbaik</span><b>' + save.streak.best + ' hari</b></div></div>' +
      '<div class="panel s-dom"><div class="p-head">' + ic('stats') + '<span>Akurasi per domain (10 terakhir per skill)</span></div>';
    var keys = Object.keys(dom).sort();
    if (!keys.length) html += '<div class="muted small">Belum ada data.</div>';
    keys.forEach(function (k) {
      var pct = dom[k].n ? Math.round(dom[k].c / dom[k].n * 100) : 0;
      html += '<div class="dombar"><span class="domname">' + esc(k) + '</span><div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div><b>' + (dom[k].n ? pct + '%' : '–') + '</b></div>';
    });
    html += '</div>' +
      '<div class="panel s-cal"><div class="p-head">' + ic('flame') + '<span>Kalender 20 minggu</span></div>' + UI.heatmap(save.stats.dailyLog, 20) + '</div>' +
      '<div class="panel s-badge"><div class="p-head">' + ic('award') + '<span>Pencapaian (' + save.badges.length + '/' + VF.BADGES.length + ')</span></div><div class="badges">';
    VF.BADGES.forEach(function (b) {
      var got = save.badges.indexOf(b.id) >= 0;
      html += '<div class="badge' + (got ? ' got' : '') + '">' + ic(b.icon, 22) + '<span>' + b.name + '</span></div>';
    });
    html += '</div></div>';
    var bestExam = (save.tiers.examHistory || []).filter(function (e) { return e.passed; }).reduce(function (m, e) { return Math.max(m, e.score); }, 0);
    var bestSharp = (save.stats.sharpHistory || []).reduce(function (m, h) { return Math.max(m, h.s); }, 0);
    var bestCombo = save.stats.bestCombo || 0;
    html += '<div class="panel s-rec"><div class="p-head">' + ic('award') + '<span>Papan Rekor Pribadi</span></div>' +
      '<div class="kv"><span>Sharpness tertinggi</span><b>' + bestSharp + '</b></div>' +
      '<div class="kv"><span>Skor ujian terbaik (lulus)</span><b>' + (bestExam ? bestExam + '%' : '–') + '</b></div>' +
      '<div class="kv"><span>Combo terbaik</span><b>×' + bestCombo + '</b></div>' +
      '<div class="kv"><span>Boss ditumbangkan</span><b>' + (save.stats.bossWins || 0) + '</b></div></div>';
    // ===== v1.5.2: histori sesi per-item + jam emas =====
    var slog = (save.stats.sessionLog || []).slice().reverse().slice(0, 8);
    html += '<div class="panel s-log"><div class="p-head">' + ic('clock') + '<span>Riwayat Sesi (per-item)</span></div>';
    if (!slog.length) html += '<div class="muted small">Belum ada sesi tercatat.</div>';
    slog.forEach(function (s2, i) {
      var d = new Date(s2.ts);
      var jam = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
      var tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      html += '<div class="kv"><span>' + tgl + ' ' + jam + ' · ' + ({ daily: 'Harian', quick: 'Quick', zeno: 'Zeno', exam: 'Ujian', boss: 'Boss', sim: 'Sim' }[s2.mode] || s2.mode) + '</span>' +
        '<span class="kv-r"><b>' + s2.correct + '/' + s2.answered + ' · ' + Math.round(s2.ms / 60000) + ' mnt</b><button class="mini-btn sess-det" data-i="' + i + '">detail</button></span></div>';
    });
    html += '</div>';
    var hours = {};
    (save.stats.sessionLog || []).forEach(function (s3) {
      var h = new Date(s3.ts).getHours();
      hours[h] = hours[h] || { q: 0, c: 0 };
      hours[h].q += s3.answered; hours[h].c += s3.correct;
    });
    var hKeys = Object.keys(hours).sort(function (a, b) { return a - b; });
    html += '<div class="panel s-hours"><div class="p-head">' + ic('zap') + '<span>Jam Emas — kapan otakmu paling tajam</span></div>';
    if (!hKeys.length) html += '<div class="muted small">Muncul setelah beberapa sesi.</div>';
    var maxQ = Math.max.apply(null, hKeys.map(function (h) { return hours[h].q; }).concat([1]));
    hKeys.forEach(function (h) {
      var pct = Math.round(hours[h].c / hours[h].q * 100);
      html += '<div class="dombar"><span class="domname">' + ('0' + h).slice(-2) + '.00</span><div class="bar-track"><div class="bar-fill" style="width:' + Math.round(hours[h].q / maxQ * 100) + '%"></div></div><b>' + pct + '% · ' + hours[h].q + ' soal</b></div>';
    });
    html += '</div>';
    var exams = (save.tiers.examHistory || []).slice().reverse().slice(0, 8);
    html += '<div class="panel s-hist"><div class="p-head">' + ic('clock') + '<span>Riwayat Ujian</span></div>';
    if (!exams.length) html += '<div class="muted small">Belum ada ujian.</div>';
    exams.forEach(function (ex) {
      html += '<div class="kv"><span>' + (ex.tier === 9 ? 'Boss Mingguan' : 'Promosi Tier ' + ex.tier) + ' · ' + fmtDate(ex.ts) + '</span><b class="' + (ex.passed ? 'ok' : 'no') + '">' + ex.score + '% ' + (ex.passed ? 'LULUS' : 'GAGAL') + '</b></div>';
    });
    html += '</div></div></section>';
    UI.$('#app').innerHTML = html;
    UI.countUp(UI.$('#statSharp'), sharp);
    UI.$$('.sess-det').forEach(function (b) {
      b.onclick = function () {
        var e2 = slog[parseInt(b.getAttribute('data-i'), 10)];
        var itemsHtml = (e2.items || []).map(function (it, j) {
          var nd = E.getNode(it[0]) || { name: it[0] };
          return '<div class="kv"><span>' + (j + 1) + '. ' + esc(nd.name) + '</span><b class="' + (it[1] ? 'ok' : 'no') + '">' + (it[1] ? '✓' : '✗') + ' · ' + (it[2] / 1000).toFixed(1).replace('.', ',') + ' dtk</b></div>';
        }).join('');
        UI.modal('<div class="concept"><h2>Detail sesi</h2><p class="muted small">' + e2.correct + '/' + e2.answered + ' benar · ' + Math.round(e2.ms / 60000) + ' menit</p>' + itemsHtml + '</div>', 'wide');
      };
    });
    var csvBtn = UI.$('#btnCsv');
    if (csvBtn) csvBtn.onclick = function () {
      var rows = [['tanggal', 'soal', 'benar', 'menit']];
      (save.stats.dailyLog || []).forEach(function (d) { rows.push([d.date, d.questions, d.correct, d.minutes]); });
      var csv = rows.map(function (r) { return r.join(','); }).join('\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'vista-forgy-statistik-' + VF.todayStr() + '.csv';
      a.click();
      UI.toast('Statistik harian terunduh (CSV).', 'ok');
    };
    function sparkline(vals) {
      var W = 260, H = 60, mx = Math.max.apply(null, vals.concat([1]));
      var pts = vals.map(function (v, i) { return (i / (vals.length - 1) * W).toFixed(1) + ',' + (H - v / mx * (H - 8) - 4).toFixed(1); });
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="sparkline"><polyline points="' + pts.join(' ') + '" fill="none" stroke="#55E6C1" stroke-width="2.4"/></svg>';
    }
  });

  /* ================= PENGATURAN ================= */
  UI.route('settings', function () {
    var save = VF.save;
    var s = save.settings;
    var html = '<section class="screen narrow"><h1>Pengaturan</h1>' +
      '<div class="panel"><label class="field"><span>Nama panggilan</span><input id="setNama" type="text" maxlength="20" value="' + esc(save.profile.name) + '"></label>' +
      '<label class="field"><span>Target harian</span><div class="dd" id="ddGoal"></div></label>' +
      '<label class="field"><span>Track</span><div class="dd" id="ddTrack"></div></label></div>' +
      '<div class="panel">' +
      '<div class="toggle-row"><span>' + ic('zap') + ' Efek suara</span><button class="toggle ' + (s.sound ? 'on' : '') + '" id="setSound"></button></div>' +
      '<div class="toggle-row"><span>Volume</span><input type="range" id="setVol" min="0" max="100" value="' + Math.round(s.volume * 100) + '"></div>' +
      '<div class="toggle-row"><span>' + ic('info') + ' Serius Mode (matikan humor KOA)</span><button class="toggle ' + (s.serious ? 'on' : '') + '" id="setSerious"></button></div>' +
      '<div class="toggle-row"><span>Animasi</span><div class="dd dd-inline" id="ddMotion"></div></div>' +
      '<div class="toggle-row"><span>Tema</span><div class="dd dd-inline" id="ddTheme"></div></div></div>' +
      '<div class="panel"><h3>Pelajari sistemnya</h3><div class="btn-row">' +
      '<button class="btn ghost" id="btnAboutSrs">' + ic('book') + ' Cara kerja repetisi (SRS)</button>' +
      '<button class="btn ghost" id="btnGlossary">' + ic('info') + ' Glosarium istilah</button></div></div>' +
      '<div class="panel danger-zone"><h3>Zona Merah</h3><p class="muted small">Menghapus seluruh progress. Aplikasi akan menawarkan export dulu.</p>' +
      '<button class="btn danger" id="btnReset">' + ic('alert') + ' Reset Progress</button></div></section>';
    UI.$('#app').innerHTML = html;
    UI.$('#setNama').onchange = function () { save.profile.name = this.value.trim(); VF.persist(); };
    UI.dropdown(UI.$('#ddGoal'), {
      value: save.profile.dailyGoalMin,
      items: [{ v: 15, label: '15 menit' }, { v: 25, label: '25 menit' }, { v: 40, label: '40 menit' }],
      onChange: function (v) { save.profile.dailyGoalMin = parseInt(v, 10); VF.persist(); VF.AUDIO.click(save); }
    });
    UI.dropdown(UI.$('#ddTrack'), {
      value: save.profile.track,
      items: [{ v: 'ti', label: 'Teknik Industri' }, { v: 'both', label: 'Semua (TI + Universal)' }],
      onChange: function (v) { save.profile.track = v; VF.persist(); VF.AUDIO.click(save); }
    });
    function tgl(id, key, cb) {
      var b = UI.$(id);
      b.onclick = function () { save.settings[key] = !save.settings[key]; b.classList.toggle('on', save.settings[key]); VF.persist(); if (cb) cb(save.settings[key]); };
    }
    tgl('#setSound', 'sound');
    tgl('#setSerious', 'serious', function (on) { var l = VF.KOA.line(save, on ? 'serius-on' : 'serius-off'); if (l) UI.toast(esc(l)); });
    UI.$('#setVol').oninput = function () { save.settings.volume = this.value / 100; };
    UI.$('#setVol').onchange = function () { VF.persist(); VF.AUDIO.correct(save); };
    UI.dropdown(UI.$('#ddMotion'), {
      value: s.motion,
      items: [{ v: 'auto', label: 'Ikut sistem' }, { v: 'full', label: 'Penuh' }, { v: 'reduced', label: 'Kurangi' }],
      onChange: function (v) { save.settings.motion = v; VF.applyMotion(); VF.persist(); }
    });
    UI.dropdown(UI.$('#ddTheme'), {
      value: s.theme,
      items: [{ v: 'dark', label: 'Gelap (default)' }, { v: 'light', label: 'Terang' }],
      onChange: function (v) { save.settings.theme = v; VF.applyTheme(); VF.persist(); }
    });
    UI.$('#btnAboutSrs').onclick = function () {
      UI.modal('<div class="concept"><h2>Cara kerja repetisi (SRS)</h2>' +
        '<p>Teknik ini disebut <b>spaced repetition</b> — mengulang tepat sebelum kamu hampir lupa. Makin kamu menguasai sebuah skill, makin jarang ia muncul kembali; begitu mulai memudar, ia dijemput pulang.</p>' +
        '<p>Setiap jawaban mengubah tiga hal: <b>Difficulty</b> (seberapa berat skill itu buatmu), <b>Stability</b> (seberapa lama ingatan bertahan), dan <b>Retrievability</b> (peluang kamu masih ingat sekarang). Saat Retrievability turun mendekati 90%, skill masuk Antrian Hari Ini.</p>' +
        '<p>Kenapa latihan kadang terasa berat? Itu disebut <b>desirable difficulty</b> — retrieval yang susah payah justru menguatkan ingatan jangka panjang jauh lebih dalam daripada membaca ulang yang nyaman.</p>' +
        '<p>Status skill: <span class="status-pill st-belajar">belajar</span> <span class="status-pill st-lancar">lancar</span> <span class="status-pill st-mastered">mastered</span> <span class="status-pill st-memudar">memudar ↻</span> — "memudar" berarti perlu review sebelum ujian promosi.</p></div>', 'wide');
    };
    UI.$('#btnGlossary').onclick = function () {
      var rows = VF.GLOSSARY.map(function (g) { return '<div class="kv"><span>' + esc(g[0]) + '</span><b>' + esc(g[1]) + '</b></div>'; }).join('');
      UI.modal('<div class="concept"><h2>Glosarium</h2><p class="muted small">Istilah Indonesia ↔ Inggris yang dipakai konsisten di seluruh app.</p>' + rows + '</div>', 'wide');
    };
    UI.$('#btnReset').onclick = function () {
      var m = UI.modal('<div class="concept"><h2>Reset progress?</h2><p>Semua skill, streak, dan badge akan hilang. KOA menyarankan export dulu (menu Data).</p>' +
        '<div class="field"><span>Ketik RESET untuk konfirmasi</span><input id="resetConfirm" type="text" autocomplete="off"></div>' +
        '<div class="btn-row"><button class="btn ghost" id="rCancel">Batal</button><button class="btn danger" id="rGo">Hapus permanen</button></div></div>');
      UI.$('#rCancel', m.box).onclick = m.close;
      UI.$('#rGo', m.box).onclick = function () {
        if (UI.$('#resetConfirm', m.box).value.trim().toUpperCase() !== 'RESET') { UI.toast('Ketik RESET dulu.', 'warn'); return; }
        STORE.reset(); VF.save = null; m.close(); UI.nav('onboarding'); location.reload();
      };
    };
  });

  /* ================= DATA (export/import .fgy) ================= */
  UI.route('data', function () {
    var save = VF.save;
    var usage = STORE.usage();
    var cryptoOk = VF.CRYPTO.available();
    var html = '<section class="screen narrow"><h1>Data</h1>' +
      '<div class="panel"><h3>Export progress (.fgy terenkripsi)</h3>' +
      '<p class="muted small">File khusus Vista Forgy — AES-256-GCM + PBKDF2 (250.000 iterasi). Password tidak disimpan; lupa password = file tidak bisa dibuka.</p>' +
      (cryptoOk ? '' : '<div class="warn small">' + ic('alert') + ' Web Crypto tidak tersedia di konteks ini — export terenkripsi dinonaktifkan. Gunakan backup plain (dengan risikonya).</div>') +
      '<div class="field"><span>Password file</span><input id="expPw" type="password" autocomplete="new-password"></div>' +
      '<div class="field"><span>Ulangi password</span><input id="expPw2" type="password" autocomplete="new-password"></div>' +
      '<button class="btn primary" id="btnExport"' + (cryptoOk ? '' : ' disabled') + '>' + ic('download') + ' Download .fgy</button></div>' +
      '<div class="panel"><h3>Import progress</h3>' +
      '<div class="field"><span>File .fgy</span><input id="impFile" type="file" accept=".fgy"></div>' +
      '<div class="field"><span>Password file</span><input id="impPw" type="password" autocomplete="off"></div>' +
      '<div class="btn-row"><button class="btn ghost" id="btnMerge">' + ic('upload') + ' Merge (gabung)</button><button class="btn ghost" id="btnReplace">Replace (timpa)</button></div>' +
      '<div id="impPreview"></div></div>' +
      '<div class="panel"><h3>Backup plain (tidak terenkripsi)</h3><p class="muted small">JSON mentah — siapa pun yang punya file bisa membacanya.</p>' +
      '<div class="btn-row"><button class="btn ghost" id="btnPlainExp">' + ic('download') + ' Download .json</button>' +
      '<label class="btn ghost filelike">' + ic('upload') + ' Import .json<input id="impJson" type="file" accept=".json" hidden></label></div></div>' +
      '<div class="panel"><h3>Penyimpanan</h3><div class="kv"><span>Terpakai</span><b>' + usage.kb + ' KB / ~' + usage.limitKb + ' KB</b></div>' +
      '<div class="kv"><span>Versi schema</span><b>v' + save.version + '</b></div>' +
      '<div class="kv"><span>Migrasi</span><b>' + (save.schemaMigrations || []).join(' → ') + '</b></div>' +
      '<p class="muted small">Data hidup di perangkat ini saja. Export rutin = progress aman 5 tahun.</p></div></section>';
    UI.$('#app').innerHTML = html;

    UI.$('#btnExport').onclick = async function () {
      var p1 = UI.$('#expPw').value, p2 = UI.$('#expPw2').value;
      if (p1.length < 4) { UI.toast('Password minimal 4 karakter.', 'warn'); return; }
      if (p1 !== p2) { UI.toast('Password tidak sama.', 'warn'); return; }
      try {
        this.disabled = true; this.textContent = 'Mengenkripsi…';
        var bytes = await VF.CRYPTO.encryptSave(save, p1);
        save.stats.lastExportTs = Date.now();
        VF.persist();
        var fname = 'vista-forgy-' + VF.todayStr() + '.fgy';
        VF.CRYPTO.download(bytes, fname);
        UI.toast('File ' + fname + ' terunduh. Simpan baik-baik!', 'ok');
      } catch (e) { UI.toast(esc(e.message || 'Gagal export'), 'warn'); }
      this.disabled = false; this.innerHTML = ic('download') + ' Download .fgy';
    };

    function readFile(inp, cb) {
      var f = inp.files && inp.files[0];
      if (!f) { UI.toast('Pilih file dulu.', 'warn'); return; }
      var r = new FileReader();
      r.onload = function () { cb(r.result, f.name); };
      r.readAsArrayBuffer(r._arr = f);
    }

    async function doImport(mode) {
      var pw = UI.$('#impPw').value;
      if (!pw) { UI.toast('Masukkan password file.', 'warn'); return; }
      var f = UI.$('#impFile').files && UI.$('#impFile').files[0];
      if (!f) { UI.toast('Pilih file .fgy dulu.', 'warn'); return; }
      var buf = await f.arrayBuffer();
      try {
        var remote = await VF.CRYPTO.decryptSave(buf, pw);
        var preview = UI.$('#impPreview');
        preview.innerHTML = '<div class="ok-box">File valid — ' + fmtDate(remote.updatedAt) + ' · ' + Object.keys(remote.skills).length + ' skill · tier ' + remote.tiers.unlocked + '</div>';
        var go = UI.el('button', 'btn primary', ic('check') + (mode === 'merge' ? ' Konfirmasi Merge' : ' Konfirmasi Replace'));
        preview.appendChild(go);
        go.onclick = function () {
          if (mode === 'merge') VF.save = VF.CRYPTO.mergeSaves(VF.save, remote);
          else VF.save = STORE.migrate(remote);
          VF.persist(); VF.checkBadges(VF.save); VF.persist();
          UI.toast('Import ' + mode + ' berhasil.', 'ok');
          UI.nav('home');
        };
      } catch (e) { UI.toast(esc(e.message || 'Gagal membaca file'), 'warn'); }
    }
    UI.$('#btnMerge').onclick = function () { doImport('merge'); };
    UI.$('#btnReplace').onclick = function () { doImport('replace'); };

    UI.$('#btnPlainExp').onclick = function () {
      var blob = new Blob([JSON.stringify(VF.save)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vista-forgy-backup-' + VF.todayStr() + '.json';
      a.click();
    };
    UI.$('#impJson').onchange = function () {
      var f = this.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var obj = JSON.parse(r.result);
          if (!obj.profile) throw new Error('bukan file backup Vista Forgy');
          VF.save = STORE.migrate(obj); VF.persist();
          UI.toast('Backup plain dimuat.', 'ok'); UI.nav('home');
        } catch (e) { UI.toast('File tidak valid.', 'warn'); }
      };
      r.readAsText(f);
    };
  });

  /* ================= ONBOARDING ================= */
  UI.route('onboarding', function () {
    var html = '<section class="screen onboarding">' +
      '<div class="ob-hero"><div class="logo-ring big"><img src="assets/vista-192.png" alt="Vista Academy" draggable="false"></div>' +
      '<h1>Vista Forgy <span class="muted small">× Vista Academy</span></h1><p class="tagline">Gym untuk otakmu — logika & matematika industri sampai <b>di luar kepala</b>.</p>' +
      '<div id="obTopo"></div></div>' +
      '<div class="ob-cards">' +
      '<div class="ob-card">' + ic('zap') + '<b>Bukan kursus online</b><span>Tiap hari angkat beban: soal drill, bukan video panjang.</span></div>' +
      '<div class="ob-card">' + ic('gear') + '<b>Soal tidak pernah berulang</b><span>Digenerate oleh mesin — angka, struktur, dan konteksnya selalu baru.</span></div>' +
      '<div class="ob-card">' + ic('shield') + '<b>Progressmu milikmu</b><span>Semua data di perangkatmu. Bisa dibawa dengan file terenkripsi.</span></div></div>' +
      '<div class="panel ob-form">' +
      '<label class="field"><span>Nama panggilan (untuk salam & sertifikat)</span><input id="obNama" type="text" maxlength="20" placeholder="mis. Arif"></label>' +
      '<label class="field"><span>Track</span><select id="obTrack"><option value="ti">Teknik Industri (lengkap)</option><option value="both">TI + Universal (non-TI friendly)</option></select></label>' +
      '<label class="field"><span>Target harian</span><select id="obGoal"><option value="15">15 menit (santai)</option><option value="25" selected>25 menit (serius)</option><option value="40">40 menit (gaspol)</option></select></label>' +
      '<div class="btn-row"><button class="btn primary big" id="obGo" style="flex:1">' + ic('play') + ' Mulai Tempa Hari Ini</button>' +
      '<button class="btn ghost" id="obCalib">Kalibrasi (opsional)</button></div>' +
      '<p class="muted small">Dengan mulai, kamu setuju otakmu akan disesakkan dengan cara yang sehat (desirable difficulty).</p>' +
      '<div id="calibBox"></div></div></section>';
    UI.$('#app').innerHTML = html;
    var obTopo = UI.$('#obTopo');
    if (obTopo) {
      try {
        var demoSave = STORE.newSave();
        VF.TOPO3D.mount(obTopo, { height: 210, clickToOpen: false, save: demoSave });
      } catch (e) { obTopo.style.display = 'none'; }
    }
    UI.$('#obGo').onclick = function () {
      VF.save = STORE.newSave();
      VF.save.profile.name = UI.$('#obNama').value.trim();
      VF.save.profile.track = UI.$('#obTrack').value;
      VF.save.profile.dailyGoalMin = parseInt(UI.$('#obGoal').value, 10);
      var cr = VF._calibRight || 0;
      if (cr > 0) {
        var bump = 1200 + cr * 30; // 6/6 → 1380
        ['ari.tambah','ari.kurang','ari.kali','ari.bagi','ari.campur','ari.persen','ari.rasio','log.implikasi','log.danau','dat.mean','alj.linear1','alj.linear2'].forEach(function (id) {
          if (!VF.save.skills[id]) VF.save.skills[id] = { elo: bump, D: 0, S: 0, lastReviewTs: 0, dueTs: 0, streakBenar: 0, medianMs: 0, attempts: 0, status: 'baru', hist: [] };
          else VF.save.skills[id].elo = bump;
        });
        VF.save.stats.calibrated = true;
      }
      VF.persist(); STORE.snapshot(VF.save);
      UI.nav('home');
    };
    UI.$('#obCalib').onclick = function () {
      var CAL_NODES = ['ari.campur', 'ari.pecahan', 'log.negasi', 'log.implikasi', 'log.deduksi', 'dat.banding']; // semua family MC
      var ci = 0, right = 0;
      var box = UI.$('#calibBox');
      function nextCal() {
        if (ci >= CAL_NODES.length) {
          var lvl = right >= 5 ? '«gaspol»' : right >= 3 ? '«serius»' : '«start tenang»';
          box.innerHTML = '<div class="ok-box">' + ic('check') + ' Kalibrasi selesai: ' + right + '/' + CAL_NODES.length + ' benar — Elo awal domain dasar disesuaikan (' + lvl + '). Lanjutkan dengan tombol atas.</div>';
          return;
        }
        var nid = CAL_NODES[ci];
        var q = null;
        try { q = VF.ENGINE.make(nid, 1200); } catch (e) { q = null; }
        if (!q || q.format !== 'mc' || !q.choices) {
          // jangan pernah macet: skip node bermasalah, lanjut berikutnya
          ci++;
          nextCal();
          return;
        }
        var idxs = q.choices.map(function (c, i) { return i; });
        for (var i = idxs.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = idxs[i]; idxs[i] = idxs[j]; idxs[j] = t; }
        box.innerHTML = '<div class="qcard" style="margin-top:10px"><div class="q-meta">Kalibrasi ' + (ci + 1) + '/' + CAL_NODES.length + '</div>' +
          UI.renderVisual(q.visual) +
          '<div class="q-prompt">' + esc(q.promptText) + '</div>' + (q.promptLatex ? '<div class="q-latex">' + UI.latex(q.promptLatex) + '</div>' : '') +
          '<div class="mc">' + idxs.map(function (cix, pos) {
            var c = q.choices[cix];
            return '<button class="mc-opt calib-opt" data-ok="' + (c.correct ? 1 : 0) + '"><span class="mc-key">' + (pos + 1) + '</span><span class="mc-lab">' + esc(c.label) + '</span></button>';
          }).join('') + '</div></div>';
        UI.activateQueue(box);
        UI.activateLp(box);
        UI.$$('.calib-opt', box).forEach(function (b) {
          b.onclick = function () {
            var okc = b.getAttribute('data-ok') === '1';
            if (okc) { right++; VF.AUDIO.correct(VF.save); } else VF.AUDIO.wrong(VF.save);
            b.style.borderColor = okc ? 'var(--ok)' : 'var(--no)';
            VF._calibRight = right;
            setTimeout(nextCal, 350);
          };
        });
        ci++;
      }
      nextCal();
    };
  });

  /* fallback */
  UI.route('run', function () { UI.nav('home'); });
})();
