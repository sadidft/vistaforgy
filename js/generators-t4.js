/* Vista Forgy — generators-t4.js (Tier 4: riset operasi, antrean, inventori, forecasting,
   keandalan & kualitas, ekonomi teknik + Pack Universal tambahan) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var E = VF.ENGINE, U = E.util;
  function steps(title, arr, final, takeaway) { return { title: title, steps: arr, final: final, takeaway: takeaway }; }
  function st(text, latex) { return latex ? { text: text, latex: latex } : { text: text }; }
  function fx(v, d) { return U.fmtID(v, d === undefined ? 2 : d); }

  /* ===== helper: geometri LP ===== */
  function lpInstance(rng) {
    // kendala ai x + bi y <= ri (semua positif) + x,y >= 0
    for (var tries = 0; tries < 300; tries++) {
      var cons = [];
      for (var i = 0; i < 3; i++) cons.push({ a: rng.int(1, 5), b: rng.int(1, 5), r: rng.int(10, 45) });
      var cand = [[0, 0]];
      cons.forEach(function (c) { cand.push([c.r / c.a, 0]); cand.push([0, c.r / c.b]); });
      for (var p = 0; p < cons.length; p++) for (var q = p + 1; q < cons.length; q++) {
        var A = cons[p], B = cons[q];
        var det = A.a * B.b - B.a * A.b;
        if (det === 0) continue;
        cand.push([(A.r * B.b - B.r * A.b) / det, (A.a * B.r - B.a * A.r) / det]);
      }
      var feas = cand.filter(function (pt) {
        return pt[0] >= -1e-9 && pt[1] >= -1e-9 && cons.every(function (c) { return c.a * pt[0] + c.b * pt[1] <= c.r + 1e-9; });
      });
      // dedupe
      var uniq = [];
      feas.forEach(function (pt) {
        if (!uniq.some(function (u) { return Math.abs(u[0] - pt[0]) < 1e-6 && Math.abs(u[1] - pt[1]) < 1e-6; })) uniq.push(pt);
      });
      if (uniq.length < 4) continue;
      var p1 = rng.int(2, 9), p2 = rng.int(2, 9);
      var best = null, bestZ = -1, tie = false;
      uniq.forEach(function (pt) {
        var z = p1 * pt[0] + p2 * pt[1];
        if (z > bestZ + 1e-9) { bestZ = z; best = pt; tie = false; }
        else if (Math.abs(z - bestZ) < 1e-9) tie = true;
      });
      if (tie || !best) continue;
      if (best[0] < 1e-6 || best[1] < 1e-6) continue; // optimum harus di interior kuadran
      if (Math.abs(best[0] - Math.round(best[0])) > 1e-6 || Math.abs(best[1] - Math.round(best[1])) > 1e-6) continue; // unit bulat
      return { cons: cons, verts: uniq, obj: [p1, p2], best: best, bestZ: Math.round(bestZ * 100) / 100 };
    }
    return null;
  }

  /* ===== T4: LP — PEMODELAN ===== */
  E.registerFamily({
    familyId: 'lpModel',
    make: function (rng, node, knobs) {
      var inst = lpInstance(rng); if (!inst) return null;
      var c = inst.cons, o = inst.obj;
      var ctx = E.context(rng, node.id);
      var correct = 'Maks Z = ' + o[0] + 'x₁ + ' + o[1] + 'x₂; ' +
        c.map(function (k, i) { return k.a + 'x₁ + ' + k.b + 'x₂ ≤ ' + k.r; }).join('; ') + '; x₁, x₂ ≥ 0';
      var w1 = 'Min Z = ' + o[0] + 'x₁ + ' + o[1] + 'x₂; ' + c.map(function (k) { return k.a + 'x₁ + ' + k.b + 'x₂ ≤ ' + k.r; }).join('; ') + '; x₁, x₂ ≥ 0';
      var w2 = 'Maks Z = ' + o[0] + 'x₁ + ' + o[1] + 'x₂; ' + c.map(function (k) { return k.a + 'x₁ + ' + k.b + 'x₂ ≥ ' + k.r; }).join('; ') + '; x₁, x₂ ≥ 0';
      return {
        format: 'mc',
        promptText: ctx.place + ' membuat 2 produk: ' + ctx.items[0] + ' (x₁, labar Rp' + o[0] + 'rb/unit) dan ' + ctx.items[1] + ' (x₂, laba Rp' + o[1] + 'rb/unit). Konsumsi sumber daya per unit dan ketersediaannya: ' +
          c.map(function (k) { return '(' + k.a + ', ' + k.b + ') batas ' + k.r; }).join('; ') + '. Manakah model program linear (linear programming) yang TEPAT?',
        promptLatex: '\\max Z=' + o[0] + 'x_1+' + o[1] + 'x_2',
        choices: [
          { label: correct, correct: true },
          { label: w1, correct: false, tag: 'fungsi tujuan memakai MIN — ini masalah maksimasi laba' },
          { label: w2, correct: false, tag: 'arah kendala terbalik: ketersediaan sumber daya = ≤' }
        ],
        solution: steps('Pemodelan LP', [
          st('1) Variabel keputusan: x₁ = jumlah ' + ctx.items[0] + ', x₂ = jumlah ' + ctx.items[1] + '.'),
          st('2) Fungsi tujuan: maksimumkan laba → Maks Z = ' + o[0] + 'x₁ + ' + o[1] + 'x₂.'),
          st('3) Kendala sumber daya (pemakaian ≤ ketersediaan): ' + c.map(function (k) { return k.a + 'x₁ + ' + k.b + 'x₂ ≤ ' + k.r; }).join('; ') + ' + non-negativitas.')],
        correct, 'Pemodelan LP 3 langkah: variabel → tujuan → kendala. Arah ≤ untuk ketersediaan.')
      };
    }
  });

  /* ===== T4: LP — GRAFIS (visual interaktif) ===== */
  E.registerFamily({
    familyId: 'lpGrafis',
    make: function (rng, node, knobs) {
      var inst = lpInstance(rng); if (!inst) return null;
      var askCombo = rng.bool();
      var visual = {
        type: 'lp', caption: 'Daerah layak (feasible region) — geser slider garis tujuan',
        cons: inst.cons.map(function (c) { return { a: c.a, b: c.b, r: c.r }; }),
        obj: inst.obj, verts: inst.verts, zmax: inst.bestZ
      };
      var best = inst.best;
      if (askCombo) {
        var others = inst.verts.filter(function (v) { return v !== best && v[0] > 1e-9 && v[1] > 1e-9 && Math.abs(v[0] - Math.round(v[0])) < 1e-6 && Math.abs(v[1] - Math.round(v[1])) < 1e-6; });
        var wrongs = others.slice(0, 3).map(function (v) { return { label: '(' + Math.round(v[0]) + ', ' + Math.round(v[1]) + ')', tag: 'bukan titik sudut optimum — evaluasi semua titik sudut' }; });
        if (wrongs.length < 3) wrongs.push({ label: '(' + (best[0] + 1) + ', ' + best[1] + ')', tag: 'melanggar salah satu kendala' });
        return {
          format: 'mc',
          promptText: 'Selesaikan LP berikut secara grafis. Maks Z = ' + inst.obj[0] + 'x₁ + ' + inst.obj[1] + 'x₂ dengan kendala: ' +
            inst.cons.map(function (k) { return k.a + 'x₁ + ' + k.b + 'x₂ ≤ ' + k.r; }).join('; ') + '. Kombinasi PRODUKSI OPTIMAL (x₁, x₂) adalah?',
          promptLatex: '\\max Z=' + inst.obj[0] + 'x_1+' + inst.obj[1] + 'x_2',
          visual: visual,
          choices: [{ label: '(' + Math.round(best[0]) + ', ' + Math.round(best[1]) + ')', correct: true }].concat(wrongs.slice(0, 3)),
          solution: steps('Metode grafis', [
            st('Gambar tiap kendala sebagai garis (titik potong sumbu: ' + inst.cons.map(function (k) { return '(' + fx(k.r / k.a, 1).replace(',', '.') + ', 0) dan (0, ' + fx(k.r / k.b, 1).replace(',', '.') + ')'; }).join('; ') + ').'),
            st('Daerah layak = irisan semua setengah bidang. Titik sudutnya: ' + inst.verts.map(function (v) { return '(' + fx(v[0], 1).replace(',', '.') + ', ' + fx(v[1], 1).replace(',', '.') + ')'; }).join('; ') + '.'),
            st('Evaluasi Z di tiap sudut: optimum di (' + best[0] + ', ' + best[1] + ') dengan Z = ' + inst.bestZ + '.')],
          '(' + best[0] + ', ' + best[1] + ') → Z = ' + inst.bestZ, 'Optimum LP selalu di TITIK SUDUT. Geser garis tujuan sejauh mungkin tanpa lepas daerah layak.')
        };
      }
      return {
        format: 'numeric',
        promptText: 'Maks Z = ' + inst.obj[0] + 'x₁ + ' + inst.obj[1] + 'x₂ dgn kendala ' +
          inst.cons.map(function (k) { return k.a + 'x₁ + ' + k.b + 'x₂ ≤ ' + k.r; }).join('; ') + '. Berapa NILAI OPTIMUM Z?',
        promptLatex: '\\max Z=' + inst.obj[0] + 'x_1+' + inst.obj[1] + 'x_2',
        visual: visual,
        answer: { value: inst.bestZ, tol: 0.05 },
        solution: steps('Metode grafis — nilai Z', [
          st('Enumerasi titik sudut dan evaluasi Z di masing-masing.'),
          st('Optimum (' + best[0] + ', ' + best[1] + '): Z = ' + inst.obj[0] + '×' + best[0] + ' + ' + inst.obj[1] + '×' + best[1] + ' = ' + inst.bestZ + '.')],
        String(inst.bestZ), 'Teorema sudut: solusi optimal LP berada di titik sudut daerah layak.')
      };
    }
  });

  /* ===== T4: TRANSPORTASI (north-west) ===== */
  E.registerFamily({
    familyId: 'transport',
    make: function (rng, node, knobs) {
      var s1 = rng.int(20, 60), s2 = rng.int(20, 60);
      var d1 = rng.int(15, s1), d2 = s1 + s2 - d1;
      if (d2 < 10 || d2 > s2 + 30) return null;
      var c11 = rng.int(2, 9), c12 = rng.int(2, 9), c21 = rng.int(2, 9), c22 = rng.int(2, 9);
      // alokasi north-west
      var x11 = Math.min(s1, d1), rem = s1 - x11;
      var x12 = rem, x21 = d1 - x11, x22 = d2 - x12;
      if (x21 < 0 || x22 < 0) return null;
      var cost = x11 * c11 + x12 * c12 + x21 * c21 + x22 * c22;
      var visual = {
        type: 'table', caption: 'Biaya per unit (ribu) · supply s1=' + s1 + ', s2=' + s2 + ' · demand d1=' + d1 + ', d2=' + d2,
        head: ['', 'T1', 'T2', 'Supply'], rows: [
          ['S1', String(c11), String(c12), String(s1)],
          ['S2', String(c21), String(c22), String(s2)],
          ['Demand', String(d1), String(d2), '']]
      };
      return {
        format: 'numeric',
        promptText: 'Masalah transportasi 2×2 (supply = kapasitas pabrik, demand = kebutuhan gudang). Dengan metode NORTH-WEST CORNER sebagai solusi awal, berapa TOTAL BIAYA transportasi (ribu)?',
        visual: visual,
        answer: { value: cost, tol: 0.01 },
        solution: steps('North-West corner', [
          st('Mulai dari pojok kiri-atas: x₁₁ = min(' + s1 + ', ' + d1 + ') = ' + x11 + '.'),
          st('Habiskan baris/kolom: x₁₂ = ' + x12 + ', x₂₁ = ' + x21 + ', x₂₂ = ' + x22 + '.'),
          st('Total = ' + x11 + '×' + c11 + ' + ' + x12 + '×' + c12 + ' + ' + x21 + '×' + c21 + ' + ' + x22 + '×' + c22 + ' = ' + cost + '.')],
        String(cost), 'NW corner solusi AWAL (belum optimal) — lalu diperbaiki stepping stone/UV. Evaluasi biaya, bukan tebak.')
      };
    }
  });

  /* ===== helper: DAG PERT/CPM ===== */
  var DAG = [
    { id: 'A', from: 0, to: 1 },
    { id: 'B', from: 0, to: 2 },
    { id: 'C', from: 1, to: 3 },
    { id: 'D', from: 2, to: 3 },
    { id: 'E', from: 3, to: 4 }
  ];
  var PATHS = [['A', 'C', 'E'], ['B', 'D', 'E']];
  function pertVisual(durs, critEdges) {
    var pos = [[40, 90], [130, 40], [130, 140], [220, 90], [300, 90]];
    return { type: 'pert', caption: 'Jaringan aktivitas (durasi di garis; jalur kritis oranye)', pos: pos, acts: DAG.map(function (e, i) { return { id: e.id, from: e.from, to: e.to, d: durs[i] }; }), crit: critEdges };
  }

  /* ===== T4: PERT ===== */
  E.registerFamily({
    familyId: 'pert',
    make: function (rng, node, knobs) {
      var te = [];
      for (var i = 0; i < DAG.length; i++) te.push(rng.int(2, 12));
      var p1 = te[0] + te[2] + te[4], p2 = te[1] + te[3] + te[4];
      if (p1 === p2) return null;
      var crit = p1 > p2 ? PATHS[0] : PATHS[1];
      var proj = Math.max(p1, p2);
      // variasi: tanya durasi ekspektasi (mode optimis-pesimis) ATAU jalur kritis
      var askPath = rng.bool();
      var durs = te.slice();
      var visual = pertVisual(durs, crit);
      if (askPath) {
        return {
          format: 'mc', promptText: 'Proyek dengan 5 aktivitas (lihat jaringan). Manakah JALUR KRITIS (critical path)?',
          visual: visual,
          choices: [
            { label: 'A–C–E (' + p1 + ' minggu)', correct: p1 > p2 },
            { label: 'B–D–E (' + p2 + ' minggu)', correct: p2 > p1 },
            { label: 'A–B–E (bukan jalur)', correct: false, tag: 'A dan B paralel dari start — tidak berurutan' }
          ],
          solution: steps('CPM/PERT — jalur kritis', [
            st('Enumerasi semua jalur start→finish: A–C–E = ' + p1 + '; B–D–E = ' + p2 + '.'),
            st('Jalur terpanjang = kritis = ' + crit.join('–') + ' (' + proj + ' minggu). Aktivitas di jalur ini slack = 0.')],
          crit.join('–') + ' = ' + proj, 'Jalur kritis = rantai terpanjang; telat satu aktivitas di situ = telat satu proyek.')
        };
      }
      return {
        format: 'numeric', promptText: 'Dengan estimasi tiga waktu (a, m, b) tiap aktivitas memberi durasi ekspektasi TE = (a+4m+b)/6: A=' + te[0] + ', B=' + te[1] + ', C=' + te[2] + ', D=' + te[3] + ', E=' + te[4] + ' minggu. Berapa durasi EKSPEKTASI proyek?',
        promptLatex: 'TE=\\frac{a+4m+b}{6}',
        visual: visual,
        answer: { value: proj, tol: 0.01 },
        solution: steps('PERT', [
          st('Jalur 1 (A–C–E): ' + te[0] + '+' + te[2] + '+' + te[4] + ' = ' + p1 + '. Jalur 2 (B–D–E): ' + te[1] + '+' + te[3] + '+' + te[4] + ' = ' + p2 + '.'),
          st('Durasi proyek = jalur terpanjang = ' + proj + ' minggu.')],
        String(proj), 'PERT: ekspektasi beta per aktivitas; proyek mengikuti jalur kritis.')
      };
    }
  });

  /* ===== T4: CPM — slack ===== */
  E.registerFamily({
    familyId: 'cpm',
    make: function (rng, node, knobs) {
      var d = [];
      for (var i = 0; i < DAG.length; i++) d.push(rng.int(2, 12));
      var p1 = d[0] + d[2] + d[4], p2 = d[1] + d[3] + d[4];
      if (p1 === p2) return null;
      var slack = Math.abs(p1 - p2);
      var slowPath = p1 > p2 ? PATHS[1] : PATHS[0];
      var crit = p1 > p2 ? PATHS[0] : PATHS[1];
      var act = rng.pick(slowPath);
      var visual = pertVisual(d, crit);
      return {
        format: 'numeric',
        promptText: 'Durasi aktivitas: A=' + d[0] + ', B=' + d[1] + ', C=' + d[2] + ', D=' + d[3] + ', E=' + d[4] + ' hari. Berapa SLACK aktivitas ' + act + ' (aktivitas non-kritis)?',
        visual: visual,
        answer: { value: slack, tol: 0.01 },
        solution: steps('Slack (kelonggaran)', [
          st('Jalur kritis: ' + crit.join('–') + ' = ' + Math.max(p1, p2) + ' hari. Jalur ' + slowPath.join('–') + ' = ' + Math.min(p1, p2) + ' hari.'),
          st('Slack seluruh aktivitas di jalur non-kritis = ' + Math.max(p1, p2) + ' − ' + Math.min(p1, p2) + ' = ' + slack + ' hari.')],
        slack + ' hari', 'Slack = ruang napas tanpa menunda proyek. Aktivitas kritis slack-nya nol.')
      };
    }
  });

  /* ===== helper: graph & algo ===== */
  function graphInstance(rng) {
    var edges = [
      [0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4]
    ].map(function (e) { return { u: e[0], v: e[1], w: rng.int(2, 12) }; });
    // dijkstra 0->4
    var dist = [0, Infinity, Infinity, Infinity, Infinity], prev = [-1, -1, -1, -1, -1];
    var visited = [false, false, false, false, false];
    for (var it = 0; it < 5; it++) {
      var u = -1;
      for (var i = 0; i < 5; i++) if (!visited[i] && (u === -1 || dist[i] < dist[u])) u = i;
      if (u === -1 || dist[u] === Infinity) break;
      visited[u] = true;
      edges.forEach(function (e) {
        if (e.u === u && dist[u] + e.w < dist[e.v]) { dist[e.v] = dist[u] + e.w; prev[e.v] = u; }
        if (e.v === u && dist[u] + e.w < dist[e.u]) { dist[e.u] = dist[u] + e.w; prev[e.u] = u; }
      });
    }
    var path = [], cur = 4;
    while (cur !== -1) { path.unshift(cur); cur = prev[cur]; }
    // kruskal MST
    var parent = [0, 1, 2, 3, 4];
    function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    var mst = [], total = 0;
    edges.slice().sort(function (a, b) { return a.w - b.w; }).forEach(function (e) {
      var ru = find(e.u), rv = find(e.v);
      if (ru !== rv) { parent[ru] = rv; mst.push(e); total += e.w; }
    });
    return { edges: edges, dist: dist[4], path: path, mst: mst, mstTotal: total };
  }
  function graphVisual(g, highlight) {
    var pos = [[40, 130], [130, 50], [130, 210], [230, 120], [320, 60]];
    return { type: 'graph', caption: 'Jaringan (bobot = biaya ribu)', pos: pos, edges: g.edges, highlight: highlight || [] };
  }

  /* ===== T4: DIJKSTRA ===== */
  E.registerFamily({
    familyId: 'dijkstra',
    make: function (rng, node, knobs) {
      var g = graphInstance(rng);
      var askPath = rng.bool();
      var pathStr = g.path.map(function (p) { return p + 1; }).join('→');
      var visual = graphVisual(g, g.path);
      if (askPath) {
        return {
          format: 'mc', promptText: 'Jaringan 5 titik (lihat gambar, bobot = biaya). Rute TERMURAH dari titik 1 ke titik 5 adalah?',
          visual: visual,
          choices: [
            { label: pathStr, correct: true },
            { label: g.path.slice().reverse().map(function (p) { return p + 1; }).join('→'), correct: false, tag: 'arah rute terbalik' },
            { label: '1→2→4→5', correct: pathStr === '1→2→4→5', tag: 'cek total bobot jalur itu vs alternatif' }
          ],
          solution: steps('Dijkstra', [
            st('Dari titik 1, perbarui jarak tetangga terdekat bertahap: 2 = ' + (g.dist[1] || 0) + ' …'),
            st('Rute termurah: ' + pathStr + ' dengan total ' + g.dist + '.')],
          pathStr + ' (' + g.dist + ')', 'Dijkstra: "melebar dari sumber" selalu ambil simpul termurah dulu — greedy terbukti optimal.')
        };
      }
      return {
        format: 'numeric', promptText: 'Jaringan 5 titik (bobot = biaya ribu). Dengan Dijkstra, berapa TOTAL BIAYA TERMURAH dari titik 1 ke titik 5?',
        visual: visual,
        answer: { value: g.dist, tol: 0.01 },
        solution: steps('Dijkstra', [
          st('Jarak sementara: d(1)=0; relaksasi tepi satu per satu dari simpul termurah.'),
          st('Hasil akhir d(5) = ' + g.dist + ' lewat rute ' + g.path.map(function (p) { return p + 1; }).join('→') + '.')],
        String(g.dist), 'Dijkstra = GPS di dalam app logistik. Latih manual agar paham cara kerjanya.')
      };
    }
  });

  /* ===== T4: MST ===== */
  E.registerFamily({
    familyId: 'mst',
    make: function (rng, node, knobs) {
      var g = graphInstance(rng);
      var visual = graphVisual(g, g.mst.map(function (e) { return e.u; }).length ? g.mst : []);
      var mstEdges = g.mst.map(function (e) { return (e.u + 1) + '–' + (e.v + 1); }).join(', ');
      return {
        format: 'numeric',
        promptText: 'Jaringan 5 titik harus dihubungkan SEMUA dengan total biaya kabel minimum (spanning tree). Berapa TOTAL BOBOT Minimum Spanning Tree-nya?',
        visual: visual,
        answer: { value: g.mstTotal, tol: 0.01 },
        solution: steps('Kruskal (MST)', [
          st('Urutkan sisi dari termurah, ambil yang tidak membentuk siklus.'),
          st('Sisi terpilih: ' + mstEdges + ' → total = ' + g.mstTotal + '.')],
        String(g.mstTotal), 'MST = infrastruktur penghubung termurah (jaringan listrik, fiber, road access).')
      };
    }
  });

  /* ===== T4: ANTREAN — BIAYA SISTEM ===== */
  E.registerFamily({
    familyId: 'antCost',
    make: function (rng, node, knobs) {
      var lam = rng.pick([4, 5, 6, 8, 10]), mu = rng.pick([6, 8, 10, 12]);
      var rho = lam / mu;
      if (rho <= 0.4 || rho >= 0.95) return null;
      var Ls = rho / (1 - rho);
      if (Math.abs(Ls * 10 - Math.round(Ls * 10)) > 1e-9) return null;
      var Cw = rng.pick([10, 15, 20, 25]); // ribu/pelanggan/jam
      var Cs = rng.pick([40, 50, 60, 80]); // ribu/jam
      var ans = Cw * Ls + Cs;
      return {
        format: 'numeric',
        promptText: 'Layanan M/M/1: λ = ' + lam + '/jam, μ = ' + mu + '/jam. Biaya tunggu ' + Cw + ' ribu per pelanggan dalam sistem per jam; biaya operasi server ' + Cs + ' ribu/jam. Berapa TOTAL BIAYA SISTEM per jam (ribu, 2 desimal)?',
        promptLatex: 'TC=C_w\\cdot L_s+C_s\\;,\\;L_s=\\frac{\\rho}{1-\\rho}',
        answer: { value: ans, tol: 0.1 },
        solution: steps('Biaya sistem antrean', [
          st('ρ = ' + lam + '/' + mu + ' = ' + fx(rho, 2).replace(',', '.') + ' → Ls = ρ/(1−ρ) = ' + fx(Ls, 2).replace(',', '.') + ' pelanggan.'),
          st('TC = ' + Cw + ' × ' + fx(Ls, 2).replace(',', '.') + ' + ' + Cs + ' = ' + fx(ans, 2).replace(',', '.') + ' ribu/jam.')],
        fx(ans, 2), 'Trade-off klasik: server cepat mahal, pelanggan menunggu juga mahal. Optimasi = minim kombinasi.')
      };
    }
  });

  /* ===== T4: LITTLE'S LAW ===== */
  E.registerFamily({
    familyId: 'little',
    make: function (rng, node, knobs) {
      var lam = rng.pick([6, 8, 10, 12]); // per jam
      var W = rng.pick([0.25, 0.5, 0.75, 1, 1.5]); // jam
      var L = lam * W;
      var ask = rng.pick(['L', 'W', 'lam']);
      if (ask === 'L') {
        return {
          format: 'numeric', promptText: 'Pelanggan datang λ = ' + lam + '/jam dan rata-rata menghabiskan W = ' + W + ' jam di sistem. Berapa jumlah pelanggan dalam sistem L (Little\u2019s Law)?',
          promptLatex: 'L=\\lambda W',
          answer: { value: L, tol: 0.02 },
          solution: steps("Little's Law", [st('L = λ·W = ' + lam + ' × ' + W + ' = ' + L + ' pelanggan.')],
          fx(L, 2), 'L = λW berlaku untuk hampir semua sistem antrean stabil — hukum alam operasi.')
        };
      }
      if (ask === 'W') {
        return {
          format: 'numeric', promptText: 'Di sistem stabil, L = ' + L + ' pelanggan dan λ = ' + lam + '/jam. Berapa waktu rata-rata dalam sistem W (jam)?',
          promptLatex: 'W=\\frac{L}{\\lambda}',
          answer: { value: W, tol: 0.02 },
          solution: steps("Little's Law", [st('W = L/λ = ' + L + '/' + lam + ' = ' + W + ' jam.')],
          fx(W, 2), 'Little\u2019s Law menghubungkan 3 besaran; yang mana pun bisa dicari.')
        };
      }
      return {
        format: 'numeric', promptText: 'Sistem berisi rata-rata L = ' + L + ' pelanggan, masing-masing W = ' + W + ' jam. Berapa laju kedatangan λ (per jam)?',
        promptLatex: '\\lambda=\\frac{L}{W}',
        answer: { value: lam, tol: 0.02 },
        solution: steps("Little's Law", [st('λ = L/W = ' + L + '/' + W + ' = ' + lam + ' per jam.')],
        String(lam), 'Rumus sejekat tapi ampuh — dipakai dari rumah sakit sampai DevOps.')
      };
    }
  });

  /* ===== T4: EOQ PRODUKSI ===== */
  E.registerFamily({
    familyId: 'eoqProd',
    make: function (rng, node, knobs) {
      var d = rng.pick([10, 12, 15, 20, 24, 30]);   // permintaan harian
      var p = d * rng.pick([2, 2.5, 3, 4]);
      if (p !== Math.round(p)) return null;
      var S = rng.pick([50, 60, 75, 90]);            // setup cost ribu
      var H = rng.pick([2, 3, 4, 5]);                // holding ribu/unit/tahun
      var D = d * 250;
      var q = Math.sqrt(2 * D * S / (H * (1 - d / p)));
      var qR = Math.round(q * 10) / 10;
      var ctx = E.context(rng, node.id);
      return {
        format: 'numeric',
        promptText: ctx.place + ' memproduksi sendiri ' + ctx.items[0] + ': permintaan ' + d + ' ' + ctx.unit + '/hari, kapasitas produksi ' + p + ' ' + ctx.unit + '/hari (250 hari kerja), biaya setup S = ' + S + ' ribu, biaya simpan H = ' + H + ' ribu/unit/tahun. Berapa lot produksi ekonomis (EPQ, 1 desimal)?',
        promptLatex: 'Q^*=\\sqrt{\\frac{2DS}{H\\left(1-d/p\\right)}}',
        answer: { value: qR, tol: Math.max(0.6, qR * 0.02) },
        solution: steps('Economic Production Quantity', [
          st('D = ' + d + ' × 250 = ' + D + ' unit/tahun; 1 − d/p = 1 − ' + d + '/' + p + ' = ' + fx(1 - d / p, 3).replace(',', '.') + '.'),
          st('Q* = √(2×' + D + '×' + S + '/(' + H + '×' + fx(1 - d / p, 3).replace(',', '.') + ')) = ' + fx(qR, 1).replace(',', '.') + ' ' + ctx.unit + '.')],
        fx(qR, 1), 'EPQ: saat produksi bertahap, stok terisi pelan → holding efektif turun faktor (1−d/p).')
      };
    }
  });

  /* ===== T4: ROP + SAFETY STOCK ===== */
  E.registerFamily({
    familyId: 'rop',
    make: function (rng, node, knobs) {
      var d = rng.pick([20, 25, 30, 40, 50]);
      var LT = rng.pick([4, 5, 9, 10]);
      var sd = rng.pick([2, 4, 5]);
      var zRow = rng.pick([[1.28, '90%'], [1.65, '95%'], [2.05, '96%'], [2.33, '99%']]);
      var z = zRow[0];
      var ss = z * sd * Math.sqrt(LT);
      var rop = d * LT + ss;
      if (Math.abs(rop - Math.round(rop)) > 1e-9 && Math.abs(rop * 10 - Math.round(rop * 10)) > 1e-9) return null;
      var visual = { type: 'table', caption: 'Tabel z (service level)', head: ['Service', 'z'], rows: [['90%', '1,28'], ['95%', '1,65'], ['96%', '2,05'], ['99%', '2,33']] };
      return {
        format: 'numeric',
        promptText: 'Permintaan harian d = ' + d + ' unit (sd harian ' + sd + '), lead time pemasok LT = ' + LT + ' hari. Manajemen ingin tingkat layanan (service level) ' + zRow[1] + '. Berapa TITIK PEMESANAN ULANG (reorder point, ROP)?',
        promptLatex: 'ROP=d\\cdot LT+z\\cdot\\sigma_d\\sqrt{LT}',
        visual: visual,
        answer: { value: rop, tol: 0.3 },
        solution: steps('Reorder point', [
          st('Pemakaian selama LT: ' + d + ' × ' + LT + ' = ' + d * LT + ' unit.'),
          st('Safety stock = z·σ·√LT = ' + z.toFixed(2).replace('.', ',') + ' × ' + sd + ' × √' + LT + ' = ' + fx(ss, 2).replace(',', '.') + '.'),
          st('ROP = ' + d * LT + ' + ' + fx(ss, 2).replace(',', '.') + ' = ' + fx(rop, 2).replace(',', '.') + ' unit.')],
        fx(rop, 2), 'ROP = "pesan saat stok menyentuh gar ini": pemakaian LT + bantalan ketidakpastian.')
      };
    }
  });

  /* ===== T4: FORECASTING — MOVING AVERAGE ===== */
  E.registerFamily({
    familyId: 'fma',
    make: function (rng, node, knobs) {
      var w1 = rng.int(3, 4);
      var data = [];
      for (var i = 0; i < 5; i++) data.push(rng.int(30, 90));
      var w = rng.pick([3, 4]);
      var last = data.slice(-w);
      var ans = last.reduce(function (a, b) { return a + b; }, 0) / w;
      if (Math.abs(ans * 10 - Math.round(ans * 10)) > 1e-9 && w === 3 && (last[0] + last[1] + last[2]) % 3 !== 0) {
        // pastikan hasil 1-2 desimal bersih
        var sum3 = last[0] + last[1] + last[2];
        data[4] = data[4] + ((3 - (sum3 % 3)) % 3);
        last = data.slice(-3);
        ans = (last[0] + last[1] + last[2]) / 3;
        w = 3;
      }
      var visual = { type: 'table', caption: 'Permintaan aktual per minggu', head: ['M1', 'M2', 'M3', 'M4', 'M5'], rows: [data.map(String)] };
      return {
        format: 'numeric',
        promptText: 'Dengan moving average ' + (w === 3 ? '3' : '4') + '-periode, berapa peramalan (forecast) minggu ke-6?',
        promptLatex: 'F_{t}=\\frac{D_{t-1}+D_{t-2}+D_{t-3}}{3}',
        visual: visual,
        answer: { value: ans, tol: 0.05 },
        solution: steps('Moving average', [
          st('Ambil ' + w + ' data terakhir: ' + last.join(', ') + '.'),
          st('F = rata-ratanya = ' + last.join('+') + ' ÷ ' + w + ' = ' + fx(ans, 2).replace(',', '.') + '.')],
        fx(ans, 2), 'Moving average menghaluskan fluktuasi; makin besar n, makin lambat merespons tren.')
      };
    }
  });

  /* ===== T4: FORECASTING — EXPONENTIAL SMOOTHING ===== */
  E.registerFamily({
    familyId: 'fes',
    make: function (rng, node, knobs) {
      var F1 = rng.int(40, 60);
      var D1 = rng.int(30, 80), D2 = rng.int(30, 80);
      var alphas = [0.2, 0.3, 0.4, 0.5];
      var al = rng.pick(alphas);
      var F2 = al * D1 + (1 - al) * F1;
      var F3 = al * D2 + (1 - al) * F2;
      var ans = Math.round(F3 * 100) / 100;
      if (Math.abs(ans * 100 - Math.round(ans * 100)) > 1e-9) return null;
      var visual = { type: 'table', caption: 'Data peramalan', head: ['Periode', 'Aktual D', 'Forecast F'], rows: [['1', String(D1), fx(F1, 2)], ['2', String(D2), fx(F2, 2)]] };
      return {
        format: 'numeric',
        promptText: 'Exponential smoothing dengan α = ' + al.toFixed(1).replace('.', ',') + '. F₁ = ' + F1 + '. Berapa F₃ (peramalan periode 3)? (2 desimal)',
        promptLatex: 'F_{t+1}=\\alpha D_t+(1-\\alpha)F_t',
        visual: visual,
        answer: { value: ans, tol: 0.05 },
        solution: steps('Exponential smoothing', [
          st('F₂ = ' + al + '×' + D1 + ' + ' + (1 - al).toFixed(1).replace('.', ',') + '×' + F1 + ' = ' + fx(F2, 2).replace(',', '.') + '.'),
          st('F₃ = ' + al + '×' + D2 + ' + ' + (1 - al).toFixed(1).replace('.', ',') + '×' + fx(F2, 2).replace(',', '.') + ' = ' + fx(F3, 2).replace(',', '.') + '.')],
        fx(ans, 2), 'ES memberi bobot menurun secara eksponensial ke data lama; α besar = responsif, α kecil = halus.')
      };
    }
  });

  /* ===== T4: MAPE ===== */
  E.registerFamily({
    familyId: 'fmape',
    make: function (rng, node, knobs) {
      var A = [], F = [];
      for (var i = 0; i < 4; i++) {
        var a = rng.int(40, 100);
        var off = rng.int(-8, 8);
        A.push(a); F.push(a + off);
      }
      var errs = A.map(function (a, i) { return Math.abs(a - F[i]) / a; });
      var mape = errs.reduce(function (x, y) { return x + y; }, 0) / 4 * 100;
      var ans = Math.round(mape * 10) / 10;
      var visual = { type: 'table', caption: 'Aktual vs Forecast', head: ['Periode', 'Aktual', 'Forecast'], rows: A.map(function (a, i) { return [String(i + 1), String(a), String(F[i])]; }) };
      return {
        format: 'numeric', promptText: 'Hitung MAPE (Mean Absolute Percentage Error) dari tabel (persen, 1 desimal).',
        promptLatex: 'MAPE=\\frac{1}{n}\\sum\\left|\\frac{A_t-F_t}{A_t}\\right|\\times100\\%',
        visual: visual,
        answer: { value: ans, tol: 0.3 },
        solution: steps('MAPE', [
          st('Error relatif tiap periode: ' + errs.map(function (e) { return fx(e * 100, 1).replace(',', '.') + '%'; }).join('; ') + '.'),
          st('Rata-rata × 100% = ' + fx(ans, 1).replace(',', '.') + '%.')],
        fx(ans, 1) + '%', 'MAPE membandingkan kualitas peramalan lintas skala. <10% sangat bagus, >50% gawat.')
      };
    }
  });

  /* ===== T4: KEANDALAN — MTBF & AVAILABILITY ===== */
  E.registerFamily({
    familyId: 'mtbf',
    make: function (rng, node, knobs) {
      var mode = rng.bool();
      if (mode) {
        var op = rng.pick([400, 600, 800, 1000, 1200]); // jam operasi
        var fails = rng.pick([2, 4, 5, 8, 10]);
        var mtbf = op / fails;
        if (Math.abs(mtbf - Math.round(mtbf)) > 1e-9) return null;
        return {
          format: 'numeric', promptText: 'Mesin beroperasi total ' + op + ' jam dalam setahun dan mengalami ' + fails + ' kegagalan. Berapa MTBF (mean time between failures, jam)?',
          promptLatex: 'MTBF=\\frac{waktu\\;operasi}{jumlah\\;kegagalan}',
          answer: { value: mtbf, tol: 0.01 },
          solution: steps('MTBF', [st('MTBF = ' + op + ' ÷ ' + fails + ' = ' + mtbf + ' jam antar kegagalan.')],
          String(mtbf), 'MTBF = rata-rata usia antar kerusakan — metrik perawatan dasar.')
        };
      }
      var mtbf2 = rng.pick([100, 150, 200, 250]);
      var mttr = rng.pick([2, 5, 10]);
      var av = mtbf2 / (mtbf2 + mttr) * 100;
      var ans = Math.round(av * 10) / 10;
      return {
        format: 'numeric', promptText: 'MTBF = ' + mtbf2 + ' jam, MTTR (mean time to repair) = ' + mttr + ' jam. Berapa AVAILABILITY mesin (persen, 1 desimal)?',
        promptLatex: 'A=\\frac{MTBF}{MTBF+MTTR}\\times100\\%',
        answer: { value: ans, tol: 0.2 },
        solution: steps('Availability', [st('A = ' + mtbf2 + '/(' + mtbf2 + '+' + mttr + ') = ' + fx(ans, 1).replace(',', '.') + '%.')],
        fx(ans, 1) + '%', 'Availability menggabungkan keandalan (MTBF) dan perawatan (MTTR).')
      };
    }
  });

  /* ===== T4: KEANDALAN SERI-PARALEL ===== */
  E.registerFamily({
    familyId: 'relsys',
    make: function (rng, node, knobs) {
      var R = [rng.pick([0.9, 0.95, 0.8]), rng.pick([0.9, 0.95, 0.85]), rng.pick([0.9, 0.95, 0.85])];
      var mode = rng.pick(['seri', 'paralel', 'sp']);
      if (mode === 'seri') {
        var rs = R[0] * R[1];
        return {
          format: 'numeric', promptText: 'Dua komponen DIRANNTAI (series): R₁ = ' + R[0].toFixed(2).replace('.', ',') + ', R₂ = ' + R[1].toFixed(2).replace('.', ',') + '. Berapa keandalan sistem (3 desimal)?',
          promptLatex: 'R_s=R_1\\times R_2',
          answer: { value: rs, tol: 0.005 },
          solution: steps('Sistem seri', [st('Semua komponen harus hidup: Rs = ' + R[0] + ' × ' + R[1] + ' = ' + rs.toFixed(3).replace('.', ',') + '.')],
          rs.toFixed(3).replace('.', ','), 'Seri = rantai: selemah mata rantai terlemah (hasil kali selalu < terkecil).')
        };
      }
      if (mode === 'paralel') {
        var rp = 1 - (1 - R[0]) * (1 - R[1]);
        return {
          format: 'numeric', promptText: 'Dua komponen PARALEL (redundan): R₁ = ' + R[0].toFixed(2).replace('.', ',') + ', R₂ = ' + R[1].toFixed(2).replace('.', ',') + '. Berapa keandalan sistem (3 desimal)?',
          promptLatex: 'R_p=1-(1-R_1)(1-R_2)',
          answer: { value: rp, tol: 0.005 },
          solution: steps('Sistem paralel', [
            st('Hitung peluang keduanya mati: (1−' + R[0] + ')(1−' + R[1] + ') = ' + ((1 - R[0]) * (1 - R[1])).toFixed(3).replace('.', ',') + '.'),
            st('Rp = 1 − itu = ' + rp.toFixed(3).replace('.', ',') + '.')],
          rp.toFixed(3).replace('.', ','), 'Paralel = cadangan: lebihandal dari komponen terbaiknya.')
        };
      }
      // seri dari (A paralel B) dan C
      var rsp = (1 - (1 - R[0]) * (1 - R[1])) * R[2];
      return {
        format: 'numeric',
        promptText: 'Sistem: komponen 1 dan 2 paralel, hasilnya dirantai seri dengan komponen 3. R₁ = ' + R[0].toFixed(2).replace('.', ',') + ', R₂ = ' + R[1].toFixed(2).replace('.', ',') + ', R₃ = ' + R[2].toFixed(2).replace('.', ',') + '. Keandalan sistem (3 desimal)?',
        promptLatex: 'R_s=\\left[1-(1-R_1)(1-R_2)\\right]\\times R_3',
        answer: { value: rsp, tol: 0.005 },
        solution: steps('Kombinasi seri-paralel', [
          st('Bagian paralel: 1 − (1−' + R[0] + ')(1−' + R[1] + ') = ' + (1 - (1 - R[0]) * (1 - R[1])).toFixed(3).replace('.', ',') + '.'),
          st('Seri dengan R₃: × ' + R[2] + ' = ' + rsp.toFixed(3).replace('.', ',') + '.')],
        rsp.toFixed(3).replace('.', ','), 'Pecah sistem jadi blok seri-paralel, hitung dari dalam ke luar.')
      };
    }
  });

  /* ===== T4: CONTROL CHART X̄ ===== */
  E.registerFamily({
    familyId: 'spc',
    make: function (rng, node, knobs) {
      var cl = rng.int(30, 60);
      var sd = rng.pick([1, 2]);
      var n = 5;
      var A2 = 0.577;
      var Rbar = sd * Math.sqrt(n) * Math.sqrt(2 / Math.PI) * 1.05; // aproksimasi
      Rbar = Math.round(Rbar * 10) / 10;
      var ucl = cl + A2 * Rbar, lcl = cl - A2 * Rbar;
      var pts = [];
      for (var i = 0; i < 8; i++) pts.push(Math.round((cl + (rng.int(-15, 15) / 10) * sd / Math.sqrt(n) * 3) * 100) / 100);
      var outIdx = rng.int(2, 7);
      var outAbove = rng.bool();
      pts[outIdx] = outAbove ? ucl + 0.8 : lcl - 0.8;
      var visual = { type: 'spc', caption: 'Control chart X̄ (sampel per jam)', cl: cl, ucl: ucl, lcl: lcl, pts: pts };
      var askUcl = rng.bool();
      if (askUcl) {
        return {
          format: 'numeric', promptText: 'Control chart X̄ dengan x̿ = ' + cl + ', R̄ = ' + Rbar + ', n = 5 (faktor A₂ = 0,577). Berapa UCL (batas kendali atas, 2 desimal)?',
          promptLatex: 'UCL=\\bar{\\bar{x}}+A_2\\bar{R}',
          answer: { value: ucl, tol: 0.1 },
          solution: steps('Batas kendali', [st('UCL = ' + cl + ' + 0,577 × ' + Rbar + ' = ' + fx(ucl, 2).replace(',', '.') + '; LCL = ' + fx(lcl, 2).replace(',', '.') + '.')],
          fx(ucl, 2), 'Peta kendali = deteksi dini proses "keluar kendali" sebelum produk cacat.')
        };
      }
      return {
        format: 'mc', promptText: 'Lihat control chart. Apa interpretasi yang TEPAT?',
        visual: visual,
        choices: [
          { label: 'Ada titik di luar batas kendali → proses out of control, hentikan & selidiki', correct: true },
          { label: 'Semua titik aman karena mayoritas di dalam batas', correct: false, tag: 'satu titik keluar batas sudah cukup sebagai sinyal' },
          { label: 'Proses out of control karena semua variasi harus nol', correct: false, tag: 'variasi wajar selalu ada — yang diawasi adalah pola tak wajar' }
        ],
        solution: steps('Membaca control chart', [
          st('Aturan 1 Western Electric: 1 titik di luar 3σ → sinyal out of control.'),
          st('Titik ke-' + (outIdx + 1) + ' (' + fx(pts[outIdx], 1).replace(',', '.') + ') melewati ' + (outAbove ? 'UCL' : 'LCL') + '.')],
        'Out of control → cari special cause', 'SPC: bedakan variasi umum (common) vs khusus (special). Titik keluar batas = special cause.')
      };
    }
  });

  /* ===== T4: Cp/Cpk ===== */
  E.registerFamily({
    familyId: 'cpk',
    make: function (rng, node, knobs) {
      var LSL = rng.int(20, 40), USL = LSL + rng.pick([10, 15, 20, 25]);
      var mu = LSL + Math.round((USL - LSL) * rng.pick([0.4, 0.5, 0.6]));
      var sd = rng.pick([1, 1.5, 2, 2.5]);
      var cp = (USL - LSL) / (6 * sd);
      var cpk = Math.min(USL - mu, mu - LSL) / (3 * sd);
      var askCp = rng.bool();
      var ans = Math.round((askCp ? cp : cpk) * 100) / 100;
      return {
        format: 'numeric',
        promptText: 'Spesifikasi produk: LSL = ' + LSL + ', USL = ' + USL + '. Proses: μ = ' + mu + ', σ = ' + sd.toFixed(1).replace('.', ',') + '. Berapa ' + (askCp ? 'Cp' : 'Cpk') + ' (2 desimal)?',
        promptLatex: askCp ? 'C_p=\\frac{USL-LSL}{6\\sigma}' : 'C_{pk}=\\min\\left(\\frac{USL-\\mu}{3\\sigma},\\frac{\\mu-LSL}{3\\sigma}\\right)',
        answer: { value: ans, tol: 0.03 },
        solution: steps('Process capability', [
          st(askCp ? 'Cp = (' + USL + '−' + LSL + ')/(6×' + sd + ') = ' + ans.toFixed(2).replace('.', ',') + ' — potensi proses jika terpusat.'
            : 'Jarak ke batas terdekat: min(' + USL + '−' + mu + ', ' + mu + '−' + LSL + ') = ' + Math.min(USL - mu, mu - LSL) + '; Cpk = itu / (3σ) = ' + ans.toFixed(2).replace('.', ',') + '.')],
        ans.toFixed(2), 'Cp ≥ 1,33 = mampu; Cpk memperhitungkan pusat proses — selalu ≤ Cp.')
      };
    }
  });

  /* ===== T4: EKONOMI — F/P & P/F ===== */
  E.registerFamily({
    familyId: 'efp',
    make: function (rng, node, knobs) {
      var P = rng.pick([10, 20, 25, 40, 50, 100]); // juta
      var i = rng.pick([0.05, 0.08, 0.1, 0.12]);
      var n = rng.int(2, 5);
      var F = P * Math.pow(1 + i, n);
      var askF = rng.bool();
      var ans = askF ? F : P;
      if (askF) {
        return {
          format: 'numeric', promptText: 'Investasi hari ini ' + U.fmtID(P, 0) + ' juta, bunga majemuk ' + Math.round(i * 100) + '% per tahun. Berapa nilai di tahun ke-' + n + ' (juta, 2 desimal)?',
          promptLatex: 'F=P(1+i)^n',
          answer: { value: F, tol: Math.max(0.1, F * 0.01) },
          solution: steps('Faktor F/P', [st('F = ' + P + '×(1+' + (i * 100) + '%)^' + n + ' = ' + P + '×' + Math.pow(1 + i, n).toFixed(4).replace('.', ',') + ' = ' + fx(F, 2).replace(',', '.') + ' juta.')],
          fx(F, 2) + ' juta', 'Uang punya waktu-harga: F = P(1+i)ⁿ — induk semua ekonomi teknik.')
        };
      }
      var F2 = rng.pick([50, 80, 100, 150, 200]);
      var P2 = F2 / Math.pow(1 + i, n);
      return {
        format: 'numeric', promptText: 'Anda ingin punya ' + U.fmtID(F2, 0) + ' juta pada tahun ke-' + n + ', bunga ' + Math.round(i * 100) + '%/tahun. Berapa harus diinvestasikan SEKARANG (juta, 2 desimal)?',
        promptLatex: 'P=\\frac{F}{(1+i)^n}',
        answer: { value: P2, tol: Math.max(0.1, P2 * 0.01) },
        solution: steps('Faktor P/F', [st('P = ' + F2 + '/(1+' + (i * 100) + '%)^' + n + ' = ' + F2 + '/' + Math.pow(1 + i, n).toFixed(4).replace('.', ',') + ' = ' + fx(P2, 2).replace(',', '.') + ' juta.')],
        fx(P2, 2) + ' juta', 'P/F = F dibalik waktu. Diskonto membuat masa depan lebih murah dari kelihatannya.')
      };
    }
  });

  /* ===== T4: ANUITAS ===== */
  E.registerFamily({
    familyId: 'eann',
    make: function (rng, node, knobs) {
      var A = rng.pick([5, 8, 10, 12, 20]); // juta/tahun
      var i = rng.pick([0.05, 0.08, 0.1]);
      var n = rng.int(3, 6);
      var F = A * ((Math.pow(1 + i, n) - 1) / i);
      return {
        format: 'numeric', promptText: 'Menabung ' + U.fmtID(A, 0) + ' juta DI AKHIR setiap tahun, bunga ' + Math.round(i * 100) + '%/tahun, selama ' + n + ' tahun. Berapa total di akhir tahun ke-' + n + ' (juta, 2 desimal)?',
        promptLatex: 'F=A\\frac{(1+i)^n-1}{i}',
        answer: { value: F, tol: Math.max(0.2, F * 0.01) },
        solution: steps('Anuitas (F/A)', [
          st('Faktor = ((1+i)ⁿ−1)/i = (' + Math.pow(1 + i, n).toFixed(4).replace('.', ',') + '−1)/' + i + ' = ' + ((Math.pow(1 + i, n) - 1) / i).toFixed(4).replace('.', ',') + '.'),
          st('F = ' + A + ' × faktor = ' + fx(F, 2).replace('.', ',') + ' juta.')],
        fx(F, 2) + ' juta', 'Menabung rutin = mesin majemuk. Faktor F/A menjumlah tabungan+bunga otomatis.')
      };
    }
  });

  /* ===== T4: NPV ===== */
  E.registerFamily({
    familyId: 'npv',
    make: function (rng, node, knobs) {
      var I = rng.pick([100, 150, 200, 250]); // juta
      var i = rng.pick([0.08, 0.1, 0.12]);
      var cfs = [];
      var factors = [];
      for (var t = 1; t <= 4; t++) {
        var cf = rng.int(30, 80);
        cfs.push(cf);
        factors.push(Math.round(1 / Math.pow(1 + i, t) * 10000) / 10000);
      }
      var npv = -I;
      cfs.forEach(function (cf, t) { npv += cf * factors[t]; });
      var visual = { type: 'table', caption: 'Arus kas & faktor diskonto (P/F, i=' + Math.round(i * 100) + '%)', head: ['Tahun', 'CF (juta)', 'P/F'], rows: cfs.map(function (cf, t) { return [String(t + 1), String(cf), factors[t].toFixed(4).replace('.', ',')]; }) };
      return {
        format: 'numeric',
        promptText: 'Investasi awal ' + U.fmtID(I, 0) + ' juta, arus kas tahunan di tabel (faktor diskonto disediakan). Berapa NPV (juta, 2 desimal)?',
        promptLatex: 'NPV=-I+\\sum CF_t\\,(P/F)',
        visual: visual,
        answer: { value: npv, tol: Math.max(0.3, Math.abs(npv) * 0.01) },
        solution: steps('Net Present Value', [
          st('Diskonto tiap CF: ' + cfs.map(function (cf, t) { return cf + '×' + factors[t].toFixed(4).replace('.', ','); }).join(' + ') + '.'),
          st('NPV = −' + I + ' + ' + fx(cfs.reduce(function (a, cf, t) { return a + cf * factors[t]; }, 0), 2).replace(',', '.') + ' = ' + fx(npv, 2).replace(',', '.') + ' juta.')],
        fx(npv, 2) + (npv > 0 ? ' → layak' : ' → tidak layak'), 'NPV > 0 = menciptakan nilai; satu angka untuk memutuskan investasi.')
      };
    }
  });

  /* ===== T4: PAYBACK ===== */
  E.registerFamily({
    familyId: 'payback',
    make: function (rng, node, knobs) {
      var I = rng.pick([100, 120, 150, 200]);
      var cf1 = rng.int(30, 60), cf2 = rng.int(30, 60), cf3 = rng.int(40, 80), cf4 = rng.int(40, 80);
      var cums = [cf1, cf1 + cf2, cf1 + cf2 + cf3, cf1 + cf2 + cf3 + cf4];
      if (cums[1] >= I || cums[2] < I) return null; // payback jatuh di tahun 3
      var remain = I - cums[1];
      var pb = 2 + remain / cf3;
      var ans = Math.round(pb * 100) / 100;
      var visual = { type: 'table', caption: 'Arus kas (juta)', head: ['Tahun', 'CF', 'Kumulatif'], rows: [[1, cf1, cums[0]], [2, cf2, cums[1]], [3, cf3, cums[2]], [4, cf4, cums[3]]].map(function (r) { return r.map(String); }) };
      return {
        format: 'numeric', promptText: 'Investasi ' + U.fmtID(I, 0) + ' juta dengan arus kas di tabel. Berapa PAYBACK PERIOD (tahun, 2 desimal)?',
        visual: visual,
        answer: { value: ans, tol: 0.06 },
        solution: steps('Payback period', [
          st('Kumulatif: ' + cums.join(', ') + ' — investasi terlampaui di tahun ke-3.'),
          st('Sisa setelah tahun 2 = ' + I + ' − ' + cums[1] + ' = ' + remain + '; dibagi CF tahun 3 = ' + cf3 + '.'),
          st('Payback = 2 + ' + remain + '/' + cf3 + ' = ' + fx(ans, 2).replace(',', '.') + ' tahun.')],
        fx(ans, 2) + ' tahun', 'Payback = kecepatan uang kembali. Sederhana, tapi mengabaikan nilai waktu & tahun-tahun akhir.')
      };
    }
  });

  /* ===== T4: DEPRESIASI GARIS LURUS ===== */
  E.registerFamily({
    familyId: 'dep',
    make: function (rng, node, knobs) {
      var C = rng.pick([80, 120, 150, 200, 250]); // juta
      var Sv = rng.pick([10, 15, 20, 25]);
      var n = rng.pick([5, 8, 10]);
      var D = (C - Sv) / n;
      if (Math.abs(D * 100 - Math.round(D * 100)) > 1e-9) return null;
      return {
        format: 'numeric', promptText: 'Mesin harga ' + U.fmtID(C, 0) + ' juta, nilai sisa (salvage) ' + U.fmtID(Sv, 0) + ' juta, umur ' + n + ' tahun. Berapa depresiasi TAHUNAN (garis lurus / straight line, juta)?',
        promptLatex: 'D=\\frac{C-S_v}{n}',
        answer: { value: D, tol: 0.05 },
        solution: steps('Depresiasi garis lurus', [st('D = (' + C + ' − ' + Sv + ')/' + n + ' = ' + D + ' juta per tahun.')],
        fx(D, 2) + ' juta/tahun', 'Yang didepresiasikan adalah harga − nilai sisa, dibagi rata umur ekonomis.')
      };
    }
  });

  /* ===== UNIVERSAL: MARGIN & MARKUP ===== */
  E.registerFamily({
    familyId: 'margin',
    make: function (rng, node, knobs) {
      var c = rng.pick([40, 50, 60, 80, 100]) * 1000;
      var mk = rng.pick([0.25, 0.5, 0.75, 1]);
      var p = c * (1 + mk);
      if (Math.abs(p - Math.round(p)) > 1e-9) return null;
      var askMargin = rng.bool();
      var ans = askMargin ? (p - c) / p * 100 : (p - c) / c * 100;
      return {
        format: 'numeric',
        promptText: 'Harga beli ' + U.rupiah(c) + ', harga jual ' + U.rupiah(p) + '. Berapa ' + (askMargin ? 'MARGIN (atas harga jual)' : 'MARKUP (atas harga beli)') + ' (persen, 1 desimal)?',
        promptLatex: askMargin ? 'margin=\\frac{p-c}{p}' : 'markup=\\frac{p-c}{c}',
        answer: { value: ans, tol: 0.3 },
        solution: steps('Margin vs markup', [
          st('Laba = ' + U.fmtID(p - c, 0) + '.'),
          st(askMargin ? 'Margin = laba ÷ HARGA JUAL = ' + U.fmtID(p - c, 0) + '/' + U.fmtID(p, 0) + ' = ' + fx(ans, 1).replace(',', '.') + '%.'
            : 'Markup = laba ÷ HARGA BELI = ' + U.fmtID(p - c, 0) + '/' + U.fmtID(c, 0) + ' = ' + fx(ans, 1).replace(',', '.') + '%.')],
        fx(ans, 1) + '%', 'Markup 50% ≠ margin 50% — basis pembaginya beda. Salah pilih = salah pricing.')
      };
    }
  });

  /* ===== UNIVERSAL: PPN ===== */
  E.registerFamily({
    familyId: 'ppn',
    make: function (rng, node, knobs) {
      var base = rng.pick([120, 150, 200, 250, 300, 400, 500]) * 1000;
      var rate = rng.pick([10, 11, 12]);
      var ppn = base * rate / 100;
      var total = base + ppn;
      var askTotal = rng.bool();
      var ans = askTotal ? total : ppn;
      return {
        format: 'numeric',
        promptText: 'Harga barang (sebelum pajak) ' + U.rupiah(base) + '. PPN ' + rate + '%. Berapa ' + (askTotal ? 'TOTAL yang dibayar' : 'besar PPN-nya') + '?',
        answer: { value: ans, tol: Math.max(1, ans * 0.001) },
        solution: steps('PPN', [
          st('PPN = ' + rate + '% × ' + U.fmtID(base, 0) + ' = ' + U.fmtID(ppn, 0) + '.'),
          st(askTotal ? 'Total = ' + U.fmtID(base, 0) + ' + ' + U.fmtID(ppn, 0) + ' = ' + U.fmtID(total, 0) + '.' : 'Itu jawabannya.')],
        U.fmtID(ans, 0), 'PPN dipungut atas nilai tambah — konsumen akhir yang menanggung.')
      };
    }
  });

  /* ===== UNIVERSAL: BUNGA MAJEMUK ===== */
  E.registerFamily({
    familyId: 'majemuk',
    make: function (rng, node, knobs) {
      var P = rng.pick([1, 2, 4, 5, 8, 10]) * 1000000;
      var i = rng.pick([0.05, 0.1, 0.12]);
      var n = rng.int(2, 3);
      var F = P * Math.pow(1 + i, n);
      var simple = P * (1 + i * n);
      if (Math.abs(F - simple) < 1000) return null;
      return {
        format: 'numeric',
        promptText: 'Tabungan ' + U.rupiah(P) + ' dengan bunga MAJEMUK ' + Math.round(i * 100) + '%/tahun. Berapa saldo setelah ' + n + ' tahun? (pembulatan ke ribuan terdekat)',
        promptLatex: 'F=P(1+i)^n',
        answer: { value: Math.round(F / 1000) * 1000, tol: 5000 },
        solution: steps('Bunga majemuk', [
          st('Tahun 1: ' + U.fmtID(P * (1 + i), 0) + '; tahun ' + n + ': ' + U.fmtID(F, 0) + '.'),
          st('Bandingkan bunga sederhana: ' + U.fmtID(simple, 0) + ' — selisih ' + U.fmtID(F - simple, 0) + ' adalah bunga atas bunga.')],
        U.fmtID(F, 0), 'Majemuk = bunga berbunga. Selisih kecil di awal, luar biasa di tahun-tahun panjang.')
      };
    }
  });

  /* ===== UNIVERSAL: MEAN TERTIMBANG (IPK-style) ===== */
  E.registerFamily({
    familyId: 'weighted',
    make: function (rng, node, knobs) {
      var grades = [], sks = [];
      for (var i = 0; i < 4; i++) { grades.push(rng.int(3, 4)); sks.push(rng.pick([2, 3, 4])); }
      grades[0] = 4; // satu nilai A agar menarik
      var tot = grades.reduce(function (a, g, i2) { return a + g * sks[i2]; }, 0);
      var sksTot = sks.reduce(function (a, b) { return a + b; }, 0);
      var ip = tot / sksTot;
      if (Math.abs(ip * 100 - Math.round(ip * 100)) > 1e-9) return null;
      var visual = { type: 'table', caption: 'Nilai semester (A=4, B=3)', head: ['MK', 'Nilai', 'SKS'], rows: grades.map(function (g, i2) { return ['MK' + (i2 + 1), String(g), String(sks[i2])]; }) };
      return {
        format: 'numeric', promptText: 'Hitung rata-rata tertimbang (seperti IPK: nilai × SKS dibagi total SKS, 2 desimal).',
        promptLatex: '\\bar{x}_w=\\frac{\\sum w_i x_i}{\\sum w_i}',
        visual: visual,
        answer: { value: ip, tol: 0.02 },
        solution: steps('Mean tertimbang', [
          st('Σ(nilai×SKS) = ' + grades.map(function (g, i2) { return g + '×' + sks[i2]; }).join(' + ') + ' = ' + tot + '.'),
          st('Total SKS = ' + sksTot + ' → rata-rata = ' + fx(ip, 2).replace(',', '.') + '.')],
        fx(ip, 2), 'Mean tertimbang menghormati bobot: MK 4 SKS "lebih berbicara" daripada 2 SKS.')
      };
    }
  });

  /* ===== UNIVERSAL: KORELASI ≠ KAUSASI ===== */
  E.registerFamily({
    familyId: 'corr',
    make: function (rng, node, knobs) {
      var pool = [
        { s: 'Penjualan es krim dan kasus tenggelam naik bersamaan tiap musim panas', r: 'Korelasi kuat, tapi bukan sebab-akibat — variabel perancu (musim panas) mendorong keduanya' },
        { s: 'Jumlah pemadam kebakaran di lokasi kebakaran berkorelasi dengan besar kerugian', r: 'Korelasi positif, tapi pemadam bukan penyebab kerugian — besarnya kebakaran yang mendorong keduanya' },
        { s: 'Konsumsi kopi kampus dan IPK naik bersama saat masa ujian', r: 'Korelasi, tetapi bisa jadi keduanya dipengaruhi intensitas belajar (variabel perancu)' }
      ];
      var it = rng.pick(pool);
      return {
        format: 'mc', promptText: 'Data menunjukkan: ' + it.s + '. Interpretasi yang benar?',
        choices: [
          { label: it.r, correct: true },
          { label: 'Korelasi kuat membuktikan sebab-akibat', correct: false, tag: 'korelasi ≠ kausalitas' },
          { label: 'Tidak ada hubungan sama sekali', correct: false, tag: 'korelasi ada — yang salah adalah kesimpulan kausal' }
        ],
        solution: steps('Korelasi vs kausalitas', [
          st('Korelasi = bergerak bersama. Kausalitas = satu MENYEBABKAN yang lain.'),
          st('Sebelum menyimpulkan sebab-akibat, cari variabel perancu (confounder) & bukti mekanisme.')],
        it.r, 'Setiap klaim "X menyebabkan Y" dari data observasional patut dicurigai — tanya: perancunya apa?')
      };
    }
  });

  /* ===== T4: M/M/2 — MULTI SERVER (format steps, rumus disediakan) ===== */
  E.registerFamily({
    familyId: 'mms',
    make: function (rng, node, knobs) {
      var lam = rng.pick([6, 8, 9, 10, 12]);
      var mu = rng.pick([4, 5, 6]);
      var a = lam / mu;                 // offered load
      var rho = lam / (2 * mu);
      if (rho >= 0.9 || rho < 0.4) return null;
      var p0 = 1 / (1 + a + (a * a) / (2 * (1 - rho)));
      var Lq = p0 * a * a * rho / (2 * (1 - rho) * (1 - rho));
      var Wq = Lq / lam * 60;           // menit
      var Lq2 = Math.round(Lq * 100) / 100, Wq2 = Math.round(Wq * 10) / 10;
      if (Lq2 <= 0) return null;
      var ctx = rng.pick(['loket layanan', 'gerbang gudang', 'customer service']);
      return {
        format: 'steps',
        promptText: 'Antrean M/M/2 di ' + ctx + ': λ = ' + lam + '/jam, μ = ' + mu + '/jam per server (2 server paralel). Rumus (s=2): ρ = λ/(2μ); p0 = [1 + a + a²/(2(1−ρ))]⁻¹ dengan a = λ/μ; Lq = p0·a²·ρ/(2(1−ρ)²); Wq = Lq/λ. Isi tiga langkah.',
        promptLatex: 'L_q=p_0\\frac{a^2\\rho}{2!(1-\\rho)^2}',
        steps: [
          { label: 'utilisasi ρ = λ/(2μ)', value: Math.round(rho * 100) / 100, tol: 0.01 },
          { label: 'panjang antrean Lq (2 desimal)', value: Lq2, tol: 0.05 },
          { label: 'waktu tunggu Wq dalam MENIT (1 desimal)', value: Wq2, tol: Math.max(0.2, Wq2 * 0.03) }
        ],
        answer: { value: Lq2, tol: 0.05 },
        solution: steps('M/M/2 — dua server', [
          st('a = λ/μ = ' + lam + '/' + mu + ' = ' + fx(a, 3) + '; ρ = ' + lam + '/(2×' + mu + ') = ' + fx(rho, 2) + ' (stabil < 1).'),
          st('p0 = 1/[1 + ' + fx(a, 3) + ' + ' + fx(a * a, 2) + '/(2×' + fx(1 - rho, 2) + ')] = ' + fx(p0, 4) + '.'),
          st('Lq = ' + fx(p0, 4) + ' × ' + fx(a * a, 2) + ' × ' + fx(rho, 2) + '/(2×' + fx((1 - rho) * (1 - rho), 3) + ') = ' + fx(Lq2, 2) + '.'),
          st('Wq = Lq/λ = ' + fx(Lq2, 2) + '/' + lam + ' jam = ' + fx(Wq2, 1) + ' menit. (Little berlaku juga di sini.)')
        ], fx(Lq2, 2) + ' orang; Wq = ' + fx(Wq2, 1) + ' menit', 'Multi-server: pakai p0 & rumus Erlang — dengan 2 server, antrean jauh lebih pendek dari 2× satu server cepat.')
      };
    }
  });

  /* ===== T4: DUALITAS LP ===== */
  E.registerFamily({
    familyId: 'dual',
    make: function (rng, node, knobs) {
      var c1 = rng.int(3, 9), c2 = rng.int(3, 9);
      var a11 = rng.int(1, 5), a12 = rng.int(1, 5), a21 = rng.int(1, 5), a22 = rng.int(1, 5);
      var b1 = rng.int(20, 60), b2 = rng.int(20, 60);
      var primal = 'Maks Z = ' + c1 + 'x₁ + ' + c2 + 'x₂  s.t.  ' + a11 + 'x₁ + ' + a12 + 'x₂ ≤ ' + b1 + ';  ' + a21 + 'x₁ + ' + a22 + 'x₂ ≤ ' + b2 + ';  x ≥ 0';
      var dual = 'Min W = ' + b1 + 'y₁ + ' + b2 + 'y₂  s.t.  ' + a11 + 'y₁ + ' + a21 + 'y₂ ≥ ' + c1 + ';  ' + a12 + 'y₁ + ' + a22 + 'y₂ ≥ ' + c2 + ';  y ≥ 0';
      var w1 = 'Min W = ' + b1 + 'y₁ + ' + b2 + 'y₂  s.t.  ' + a11 + 'y₁ + ' + a12 + 'y₂ ≥ ' + b1 + ';  ' + a21 + 'y₁ + ' + a22 + 'y₂ ≥ ' + b2 + ';  y ≥ 0';
      var w2 = 'Maks W = ' + b1 + 'y₁ + ' + b2 + 'y₂  s.t.  ' + a11 + 'y₁ + ' + a21 + 'y₂ ≤ ' + c1 + ';  ' + a12 + 'y₁ + ' + a22 + 'y₂ ≤ ' + c2 + ';  y ≥ 0';
      return {
        format: 'mc',
        promptText: 'Tuliskan DUAL dari primal berikut: ' + primal,
        promptLatex: '\\max Z=' + c1 + 'x_1+' + c2 + 'x_2',
        choices: [
          { label: dual, correct: true },
          { label: w1, correct: false, tag: 'matriks tidak ditranspos (baris tidak menjadi kolom)' },
          { label: w2, correct: false, tag: 'arah Maks/Min dan tanda kendala tidak dibalik' }
        ],
        solution: steps('Dualitas', [
          st('Primal Maks dengan kendala ≤ → dual Min dengan kendala ≥.'),
          st('Koefisien tujuan dual = RHS primal (' + b1 + ', ' + b2 + '); RHS dual = koefisien tujuan primal (' + c1 + ', ' + c2 + ').'),
          st('Matriks kendala DITRANSPOS: kolom primal menjadi baris dual.'),
          st('Nilai optimal Z* = W* (strong duality) — y disebut harga bayangan (shadow price).')
        ], dual, 'Dual menjawab: "berapa nilai marginal tiap sumber daya?" Z* = W* selalu.')
      };
    }
  });

  /* ===== T4: EOQ QUANTITY DISCOUNT ===== */
  var DISC_COMBOS = (function () {
    var out = [];
    [1200, 2400, 3600, 4800].forEach(function (D) {
      [30, 45, 50, 60].forEach(function (S) {
        [5, 6, 10, 12].forEach(function (H) {
          var q = Math.sqrt(2 * D * S / H);
          if (Math.abs(q - Math.round(q)) < 1e-9) out.push({ D: D, S: S, H: H, q: Math.round(q) });
        });
      });
    });
    return out;
  })();
  E.registerFamily({
    familyId: 'disc',
    make: function (rng, node, knobs) {
      if (!DISC_COMBOS.length) return null;
      var comb = rng.pick(DISC_COMBOS);
      var D = comb.D, S = comb.S, H = comb.H;
      var q = comb.q;
      var price = rng.pick([20, 25, 40, 50]); // ribu/unit
      var disc = rng.pick([0.05, 0.1]);
      var Qd = Math.round(q * rng.pick([1.5, 2]));
      var H2 = H * (1 - disc);
      var tc1 = D / q * S + q / 2 * H + D * price;
      var tc2 = D / Qd * S + Qd / 2 * H2 + D * price * (1 - disc);
      var save = Math.round((tc1 - tc2) * 10) / 10;
      var take = save > 0;
      var ctx = E.context(rng, node.id);
      return {
        format: 'mc',
        promptText: ctx.place + ': D = ' + D + ' ' + ctx.unit + '/tahun, S = ' + S + ' ribu/pesan, H = ' + H + ' ribu/unit/tahun, harga beli ' + price + ' ribu/unit. EOQ = ' + q + '. Pemasok menawarkan diskon ' + (disc * 100) + '% dari harga (dan H turun ' + (disc * 100) + '%) jika pesan ≥ ' + Qd + ' ' + ctx.unit + '. Ambil diskian atau tetap di EOQ?',
        promptLatex: 'TC(Q)=\\frac{D}{Q}S+\\frac{Q}{2}H+D\\cdot p',
        choices: [
          { label: (take ? 'AMBIL diskon — total hemat ' + U.fmtID(save, 1) + ' ribu/tahun' : 'TETAP di EOQ — diskon justru lebih mahal ' + U.fmtID(-save, 1) + ' ribu/tahun'), correct: true },
          { label: (take ? 'TETAP di EOQ — diskon tidak pernah menguntungkan' : 'AMBIL diskon — diskon selalu menguntungkan'), correct: false, tag: 'bandingkan TOTAL biaya (pesan+simpan+beli) pada kedua opsi, jangan asumsi' },
          { label: 'AMBIL diskon tapi pesan tepat ' + Qd + ' hanya kalau stok habis', correct: false, tag: 'keputusan EOQ-diskon berbasis biaya tahunan, bukan momen pesan' }
        ],
        solution: steps('EOQ dengan quantity discount', [
          st('TC di EOQ = ' + D + '/' + q + '×' + S + ' + ' + q + '/2×' + H + ' + ' + D + '×' + price + ' = ' + fx(tc1, 1) + ' ribu.'),
          st('TC di Q = ' + Qd + ' (dengan harga & H turun ' + (disc * 100) + '%) = ' + fx(D / Qd * S + Qd / 2 * H2, 1) + ' + ' + fx(D * price * (1 - disc), 1) + ' = ' + fx(tc2, 1) + ' ribu.'),
          st('Selisih = ' + fx(save, 1) + ' ribu/tahun → ' + (take ? 'diskon layak diambil.' : 'tetap di EOQ lebih murah.'))],
        (take ? 'Ambil diskon (hemat ' + fx(save, 1) + ' ribu/tahun)' : 'Tetap EOQ'), 'Diskon besar Q memaksa simpan lebih banyak — hitung total biaya dua skenario, jangan terpikat potongan harga.')
      };
    }
  });

  /* ===== T4: KEBIJAKAN P vs Q (konseptual) ===== */
  E.registerFamily({
    familyId: 'pq',
    make: function (rng, node, knobs) {
      var pool = [
        { q: 'Item bernilai TINGGI dan kritis (mesin CNC, spare part mahal) dengan permintaan stabil. Sistem persediaan yang tepat?', o: [['Q kontinu — review terus-menerus + ROP', 1], ['P periodik — cek tiap bulan saja', 0, 'item bernilai tinggi butuh pengawasan ketat & stok pengaman kecil'], ['Tanpa sistem, pesan saat ingat', 0, 'kacau']] },
        { q: 'Item bernilai RENDAH (sekrup, kemasan) banyak jenis, tidak kritis. Sistem yang efisien?', o: [['P periodik — pesan serempak tiap periode tetap', 1], ['Q kontinu dengan ROP per item', 0, 'biaya administrasi review terus-menerus justru lebih mahal dari nilai itemnya'], ['Stok sebesar mungkin biar aman', 0, 'modal mati']] }
      ];
      var it = rng.pick(pool);
      return {
        format: 'mc', promptText: it.q,
        choices: it.o.map(function (x) { return { label: x[0], correct: !!x[1], tag: x[2] }; }),
        solution: steps('Kebijakan persediaan P vs Q', [
          st('Q (continuous review): pantau terus, pesan Q* saat stok sentuh ROP — pas untuk item bernilai tinggi.'),
          st('P (periodic review): cek & pesan tiap interval tetap — murah, pas untuk item bernilai rendah/banyak.')],
        'P vs Q dipilih dari nilai item vs biaya pengawasan', 'Prinsip: intensitas pengawasan sebanding dengan nilai item (ABC logic).')
      };
    }
  });

  /* ===== T4: ABC KLASIFIKASI ===== */
  E.registerFamily({
    familyId: 'abc',
    make: function (rng, node, knobs) {
      var items = [];
      var vals = [];
      for (var i = 0; i < 3; i++) { var v = rng.int(20, 400); vals.push(v); }
      if (vals[0] === vals[1] || vals[1] === vals[2]) return null;
      var order = vals.slice().sort(function (a, b) { return b - a; });
      var top = vals.indexOf(order[0]), bot = vals.indexOf(order[2]);
      var names = ['Komponen X', 'Komponen Y', 'Komponen Z'];
      var visual = { type: 'table', caption: 'Nilai pemakaian tahunan (juta rupiah)', head: ['Item', 'Nilai'], rows: names.map(function (n, i) { return [n, String(vals[i])]; }) };
      return {
        format: 'mc', promptText: 'Dengan analisis ABC (A = nilai pemakaian tahunan tertinggi), item mana yang diklasifikasikan A dan C?',
        visual: visual,
        choices: [
          { label: 'A = ' + names[top] + ', C = ' + names[bot], correct: true },
          { label: 'A = ' + names[bot] + ', C = ' + names[top], correct: false, tag: 'urutan nilai terbalik — A selalu nilai tertinggi' },
          { label: 'Semua sama penting', correct: false, tag: 'ABC justru membedakan prioritas pengendalian' }
        ],
        solution: steps('Analisis ABC', [
          st('Urutkan nilai pemakaian tahunan: ' + order.join(' > ') + '.'),
          st('A (±20% item, ±80% nilai) kendali ketat; B sedang; C (banyak item, nilai kecil) kendali longgar.'),
          st(names[top] + ' = A (' + order[0] + '), ' + names[bot] + ' = C (' + order[2] + ').')],
        'A = ' + names[top] + ' · C = ' + names[bot], 'Pareto di persediaan: sedikit item menyerap sebagian besar nilai — fokus kendali di sana.')
      };
    }
  });

  /* ===== T4: WEIGHTED MOVING AVERAGE ===== */
  E.registerFamily({
    familyId: 'fwma',
    make: function (rng, node, knobs) {
      var d = [];
      for (var i = 0; i < 4; i++) d.push(rng.int(40, 100));
      var w = rng.pick([[0.5, 0.3, 0.2], [0.6, 0.3, 0.1], [0.4, 0.35, 0.25]]);
      var ans = d[3] * w[0] + d[2] * w[1] + d[1] * w[2];
      var ansR = Math.round(ans * 100) / 100;
      if (Math.abs(ansR * 100 - Math.round(ansR * 100)) > 1e-9) return null;
      var visual = { type: 'table', caption: 'Permintaan (M1 = tertua) · bobot termutakhir → terlama: ' + w.join(' · '), head: ['M1', 'M2', 'M3', 'M4'], rows: [d.map(String)] };
      return {
        format: 'numeric', promptText: 'Dengan WEIGHTED moving average 3-periode (bobot terbaru → terlama: ' + w.join(', ') + '), berapa peramalan M5? (2 desimal)',
        promptLatex: 'F=0{,}5D_4+0{,}3D_3+0{,}2D_2',
        visual: visual,
        answer: { value: ansR, tol: 0.05 },
        solution: steps('Weighted moving average', [
          st('Bobot diberikan ke data TERBARU: F = ' + w[0] + '×' + d[3] + ' + ' + w[1] + '×' + d[2] + ' + ' + w[2] + '×' + d[1] + '.'),
          st('= ' + fx(d[3] * w[0], 2) + ' + ' + fx(d[2] * w[1], 2) + ' + ' + fx(d[1] * w[2], 2) + ' = ' + fx(ansR, 2) + '.')],
        fx(ansR, 2), 'WMA = MA yang menghormati recency — data segar lebih dipercaya.')
      };
    }
  });

  /* ===== T4: TREND LEAST SQUARES ===== */
  E.registerFamily({
    familyId: 'ftrend',
    make: function (rng, node, knobs) {
      var y1 = rng.int(40, 80);
      var b1 = rng.pick([2, 2.5, 3, 4, 5]);
      var pts = [];
      for (var t = 1; t <= 4; t++) {
        var noise = [0, 1, -1, 2][t - 1] * rng.pick([0, 1]);
        pts.push([t, y1 + b1 * t + noise]);
      }
      var n = 4, sx = 10, sx2 = 30;
      var sy = pts.reduce(function (a, p) { return a + p[1]; }, 0);
      var sxy = pts.reduce(function (a, p) { return a + p[0] * p[1]; }, 0);
      var bb = (n * sxy - sx * sy) / (n * sx2 - sx * sx); // 20
      var b0 = (sy - bb * sx) / n;
      if (Math.abs(bb * 100 - Math.round(bb * 100)) > 1e-9 || Math.abs(b0 * 100 - Math.round(b0 * 100)) > 1e-9) return null;
      var xf = 5;
      var ans = b0 + bb * xf;
      var visual = { type: 'table', caption: 'Permintaan per triwulan · Σx=10, Σx²=30, Σy=' + sy + ', Σxy=' + sxy, head: ['x', 'y'], rows: pts.map(function (p) { return [String(p[0]), String(p[1])]; }) };
      return {
        format: 'numeric', promptText: 'Dengan regresi trend least-squares y = b0 + b1x (b1 = (nΣxy − ΣxΣy)/(nΣx² − (Σx)²)), berapa peramalan saat x = 5? (2 desimal)',
        promptLatex: 'b_1=\\frac{n\\sum xy-\\sum x\\sum y}{n\\sum x^2-(\\sum x)^2}',
        visual: visual,
        answer: { value: ans, tol: 0.05 },
        solution: steps('Trend least squares', [
          st('b1 = (4×' + sxy + ' − 10×' + sy + ')/(4×30 − 100) = ' + (n * sxy - sx * sy) + '/20 = ' + fx(bb, 2) + '.'),
          st('b0 = (' + sy + ' − ' + fx(bb, 2) + '×10)/4 = ' + fx(b0, 2) + '.'),
          st('ŷ(x=5) = ' + fx(b0, 2) + ' + ' + fx(bb, 2) + '×5 = ' + fx(ans, 2) + '.')],
        fx(ans, 2), 'Least squares: garis yang meminimumkan kuadrat error — trend forecasting standar.')
      };
    }
  });

  /* ===== T4: INDEKS MUSIMAN ===== */
  E.registerFamily({
    familyId: 'fseason',
    make: function (rng, node, knobs) {
      var q = [];
      for (var i = 0; i < 4; i++) q.push(rng.int(60, 140));
      var mean = q.reduce(function (a, b) { return a + b; }, 0) / 4;
      var ask = rng.int(0, 3);
      var idx = Math.round(q[ask] / mean * 100) / 100;
      if (Math.abs(idx * 100 - Math.round(idx * 100)) > 1e-9) return null;
      var trend = rng.int(500, 800);
      var ans = Math.round(trend * idx * 10) / 10;
      if (Math.abs(ans * 10 - Math.round(ans * 10)) > 1e-9) return null;
      var visual = { type: 'table', caption: 'Penjualan per kuartal tahun lalu', head: ['Q1', 'Q2', 'Q3', 'Q4'], rows: [q.map(String)] };
      return {
        format: 'numeric',
        promptText: 'Hitung indeks musiman Q' + (ask + 1) + ' (rata-rata kuartal itu ÷ rata-rata tahunan, 2 desimal), lalu pakai untuk meramal: jika trend tahun depan ' + trend + ' unit, berapa ramalan Q' + (ask + 1) + '? (1 desimal)',
        promptLatex: 'I_k=\\frac{\\bar{q}_k}{\\bar{q}}\\;,\\;\\hat{y}=trend\\times I_k',
        visual: visual,
        answer: { value: ans, tol: Math.max(0.3, ans * 0.01) },
        solution: steps('Indeks musiman', [
          st('Rata-rata tahunan = (' + q.join('+') + ')/4 = ' + fx(mean, 2) + '.'),
          st('Indeks Q' + (ask + 1) + ' = ' + q[ask] + '/' + fx(mean, 2) + ' = ' + fx(idx, 2) + '.'),
          st('Ramalan = trend × indeks = ' + trend + ' × ' + fx(idx, 2) + ' = ' + fx(ans, 1) + '.')],
        fx(ans, 1), 'Musiman = pola berulang tahunan; indeksnya menskalakan trend per kuartal.')
      };
    }
  });

  /* ===== T4: MONTE CARLO — RANDOM NUMBER → VARIATE ===== */
  E.registerFamily({
    familyId: 'mcvar',
    make: function (rng, node, knobs) {
      var probs = [0.2, 0.3, 0.3, 0.2];
      var demands = [0, 1, 2, 3];
      var cum = [];
      var c = 0;
      for (var i = 0; i < 4; i++) { c += probs[i]; cum.push(c); }
      var rns = [];
      for (var r = 0; r < 4; r++) rns.push(Math.round((0.05 + 0.9 * rng.next()) * 100) / 100);
      var vals = rns.map(function (rn) {
        for (var j = 0; j < 4; j++) if (rn < cum[j]) return demands[j];
        return 3;
      });
      var total = vals.reduce(function (a, b) { return a + b; }, 0);
      var visual = {
        type: 'table', caption: 'Distribusi permintaan harian + interval kumulatif',
        head: ['Permintaan', 'Peluang', 'Interval RN'],
        rows: demands.map(function (d, j) {
          var lo = j === 0 ? 0 : cum[j - 1];
          return [String(d), probs[j].toFixed(2).replace('.', ','), lo.toFixed(2).replace('.', ',') + ' – ' + cum[j].toFixed(2).replace('.', ',')];
        }).concat([['RN hari 1–4', '', rns.join(' · ')]])
      };
      return {
        format: 'numeric',
        promptText: 'Simulasi Monte Carlo: petakan tiap angka acak (RN, lihat baris terakhir tabel) ke permintaan via interval kumulatif. Berapa TOTAL permintaan 4 hari?',
        promptLatex: 'RN\\to\\text{permintaan}\\;\\text{(interval kumulatif)}',
        visual: visual,
        answer: { value: total, tol: 0.01 },
        solution: steps('Monte Carlo diskrit', [
          st('Petakan RN: ' + rns.map(function (rn, k) { return rn.toFixed(2).replace('.', ',') + '→' + vals[k]; }).join('; ') + '.'),
          st('Total = ' + vals.join(' + ') + ' = ' + total + ' unit.')],
        String(total), 'Monte Carlo = percepatan nasib: distribusi + RNG = hari-hari simulasi tanpa menunggu kenyataan.')
      };
    }
  });

  /* ===== T4: SIMPLEKS — SATU ITERASI PIVOT (format steps + tabel) ===== */
  E.registerFamily({
    familyId: 'simpleks',
    make: function (rng, node, knobs) {
      // max c1x1+c2x2, 2 kendala <=, b>0 → tableau awal basis slack
      var c1 = rng.int(3, 9), c2 = rng.int(2, 8);
      if (c1 === c2) return null;
      var a11 = rng.int(1, 5), a12 = rng.int(1, 5), a21 = rng.int(1, 5), a22 = rng.int(1, 5);
      var b1 = rng.int(10, 40), b2 = rng.int(10, 40);
      // entering = koefisien tujuan terbesar (Z-row paling negatif)
      var enterIdx = c1 > c2 ? 1 : 2;
      var ce = enterIdx === 1 ? c1 : c2;
      var col = enterIdx === 1 ? [a11, a21] : [a12, a22];
      if (col[0] <= 0 || col[1] <= 0) return null;
      var r1 = b1 / col[0], r2 = b2 / col[1];
      var theta = Math.min(r1, r2);
      var pivotRow = r1 <= r2 ? 0 : 1;
      var pivotEl = col[pivotRow];
      var newZ = theta * ce;
      var thetaR = Math.round(theta * 100) / 100;
      var newZR = Math.round(newZ * 100) / 100;
      if (Math.abs(thetaR * 100 - Math.round(thetaR * 100)) > 1e-9 || Math.abs(newZR * 100 - Math.round(newZR * 100)) > 1e-9) return null;
      var f = function (v) { return U.fmtID(v, 2).replace(',', '.'); };
      var visual = {
        type: 'table', caption: 'Tableau simpleks awal (basis: s1, s2) — baris Z memakai konvensi −c',
        head: ['Basis', 'x1', 'x2', 's1', 's2', 'RHS'],
        rows: [
          ['Z', '-' + c1, '-' + c2, '0', '0', '0'],
          ['s1', String(a11), String(a12), '1', '0', String(b1)],
          ['s2', String(a21), String(a22), '0', '1', String(b2)]
        ]
      };
      return {
        format: 'steps',
        promptText: 'Maks Z = ' + c1 + 'x₁ + ' + c2 + 'x₂ s.t. ' + a11 + 'x₁+' + a12 + 'x₂ ≤ ' + b1 + '; ' + a21 + 'x₁+' + a22 + 'x₂ ≤ ' + b2 + '. Lihat tableau awal — kerjakan SATU iterasi simpleks (entering = selisih Z-row paling negatif; leaving = uji rasio terkecil RHS/kolom).',
        promptLatex: '\\theta=\\min\\left\\{\\frac{b_i}{a_{i,enter}}\\right\\}',
        visual: visual,
        steps: [
          { label: 'variabel ENTERING: 1 = x₁, 2 = x₂', value: enterIdx, tol: 0.01 },
          { label: 'rasio θ terkecil (RHS ÷ kolom entering)', value: thetaR, tol: 0.02 },
          { label: 'elemen PIVOT (perpotongan baris leaving × kolom entering)', value: pivotEl, tol: 0.01 },
          { label: 'nilai Z BARU setelah pivot (= θ × koefisien entering)', value: newZR, tol: 0.05 }
        ],
        answer: { value: newZR, tol: 0.05 },
        solution: steps('Iterasi simpleks', [
          st('Baris Z: −' + c1 + ', −' + c2 + ' → paling negatif adalah −' + ce + ' → x' + enterIdx + ' masuk (entering).'),
          st('Uji rasio: ' + f(b1) + '/' + f(col[0]) + ' = ' + f(r1) + '; ' + f(b2) + '/' + f(col[1]) + ' = ' + f(r2) + ' → terkecil θ = ' + f(thetaR) + ' → s' + (pivotRow + 1) + ' keluar (leaving).'),
          st('Elemen pivot = ' + pivotEl + ' (baris s' + (pivotRow + 1) + ', kolom x' + enterIdx + ').'),
          st('Setelah pivot: variabel basis baru bernilai θ = ' + f(thetaR) + ', dan Z naik dari 0 menjadi θ × ' + ce + ' = ' + f(newZR) + '.'),
          st('Ulangi hingga baris Z tak ada lagi nilai negatif → optimal.')
        ], 'Z baru = ' + f(newZR), 'Simpleks = menyusuri titik sudut ke titik sudut, selalu memanjat Z. Entering: paling negatif; leaving: rasio terkecil.')
      };
    }
  });

  /* ===== T4: SENSITIVITAS KOEFISIEN TUJUAN ===== */
  E.registerFamily({
    familyId: 'sensitif',
    make: function (rng, node, knobs) {
      var inst = lpInstance(rng);
      if (!inst) return null;
      var best = inst.best;
      var tight = inst.cons.filter(function (c) { return Math.abs(c.a * best[0] + c.b * best[1] - c.r) < 1e-6; });
      if (tight.length < 2) return null;
      var ratios = tight.map(function (c) { return c.a / c.b; });
      var lo = Math.min.apply(null, ratios), hi = Math.max.apply(null, ratios);
      var p2 = inst.obj[1];
      var c1Lo = Math.round(lo * p2 * 10) / 10, c1Hi = Math.round(hi * p2 * 10) / 10;
      var p1 = inst.obj[0];
      if (c1Lo === c1Hi || p1 < c1Lo || p1 > c1Hi) return null;
      var mk = function (a, b) { return U.fmtID(a, 1) + ' ≤ c₁ ≤ ' + U.fmtID(b, 1); };
      return {
        format: 'mc',
        promptText: 'Optimum LP di (' + best[0] + ', ' + best[1] + ') dengan Z = ' + inst.obj[0] + 'x₁ + ' + inst.obj[1] + 'x₂ dan kendala ' +
          inst.cons.map(function (c) { return c.a + 'x₁+' + c.b + 'x₂ ≤ ' + c.r; }).join('; ') + '. Dalam rentang berapa c₁ (c₂ tetap ' + p2 + ') kombinasi optimal ini TETAP optimal?',
        promptLatex: '\\frac{c_1}{c_2}\\in\\left[\\frac{a_1}{b_1},\\frac{a_2}{b_2}\\right]',
        choices: [
          { label: mk(c1Lo, c1Hi), correct: true },
          { label: mk(Math.round((c1Lo - 2) * 10) / 10, Math.round((c1Hi - 2) * 10) / 10), tag: 'rentang geser — hitung ulang rasio kedua kendala IKAT (binding)' },
          { label: mk(Math.round(lo * p2 * 10) / 10, Math.round(hi * inst.obj[0] * 10) / 10), tag: 'mencampur rasio dengan koefisien lama' }
        ],
        solution: steps('Sensitivitas c₁', [
          st('Optimum di perpotongan dua kendala IKAT: ' + tight.map(function (c) { return c.a + 'x₁+' + c.b + 'x₂ ≤ ' + c.r; }).join(' dan ') + '.'),
          st('Solusi tetap selama kemiringan tujuan berada DI ANTARA kemiringan kedua kendala ikat: c₁/c₂ ∈ [' + U.fmtID(lo, 3).replace(',', '.') + ', ' + U.fmtID(hi, 3).replace(',', '.') + '].'),
          st('Dengan c₂ = ' + p2 + ': c₁ ∈ [' + U.fmtID(c1Lo, 1).replace(',', '.') + ', ' + U.fmtID(c1Hi, 1).replace(',', '.') + '].')
        ], mk(c1Lo, c1Hi), 'Di luar rentang ini, titik sudut lain jadi lebih baik — itulah makna ekonomis "rentang tetap optimal".')
      };
    }
  });

  /* ===== T4: GOAL PROGRAMMING ===== */
  E.registerFamily({
    familyId: 'goal',
    make: function (rng, node, knobs) {
      var T = rng.pick([80, 100, 120, 150, 200]);
      var lots = [];
      var base = T;
      for (var i = 0; i < 3; i++) {
        var delta = rng.pick([-15, -10, -5, 0, 5, 10, 15, 20]) * rng.pick([1, 2]);
        var lot = T + delta;
        if (lots.indexOf(lot) < 0 && lot > 0) lots.push(lot);
      }
      if (lots.length < 3) return null;
      lots.sort(function (a, b) { return a - b; });
      var pOver = rng.pick([1, 2, 3]); // penalti kelebihan (simpan berlebih)
      var pUnder = rng.pick([2, 3, 4]); // penalti kekurangan (lost sales)
      var penalties = lots.map(function (L) {
        var over = Math.max(0, L - T), under = Math.max(0, T - L);
        return { L: L, over: over, under: under, pen: over * pOver + under * pUnder };
      });
      var bestPen = penalties.reduce(function (m, p) { return Math.min(m, p.pen); }, Infinity);
      var bestLot = penalties.filter(function (p) { return p.pen === bestPen; })[0].L;
      var ctx = E.context(rng, node.id);
      return {
        format: 'numeric',
        promptText: 'Target produksi ' + ctx.place + ': ' + T + ' ' + ctx.unit + '. Kelebihan produksi dikenakan biaya simpan ' + pOver + ' ribu/' + ctx.unit + '; kekurangan dikenakan lost sales ' + pUnder + ' ribu/' + ctx.unit + '. Lot yang bisa dipilih: ' + lots.join(', ') + '. Dengan goal programming (minimalkan total deviasi tertimbang), berapa TOTAL PENALTI terbaik (ribu)?',
        promptLatex: '\\min z=p^+d^++p^-d^-',
        answer: { value: bestPen, tol: 0.01 },
        solution: steps('Goal programming', [
          st('Hitung deviasi tiap lot: ' + penalties.map(function (p) { return p.L + ' → d⁺=' + p.over + ', d⁻=' + p.under + ', penalti=' + p.pen; }).join('; ') + '.'),
          st('Ambil penalti minimum: lot ' + bestLot + ' dengan total ' + bestPen + ' ribu.'),
          st('Pelajaran: target bukan batu mati — yang dioptimalkan adalah DEVIASI dari target, dengan bobot biaya masing-masing arah.')
        ], 'Lot ' + bestLot + ' → penalti ' + bestPen + ' ribu', 'GP dipakai saat banyak tujuan saling tarik-menarik — realita manajerial sejati.')
      };
    }
  });

  /* ===== T4: BRANCH & BOUND (integer programming) ===== */
  E.registerFamily({
    familyId: 'bab',
    make: function (rng, node, knobs) {
      // LP relaksasi punya optimum pecahan; integer optimum berbeda
      for (var tries = 0; tries < 120; tries++) {
        var cons = [];
        for (var i = 0; i < 3; i++) cons.push({ a: rng.int(1, 4), b: rng.int(1, 4), r: rng.int(6, 24) });
        var p1 = rng.int(3, 9), p2 = rng.int(3, 9);
        // fungsional feasibilitas & optimum LP via titik kandidat
        var cand = [[0, 0]];
        cons.forEach(function (c) { cand.push([c.r / c.a, 0]); cand.push([0, c.r / c.b]); });
        for (var pa = 0; pa < cons.length; pa++) for (var pb = pa + 1; pb < cons.length; pb++) {
          var A = cons[pa], B = cons[pb];
          var det = A.a * B.b - B.a * A.b;
          if (det === 0) continue;
          cand.push([(A.r * B.b - B.r * A.b) / det, (A.a * B.r - B.a * A.r) / det]);
        }
        var feas = cand.filter(function (pt) { return pt[0] >= 0 && pt[1] >= 0 && cons.every(function (c) { return c.a * pt[0] + c.b * pt[1] <= c.r + 1e-9; }); });
        var lpBest = -1, lpPt = null;
        feas.forEach(function (pt) { var z = p1 * pt[0] + p2 * pt[1]; if (z > lpBest) { lpBest = z; lpPt = pt; } });
        if (!lpPt) continue;
        if (Math.abs(lpPt[0] - Math.round(lpPt[0])) < 1e-6 && Math.abs(lpPt[1] - Math.round(lpPt[1])) < 1e-6) continue; // harus pecahan
        // integer optimum brute force
        var maxX = Math.floor(Math.max.apply(null, feas.map(function (p) { return p[0]; })));
        var maxY = Math.floor(Math.max.apply(null, feas.map(function (p) { return p[1]; })));
        if (maxX > 8 || maxY > 8) continue;
        var best = -1, bPt = null;
        for (var x = 0; x <= maxX; x++) for (var y = 0; y <= maxY; y++) {
          if (!cons.every(function (c) { return c.a * x + c.b * y <= c.r; })) continue;
          var z2 = p1 * x + p2 * y;
          if (z2 > best) { best = z2; bPt = [x, y]; }
        }
        if (best < 0 || best === Math.floor(lpBest) && Math.abs(lpBest - Math.floor(lpBest)) < 1e-6) continue;
        if (best === lpBest) continue; // harus beda supaya menarik
        var ctx = E.context(rng, node.id);
        return {
          format: 'numeric',
          promptText: 'Maks Z = ' + p1 + 'x₁ + ' + p2 + 'x₂ dengan kendala ' + cons.map(function (c) { return c.a + 'x₁+' + c.b + 'x₂ ≤ ' + c.r; }).join('; ') + ', x₁, x₂ harus BULAT (integer programming). Solusi relaksasi LP-nya (' + U.fmtID(lpPt[0], 1).replace(',', '.') + ', ' + U.fmtID(lpPt[1], 1).replace(',', '.') + ') — pecahan, tak boleh. Dengan branch & bound, berapa nilai optimal INTEGER?',
          promptLatex: '\\max Z=c_1x_1+c_2x_2\\;,\\;x\\in\\mathbb{Z}^+',
          answer: { value: best, tol: 0.01 },
          solution: steps('Branch & bound', [
            st('Relaksasi LP memberi Z = ' + U.fmtID(lpBest, 1).replace(',', '.') + ' di (' + U.fmtID(lpPt[0], 1).replace(',', '.') + ', ' + U.fmtID(lpPt[1], 1).replace(',', '.') + ') — tidak bulat.'),
            st('B&B: cabangkan x₁ ≤ ' + Math.floor(lpPt[0]) + ' dan x₁ ≥ ' + (Math.floor(lpPt[0]) + 1) + ', selesaikan tiap cabang, pangkas yang bound-nya lebih buruk.'),
            st('Enumerasi penuh titik bulat layak mengonfirmasi optimum: (' + bPt[0] + ', ' + bPt[1] + ') dengan Z = ' + best + ' — perhatikan Z integer SELALU ≤ Z relaksasi.')
          ], 'Z* = ' + best + ' di (' + bPt[0] + ', ' + bPt[1] + ')', 'Relaksasi memberi batas atas optimistis; branching memangkas cabang yang tak mungkin menang.')
        };
      }
      return null;
    }
  });

  /* ===== v1.5.1: M/M/s UMUM (s=3 atau 4, format steps, rumus disediakan) ===== */
  E.registerFamily({
    familyId: 'mms3',
    make: function (rng, node, knobs) {
      var s = rng.pick([3, 4]);
      var mu = rng.pick([4, 5, 6]);
      var a = s === 3 ? rng.pick([2]) : rng.pick([2, 3]); // offered load λ/μ — jaga ρ = a/s < 0,92
      var lam = a * mu;
      var rho = lam / (s * mu);
      if (rho >= 0.92 || rho < 0.35) return null;
      var p0sum = 0;
      for (var nn = 0; nn <= s - 1; nn++) {
        var f = 1; for (var i = 2; i <= nn; i++) f *= i;
        p0sum += Math.pow(a, nn) / f;
      }
      var sf = 1; for (var i2 = 2; i2 <= s; i2++) sf *= i2;
      var p0 = 1 / (p0sum + Math.pow(a, s) / (sf * (1 - rho)));
      var Lq = p0 * Math.pow(a, s) * rho / (sf * (1 - rho) * (1 - rho));
      var Wq = Lq / lam * 60;
      var rho2 = Math.round(rho * 100) / 100;
      var Lq2 = Math.round(Lq * 100) / 100;
      var Wq2 = Math.round(Wq * 10) / 10;
      if (Lq2 <= 0.01) return null;
      var ctx = rng.pick(['loket layanan', 'gerbang gudang', 'customer service', 'stasiun paket']);
      return {
        format: 'steps',
        promptText: 'Antrean M/M/' + s + ' di ' + ctx + ': λ = ' + lam + '/jam, μ = ' + mu + '/jam per server (' + s + ' server paralel). Rumus: ρ = λ/(sμ); a = λ/μ; p0 = [Σ_{n<s} aⁿ/n! + a^s/(s!(1−ρ))]⁻¹; Lq = p0·a^s·ρ/(s!(1−ρ)²); Wq = Lq/λ. Isi tiga langkah.',
        promptLatex: 'L_q=p_0\\frac{a^s\\rho}{s!(1-\\rho)^2}',
        steps: [
          { label: 'utilisasi ρ = λ/(sμ) (2 desimal)', value: rho2, tol: 0.01 },
          { label: 'panjang antrean Lq (2 desimal)', value: Lq2, tol: 0.06 },
          { label: 'waktu tunggu Wq dalam MENIT (1 desimal)', value: Wq2, tol: Math.max(0.2, Wq2 * 0.03) }
        ],
        answer: { value: Lq2, tol: 0.06 },
        solution: steps('M/M/' + s,
          [
            st('a = λ/μ = ' + lam + '/' + mu + ' = ' + a + '; ρ = ' + lam + '/(' + s + '×' + mu + ') = ' + fx(rho, 2) + ' — stabil.'),
            st('p0 = 1/[Σ + ' + Math.pow(a, s) + '/(' + sf + '×' + fx(1 - rho, 2) + ')] = ' + fx(p0, 4) + '.'),
            st('Lq = ' + fx(p0, 4) + ' × ' + Math.pow(a, s) + ' × ' + fx(rho, 2) + '/(' + sf + '×' + fx((1 - rho) * (1 - rho), 3) + ') = ' + fx(Lq2, 2) + ' orang.'),
            st('Wq = ' + fx(Lq2, 2) + '/' + lam + ' jam = ' + fx(Wq2, 1) + ' menit.')
          ], fx(Lq2, 2) + ' orang; Wq = ' + fx(Wq2, 1) + ' menit', 'Rumus Erlang berlaku untuk s server berapapun — yang berubah hanya s! dan pangkat a di p0.')
      };
    }
  });

  /* ===== v1.5.1: SIMPLEKS ITERASI KE-2 (format steps) ===== */
  E.registerFamily({
    familyId: 'simpleks2',
    make: function (rng, node, knobs) {
      for (var tries = 0; tries < 60; tries++) {
        var c1 = rng.int(3, 9), c2 = rng.int(2, 8);
        if (c1 === c2) continue;
        var a11 = rng.int(1, 5), a12 = rng.int(1, 5), a21 = rng.int(1, 5), a22 = rng.int(1, 5);
        var b1 = rng.int(10, 40), b2 = rng.int(10, 40);
        // tableau: Z=[-c1,-c2,0,0|0]; s1=[a11,a12,1,0|b1]; s2=[a21,a22,0,1|b2]
        var T = [
          [-c1, -c2, 0, 0, 0],
          [a11, a12, 1, 0, b1],
          [a21, a22, 0, 1, b2]
        ];
        function pivot(tab, col, row) {
          var p = tab[row][col];
          for (var j = 0; j < 5; j++) tab[row][j] /= p;
          for (var r = 0; r < 3; r++) {
            if (r === row) continue;
            var f = tab[r][col];
            if (f === 0) continue;
            for (var j2 = 0; j2 < 5; j2++) tab[r][j2] -= f * tab[row][j2];
          }
        }
        function enter(tab) {
          var best = -1, bv = 0;
          for (var j = 0; j < 4; j++) if (tab[0][j] < bv - 1e-9) { bv = tab[0][j]; best = j; }
          return best;
        }
        function leave(tab, col) {
          var best = -1, br = Infinity;
          for (var r = 1; r < 3; r++) {
            if (tab[r][col] <= 1e-9) continue;
            var ratio = tab[r][4] / tab[r][col];
            if (ratio < br - 1e-9) { br = ratio; best = r; }
          }
          return best;
        }
        var e1 = enter(T);
        if (e1 < 0) continue;
        var l1 = leave(T, e1);
        if (l1 < 0) continue;
        pivot(T, e1, l1);
        var Z1 = T[0][4];
        var e2 = enter(T);
        if (e2 < 0) continue; // selesai 1 iterasi — tidak dipakai
        var l2 = leave(T, e2);
        if (l2 < 0) continue;
        var theta2 = T[l2][4] / T[l2][e2];
        pivot(T, e2, l2);
        var Z2 = T[0][4];
        if (enter(T) >= 0) continue; // ternyata butuh iterasi ke-3 — skip
        var theta2R = Math.round(theta2 * 100) / 100;
        var Z1R = Math.round(Z1 * 100) / 100, Z2R = Math.round(Z2 * 100) / 100;
        if ([theta2R, Z1R, Z2R].some(function (v) { return Math.abs(v * 100 - Math.round(v * 100)) > 1e-9; })) continue;
        return {
          format: 'steps',
          promptText: 'Maks Z = ' + c1 + 'x₁ + ' + c2 + 'x₂ s.t. ' + a11 + 'x₁+' + a12 + 'x₂ ≤ ' + b1 + '; ' + a21 + 'x₁+' + a22 + 'x₂ ≤ ' + b2 + '. Tableau simpleks ternyata BUTUH DUA ITERASI. Iterasi-1 sudah dilakukan (Z sekarang = ' + fx(Z1R, 2) + '). Kerjakan iterasi KEDUA.',
          promptLatex: '\\text{iterasi 2}: \\theta=\\min\\frac{RHS}{a_{i,enter}}',
          steps: [
            { label: 'variabel ENTERING iterasi-2 (1 = x₁, 2 = x₂)', value: e2 + 1, tol: 0.01 },
            { label: 'rasio θ terkecil iterasi-2 (2 desimal)', value: theta2R, tol: 0.02 },
            { label: 'nilai Z FINAL setelah iterasi-2 (2 desimal)', value: Z2R, tol: 0.05 }
          ],
          answer: { value: Z2R, tol: 0.05 },
          solution: steps('Simpleks iterasi ke-2', [
            st('Setelah iterasi-1 baris Z masih memuat koefisien negatif → belum optimal.'),
            st('Entering iterasi-2: koefisien Z-row paling negatif → x' + (e2 + 1) + ' (jawaban ' + (e2 + 1) + ').'),
            st('Uji rasio pada kolom itu → θ = ' + fx(theta2R, 2) + ' → baris ' + (l2 === 1 ? 's-1' : 's-2') + ' keluar; pivot.'),
            st('Baris Z kini bebas negatif → OPTIMAL: Z* = ' + fx(Z2R, 2) + '.')
          ], 'Z* = ' + fx(Z2R, 2), 'Satu pivot = satu lompatan titik sudut. Selama Z-row masih ada negatif, panjang lagi.')
        };
      }
      return null;
    }
  });
})();