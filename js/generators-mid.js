/* Vista Forgy — generators-mid.js (Tier 1: aritmetika lanjut, aljabar, logika lanjut, fungsi, statistik;
   Tier 2: mental math rush, kalkulus cepat, trigonometri, geometri) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var E = VF.ENGINE, U = E.util;
  function steps(title, arr, final, takeaway) { return { title: title, steps: arr, final: final, takeaway: takeaway }; }
  function st(text, latex) { return latex ? { text: text, latex: latex } : { text: text }; }
  var F = function (n, d) { return '\\frac{' + n + '}{' + d + '}'; };

  /* ============ T1: PERSEN NAIK/TURUN & DISKON BERLAPIS (flagship) ============ */
  E.registerFamily({
    familyId: 'percent2',
    make: function (rng, node, knobs) {
      var mode = node.id === 'ari2.diskon' ? 1 : 0;
      var base = rng.pick([150, 200, 250, 300, 400, 500, 600, 800]) * 1000; // rupiah
      if (mode === 1) {
        var d1 = rng.pick([10, 15, 20, 25]), d2 = rng.pick([5, 10, 20]);
        var s1 = base * (1 - d1 / 100), s2 = s1 * (1 - d2 / 100);
        var potong = base - s2;
        var naive = base * (1 - (d1 + d2) / 100);
        return {
          format: 'mc',
          promptText: 'Sebuah toko memberi diskon ' + d1 + '%, lalu diskon tambahan ' + d2 + '% dari harga BARU. Harga awal ' + U.rupiah(base) + '. Berapa TOTAL potongan?',
          choices: U.mkMc(U.fmtID(potong, 0), [
            { label: U.fmtID(base - naive, 0), tag: 'diskon dijumlah langsung (' + (d1 + d2) + '% sekali jalan)' },
            { label: U.fmtID(base * d2 / 100, 0), tag: 'diskon kedua dihitung dari harga awal' },
            { label: U.fmtID(base * d1 / 100, 0), tag: 'hanya diskon pertama yang dihitung' }
          ], rng),
          solution: steps('Diskon bertingkat', [
            st('Diskon 1: ' + d1 + '% × ' + U.fmtID(base, 0) + ' = ' + U.fmtID(base * d1 / 100, 0) + ' → harga jadi ' + U.fmtID(s1, 0) + '.'),
            st('Diskon 2 dihitung dari harga BARU: ' + d2 + '% × ' + U.fmtID(s1, 0) + ' = ' + U.fmtID(s1 * d2 / 100, 0) + '.'),
            st('Total potongan = ' + U.fmtID(base * d1 / 100, 0) + ' + ' + U.fmtID(s1 * d2 / 100, 0) + '.')],
            U.fmtID(potong, 0), 'Diskon kedua selalu dari harga SETELAH diskon pertama. Jebakan klasik 30% ≠ 20%+10%.')
        };
      }
      var up = rng.bool();
      var p = rng.pick([10, 15, 20, 25, 50]);
      var ans = up ? base * (1 + p / 100) : base * (1 - p / 100);
      return {
        format: 'numeric',
        promptText: 'Harga barang ' + U.rupiah(base) + ' mengalami ' + (up ? 'kenaikan' : 'penurunan') + ' ' + p + '%. Berapa harga sekarang?',
        answer: { value: ans, tol: Math.max(1, ans * 0.001) },
        solution: steps('Persen perubahan', [
          st('Faktor pengali: ' + (up ? 'naik' : 'turun') + ' ' + p + '% = ×(1 ' + (up ? '+' : '−') + ' ' + p / 100 + ').'),
          st('Kalikan harga awal dengan faktor itu.')],
        U.fmtID(ans, 0), 'Naik 20% lalu turun 20% ≠ kembali ke awal. Selalu pakai faktor pengali.')
      };
    }
  });

  /* ============ T1: BUNGA SEDERHANA ============ */
  E.registerFamily({
    familyId: 'interest',
    make: function (rng, node, knobs) {
      var P = rng.pick([2, 4, 5, 8, 10]) * 1000000;
      var r = rng.pick([5, 6, 8, 10, 12]);
      var t = rng.int(2, 5);
      var askTotal = rng.bool();
      var bunga = P * r / 100 * t;
      var ans = askTotal ? P + bunga : bunga;
      return {
        format: 'numeric',
        promptText: 'Tabungan ' + U.rupiah(P) + ' dengan bunga sederhana ' + r + '% per tahun, selama ' + t + ' tahun. Berapa ' + (askTotal ? 'TOTAL saldo akhir' : 'bunga yang didapat') + '?',
        answer: { value: ans, tol: Math.max(1, ans * 0.001) },
        solution: steps('Bunga sederhana', [
          st('Bunga = P × r × t = ' + U.fmtID(P, 0) + ' × ' + r + '% × ' + t + '.'),
          askTotal ? st('Total = pokok + bunga.') : st('Itu langsung jawabannya.')],
        U.fmtID(ans, 0), 'Bunga sederhana: pokok TIDAK ikut berbunga. (Yang berbunga berulang = bunga majemuk.)')
      };
    }
  });

  /* ============ T1: RASIO 3 BAGIAN ============ */
  E.registerFamily({
    familyId: 'ratio3',
    make: function (rng, node, knobs) {
      var a = rng.int(1, 5), b = rng.int(2, 6), c = rng.int(3, 7);
      var k = rng.int(4, 16);
      var total = (a + b + c) * k;
      var which = rng.int(0, 2);
      var parts = [a, b, c];
      var ans = parts[which] * k;
      var ctx = E.context(rng, node.id);
      return {
        format: 'numeric',
        promptText: 'Anggaran ' + ctx.place + ' dibagi dengan perbandingan ' + a + ' : ' + b + ' : ' + c + ' untuk bahan, upah, dan transport. Total ' + U.rupiah(total) + '. Berapa bagian ' + ['bahan', 'upah', 'transport'][which] + '?',
        promptLatex: a + 'x+' + b + 'x+' + c + 'x=' + total,
        answer: { value: ans, tol: Math.max(1, ans * 0.001) },
        solution: steps('Rasio tiga bagian', [
          st('Total bagian = ' + a + '+' + b + '+' + c + ' = ' + (a + b + c) + '.'),
          st('Satu bagian = ' + U.fmtID(total, 0) + ' ÷ ' + (a + b + c) + ' = ' + U.fmtID(k, 0) + '.'),
          st('Bagian yang ditanya = ' + parts[which] + ' × ' + U.fmtID(k, 0) + '.')],
        U.fmtID(ans, 0), 'Rasio multi-part tetap satu kunci: nilai SATU bagian dulu.')
      };
    }
  });

  /* ============ T1: SKALA ============ */
  E.registerFamily({
    familyId: 'scale',
    make: function (rng, node, knobs) {
      var denom = rng.pick([100, 200, 500, 1000, 2000]);
      var mapCm = rng.pick([3, 4, 5, 6, 8, 10]);
      var ans = mapCm * denom / 100; // meter
      return {
        format: 'numeric',
        promptText: 'Skala peta 1 : ' + U.fmtID(denom, 0) + '. Jarak dua titik di peta ' + mapCm + ' cm. Berapa jarak SEBENARNYA (dalam meter)?',
        answer: { value: ans, tol: Math.max(0.5, ans * 0.002) },
        solution: steps('Skala', [
          st('1 : ' + denom + ' artinya 1 cm di peta = ' + denom + ' cm asli.'),
          st(mapCm + ' cm × ' + denom + ' cm = ' + U.fmtID(mapCm * denom, 0) + ' cm; ubah ke meter ÷ 100.')],
        U.fmtID(ans, 1), 'Skala = faktor pengali. Jangan lupa konversi satuan terakhir.')
      };
    }
  });

  /* ============ T1: PECAHAN CAMPUR ============ */
  E.registerFamily({
    familyId: 'fracmix',
    make: function (rng, node, knobs) {
      var d = rng.pick([2, 3, 4, 5, 6]);
      var a = rng.int(1, d - 1), b = rng.int(1, d * 2 - 1);
      var op = rng.pick(['+', '−']);
      var n1 = a * 2 + (op === '+' ? 0 : rng.int(0, 2));
      var n2 = b % (d * 2) + 1;
      // samakan penyebut = d untuk keduanya: gunakan penyebut sama supaya level ini adil
      var x1 = rng.int(1, 4), x2 = rng.int(1, 4);
      var num = op === '+' ? x1 + x2 : x1 - x2;
      if (num <= 0 || num >= d) return null; // pecahan murni agar jawaban & distraktor rapi
      var simp = U.simplify(num, d);
      var label = simp[0] + '/' + simp[1];
      return {
        format: 'mc', promptText: 'Hitung dan sederhanakan.', promptLatex: F(x1, d) + (op === '+' ? '+' : '-') + F(x2, d),
        choices: [
          { label: label, correct: true },
          { label: (x1 + x2) + '/' + (d * 2), tag: 'penyebut dijumlah, bukan tetap' },
          { label: (num + 1) + '/' + d, tag: 'pembilang meleset satu' },
          { label: simp[1] + '/' + simp[0], tag: 'terbalik' }
        ],
        solution: steps('Penjumlahan pecahan', [
          st('Penyebut sama → jumlahkan pembilang: ' + x1 + (op === '+' ? '+' : '−') + x2 + ' = ' + num + '.'),
          st('Sederhanakan ' + num + '/' + d + ' dengan FPB.')], label,
        'Penyebut sama: langsung jumlah pembilang. Beda penyebut: samakan dulu (KPK).')
      };
    }
  });

  /* ============ T1: PANGKAT & AKAR ============ */
  E.registerFamily({
    familyId: 'exproot',
    make: function (rng, node, knobs) {
      var mode = rng.int(0, 2);
      if (mode === 0) {
        var b = rng.pick([2, 3, 5]), e = rng.int(2, 4);
        var ans = Math.pow(b, e);
        return {
          format: 'numeric', promptText: 'Hitung.', promptLatex: b + '^{' + e + '}',
          answer: { value: ans, tol: 0.01 },
          solution: steps('Pangkat', [st(b + ' dijumlah berulang ' + e + ' kali secara perkalian: ' + Array(e).fill(b).join(' × ') + '.')],
            String(ans), 'Pangkat = perkalian berulang. 2¹⁰ = 1024 layak di luar kepala.')
        };
      }
      if (mode === 1) {
        var r = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15]);
        var sq = r * r;
        return {
          format: 'numeric', promptText: 'Berapa akar kuadratnya?', promptLatex: '\\sqrt{' + sq + '}',
          answer: { value: r, tol: 0.01 },
          solution: steps('Akar kuadrat', [st('Cari bilangan yang dikali dirinya sendiri = ' + sq + ': ' + r + ' × ' + r + '.')],
            String(r), 'Hafal kuadrat sampai 20² = 400 — investasi seumur kuliah.')
        };
      }
      var m = rng.pick([[2, 3], [3, 2], [5, 3], [10, 4], [4, 3]]);
      var ask = m[0] * m[1] + m[1];
      return {
        format: 'mc', promptText: 'Sederhanakan (satu bentuk pangkat).', promptLatex: b2(m[0], m[1]),
        choices: [{ label: 'x^' + ask, latex: 'x^{' + ask + '}', correct: true },
          { label: 'x^' + (m[0] * m[1]), latex: 'x^{' + m[0] * m[1] + '}', tag: 'sukupangkat kedua tidak dikali' },
          { label: 'x^' + (m[0] + m[1]), latex: 'x^{' + (m[0] + m[1]) + '}', tag: 'pangkat dijumlah (aturan untuk kali, bukan pangkat pangkat)' }],
        solution: steps('Aturan pangkat', [st('(x^a)^b = x^(a×b), x^a × x^b = x^(a+b).'),
          st('Di sini: (' + m[0] + '×' + m[1] + ') + ' + m[1] + ' = ' + ask + '.')],
        'x^' + ask, 'Pangkat dipangkatkan → dikali. Pangkat dikali → dijumlah. Bedakan!')
      };
      function b2(a, b) { return '\\left(x^{' + a + '}\\right)^{' + b + '}\\cdot x^{' + b + '}'; }
    }
  });

  /* ============ T1: SOAL CERITA LINEAR (flagship) ============ */
  E.registerFamily({
    familyId: 'wordLin',
    make: function (rng, node, knobs) {
      var mode = rng.int(0, 1);
      if (mode === 0) { // harga
        var ctx = E.context(rng, node.id);
        var x = rng.int(3, 12), y = rng.int(3, 12);
        var p1 = rng.pick([7, 9, 12, 15, 18, 25]), p2 = rng.pick([5, 8, 10, 14, 20]);
        var n1 = rng.int(2, 5), n2 = rng.int(2, 5);
        var total = p1 * n1 + p2 * n2;
        var askP = rng.bool();
        var ans = askP ? p1 : p2;
        var text = 'Di ' + ctx.place + ', ' + ctx.person[0] + ' membeli ' + n1 + ' ' + ctx.items[0] + ' dan ' + n2 + ' ' + ctx.items[1] + ' seharga total ' + U.fmtID(total, 0) + ' (ribu rupiah). Harga 1 ' + ctx.items[0] + ' = ' + p1 + ' ribu. Berapa harga 1 ' + ctx.items[1] + ' (ribu rupiah)?';
        if (askP) text = 'Di ' + ctx.place + ', ' + ctx.person[0] + ' membeli ' + n1 + ' ' + ctx.items[0] + ' dan ' + n2 + ' ' + ctx.items[1] + ' seharga total ' + U.fmtID(total, 0) + ' (ribu rupiah). Harga 1 ' + ctx.items[1] + ' = ' + p2 + ' ribu. Berapa harga 1 ' + ctx.items[0] + ' (ribu rupiah)?';
        return {
          format: 'numeric', promptText: text,
          promptLatex: n1 + 'x+' + n2 + 'y=' + total,
          answer: { value: ans, tol: 0.01 },
          solution: steps('Soal cerita linear', [
            st('Definisikan variabel: x = harga ' + (askP ? ctx.items[0] : ctx.items[1]) + ' (yang dicari), nilai lain diketahui.'),
            st('Bentuk persamaan: ' + n1 + 'x + ' + n2 + '·' + (askP ? p2 : p1) + ' = ' + total + '.'),
            st('Selesaikan: x = (' + total + ' − ' + n2 * (askP ? p2 : p1) + ') ÷ ' + n1 + '.')],
          String(ans), 'Resep universal: definisikan variabel → persamaan → selesaikan → cek balik ke cerita.')
        };
      }
      // kecepatan
      var v = rng.pick([40, 50, 60, 70, 80]);
      var t1 = rng.pick([1.5, 2, 2.5, 3]), t2 = rng.pick([0.5, 1, 1.5]);
      var d = v * t1;
      var tBack = rng.pick([2, 2.5, 3]);
      var avg = Math.round(2 * d / (t1 + tBack) * 10) / 10;
      if (t1 + tBack === t1 * 2 && v === 60) return null;
      return {
        format: 'numeric',
        promptText: 'Sebuah armada ' + 'travel berangkat menempuh ' + U.fmtID(d, 1).replace(',0', '') + ' km dalam ' + U.fmtID(t1, 2).replace(/,?0+$/, '') + ' jam, lalu kembali dengan waktu ' + U.fmtID(tBack, 2).replace(/,?0+$/, '') + ' jam. Berapa kecepatan RATA-RATA selama perjalanan pulang-pergi (km/jam)?',
        answer: { value: avg, tol: 0.3 },
        solution: steps('Kecepatan rata-rata', [
          st('Rata-rata = total jarak ÷ total waktu (BUKAN rata-rata dua kecepatan).'),
          st('Total jarak = 2 × ' + d + ' = ' + 2 * d + ' km; total waktu = ' + (t1 + tBack) + ' jam.')],
        U.fmtID(avg, 1), 'Rata-rata kecepatan selalu total jarak ÷ total waktu — harmonic, bukan aritmetika.')
      };
    }
  });

  /* ============ T1: SISTEM 2 VARIABEL ============ */
  E.registerFamily({
    familyId: 'sysEq',
    make: function (rng, node, knobs) {
      var x = rng.int(2, 9), y = rng.int(2, 9);
      var a1 = rng.int(1, 3), a2 = rng.int(1, 3), b1 = rng.int(1, 4), b2 = rng.int(1, 4);
      while (a1 * b2 === a2 * b1) { b2 = rng.int(1, 4) + 1; }
      var c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
      var askX = rng.bool();
      var ans = askX ? x : y;
      return {
        format: 'numeric', promptText: 'Selesaikan sistem (nilai ' + (askX ? 'x' : 'y') + ').',
        promptLatex: a1 + 'x+' + b1 + 'y=' + c1 + '\\;,\\;' + a2 + 'x+' + b2 + 'y=' + c2,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Sistem dua persamaan', [
          st('Eliminasi: kalikan pers.1 dengan ' + b2 + ' dan pers.2 dengan ' + b1 + ' agar koefisien y sama.'),
          st('Kurangkan → dapat x. Substitusi balik → dapat y. (x, y) = (' + x + ', ' + y + ').')],
        String(ans), 'Eliminasi vs substitusi: pilih yang koefisiennya paling ramah.')
      };
    }
  });

  /* ============ T1: KUADRAT FAKTOR ============ */
  E.registerFamily({
    familyId: 'quadFactor',
    make: function (rng, node, knobs) {
      var r1 = rng.int(-9, 9), r2 = rng.int(-9, 9);
      if (r1 === 0 || r2 === 0 || r1 === r2) return null;
      var b = -(r1 + r2), c = r1 * r2;
      var ask = rng.pick(['akar besar', 'jumlah', 'hasil kali']);
      var ans = ask === 'akar besar' ? Math.max(r1, r2) : ask === 'jumlah' ? (r1 + r2) : c;
      var eq = 'x^2' + (b >= 0 ? '+' : '') + b + 'x' + (c >= 0 ? '+' : '') + c + '=0';
      return {
        format: 'numeric',
        promptText: 'Persamaan ' + eq.replace(/\^2/, '²') + ' punya akar p dan q. Berapa ' + (ask === 'akar besar' ? 'AKAR TERBESARNYA' : ask === 'jumlah' ? 'p + q' : 'p × q') + '?',
        promptLatex: 'x^2' + (b >= 0 ? '+' : '') + b + 'x+' + c + '=0',
        answer: { value: ans, tol: 0.01 },
        solution: steps('Akar kuadrat (Vieta)', [
          st('Jumlah akar p + q = −b = ' + (r1 + r2) + '; hasil kali p·q = c = ' + c + '.'),
          st('Faktorkan: akar-akarnya ' + r1 + ' dan ' + r2 + ' (cek: ' + r1 + '×' + r2 + ' = ' + c + ').')],
        String(ans), 'Vieta: p+q = −b, p·q = c. Cek silang dengan faktorisasi sebelum menjawab.')
      };
    }
  });

  /* ============ T1: ATURAN EKSPONEN LANJUT ============ */
  E.registerFamily({
    familyId: 'expoRules',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 6), b = rng.int(2, 6);
      if (a * b === a + b) b++; // hindari duplikat opsi
      var mode = rng.int(0, 2);
      if (mode === 0) {
        return {
          format: 'mc', promptText: 'Sederhanakan.', promptLatex: 'x^{' + a + '}\\cdot x^{' + b + '}',
          choices: [
            { label: 'x^' + (a + b), latex: 'x^{' + (a + b) + '}', correct: true },
            { label: 'x^' + (a * b), latex: 'x^{' + (a * b) + '}', tag: 'pangkat DIKALI — aturan itu untuk (x^a)^b' },
            { label: 'x^' + Math.abs(a - b), latex: 'x^{' + Math.abs(a - b) + '}', tag: 'pangkat dikurang — aturan itu untuk pembagian' }
          ],
          solution: steps('Aturan eksponen', [st('Sesama basis dikali → pangkat dijumlah: ' + a + ' + ' + b + ' = ' + (a + b) + '.')],
            'x^' + (a + b), 'Kali → jumlah. Bagi → kurang. Pangkat dipangkat → kali.')
        };
      }
      if (mode === 1) {
        return {
          format: 'mc', promptText: 'Sederhanakan.', promptLatex: '\\frac{x^{' + (a + b) + '}}{x^{' + b + '}}',
          choices: [
            { label: 'x^' + a, latex: 'x^{' + a + '}', correct: true },
            { label: 'x^' + (a + b), latex: 'x^{' + (a + b) + '}', tag: 'pembagi diabaikan' },
            { label: 'x^' + (a * b), latex: 'x^{' + (a * b) + '}', tag: 'pangkat dikali' }
          ],
          solution: steps('Aturan eksponen', [st('Sesama basis dibagi → pangkat dikurang: (' + (a + b) + ') − ' + b + ' = ' + a + '.')],
            'x^' + a, 'Kali → jumlah. Bagi → kurang.')
        };
      }
      var e2 = a * 2;
      return {
        format: 'mc', promptText: 'Sederhanakan.', promptLatex: '\\left(2x^{' + a + '}\\right)^{2}',
        choices: [
          { label: '4x^' + e2, latex: '4x^{' + e2 + '}', correct: true },
          { label: '2x^' + e2, latex: '2x^{' + e2 + '}', tag: 'koefisien tidak ikut dikuadratkan' },
          { label: '4x^' + a, latex: '4x^{' + a + '}', tag: 'pangkat tidak dikali 2' }
        ],
        solution: steps('Aturan eksponen', [
          st('Pangkat menyebar ke SEMUA faktor: (2xᵃ)² = 2² · x^(2a) = 4x^' + e2 + '.')],
        '4x^' + e2, '(ab)ⁿ = aⁿbⁿ — koefisien ikut dikuadratkan.')
      };
    }
  });

  /* ============ T1: NILAI MUTLAK ============ */
  E.registerFamily({
    familyId: 'absval',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 12), b = rng.int(2, 15);
      var sol1 = a + b, sol2 = a - b;
      if (sol1 === sol2) return null;
      var askBig = rng.bool();
      var ans = askBig ? Math.max(sol1, sol2) : Math.min(sol1, sol2);
      return {
        format: 'numeric', promptText: 'Selesaikan: berapa penyelesaian ' + (askBig ? 'TERBESAR' : 'TERKECIL') + ' dari persamaan ini?',
        promptLatex: '\\left|x-' + a + '\\right|=' + b,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Nilai mutlak', [
          st('|x − a| = b punya dua solusi: x − a = +' + b + ' atau x − a = −' + b + '.'),
          st('x = ' + sol1 + ' atau x = ' + sol2 + '.')],
        String(ans), 'Mutlak = jarak → dua solusi simetris di sekitar a.')
      };
    }
  });

  /* ============ T1: KONTRAPOSISI ============ */
  E.registerFamily({
    familyId: 'contrapose',
    make: function (rng, node, knobs) {
      var pool = [
        { p: 'Jika mesin panas, maka mesin dihentikan', c: 'Jika mesin tidak dihentikan, maka mesin tidak panas', w1: 'Jika mesin tidak panas, maka mesin tidak dihentikan', w2: 'Jika mesin dihentikan, maka mesin panas' },
        { p: 'Jika kualitas bagus, maka pelanggan kembali', c: 'Jika pelanggan tidak kembali, maka kualitas tidak bagus', w1: 'Jika kualitas tidak bagus, maka pelanggan tidak kembali', w2: 'Jika pelanggan kembali, maka kualitas bagus' },
        { p: 'Jika stok habis, maka produksi dijadwalkan ulang', c: 'Jika produksi tidak dijadwalkan ulang, maka stok tidak habis', w1: 'Jika stok tidak habis, maka produksi tidak dijadwalkan ulang', w2: 'Jika produksi dijadwalkan ulang, maka stok habis' }
      ];
      var it = rng.pick(pool);
      return {
        format: 'mc', promptText: 'Manakah KONTRAPOSISI dari: "' + it.p + '"?',
        choices: [{ label: it.c, correct: true }, { label: it.w1, correct: false, tag: 'itu INVERS (¬p → ¬q), tidak setara' }, { label: it.w2, correct: false, tag: 'itu KONVERS (q → p), tidak setara' }],
        solution: steps('Kontraposisi', [st('Kontraposisi p → q adalah ¬q → ¬p (dibalik DAN dinegasi). Setara dengan aslinya.'),
          st('Invers (¬p → ¬q) dan konvers (q → p) TIDAK setara.')], it.c,
        'Hanya kontraposisi yang setara. Bukti "jika p maka q" bisa lewat "jika tidak q maka tidak p".')
      };
    }
  });

  /* ============ T1: DE MORGAN ============ */
  E.registerFamily({
    familyId: 'demorgan',
    make: function (rng, node, knobs) {
      var pool = [
        { e: 'Tidak (mesin A beroperasi dan mesin B beroperasi)', r: 'Mesin A tidak beroperasi ATAU mesin B tidak beroperasi', w1: 'Mesin A tidak beroperasi DAN mesin B tidak beroperasi', w2: 'Mesin A beroperasi atau mesin B beroperasi' },
        { e: 'Tidak (pengiriman terlambat atau paket rusak)', r: 'Pengiriman tidak terlambat DAN paket tidak rusak', w1: 'Pengiriman tidak terlambat ATAU paket tidak rusak', w2: 'Pengiriman terlambat dan paket rusak' }
      ];
      var it = rng.pick(pool);
      return {
        format: 'mc', promptText: 'Manakah yang SETARA dengan: "' + it.e + '"?',
        choices: [{ label: it.r, correct: true }, { label: it.w1, correct: false, tag: 'ATAU/DAN tidak dibalik — De Morgan membalik konektivitasnya juga' }, { label: it.w2, correct: false, tag: 'negasi hilang' }],
        solution: steps('De Morgan', [st('¬(p ∧ q) = ¬p ∨ ¬q — DAN berubah ATAU.'),
          st('¬(p ∨ q) = ¬p ∧ ¬q — ATAU berubah DAN.')], it.r,
        'De Morgan: negasi masuk, konektivitas MENGALIHKAN (dan↔atau).')
      };
    }
  });

  /* ============ T1: KUANTOR ============ */
  E.registerFamily({
    familyId: 'quantor',
    make: function (rng, node, knobs) {
      var pool = [
        { q: 'Ada mesin yang pernah rusak bulan ini', n: 'Semua mesin tidak pernah rusak bulan ini' },
        { q: 'Ada produk yang gagal uji', n: 'Semua produk lulus uji' },
        { q: 'Ada karyawan yang lembur hari ini', n: 'Semua karyawan tidak lembur hari ini' }
      ];
      var it = rng.pick(pool);
      return {
        format: 'mc', promptText: 'Negasi dari "' + it.q + '" adalah?',
        choices: [{ label: it.n, correct: true }, { label: 'Ada yang tidak ' + it.q.toLowerCase().replace('ada ', ''), correct: false, tag: 'negasi "ada" adalah "tidak ada sama sekali" = "semua tidak"' }, { label: 'Tidak bisa dinegasikan', correct: false }],
        solution: steps('Negasi kuantor eksistensial', [st('¬(Ada x: P) = Semua x: tidak P.')], it.n,
        '"Ada yang rusak" dibantah dengan "semuanya baik-baik saja" — satu pernyataan universal.')
      };
    }
  });

  /* ============ T1: ZEBRA MINI ============ */
  E.registerFamily({
    familyId: 'zebra',
    make: function (rng, node, knobs) {
      var people = rng.shuffle(['Dimas', 'Eka', 'Farhan']);
      var shifts = rng.shuffle(['pagi', 'siang', 'malam']);
      var sol = {}; people.forEach(function (p, i) { sol[p] = shifts[i]; });
      var target = rng.pick(people);
      var clues = [
        people[0] + ' bekerja shift ' + sol[people[0]] + '.',
        people[1] + ' TIDAK bekerja shift ' + (shifts.filter(function (s) { return s !== sol[people[1]]; })[0]) + '.',
        people[2] + ' bekerja shift ' + sol[people[2]] + '.'
      ];
      return {
        format: 'mc',
        promptText: 'Tiga operator — ' + people.join(', ') + ' — shift pagi/siang/malam, satu orang per shift. Petunjuk: (1) ' + clues[0] + ' (2) ' + clues[1] + ' (3) ' + clues[2] + ' Shift ' + target + ' adalah?',
        choices: [{ label: sol[target], correct: true }, { label: shifts.filter(function (s) { return s !== sol[target]; })[0], correct: false, tag: 'cek ulang petunjuk 2 — eliminasi' }, { label: shifts.filter(function (s) { return s !== sol[target]; })[1], correct: false, tag: 'cek ulang petunjuk' }],
        solution: steps('Deduksi grid', [
          st('Buat tabel orang × shift. Tandai langsung dari petunjuk eksplisit.'),
          st('Petunjuk negatif mengeliminasi satu kemungkinan, sisanya pasti.'),
          st('Hasil: ' + people.map(function (p) { return p + '=' + sol[p]; }).join(', '))],
        sol[target], 'Tabel kecil + eliminasi = senjata deduksi. Jangan simpan di kepala, tulis.')
      };
    }
  });

  /* ============ T1: GRADIEN & INTERSEP ============ */
  E.registerFamily({
    familyId: 'slopeIntercept',
    make: function (rng, node, knobs) {
      var m = rng.int(-6, 6); if (m === 0) m = 2;
      var x1 = rng.int(-5, 5), y1 = m * x1 + rng.int(-8, 8);
      var x2 = x1 + rng.int(1, 4), y2 = m * x2 + (y1 - m * x1);
      var ans = m;
      return {
        format: 'numeric', promptText: 'Garis melewati titik (' + x1 + ', ' + y1 + ') dan (' + x2 + ', ' + y2 + '). Berapa gradiennya?',
        promptLatex: 'm=\\frac{' + y2 + '-' + y1 + '}{' + x2 + '-' + x1 + '}',
        answer: { value: ans, tol: 0.01 },
        solution: steps('Gradien dua titik', [
          st('m = (y₂ − y₁)/(x₂ − x₁) = (' + y2 + ' − ' + y1 + ')/(' + x2 + ' − ' + x1 + ') = ' + ((y2 - y1)) + '/' + ((x2 - x1)) + '.')],
        String(ans), 'Gradien = kemiringan = laju perubahan — konsep yang sama dengan turunan.')
      };
    }
  });

  /* ============ T1: BACA GRAFIK ============ */
  E.registerFamily({
    familyId: 'readGraph',
    make: function (rng, node, knobs) {
      var m = rng.int(1, 5), c = rng.int(-6, 6);
      var k = rng.int(1, 6);
      var ans = m * k + c;
      var visual = { type: 'line', caption: 'Grafik y = ' + m + 'x' + (c >= 0 ? '+' : '') + c, m: m, c: c, xFrom: -1, xTo: 6 };
      return {
        format: 'numeric', promptText: 'Lihat grafik. Berapa nilai y saat x = ' + k + '?',
        visual: visual,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Membaca grafik garis', [
          st('Garis melalui (0, ' + c + ') — intersep — dan naik ' + m + ' per 1 x.'),
          st('y = ' + m + '(' + k + ') ' + (c >= 0 ? '+' : '−') + ' ' + Math.abs(c) + '.')],
        String(ans), 'Intersep = titik awal, gradien = laju. Dua info ini mendefinisikan seluruh garis.')
      };
    }
  });

  /* ============ T1: KOMPOSISI FUNGSI ============ */
  E.registerFamily({
    familyId: 'compose',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 5), b = rng.int(1, 9), c = rng.int(2, 4), d = rng.int(1, 6), k = rng.int(1, 4);
      var gk = c * k + d;
      var ans = a * gk + b;
      return {
        format: 'numeric',
        promptText: 'f(x) = ' + a + 'x + ' + b + ' dan g(x) = ' + c + 'x + ' + d + '. Berapa (f ∘ g)(' + k + ') = f(g(' + k + '))?',
        promptLatex: 'f(x)=' + a + 'x+' + b + '\\;,\\;g(x)=' + c + 'x+' + d,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Komposisi fungsi', [
          st('Kerjakan DALAM dulu: g(' + k + ') = ' + c + '(' + k + ') + ' + d + ' = ' + gk + '.'),
          st('Lalu luar: f(' + gk + ') = ' + a + '(' + gk + ') + ' + b + '.')],
        String(ans), 'Komposisi seperti lapisan: dalam dulu, baru luar. Urutan balik beda hasil.')
      };
    }
  });

  /* ============ T1: INVERS FUNGSI ============ */
  E.registerFamily({
    familyId: 'inverse',
    make: function (rng, node, knobs) {
      var a = rng.pick([2, 3, 4, 5]), b = rng.int(1, 9);
      var k = a * rng.int(2, 6) + b;
      var ans = (k - b) / a;
      return {
        format: 'numeric',
        promptText: 'f(x) = ' + a + 'x + ' + b + '. Jika f(x) = ' + k + ', berapa x? (yaitu f⁻¹(' + k + '))',
        promptLatex: a + 'x+' + b + '=' + k,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Invers fungsi', [
          st('Balik prosesnya: kurangi ' + b + ' → bagi ' + a + '.'),
          st('x = (' + k + ' − ' + b + ') ÷ ' + a + '.')],
        String(ans), 'Invers = mesin dijalankan mundur: urutan operasi dibalik urutannya.')
      };
    }
  });

  /* ============ T1: GRAFIK KUADRAT ============ */
  E.registerFamily({
    familyId: 'quadGraph',
    make: function (rng, node, knobs) {
      var r1 = rng.int(-5, 5), r2 = rng.int(-5, 5);
      if (r1 === r2) return null;
      var b = -(r1 + r2), c = r1 * r2;
      var ask = rng.pick(['akar', 'puncak-x']);
      if (ask === 'akar') {
        var visual = { type: 'parabola', caption: 'Grafik y = x²' + (b >= 0 ? '+' : '') + b + 'x+' + c, b: b, c: c };
        return {
          format: 'mc', promptText: 'Lihat grafik. Kumpulan akar-akarnya adalah?',
          visual: visual,
          choices: [
            { label: '{' + Math.min(r1, r2) + ', ' + Math.max(r1, r2) + '}', correct: true },
            { label: '{' + (r1 + r2) + ', ' + c + '}', correct: false, tag: 'itu −b dan c, bukan akarnya' },
            { label: '{' + (-(r1 + r2) / 2) + '}', correct: false, tag: 'itu x puncak' }
          ],
          solution: steps('Akar dari grafik', [st('Akar = titik potong dengan sumbu-x: y = 0.'),
            st('Cek Vieta: jumlah = ' + (r1 + r2) + ' (−b), hasil kali = ' + c + '.')],
          '{' + Math.min(r1, r2) + ', ' + Math.max(r1, r2) + '}', 'Grafik memberi intuisi; Vieta memberi kecepatan. Pakai keduanya.')
        };
      }
      var xv = (r1 + r2) / 2;
      return {
        format: 'numeric', promptText: 'Parabola y = x²' + (b >= 0 ? '+' : '') + b + 'x+' + c + '. Berapa koordinat x titik puncaknya?',
        promptLatex: 'x_{puncak}=-\\frac{b}{2a}',
        answer: { value: xv, tol: 0.01 },
        solution: steps('Titik puncak', [
          st('x puncak = −b/2a dengan a = 1: −(' + b + ')/2 = ' + (xv) + '.'),
          st('Cek: titik tengah dua akar (' + r1 + ', ' + r2 + ') juga = ' + xv + '.')],
        String(xv), 'Puncak selalu di tengah dua akar — simetri parabola.')
      };
    }
  });

  /* ============ T1: STATISTIK FREKUENSI ============ */
  E.registerFamily({
    familyId: 'freqStats',
    make: function (rng, node, knobs) {
      var vals = [];
      var freqs = [];
      var sum = 0, n = 0;
      for (var i = 0; i < 3; i++) { var v = rng.int(2, 9), f = rng.int(2, 6); vals.push(v); freqs.push(f); sum += v * f; n += f; }
      var ans = sum / n;
      if (Math.abs(ans - Math.round(ans * 10) / 10) > 1e-9) return null;
      var visual = { type: 'table', caption: 'Data hasil inspeksi (nilai = skor kualitas)', head: ['Nilai', 'Frekuensi'], rows: vals.map(function (v, i) { return [String(v), String(freqs[i])]; }) };
      return {
        format: 'numeric', promptText: 'Lihat tabel frekuensi. Berapa rata-rata (mean) tertimbang?',
        visual: visual,
        answer: { value: ans, tol: 0.05 },
        solution: steps('Mean data berfrekuensi', [
          st('Kalikan nilai × frekuensi lalu jumlah: ' + vals.map(function (v, i) { return v + '×' + freqs[i]; }).join(' + ') + ' = ' + sum + '.'),
          st('Bagi total frekuensi: ' + sum + ' ÷ ' + n + '.')],
        U.fmtID(ans, 2), 'Data berfrekuensi: boboti setiap nilai — jangan rata-rata kolom mentah.')
      };
    }
  });

  /* ============ T1: SEBARAN (IQR & VARIAN) ============ */
  E.registerFamily({
    familyId: 'spread',
    make: function (rng, node, knobs) {
      var askVar = rng.bool();
      var data = [];
      for (var i = 0; i < 5; i++) data.push(rng.int(4, 30));
      var s = data.slice().sort(function (a, b) { return a - b; });
      if (askVar) {
        var n2 = 4;
        var data4 = data.slice(0, 4);
        var m = data4.reduce(function (x, y) { return x + y; }, 0) / n2;
        var v = data4.reduce(function (acc, x) { return acc + (x - m) * (x - m); }, 0) / n2;
        if (Math.abs(v - Math.round(v * 100) / 100) > 1e-9) return null;
        return {
          format: 'numeric', promptText: 'Data: ' + data4.join(', ') + '. Berapa VARIANSI POPULASINYA (dibagi n)?',
          answer: { value: v, tol: 0.05 },
          solution: steps('Variansi populasi', [
            st('Mean m = ' + U.fmtID(m, 2) + '.'),
            st('σ² = Σ(x−m)²/n = (' + data4.map(function (x) { return '(' + x + '−' + U.fmtID(m, 2) + ')²'; }).join('+') + ') ÷ 4.')],
          U.fmtID(v, 2), 'Variansi = rata-rata kuadrat jarak ke mean. Akarnya = standar deviasi.')
        };
      }
      var q1 = s[1], q3 = s[3];
      return {
        format: 'numeric', promptText: 'Data: ' + data.join(', ') + '. Berapa IQR (Q3 − Q1)? Untuk 5 data: Q1 = nilai ke-2, Q3 = nilai ke-4 setelah diurutkan.',
        answer: { value: q3 - q1, tol: 0.01 },
        solution: steps('IQR', [
          st('Urutkan: ' + s.join(', ') + '.'),
          st('Q1 = ' + q1 + ', Q3 = ' + q3 + ' → IQR = ' + q3 + ' − ' + q1 + '.')],
        String(q3 - q1), 'IQR = lebar "jantung data", tahan pencilan (beda dengan range.')
      };
    }
  });

  /* ============ T1: BACPLOT ============ */
  E.registerFamily({
    familyId: 'boxRead',
    make: function (rng, node, knobs) {
      var vals = [];
      for (var i = 0; i < 5; i++) vals.push(rng.int(5, 40));
      var s = vals.slice().sort(function (a, b) { return a - b; });
      var min = s[0], q1 = s[1], med = s[2], q3 = s[3], max = s[4];
      var visual = { type: 'box', caption: 'Boxplot waktu produksi (menit)', min: min, q1: q1, med: med, q3: q3, max: max };
      var ask = rng.pick(['median', 'iqr', 'max-min']);
      var ans = ask === 'median' ? med : ask === 'iqr' ? q3 - q1 : max - min;
      return {
        format: 'numeric', promptText: 'Lihat boxplot. Berapa ' + (ask === 'median' ? 'MEDIAN' : ask === 'iqr' ? 'IQR (Q3−Q1)' : 'RANGE (max−min)') + '?',
        visual: visual,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Membaca boxplot', [
          st('Boxplot: garis tengah = median, kotak = Q1–Q3, kumis = min–max.'),
          st('Median = ' + med + ', Q1 = ' + q1 + ', Q3 = ' + q3 + ', min = ' + min + ', max = ' + max + '.')],
        String(ans), 'Lima angka ringkas: min, Q1, median, Q3, max — boxplot adalah ringkasan distribusi.')
      };
    }
  });

  /* ============ T2: MENTAL MATH RUSH ============ */
  E.registerFamily({
    familyId: 'rush',
    make: function (rng, node, knobs) {
      var kind = node.id; // mm.campur2 | mm.persen-cepat | mmsen-cepat | mm.trick | mm.jam
      if (kind === 'mm.campur2') {
        var a = rng.int(6, 25), b = rng.int(2, 9), c = rng.int(5, 40);
        var ans = a * b + c;
        return {
          format: 'numeric', rush: true, promptText: 'Hitung cepat:', promptLatex: a + '\\times' + b + '+' + c,
          answer: { value: ans, tol: 0.01 },
          solution: steps('Rush', [st('Kali dulu: ' + a + '×' + b + ' = ' + (a * b) + ', lalu tambah ' + c + '.')], String(ans), 'Napas, kali dulu, baru tambah.')
        };
      }
      if (kind === 'mm.persen-cepat') {
        var p = rng.pick([5, 10, 15, 20, 25, 50, 75]);
        var base = rng.pick([40, 60, 80, 120, 160, 200, 240, 320, 400]);
        var ans2 = p * base / 100;
        return {
          format: 'numeric', rush: true, promptText: p + '% dari ' + base + ' =', promptLatex: p + '\\%\\times' + base,
          answer: { value: ans2, tol: 0.01 },
          solution: steps('Rush persen', [st('Cara cepat: 1% dari ' + base + ' = ' + base / 100 + ', jadi ' + p + '% = ' + p + ' × ' + base / 100 + ' = ' + ans2 + '.')], String(ans2), '1% dulu, lalu kalikan — teknik serbaguna untuk semua persen.')
        };
      }
      if (kind === 'mm.trick') {
        var n = rng.pick([11, 5, 25, 50]), m = rng.int(4, 48);
        var ans3 = n * m;
        return {
          format: 'numeric', rush: true, promptText: n + ' × ' + m + ' = (pakai trik)', promptLatex: m + '\\times' + n,
          answer: { value: ans3, tol: 0.01 },
          solution: steps('Trik perkalian', [
            n === 11 ? st('×11 = ×10 + diri sendiri: ' + m + '0 + ' + m + ' = ' + ans3 + '.')
              : n === 5 ? st('×5 = setengah dari ×10: ' + (m * 10 / 2) + '.')
                : n === 25 ? st('×25 = perempat dari ×100: ' + m + '00 ÷ 4 = ' + ans3 + '.')
                  : st('×50 = setengah dari ×100: ' + m + '00 ÷ 2 = ' + ans3 + '.')],
          String(ans3), 'Trik ×11, ×5, ×25, ×50 membuat hitungan "susah" jadi satu langkah.')
        };
      }
      var now = rng.int(1, 11), plus = rng.int(3, 16);
      var ans4 = ((now + plus - 1) % 12) + 1;
      return {
        format: 'numeric', rush: true, promptText: 'Sekarang jam ' + now + '. ' + plus + ' jam lagi jam berapa? (format 12 jam)',
        answer: { value: ans4, tol: 0.01 },
        solution: steps('Aritmetika jam (mod 12)', [st(now + ' + ' + plus + ' = ' + (now + plus) + '; karena > 12, kurangi 12 (atau ulang dari 12).')],
        String(ans4), 'Jam adalah aritmetika modular — konsep yang sama dengan CPU & penjadwalan.')
      };
    }
  });

  /* ============ T2: LIMIT ============ */
  E.registerFamily({
    familyId: 'limitPoly',
    make: function (rng, node, knobs) {
      var mode = rng.int(0, 1);
      if (mode === 0) {
        var k = rng.int(1, 6), a = rng.int(1, 5), b = rng.int(1, 9), c = rng.int(1, 9);
        var ans = a * k * k + b * k + c;
        return {
          format: 'numeric', promptText: 'Hitung limit (substitusi langsung bisa).',
          promptLatex: '\\lim_{x\\to ' + k + '}\\left(' + a + 'x^2+' + b + 'x+' + c + '\\right)',
          answer: { value: ans, tol: 0.01 },
          solution: steps('Limit polinomial', [st('Polinomial kontinu → substitusi langsung: ' + a + '(' + k + ')² + ' + b + '(' + k + ') + ' + c + '.')],
          String(ans), 'Kalau fungsi kontinu di titik itu, limit = nilai fungsi. Selesai.')
        };
      }
      var r = rng.int(2, 7);
      var ans2 = 2 * r;
      return {
        format: 'numeric', promptText: 'Hitung limit (bentuk 0/0 — faktorkan).',
        promptLatex: '\\lim_{x\\to ' + r + '}\\frac{x^2-' + r * r + '}{x-' + r + '}',
        answer: { value: ans2, tol: 0.01 },
        solution: steps('Limit bentuk 0/0', [
          st('Pembilang = (x−' + r + ')(x+' + r + ') — selisih kuadrat.'),
          st('Coret (x−' + r + '), sisakan x + ' + r + '. Substitusi x = ' + r + ' → ' + (r + r) + '.')],
        String(ans2), '0/0 bukan jawaban akhir — itu tanda untuk faktorkan/rasionalisasi.')
      };
    }
  });

  /* ============ T2: TURUNAN POWER RULE (FLAGSHIP) ============ */
  E.registerFamily({
    familyId: 'power',
    make: function (rng, node, knobs) {
      var L = knobs.level;
      var terms = L <= 1 ? 2 : rng.int(2, 3);
      var coefs = [], pows = [];
      for (var i = 0; i < terms; i++) {
        coefs.push(rng.int(1, 9) * (rng.bool(0.75) ? 1 : -1));
        pows.push(rng.int(1, 4));
      }
      var k = rng.int(1, 4);
      var mode = rng.pick(L <= 1 ? ['val', 'val', 'zero'] : ['val', 'zero', 'expr']);
      var f = function (x) { var s = 0; for (var i = 0; i < terms; i++) s += coefs[i] * Math.pow(x, pows[i]); return s; };
      var df = function (x) { var s = 0; for (var i = 0; i < terms; i++) s += coefs[i] * pows[i] * Math.pow(x, pows[i] - 1); return s; };
      var fx = buildLatex(coefs, pows);
      if (mode === 'expr') {
        var right = buildDLatex(coefs, pows);
        return {
          format: 'mc', promptText: 'Turunan pertama f′(x) adalah?', promptLatex: 'f(x)=' + fx,
          choices: [
            { label: plainD(coefs, pows), latex: right, correct: true },
            { label: plainNoMinus(coefs, pows), latex: buildDLatexWrong(coefs, pows), tag: 'konstanta per suku tidak dikali pangkat' },
            { label: plainInt(coefs, pows), latex: buildILatex(coefs, pows), tag: 'itu hasil INTEGRAL (pangkat naik), bukan turunan' }
          ],
          solution: steps('Aturan pangkat', [
            st('Turunkan per suku: koefisien × pangkat, pangkat dikurangi 1.'),
            st('Suku ' + (terms === 2 ? 'kedua' : 'ketiga') + ' ikut aturan yang sama.')],
          right, 'Turun = pangkat turun. Kalikan dulu, baru kurangi.')
        };
      }
      if (mode === 'zero') {
        // f'(x)=0 → cari x kritis dengan bentuk 2 suku ax^n - bx (kritis mudah)
        var a = rng.int(2, 6), n = rng.pick([2, 3]), b = rng.int(2, 9);
        var xcrit = n === 2 ? U.fmtID(b / (2 * a), 2) : U.fmtID(Math.sqrt(b / (3 * a)), 2);
        var xcv = n === 2 ? b / (2 * a) : Math.sqrt(b / (3 * a));
        if (Math.abs(xcv - Math.round(xcv)) > 1e-9 && n === 3) return null;
        if (n === 2 && Math.abs(xcv - Math.round(xcv)) > 1e-9) return null;
        return {
          format: 'numeric', promptText: 'Di titik berapakah gradien f(x) = ' + a + 'x' + (n === 2 ? '² − ' + b + 'x' : '³ − ' + b + 'x') + ' sama dengan nol? (titik kritis)',
          promptLatex: a + 'x^' + n + '-' + b + 'x',
          answer: { value: xcv, tol: 0.01 },
          solution: steps('Titik kritis', [
            st('f′(x) = ' + a * n + 'x' + (n === 2 ? ' − ' + b : '² − ' + b) + ' = 0.'),
            st('Selesaikan: x = ' + xcrit + '.')],
          xcrit, 'Turunan nol = kemiringan datar = kandidat maksimum/minimum — pintu menuju optimasi.')
        };
      }
      var ans3 = df(k);
      var wrongFx = f(k);
      var ctx = E.context(rng, node.id);
      return {
        format: 'numeric',
        promptText: rng.bool() ? 'f(x) = ' + plain(coefs, pows) + '. Berapa f′(' + k + ')?'
          : 'Posisi partikel di conveyor ' + ctx.place + ': s(t) = ' + plain(coefs, pows).replace(/x/g, 't') + ' meter. Berapa kecepatannya saat t = ' + k + ' m/s?',
        promptLatex: 'f(x)=' + fx,
        answer: { value: ans3, tol: 0.01 },
        solution: steps('Turunan lalu substitusi', [
          st('Turunkan dulu: f′(x) = ' + plainD(coefs, pows) + '.'),
          st('Baru substitusi x = ' + k + ': ' + U.fmtID(ans3, 2) + '.')],
        U.fmtID(ans3, 2), 'Turunkan DULU, substitusi BELAKANGAN. Kebalik urutan = jebakan klasik.')
      };
      function buildLatex(cs, ps) {
        var s = '';
        for (var i = 0; i < cs.length; i++) {
          var c = cs[i], p = ps[i];
          if (c === 0) continue;
          if (i > 0) s += c > 0 ? '+' : '-';
          else if (c < 0) s += '-';
          var ac = Math.abs(c);
          s += (p === 0 ? ac : (ac === 1 ? '' : ac) + 'x' + (p > 1 ? '^{' + p + '}' : ''));
        }
        return s;
      }
      function buildDLatex(cs, ps) { var c2 = [], p2 = []; for (var i = 0; i < cs.length; i++) { if (ps[i] >= 1) { c2.push(cs[i] * ps[i]); p2.push(ps[i] - 1); } } return buildLatex(c2, p2); }
      function buildDLatexWrong(cs, ps) { var c2 = [], p2 = []; for (var i = 0; i < cs.length; i++) { if (ps[i] >= 1) { c2.push(cs[i]); p2.push(ps[i] - 1); } } return buildLatex(c2, p2); }
      function buildILatex(cs, ps) { var c2 = [], p2 = []; for (var i = 0; i < cs.length; i++) { c2.push(cs[i] / (ps[i] + 1)); p2.push(ps[i] + 1); } return buildLatex(c2.map(function (x) { return Math.round(x * 100) / 100; }), p2); }
      function plain(cs, ps) { return buildLatex(cs, ps).replace(/\^\{(\d)\}/g, '^$1'); }
      function plainD(cs, ps) { return buildDLatex(cs, ps).replace(/\^\{(\d)\}/g, '^$1'); }
      function plainNoMinus(cs, ps) { return buildDLatexWrong(cs, ps).replace(/\^\{(\d)\}/g, '^$1'); }
      function plainInt(cs, ps) { return buildILatex(cs, ps).replace(/\^\{(\d)\}/g, '^$1'); }
    }
  });

  /* ============ T2: ATURAN HASIL KALI ============ */
  E.registerFamily({
    familyId: 'prodRule',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 5), b = rng.int(1, 9), c = rng.int(2, 6), d = rng.int(1, 9), k = rng.int(1, 4);
      // f(x)=(ax+b)(cx+d); f' = a(cx+d)+c(ax+b); f'(k)
      var dv = a * (c * k + d) + c * (a * k + b);
      var wrongExpand = (a * c) * 1;
      return {
        format: 'numeric',
        promptText: 'f(x) = (' + a + 'x + ' + b + ')(' + c + 'x + ' + d + '). Berapa f′(' + k + ')?',
        promptLatex: 'f(x)=(' + a + 'x+' + b + ')(' + c + 'x+' + d + ')',
        answer: { value: dv, tol: 0.01 },
        solution: steps('Aturan hasil kali', [
          st('(uv)′ = u′v + uv′ dengan u = ' + a + 'x+' + b + ', v = ' + c + 'x+' + d + '.'),
          st('f′(x) = ' + a + '(' + c + 'x+' + d + ') + ' + c + '(' + a + 'x+' + b + '); substitusi x = ' + k + '.')],
        String(dv), 'Aturan hasil kali: turunkan bergantian lalu jumlahkan dua hasil kali.')
      };
    }
  });

  /* ============ T2: CHAIN RULE ============ */
  E.registerFamily({
    familyId: 'chain',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 5), b = rng.int(1, 6), n = rng.int(2, 5), k = rng.int(1, 3);
      // f(x)=(ax+b)^n ; f'(k)= n*a*(a k + b)^{n-1}
      var inner = a * k + b;
      var dv = n * a * Math.pow(inner, n - 1);
      var right = n + '\\cdot' + a + '\\left(' + a + 'x+' + b + '\\right)^{' + (n - 1) + '}';
      var w1 = n + '\\left(' + a + 'x+' + b + '\\right)^{' + (n - 1) + '}';
      var w2 = a + '\\left(' + a + 'x+' + b + '\\right)^{' + n + '}';
      return {
        format: 'mc', promptText: 'Turunan pertama f(x) = (' + a + 'x + ' + b + ')^' + n + ' adalah?',
        promptLatex: 'f(x)=' + '\\left(' + a + 'x+' + b + '\\right)^{' + n + '}',
        choices: [
          { label: plainOf(right), latex: right, correct: true },
          { label: plainOf(w1), latex: w1, tag: 'turunan bagian dalam (×' + a + ') hilang' },
          { label: plainOf(w2), latex: w2, tag: 'pangkat tidak turun / turunan dalam salah' }
        ],
        solution: steps('Aturan rantai', [
          st('Bawa pangkat ke depan, kurangi pangkat, KALI turunan bagian dalam.'),
          st('Bagian dalam ' + a + 'x+' + b + ' punya turunan ' + a + '.')],
        right, 'Chain rule = tangga: turun luar, kali turun dalam. Jangan lupa "kali turun dalam".')
      };
      function plainOf(s) { return s.replace(/\\cdot/g, '·').replace(/\\left\(/g, '(').replace(/\\right\)/g, ')').replace(/\^\{(\d)\}/g, '^$1').replace(/\\/g, ''); }
    }
  });

  /* ============ T2: GARIS SINGGUNG ============ */
  E.registerFamily({
    familyId: 'tangent',
    make: function (rng, node, knobs) {
      var a = rng.int(1, 4), b = rng.int(-9, 9), k = rng.int(1, 5);
      var dv = 2 * a * k + b;
      return {
        format: 'numeric', promptText: 'Gradien garis singgung kurva y = ' + (a === 1 ? '' : a) + 'x²' + (b >= 0 ? '+' : '') + b + 'x di titik x = ' + k + ' adalah?',
        promptLatex: 'y=' + a + 'x^2' + (b >= 0 ? '+' : '') + b + 'x',
        answer: { value: dv, tol: 0.01 },
        solution: steps('Gradien garis singgung', [
          st('Gradien singgung = turunan di titik itu: y′ = ' + 2 * a + 'x' + (b >= 0 ? '+' : '') + b + '.'),
          st('Substitusi x = ' + k + ' → ' + dv + '.')],
        String(dv), 'Turunan di satu titik = kemiringan singgung = laju sesaat.')
      };
    }
  });

  /* ============ T2: INTEGRAL TAK TENTU ============ */
  E.registerFamily({
    familyId: 'indefInt',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 6), n = rng.int(1, 3);
      var c = a / (n + 1);
      if (Math.abs(c - Math.round(c)) > 1e-9) { // pakai koefisien agar cantik
        var a2 = (n + 1) * rng.int(2, 5);
        var right = 'x^{' + (n + 1) + '}+C';
        return {
          format: 'mc', promptText: 'Integral tak tentu:', promptLatex: '\\int ' + a2 + 'x^{' + n + '}\\,dx',
          choices: [
            { label: a2 + 'x^' + (n + 1) + '+C... cek', latex: '\\frac{' + a2 + '}{' + (n + 1) + '}x^{' + (n + 1) + '}+C', correct: true },
            { label: 'x^' + (n + 1) + '+C', latex: 'x^{' + (n + 1) + '}+C', tag: 'koefisien belum dibagi pangkat baru' },
            { label: a2 + 'x^' + (n + 1) + '+C', latex: a2 + 'x^{' + (n + 1) + '}+C', tag: 'langsung naikkan pangkat tanpa membagi' }
          ],
          solution: steps('Integral power rule', [
            st('Naikkan pangkat +1, bagi koefisien dengan pangkat baru.'),
            st(a2 + ' ÷ ' + (n + 1) + ' = ' + (a2 / (n + 1)) + ' → jawaban (' + a2 / (n + 1) + ')x^' + (n + 1) + ' + C.')],
          right, 'Integral = turunan terbalik: naikkan pangkat, bagi. Jangan lupa +C.')
        };
      }
      return null;
    }
  });

  /* ============ T2: INTEGRAL TENTU ============ */
  E.registerFamily({
    familyId: 'defInt',
    make: function (rng, node, knobs) {
      var a = rng.int(1, 4), b = rng.int(0, 6), u = rng.int(2, 5);
      // ∫0..u (a x + b) dx
      var ans = a * u * u / 2 + b * u;
      return {
        format: 'numeric', promptText: 'Hitung integral tentu (nilai LUAS di bawah garis dari x=0 sampai x=' + u + ').',
        promptLatex: '\\int_{0}^{' + u + '}\\left(' + a + 'x+' + b + '\\right)dx',
        answer: { value: ans, tol: 0.05 },
        solution: steps('Integral tentu', [
          st('Antiturunan: ' + (a / 2 === Math.round(a / 2) ? a / 2 + 'x²' : U.fmtID(a / 2, 1).replace(',', '.') + 'x²') + '+' + b + 'x.'),
          st('Substitusi batas atas (' + u + ') dikurangi batas bawah (0): ' + U.fmtID(ans, 2) + '.')],
        U.fmtID(ans, 2), 'Integral tentu = luas bersih — antiturunan di batas atas dikurangi batas bawah.')
      };
    }
  });

  /* ============ T2: TRIG NILAI ISTIMEWA ============ */
  E.registerFamily({
    familyId: 'trigVal',
    make: function (rng, node, knobs) {
      var table = [
        { a: 0, s: '0', c: '1', t: '0' },
        { a: 30, s: '1/2', c: '√3/2', t: '√3/3' },
        { a: 45, s: '√2/2', c: '√2/2', t: '1' },
        { a: 60, s: '√3/2', c: '1/2', t: '√3' },
        { a: 90, s: '1', c: '0', t: 'tak terdefinisi' }
      ];
      var it = rng.pick(table);
      var f = rng.pick(['sin', 'cos', 'tan']);
      if (f === 'tan' && it.a === 90) f = 'sin';
      var ans = f === 'sin' ? it.s : f === 'cos' ? it.c : it.t;
      var all = ['0', '1/2', '√2/2', '√3/2', '1', '√3', '√3/3'];
      var wrongs = rng.shuffle(all.filter(function (x) { return x !== ans; })).slice(0, 3);
      return {
        format: 'mc', promptText: 'Nilai eksak dari:', promptLatex: f + '\\' + it.a + '^\\circ',
        choices: [{ label: ans, correct: true }].concat(wrongs.map(function (w) { return { label: w, correct: false, tag: 'cek tabel sudut istimewa / sin-cos tertukar' }; })),
        solution: steps('Sudut istimewa', [
          st('Hafal segitiga istimewa: 45-45-90 (sisi 1,1,√2) dan 30-60-90 (sisi 1,√3,2).'),
          st(f + ' ' + it.a + '° = ' + ans + '.')],
        ans, 'Hafalkan tabel ini — muncul dari fisika sampai sinyal & gelombang.')
      };
    }
  });

  /* ============ T2: TRIG PERBANDINGAN ============ */
  E.registerFamily({
    familyId: 'trigRatio',
    make: function (rng, node, knobs) {
      var triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
      var t = rng.pick(triples);
      var f = rng.pick(['sin', 'cos', 'tan']);
      var ans = f === 'sin' ? t[0] + '/' + t[2] : f === 'cos' ? t[1] + '/' + t[2] : t[0] + '/' + t[1];
      var wrongs = [t[1] + '/' + t[2], t[0] + '/' + t[1], t[1] + '/' + t[0]];
      return {
        format: 'mc',
        promptText: 'Segitiga siku-siku: sisi depan sudut θ = ' + t[0] + ', sisi samping = ' + t[1] + ', hipotenusa = ' + t[2] + '. Berapa ' + f + ' θ?',
        choices: [{ label: ans, correct: true }].concat(wrongs.filter(function (w) { return w !== ans; }).slice(0, 3).map(function (w) { return { label: w, correct: false, tag: 'posisi sisi tertukar (depan/samping/hipotenusa)' }; })),
        solution: steps('Perbandingan trigonometri', [
          st('SOH-CAH-TOA: sin = depan/hipotenusa, cos = samping/hipotenusa, tan = depan/samping.'),
          st(f + ' θ = ' + ans + '.')],
        ans, 'SOH-CAH-TOA: gambar segitiganya, tandai sisi, baru baca.')
      };
    }
  });

  /* ============ T2: PYTHAGORAS TERAPAN ============ */
  E.registerFamily({
    familyId: 'pythApp',
    make: function (rng, node, knobs) {
      var triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25]];
      var t = rng.pick(triples);
      var askHyp = rng.bool();
      var ans;
      if (askHyp) { ans = t[2]; var text = 'Tangga bersandar: kaki tangga ' + t[0] + ' m dari dinding, ujung tangga ' + t[1] + ' m di atas tanah. Berapa panjang tangga (m)?'; }
      else { ans = t[1]; var text = 'Tangga ' + t[2] + ' m bersandar dengan kaki ' + t[0] + ' m dari dinding. Berapa tinggi ujung tangga di dinding (m)?'; }
      return {
        format: 'numeric', promptText: text,
        promptLatex: askHyp ? 'c^2=' + t[0] + '^2+' + t[1] + '^2' : t[1] + '^2=' + t[2] + '^2-' + t[0] + '^2',
        answer: { value: ans, tol: 0.01 },
        solution: steps('Pythagoras', [
          st('a² + b² = c² (c = sisi terpanjang/hypotenusa).'),
          askHyp ? st(t[0] + '² + ' + t[1] + '² = ' + (t[0] * t[0]) + ' + ' + (t[1] * t[1]) + ' = ' + (t[2] * t[2]) + ' → c = ' + t[2] + '.')
            : st(t[2] + '² − ' + t[0] + '² = ' + (t[2] * t[2]) + ' − ' + (t[0] * t[0]) + ' = ' + (t[1] * t[1]) + ' → b = ' + t[1] + '.')],
        String(ans), 'Kenali tripel Pythagoras (3,4,5 · 5,12,13 · 8,15,17) — menghemat waktu ujian.')
      };
    }
  });

  /* ============ T2: GEOMETRI LUAS & VOLUME ============ */
  E.registerFamily({
    familyId: 'geoAV',
    make: function (rng, node, knobs) {
      var mode = rng.int(0, 2);
      if (mode === 0) {
        var p = rng.pick([24, 32, 40, 48, 60]);
        var side = p / 4;
        return {
          format: 'numeric', promptText: 'Sebuah taman berbentuk persegi panjang dengan keliling ' + p + ' m. Berapa luas MAKSIMUM yang mungkin (m²)?',
          answer: { value: side * side, tol: 0.01 },
          solution: steps('Optimasi mini', [
            st('Keliling tetap → luas maksimum justru persegi (bukti lewat turunan/AM-GM).'),
            st('Sisi = ' + p + ' ÷ 4 = ' + side + ' → luas = ' + side + '² = ' + (side * side) + '.')],
          String(side * side), 'Keliling tetap: persegi juara luas. Intuisi optimasi paling awal.')
        };
      }
      if (mode === 1) {
        var r = rng.int(2, 9), t2 = rng.int(3, 15);
        var ans2 = 22 / 7 * r * r * t2; // pakai π=22/7 dengan r kelipatan 7? simplified: use integer-friendly
        if (r % 7 !== 0) return null;
        return {
          format: 'numeric', promptText: 'Tabung: radius ' + r + ' cm, tinggi ' + t2 + ' cm. Volume (cm³, π = 22/7)?',
          promptLatex: 'V=\\pi r^2 h',
          answer: { value: ans2, tol: 2 },
          solution: steps('Volume tabung', [st('V = πr²t = 22/7 × ' + r * r + ' × ' + t2 + '.')],
          U.fmtID(ans2, 0), 'π = 22/7 untuk radius kelipatan 7 — konvensi soal Indonesia.')
        };
      }
      var l = rng.int(4, 15), w = rng.int(3, 12);
      return {
        format: 'numeric', promptText: 'Lantai bengkel berbentuk persegi panjang ' + l + ' m × ' + w + ' m. Berapa luasnya (m²)?',
        answer: { value: l * w, tol: 0.01 },
        solution: steps('Luas persegi panjang', [st('L = p × l = ' + l + ' × ' + w + '.')], String(l * w),
        'Luas dasar banyak soal: material, cat, tata letak fasilitas.')
      };
    }
  });
})();
