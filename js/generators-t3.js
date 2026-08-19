/* Vista Forgy — generators-t3.js (Tier 3 lengkap: kalkulus lanjut, integral, matriks & vektor,
   kombinatorik, peluang bersyarat/binomial/normal, inferensia t/z, regresi) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var E = VF.ENGINE, U = E.util;
  function steps(title, arr, final, takeaway) { return { title: title, steps: arr, final: final, takeaway: takeaway }; }
  function st(text, latex) { return latex ? { text: text, latex: latex } : { text: text }; }
  function fx(v, dec) { return U.fmtID(v, dec === undefined ? 2 : dec); }

  /* ===== T3: RELATED RATES (tangga) ===== */
  E.registerFamily({
    familyId: 'related',
    make: function (rng, node, knobs) {
      var trip = rng.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]]);
      var L = trip[2], x = trip[0], y = trip[1];
      var v = rng.pick([0.5, 1, 2, 0.4]);
      var ans = -(x / y) * v;
      return {
        format: 'numeric',
        promptText: 'Tangga ' + L + ' m bersandar di dinding. Kaki tangga ditarik menjauh dengan laju ' + fx(v, 1).replace(',0', '') + ' m/detik. Saat kaki tangga ' + x + ' m dari dinding, seberapa cepat UJUNG TANGGA TURUN? (tanda negatif = turun, 3 desimal)',
        promptLatex: 'x^2+y^2=' + L * L,
        answer: { value: ans, tol: 0.02 },
        solution: steps('Laju berhubung (related rates)', [
          st('Pythagoras: x² + y² = ' + L * L + ' → saat x = ' + x + ', y = ' + y + '.'),
          st('Turunkan terhadap waktu t: 2x·(dx/dt) + 2y·(dy/dt) = 0.'),
          st('dy/dt = −(x/y)·(dx/dt) = −(' + x + '/' + y + ')×' + v + ' = ' + ans.toFixed(3).replace('.', ',') + ' m/s.')],
        ans.toFixed(3).replace('.', ',') + ' m/s', 'Related rates: hubungkan variabel (Pythagoras), turunkan terhadap WAKTU, substitusi.')
      };
    }
  });

  /* ===== T3: OPTIMASI TERIKAT (pagar 3 sisi) ===== */
  E.registerFamily({
    familyId: 'optim',
    make: function (rng, node, knobs) {
      var P = 4 * rng.int(6, 20);
      var x = P / 4, y = P / 2, A = x * y;
      var ask = rng.pick(['x', 'y', 'A']);
      var ans = ask === 'x' ? x : ask === 'y' ? y : A;
      return {
        format: 'numeric',
        promptText: 'Sebuah area penyimpanan ' + 'di samping tembok: pagar hanya 3 sisi (2 lebar + 1 panjang, tembok menutup sisi keempat). Total pagar ' + P + ' m. Agar luas maksimum, berapa ' + (ask === 'x' ? 'LEBAR (m)' : ask === 'y' ? 'PANJANG (m)' : 'LUAS MAKSIMUM (m²)') + '?',
        promptLatex: 'A=x\\cdot y\\;,\\;2x+y=' + P,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Optimasi terikat', [
          st('Kendala: 2x + y = ' + P + ' → y = ' + P + ' − 2x.'),
          st('Luas A = x(' + P + ' − 2x) = ' + P + 'x − 2x². Turunan: A′ = ' + P + ' − 4x = 0 → x = ' + x + '.'),
          st('Maka y = ' + y + (ask === 'A' ? ' dan A = ' + x + ' × ' + y + ' = ' + A + '.' : '.'))],
        (ask === 'A' ? A : ans) + (ask === 'A' ? ' m²' : ' m'), 'Optimasi selalu dua langkah: (1) substitusi kendala ke tujuan, (2) turunan = nol.')
      };
    }
  });

  /* ===== T3: LIMIT TRIG ===== */
  E.registerFamily({
    familyId: 'limtrig',
    make: function (rng, node, knobs) {
      var k = rng.int(2, 9);
      var mode = rng.int(0, 1);
      if (mode === 0) {
        return {
          format: 'numeric', promptText: 'Hitung limit (gunakan sin x ≈ x untuk x kecil).',
          promptLatex: '\\lim_{x\\to 0}\\frac{\\sin ' + k + 'x}{x}',
          answer: { value: k, tol: 0.01 },
          solution: steps('Limit trigonometri', [
            st('Bagi pembilang & penyebut: sin(' + k + 'x)/x = k · sin(' + k + 'x)/(' + k + 'x).'),
            st('Saat u → 0, sin(u)/u → 1, jadi hasil = k × 1 = ' + k + '.')],
          String(k), 'sin(kx)/x → k. Trik: samakan "isi" sinus dengan penyebut.')
        };
      }
      var n = rng.int(2, 6);
      return {
        format: 'numeric', promptText: 'Hitung limit.',
        promptLatex: '\\lim_{x\\to 0}\\frac{' + n + 'x}{\\sin x}',
        answer: { value: n, tol: 0.01 },
        solution: steps('Limit trigonometri', [st(n + 'x/sin(x) = ' + n + ' · (x/sin x) = ' + n + ' × 1.')],
        String(n), 'x/sin(x) → 1 — kebalikan dari sin(x)/x.')
      };
    }
  });

  /* ===== T3: INTEGRAL SUBSTITUSI ===== */
  E.registerFamily({
    familyId: 'usub',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 6), n = rng.int(2, 4), b = rng.int(1, 6);
      var cRight = 1 / (a * (n + 1));
      var right = '\\frac{1}{' + (a * (n + 1)) + '}\\left(' + a + 'x+' + b + '\\right)^{' + (n + 1) + '}+C';
      return {
        format: 'mc', promptText: 'Integral tak tentu (substitusi u = ' + a + 'x + ' + b + '):',
        promptLatex: '\\int\\left(' + a + 'x+' + b + '\\right)^{' + n + '}dx',
        choices: [
          { label: '1/' + (a * (n + 1)) + '(' + a + 'x+' + b + ')^' + (n + 1) + '+C', latex: right, correct: true },
          { label: '1/' + (n + 1) + '(' + a + 'x+' + b + ')^' + (n + 1) + '+C', latex: '\\frac{1}{' + (n + 1) + '}\\left(' + a + 'x+' + b + '\\right)^{' + (n + 1) + '}+C', tag: 'lupa membagi turunan bagian dalam (×' + a + ')' },
          { label: '1/' + a + '(' + a + 'x+' + b + ')^' + n + '+C', latex: '\\frac{1}{' + a + '}\\left(' + a + 'x+' + b + '\\right)^{' + n + '}+C', tag: 'pangkat tidak naik' }
        ],
        solution: steps('Substitusi u', [
          st('u = ' + a + 'x + ' + b + ' → du = ' + a + ' dx → dx = du/' + a + '.'),
          st('Integral = (1/' + a + ')∫u^' + n + ' du = (1/' + a + ')·u^' + (n + 1) + '/' + (n + 1) + ' = ' + U.fmtID(cRight, 4).replace(',', '.') + '·u^' + (n + 1) + ' + C.'),
          st('Kembalikan u dan jangan lupa +C.')],
        right, 'Substitusi: cari "dalam", turunannya, lalu bagi. +C wajib.')
      };
    }
  });

  /* ===== T3: RATA-RATA FUNGSI & VOLUME PUTAR ===== */
  E.registerFamily({
    familyId: 'favg',
    make: function (rng, node, knobs) {
      var askVol = rng.bool();
      if (!askVol) {
        var a = rng.int(2, 6), b = rng.int(1, 9), k = rng.int(2, 6);
        var ans = a * k / 2 + b;
        return {
          format: 'numeric', promptText: 'Berapa NILAI RATA-RATA f(x) = ' + a + 'x + ' + b + ' pada interval [0, ' + k + ']?',
          promptLatex: '\\bar{f}=\\frac{1}{' + k + '}\\int_0^{' + k + '}(' + a + 'x+' + b + ')\\,dx',
          answer: { value: ans, tol: 0.05 },
          solution: steps('Nilai rata-rata fungsi', [
            st('Rata-rata = (1/(b−a))∫f dx = (1/' + k + ')[' + a + 'x²/2 + ' + b + 'x] dari 0 sampai ' + k + '.'),
            st('= (1/' + k + ')(' + (a * k * k / 2) + ' + ' + b * k + ') = ' + ans + '.')],
          String(ans), 'Rata-rata fungsi = tinggi persegi panjang yang luasnya sama dengan luas di bawah kurva.')
        };
      }
      var a2 = rng.int(1, 3), k2 = rng.int(2, 3);
      var vol = Math.PI * a2 * a2 * Math.pow(k2, 3) / 3;
      var volRounded = Math.round(vol * 100) / 100;
      return {
        format: 'numeric', promptText: 'Kurva y = ' + (a2 === 1 ? '' : a2) + 'x diputar mengelilingi sumbu-x dari x=0 sampai x=' + k2 + '. Volume benda putar? (gunakan π ≈ 3,14159; 2 desimal)',
        promptLatex: 'V=\\pi\\int_0^{' + k2 + '}\\left(' + a2 + 'x\\right)^2dx',
        answer: { value: volRounded, tol: 0.15 },
        solution: steps('Volume putar (cakram)', [
          st('V = π∫y² dx = π∫' + (a2 * a2) + 'x² dx = π·' + (a2 * a2) + '·x³/3 dari 0 sampai ' + k2 + '.'),
          st('= π·' + (a2 * a2) + '·' + (k2 * k2 * k2) + '/3 = ' + ((a2 * a2 * k2 * k2 * k2) / 3) + 'π ≈ ' + volRounded.toFixed(2).replace('.', ',') + '.')],
        volRounded.toFixed(2).replace('.', ','), 'Cakram: V = π∫(radius)²dx — radiusnya adalah y.')
      };
    }
  });

  /* ===== T3: PERKALIAN MATRIKS ===== */
  E.registerFamily({
    familyId: 'mtops',
    make: function (rng, node, knobs) {
      var A = [[rng.int(-6, 9), rng.int(-6, 9)], [rng.int(-6, 9), rng.int(-6, 9)]];
      var B = [[rng.int(-6, 9), rng.int(-6, 9)], [rng.int(-6, 9), rng.int(-6, 9)]];
      var c11 = A[0][0] * B[0][0] + A[0][1] * B[1][0];
      var c12 = A[0][0] * B[0][1] + A[0][1] * B[1][1];
      var askFirst = rng.bool();
      var ans = askFirst ? c11 : c12;
      return {
        format: 'numeric',
        promptText: 'Diketahui matriks A dan B (lihat rumus). Berapa elemen C = A×B pada baris 1 kolom ' + (askFirst ? '1' : '2') + '?',
        promptLatex: 'A=\\begin{pmatrix}' + A[0][0] + '&' + A[0][1] + '\\\\' + A[1][0] + '&' + A[1][1] + '\\end{pmatrix}\\;,\\;B=\\begin{pmatrix}' + B[0][0] + '&' + B[0][1] + '\\\\' + B[1][0] + '&' + B[1][1] + '\\end{pmatrix}',
        answer: { value: ans, tol: 0.01 },
        solution: steps('Perkalian matriks', [
          st('Baris A × kolom ' + (askFirst ? '1' : '2') + ' B: ' + A[0][0] + '×' + (askFirst ? B[0][0] : B[0][1]) + ' + ' + A[0][1] + '×' + (askFirst ? B[1][0] : B[1][1]) + '.'),
          st('= ' + (A[0][0] * (askFirst ? B[0][0] : B[0][1])) + ' + ' + (A[0][1] * (askFirst ? B[1][0] : B[1][1])) + ' = ' + ans + '.')],
        String(ans), 'Baris kali kolom, lalu jumlah. Elemen C(i,j) = Σ A(i,k)·B(k,j).')
      };
    }
  });

  /* ===== T3: DETERMINAN 3×3 ===== */
  E.registerFamily({
    familyId: 'det3',
    make: function (rng, node, knobs) {
      var m = [];
      for (var i = 0; i < 3; i++) { m.push([rng.int(-4, 5), rng.int(-4, 5), rng.int(-4, 5)]); }
      var det =
        m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
        m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
      if (det === 0) return null;
      var wrongSign = -det;
      var wrongDiag = m[0][0] * m[1][1] * m[2][2];
      return {
        format: 'mc', promptText: 'Berapa determinan matriks 3×3 berikut? (ekspansi kofaktor baris pertama)',
        promptLatex: '\\begin{vmatrix}' + m[0].join('&') + '\\\\' + m[1].join('&') + '\\\\' + m[2].join('&') + '\\end{vmatrix}',
        choices: U.mkMc(String(det), [
          { label: String(wrongSign), tag: 'tanda kofaktar terbalik (pola + − +)' },
          { label: String(wrongDiag), tag: 'hanya diagonal utama — kofaktor punya 6 suku' },
          { label: String(det + m[0][1] * m[1][0]), tag: 'satu suku minor salah tanda' }
        ], rng),
        solution: steps('Determinan 3×3', [
          st('Pola + − + pada baris pertama: a(ei − fh) − b(di − fg) + c(dh − eg).'),
          st('Substitusi angka: ' + det + '.')],
        String(det), 'Kofaktor baris pertama dengan pola tanda selang-seling. Latih sampai lancar — ini muncul di Cramer & Kriega… eh, kofaktor.')
      };
    }
  });

  /* ===== T3: VEKTOR ===== */
  E.registerFamily({
    familyId: 'vektor',
    make: function (rng, node, knobs) {
      var mode = rng.pick(['dot', 'cross', 'cos']);
      var u1 = rng.int(-5, 8), u2 = rng.int(-5, 8), v1 = rng.int(-5, 8), v2 = rng.int(-5, 8);
      var mag = function (a, b) { return Math.sqrt(a * a + b * b); };
      if (mode === 'dot') {
        var ans = u1 * v1 + u2 * v2;
        return {
          format: 'numeric', promptText: 'u = (' + u1 + ', ' + u2 + '), v = (' + v1 + ', ' + v2 + '). Berapa u · v (dot product)?',
          promptLatex: '\\vec{u}\\cdot\\vec{v}=' + u1 + '\\cdot' + v1 + '+' + u2 + '\\cdot' + v2,
          answer: { value: ans, tol: 0.01 },
          solution: steps('Dot product', [st('Kalikan komponen searah lalu jumlahkan: ' + u1 + '×' + v1 + ' + ' + u2 + '×' + v2 + ' = ' + ans + '.')],
          String(ans), 'u·v = |u||v|cosθ — nol berarti tegak lurus.')
        };
      }
      if (mode === 'cross') {
        var cz = u1 * v2 - u2 * v1;
        return {
          format: 'numeric', promptText: 'Vektor bidang u = (' + u1 + ', ' + u2 + '), v = (' + v1 + ', ' + v2 + '). Berapa komponen-z dari u × v?',
          promptLatex: '\\vec{u}\\times\\vec{v}=\\left(0,\\,0,\\,' + u1 + '\\cdot' + v2 + '-' + u2 + '\\cdot' + v1 + '\\right)',
          answer: { value: cz, tol: 0.01 },
          solution: steps('Cross product (2D)', [st('Komponen-z = u₁v₂ − u₂v₁ = ' + (u1 * v2) + ' − ' + (u2 * v1) + ' = ' + cz + '.')],
          String(cz), 'u×v tegak lurus kedua vektor; panjangnya = luas jajar genjang.')
        };
      }
      var mu = mag(u1, u2), mv = mag(v1, v2);
      var cosv = (u1 * v1 + u2 * v2) / (mu * mv);
      if (!isFinite(cosv) || Math.abs(cosv) > 1) return null;
      if (Math.abs(cosv - Math.round(cosv * 100) / 100) > 1e-9) return null;
      return {
        format: 'numeric', promptText: 'u = (' + u1 + ', ' + u2 + '), v = (' + v1 + ', ' + v2 + '). Berapa cos sudut antara u dan v? (3 desimal)',
        promptLatex: '\\cos\\theta=\\frac{\\vec{u}\\cdot\\vec{v}}{|\\vec{u}||\\vec{v}|}',
        answer: { value: cosv, tol: 0.02 },
        solution: steps('Sudut antar vektor', [
          st('u·v = ' + (u1 * v1 + u2 * v2) + '; |u| = ' + fx(mu, 3).replace(',', '.') + '; |v| = ' + fx(mv, 3).replace(',', '.') + '.'),
          st('cosθ = ' + (u1 * v1 + u2 * v2) + '/(' + fx(mu, 3).replace(',', '.') + '×' + fx(mv, 3).replace(',', '.') + ') = ' + cosv.toFixed(3).replace('.', ',') + '.')],
        cosv.toFixed(3).replace('.', ','), 'cosθ dari dot product. 0 = tegak lurus, 1 = searah.')
      };
    }
  });

  /* ===== T3: KOMBINATORIK ===== */
  E.registerFamily({
    familyId: 'counting',
    make: function (rng, node, knobs) {
      function fact(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
      function C(n, r) { return fact(n) / (fact(r) * fact(n - r)); }
      function P(n, r) { return fact(n) / fact(n - r); }
      var n = rng.int(5, 8), r = rng.int(2, 3);
      var mode = rng.bool(); // true = kombinasi (tim), false = permutasi (urutan)
      var ctx = E.context(rng, node.id);
      var ans = mode ? C(n, r) : P(n, r);
      var other = mode ? P(n, r) : C(n, r);
      if (ans === other) return null;
      return {
        format: 'numeric',
        promptText: mode
          ? 'Dari ' + n + ' karyawan ' + ctx.place + ' akan dipilih ' + r + ' orang membentuk TIM (urutan tidak penting). Berapa banyak cara?'
          : 'Dari ' + n + ' karyawan ' + ctx.place + ' akan dipilih ' + r + ' orang untuk menduduki posisi BERBEDA (urutan penting: ketua, sekretaris, …). Berapa banyak cara?',
        promptLatex: mode ? 'C(' + n + ',' + r + ')=\\frac{' + n + '!}{' + r + '!(' + n + '-' + r + ')!}' : 'P(' + n + ',' + r + ')=\\frac{' + n + '!}{(' + n + '-' + r + ')!}',
        answer: { value: ans, tol: 0.01 },
        solution: steps(mode ? 'Kombinasi' : 'Permutasi', [
          st(mode ? 'Urutan tidak penting → kombinasi: C(n,r) = n!/(r!(n−r)!).' : 'Urutan penting → permutasi: P(n,r) = n!/(n−r)!.'),
          st('C(' + n + ',' + r + ') = ' + ans + (mode ? '' : ' (karena posisi dibedakan, hasil lebih besar dari kombinasi = ' + C(n, r) + ').'))],
        String(ans), 'Pertanyaan kunci: "apakah urutan penting?" Tim = kombinasi; jabatan berbeda = permutasi.')
      };
    }
  });

  /* ===== T3: PELUANG BERSYARAT (tabel) ===== */
  E.registerFamily({
    familyId: 'cond',
    make: function (rng, node, knobs) {
      var nA = rng.int(40, 80), nB = rng.int(40, 80);
      var dA = rng.pick([0.05, 0.1, 0.15, 0.2]) , dB = rng.pick([0.05, 0.1, 0.15, 0.25]);
      var cA = Math.round(nA * dA), cB = Math.round(nB * dB);
      if (cA === 0 || cB === 0) return null;
      var askA = rng.bool();
      var num = askA ? cA : cB, den = askA ? nA : nB;
      var ans = Math.round(num / den * 1000) / 1000;
      if (Math.abs(ans * 1000 - Math.round(ans * 1000)) > 1e-9) return null;
      var visual = { type: 'table', caption: 'Hasil inspeksi dua lini produksi', head: ['Lini', 'Cacat', 'Baik', 'Total'], rows: [['A', String(cA), String(nA - cA), String(nA)], ['B', String(cB), String(nB - cB), String(nB)]] };
      return {
        format: 'numeric', promptText: 'Lihat tabel. Berapa peluang item cacat BERNILAI diketahui berasal dari lini ' + (askA ? 'A' : 'B') + '? (3 desimal)',
        promptLatex: 'P(C|' + (askA ? 'A' : 'B') + ')=\\frac{' + num + '}{' + den + '}',
        visual: visual,
        answer: { value: ans, tol: 0.02 },
        solution: steps('Peluang bersyarat', [
          st('P(C|L) = jumlah cacat lini itu ÷ total lini itu = ' + num + '/' + den + '.'),
          st('Perhatikan: penyebutnya total LINI ITU, bukan keseluruhan — itu bedanya dengan Bayes.')],
        ans.toFixed(3).replace('.', ','), 'Bersyarat = mempersempit dunia ke baris/kolom yang diketahui.')
      };
    }
  });

  /* ===== T3: BINOMIAL ===== */
  E.registerFamily({
    familyId: 'binom',
    make: function (rng, node, knobs) {
      function C(n, r) { function f(x) { var a = 1; for (var i = 2; i <= x; i++) a *= i; return a; } return f(n) / (f(r) * f(n - r)); }
      var n = rng.pick([4, 5, 6]);
      var k = rng.int(1, n - 1);
      var cumul = rng.bool();
      var TBv = VF.TABLES;
      if (cumul) {
        var ansC = Math.round(TBv.binomCdf(n, k, 0.5) * 10000) / 10000;
        var visual = TBv.binomTableVisual(n, k, 0.5);
        return {
          format: 'numeric',
          promptText: 'Mesin menghasilkan bagus/cacat sama likely (p=0,5). Dari ' + n + ' produk, peluang paling banyak ' + k + ' cacat — P(X ≤ ' + k + ') — pakai tabel kumulatif di bawah. (4 desimal)',
          promptLatex: 'P(X\\le ' + k + ')=\\sum_{i=0}^{' + k + '}C(' + n + ',i)\\,0{,}5^' + n,
          visual: visual,
          answer: { value: ansC, tol: 0.005 },
          solution: steps('Binomial kumulatif', [
            st('P(X ≤ ' + k + ') = Φ tabel kumulatif pada baris k=' + k + ' → ' + TBv.f4(ansC) + '.'),
            st('Cek: sama dengan jumlah P(X=i) untuk i=0…' + k + ' (kolom kumulatif sudah menjumlahkannya).')],
          TBv.f4(ansC), 'Kumulatif tabel = jumlah berantai pmf — cara cepat uji "paling banyak k".')
        };
      }
      var ways = C(n, k);
      var ans = ways / Math.pow(2, n);
      return {
        format: 'numeric',
        promptText: 'Sebuah mesin menghasilkan produk bagus/cacat dengan peluang sama (p = 0,5, independen). Dari ' + n + ' produk, peluang TEPAT ' + k + ' cacat adalah? (4 desimal)',
        promptLatex: 'P(X=' + k + ')=C(' + n + ',' + k + ')\\cdot 0{,}5^' + k + '\\cdot 0{,}5^{' + (n - k) + '}',
        answer: { value: ans, tol: 0.005 },
        solution: steps('Distribusi binomial', [
          st('Banyak cara memilih posisi cacat: C(' + n + ',' + k + ') = ' + ways + '.'),
          st('Tiap pola berpeluang 0,5^' + n + ' = ' + (1 / Math.pow(2, n)) + '.'),
          st('P = ' + ways + ' × ' + (1 / Math.pow(2, n)) + ' = ' + ans.toFixed(4).replace('.', ',') + '.')],
        ans.toFixed(4).replace('.', ','), 'Binomial: C(n,k)·p^k·q^(n−k). Dengan p=0,5 semua pola sama peluang.')
      };
    }
  });

  /* ===== T3: EKSPEKTASI & VARIAN ===== */
  E.registerFamily({
    familyId: 'expvar',
    make: function (rng, node, knobs) {
      var vals = [], probs = [];
      var rest = 1;
      for (var i = 0; i < 2; i++) { var p = rng.pick([0.1, 0.2, 0.25, 0.3, 0.4]); if (p >= rest) p = Math.round((rest - 0.1) * 10) / 10; if (p <= 0) return null; probs.push(p); rest -= p; }
      probs.push(Math.round(rest * 100) / 100);
      if (probs[2] <= 0) return null;
      vals = [rng.int(1, 5), rng.int(6, 12), rng.int(13, 20)];
      var mu = 0, i2;
      for (i2 = 0; i2 < 3; i2++) mu += vals[i2] * probs[i2];
      var varr = 0;
      for (i2 = 0; i2 < 3; i2++) varr += probs[i2] * (vals[i2] - mu) * (vals[i2] - mu);
      var askVar = rng.bool();
      var ans = askVar ? varr : mu;
      if (Math.abs(ans * 100 - Math.round(ans * 100)) > 1e-9) return null;
      var visual = { type: 'table', caption: 'Distribusi permintaan harian', head: ['Nilai x', 'Peluang'], rows: vals.map(function (v, i) { return [String(v), probs[i].toFixed(2).replace('.', ',')]; }) };
      return {
        format: 'numeric', promptText: 'Lihat tabel distribusi. Berapa ' + (askVar ? 'VARIANSI (σ²)' : 'EKSPEKTASI E[X]') + '? (2 desimal)',
        promptLatex: askVar ? '\\sigma^2=\\sum p_i(x_i-\\mu)^2' : 'E[X]=\\sum p_i x_i',
        visual: visual,
        answer: { value: ans, tol: 0.05 },
        solution: steps('Ekspektasi & variansi', [
          st('E[X] = ' + vals.map(function (v, i) { return v + '×' + probs[i].toFixed(2).replace('.', ','); }).join(' + ') + ' = ' + mu.toFixed(2).replace('.', ',') + '.'),
          askVar ? st('σ² = Σp(x−μ)² = ' + varr.toFixed(2).replace('.', ',') + '. (E[X²] − μ² juga sah.)') : st('Ekspektasi = rata-rata tertimbang peluang.')],
        ans.toFixed(2).replace('.', ','), 'E[X] = rata-rata tertimbang; σ² = rata-rata kuadrat simpangan. Dasar semua analisis risiko.')
      };
    }
  });

  /* ===== T3: NORMAL (z & luas) ===== */
  E.registerFamily({
    familyId: 'normal',
    make: function (rng, node, knobs) {
      var mode = rng.pick(['z', 'area']);
      var zRows = [[0.5, 0.6915], [1.0, 0.8413], [1.5, 0.9332], [2.0, 0.9772], [2.5, 0.9938]];
      if (mode === 'z') {
        var mu = rng.int(30, 90), sd = rng.pick([4, 5, 8, 10]), zk = rng.pick([1, 2, 1.5, 0.5, 2.5]);
        var x = mu + zk * sd;
        var ans = zk;
        return {
          format: 'numeric', promptText: 'Berat produk normal: μ = ' + mu + ' gram, σ = ' + sd + ' gram. Sebuah produk ' + x + ' gram. Berapa skor-z-nya? (mis. 1,5)',
          promptLatex: 'z=\\frac{x-\\mu}{\\sigma}=\\frac{' + x + '-' + mu + '}{' + sd + '}',
          answer: { value: ans, tol: 0.02 },
          solution: steps('Standardisasi z', [st('z = (' + x + ' − ' + mu + ')/' + sd + ' = ' + (x - mu) + '/' + sd + ' = ' + zk + '.')],
          String(zk).replace('.', ','), 'z mengubah satuan apa pun menjadi "simpangan baku dari rata-rata".')
        };
      }
      var TBv = (window.VF && VF.TABLES) || null;
      if (!TBv) return null;
      var zd = Math.round(rng.pick([0.7, 1.1, 1.3, 1.7, 1.9, 2.1, 2.4, 2.6]) * 10) / 10;
      var phi = Math.round(TBv.normCdf(zd) * 10000) / 10000;
      var visual = TBv.zTableVisual(zd);
      var wrongs = [
        { label: TBv.f4(1 - phi), tag: 'itu P(Z > z) = 1 − Φ(z)' },
        { label: TBv.f4(phi / 2), tag: 'itu setengah luas — salah baca tabel' },
        { label: TBv.f4(2 * phi - 1), tag: 'itu luas antara −z dan z' }
      ];
      return {
        format: 'mc', promptText: 'Dengan tabel Z granular di bawah, berapa P(Z ≤ ' + TBv.f2(zd) + ')?',
        visual: visual,
        choices: [{ label: TBv.f4(phi), correct: true }].concat(wrongs),
        solution: steps('Membaca tabel Z', [st('Tabel memberi Φ(z) = luas kumulatif dari kiri sampai z — baca baris ' + TBv.f2(zd) + '.'),
          st('Φ(' + TBv.f2(zd) + ') = ' + TBv.f4(phi) + '.')],
        TBv.f4(phi), 'Tabel Z = luas kumulatif kiri. P(Z>z) = 1−Φ; luas tengah = 2Φ−1.')
      };
    }
  });

  /* ===== T3: CI-t ===== */
  E.registerFamily({
    familyId: 'cit',
    make: function (rng, node, knobs) {
      var TBv = VF.TABLES;
      var df = rng.pick([4, 5, 6, 8, 9, 12, 14, 19, 24, 29]);
      var dfRow = [df, TBv.t975(df)];
      var n = dfRow[0] + 1, t = dfRow[1];
      var xbar = rng.int(40, 90), s = rng.pick([4, 5, 6, 8, 10]);
      var se = s / Math.sqrt(n);
      var me = t * se;
      var askLo = rng.bool();
      var ans = askLo ? xbar - me : xbar + me;
      var visual = TBv.tTableVisual(dfRow[0], false);
      return {
        format: 'numeric', promptText: 'Sampel n = ' + n + ' (σ tidak diketahui): x̄ = ' + xbar + ', s = ' + s + '. CI 95% memakai t(df = ' + dfRow[0] + '). Berapa batas ' + (askLo ? 'BAWAH' : 'ATAS') + '? (2 desimal)',
        promptLatex: '\\bar{x}\\pm t\\frac{s}{\\sqrt{n}}',
        visual: visual,
        answer: { value: ans, tol: 0.2 },
        solution: steps('CI dengan t', [
          st('Galat baku = s/√n = ' + s + '/√' + n + ' = ' + se.toFixed(4).replace('.', ',') + '.'),
          st('Margin = t × SE = ' + t.toFixed(3).replace('.', ',') + ' × ' + se.toFixed(4).replace('.', ',') + ' = ' + me.toFixed(3).replace('.', ',') + '.'),
          st('Interval: ' + (xbar - me).toFixed(2).replace('.', ',') + ' … ' + (xbar + me).toFixed(2).replace('.', ',') + '.')],
        ans.toFixed(2).replace('.', ','), 'σ tidak diketahui → t, bukan z. t sedikit lebih lebar (hukuman sampel kecil).')
      };
    }
  });

  /* ===== T3: UJI-z ===== */
  E.registerFamily({
    familyId: 'ujiz',
    make: function (rng, node, knobs) {
      var mode = rng.bool();
      if (mode) {
        var mu0 = rng.int(40, 80), n = rng.pick([36, 49, 64, 100]), sd = rng.pick([6, 8, 10, 12]);
        var z = rng.pick([-2.5, -2, -1.5, 1.5, 2, 2.5]);
        var xbar = mu0 + z * sd / Math.sqrt(n);
        return {
          format: 'numeric', promptText: 'Klaim: μ = ' + mu0 + '. Sampel n = ' + n + ' memberi x̄ = ' + xbar.toFixed(2).replace('.', ',') + ', σ = ' + sd + '. Berapa statistik uji z? (2 desimal)',
          promptLatex: 'z=\\frac{\\bar{x}-\\mu_0}{\\sigma/\\sqrt{n}}',
          answer: { value: z, tol: 0.05 },
          solution: steps('Uji z satu mean', [
            st('z = (' + xbar.toFixed(2).replace('.', ',') + ' − ' + mu0 + ')/(' + sd + '/√' + n + ') = ' + ((xbar - mu0)).toFixed(3).replace('.', ',') + '/' + (sd / Math.sqrt(n)).toFixed(4).replace('.', ',') + '.'),
            st('z = ' + z + '. |z| > 1,96 → tolak H₀ pada 5%.')],
          String(z).replace('.', ','), 'Uji hipotesis = ukur jarak klaim ke data, dalam satuan galat baku.')
        };
      }
      var pool = [
        { q: 'Uji menghasilkan p-value = 0,03 (α = 0,05). Kesimpulan?', o: [['Tolak H₀ — hasil signifikan', 1], ['Terima H₀ — tidak signifikan', 0, 'p > α salah baca: 0,03 < 0,05'], ['p terlalu kecil, uji gagal', 0, 'p kecil justru bukti kuat melawan H₀']] },
        { q: 'p-value = 0,08 (α = 0,05). Kesimpulan?', o: [['Gagal tolak H₀ — bukan bukti H₀ benar', 1], ['Terima H₀ — H₀ terbukti benar', 0, 'gagal tolak ≠ bukti kebenaran H₀'], ['Tolak H₀', 0, 'p > α → tidak cukup bukti menolak']] }
      ];
      var it = rng.pick(pool);
      return {
        format: 'mc', promptText: it.q,
        choices: it.o.map(function (x) { return { label: x[0], correct: !!x[1], tag: x[2] }; }),
        solution: steps('Interpretasi p-value', [st('p-value = peluang data se-extreme ini JIKA H₀ benar. p < α → tolak H₀.'),
          st('Gagal tolak H₀ bukan berarti H₀ benar — hanya bukti belum cukup.')],
        it.o[0][1] ? 'Tolak H₀' : 'Gagal tolak H₀', 'p kecil = data langka di bawah H₀. Bahasa uji semua riset.')
      };
    }
  });

  /* ===== T3: REGRESI SEDERHANA ===== */
  E.registerFamily({
    familyId: 'reg',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 9), b = rng.int(5, 30);
      var n = 4;
      var pts = [];
      for (var i = 1; i <= n; i++) pts.push([i, a * i + b]);
      var xf = rng.int(5, 8);
      var ans = a * xf + b;
      var visual = { type: 'table', caption: 'Data permintaan (x = bulan, y = unit)', head: ['x', 'y'], rows: pts.map(function (p) { return [String(p[0]), String(p[1])]; }) };
      return {
        format: 'numeric', promptText: 'Data mengikuti garis lurus sempurna y = a + bx. Lihat tabel. Prediksi y saat x = ' + xf + '!',
        promptLatex: '\\hat{y}=b_0+b_1 x',
        visual: visual,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Regresi linier sederhana', [
          st('Data kenaikan konstan ' + a + ' per x → b₁ = ' + a + ' (kemiringan).'),
          st('Saat x = 1, y = ' + (a + b) + ' → b₀ = ' + (a + b) + ' − ' + a + ' = ' + b + '.'),
          st('ŷ = ' + b + ' + ' + a + '×' + xf + ' = ' + ans + '.')],
        String(ans), 'Regresi = garis terbaik: b₁ = rata-rata kenaikan; prediksi = substitusi. Dasar forecasting.')
      };
    }
  });

  /* ===== T3: GAUSS — ELIMINASI BERTAHAP (format steps) ===== */
  E.registerFamily({
    familyId: 'gauss',
    make: function (rng, node, knobs) {
      var x = rng.int(2, 9), y = rng.int(2, 9);
      var a1 = rng.int(1, 3), m = rng.int(2, 4), a2 = m * a1;
      var b1 = rng.int(1, 6), b2 = rng.int(1, 6);
      while (b2 === m * b1) b2 = rng.int(1, 9);
      var c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
      var newB = b2 - m * b1, newC = c2 - m * c1;
      if (newB === 0) return null;
      return {
        format: 'steps',
        promptText: 'Selesaikan sistem dengan ELIMINASI: kalikan pers.1 dengan m, kurangkan dari pers.2 untuk menghilangkan x, lalu substitusi balik.',
        promptLatex: a1 + 'x+' + b1 + 'y=' + c1 + '\;,\;' + a2 + 'x+' + b2 + 'y=' + c2,
        steps: [
          { label: 'pengali m (agar koef. x pers.2 = koef. x pers.1 × m)', value: m, tol: 0.01 },
          { label: 'nilai y (dari persamaan hasil pengurangan)', value: y, tol: 0.01 },
          { label: 'nilai x (substitusi balik ke pers.1)', value: x, tol: 0.01 }
        ],
        answer: { value: x + y, tol: 0.01 },
        solution: steps('Eliminasi Gauss', [
          st('Pers.2 − m×pers.1: (' + a2 + '−' + m + '×' + a1 + ')x + (' + b2 + '−' + m + '×' + b1 + ')y = ' + c2 + '−' + m + '×' + c1 + ' → 0·x + ' + newB + 'y = ' + newC + '.'),
          st('y = ' + newC + ' ÷ ' + newB + ' = ' + y + '.'),
          st('Substitusi: ' + a1 + 'x = ' + c1 + ' − ' + b1 + '×' + y + ' = ' + (c1 - b1 * y) + ' → x = ' + x + '.'),
          st('Cek di pers.2: ' + a2 + '×' + x + ' + ' + b2 + '×' + y + ' = ' + c2 + ' ✓')
        ], 'x = ' + x + ', y = ' + y, 'Eliminasi: samakan satu koefisien → kurangkan → substitusi balik → selalu CEK.')
      };
    }
  });

  /* ===== T3: RUMUS KUADRAT BERTAHAP (format steps) ===== */
  E.registerFamily({
    familyId: 'quadSteps',
    make: function (rng, node, knobs) {
      var r1 = rng.int(-8, 8), r2 = rng.int(-8, 8);
      if (r1 === 0 || r2 === 0 || r1 === r2) return null;
      var b = -(r1 + r2), c = r1 * r2;
      var D = b * b - 4 * c;
      var big = Math.max(r1, r2), small = Math.min(r1, r2);
      return {
        format: 'steps',
        promptText: 'Selesaikan x² ' + (b >= 0 ? '+ ' + b : '− ' + Math.abs(b)) + 'x ' + (c >= 0 ? '+ ' + c : '− ' + Math.abs(c)) + ' = 0 dengan RUMUS KUADRAT — isi tiga langkah.',
        promptLatex: 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
        steps: [
          { label: 'diskriminan D = b² − 4ac', value: D, tol: 0.01 },
          { label: 'akar terbesar x₁ = (−b + √D)/2', value: big, tol: 0.01 },
          { label: 'akar terkecil x₂ = (−b − √D)/2', value: small, tol: 0.01 }
        ],
        answer: { value: big + small, tol: 0.01 },
        solution: steps('Rumus kuadrat', [
          st('a = 1, b = ' + b + ', c = ' + c + '.'),
          st('D = (' + b + ')² − 4×' + c + ' = ' + (b * b) + ' − ' + (4 * c) + ' = ' + D + ' → √D = ' + Math.sqrt(D) + '.'),
          st('x = (−(' + b + ') ± ' + Math.sqrt(D) + ')/2 → x₁ = ' + big + ', x₂ = ' + small + '.'),
          st('Cek Vieta: x₁ + x₂ = ' + (big + small) + ' = −b ✓; x₁·x₂ = ' + (big * small) + ' = c ✓')
        ], 'x₁ = ' + big + ', x₂ = ' + small, 'Rumus kuadrat selalu bekerja; Vieta untuk mengecek. D < 0 = akar imajiner.')
      };
    }
  });

  /* ===== v1.5.1: GAUSS 3×3 FULL (format steps) ===== */
  E.registerFamily({
    familyId: 'gauss3',
    make: function (rng, node, knobs) {
      var x = rng.int(2, 7), y = rng.int(2, 7), z = rng.int(2, 7);
      var a1 = rng.int(1, 3), b1 = rng.int(1, 4), c1 = rng.int(1, 4);
      var m21 = rng.int(1, 2), m31 = rng.int(1, 2);
      var b2 = rng.int(1, 2), k = rng.int(1, 3);
      var b3 = k * b2; // jamin pengali eliminasi kedua bulat
      var c2 = rng.int(1, 5), c3 = rng.int(1, 5);
      var c3dd = c3 - k * c2;
      if (c3dd === 0) return null;
      var r1 = a1 * x + b1 * y + c1 * z;
      var r2p = b2 * y + c2 * z;
      var r3p = b3 * y + c3 * z;
      var r2 = m21 * r1 + r2p, r3 = m31 * r1 + r3p;
      var a2 = m21 * a1, b2o = m21 * b1 + b2, c2o = m21 * c1 + c2;
      var a3 = m31 * a1, b3o = m31 * b1 + b3, c3o = m31 * c1 + c3;
      var z3 = r3p - k * r2p; // = c3dd * z (konsisten by construction)
      var visual = {
        type: 'table', caption: 'Sistem 3×3 (dikonstruksi agar eliminasi ramah)',
        head: ['', 'x', 'y', 'z', 'RHS'],
        rows: [
          ['R1', String(a1), String(b1), String(c1), String(r1)],
          ['R2', String(a2), String(b2o), String(c2o), String(r2)],
          ['R3', String(a3), String(b3o), String(c3o), String(r3)]
        ]
      };
      return {
        format: 'steps',
        promptText: 'Selesaikan sistem 3×3 dengan eliminasi Gauss: hapus x dari R2 (pengali m21) dan R3 (m31), lalu hapus y dari baris-3′ (pengali k = koef y R3′ ÷ koef y R2′), lalu substitusi balik. Petunjuk: semua pengali & jawaban BULAT.',
        promptLatex: 'O\\!E\\Rightarrow\\text{segitiga atas}\\Rightarrow\\text{substitusi balik}',
        visual: visual,
        steps: [
          { label: 'pengali m21 (R2 ← R2 − m21·R1)', value: m21, tol: 0.01 },
          { label: 'RHS baris-2 BARU setelah eliminasi x', value: r2p, tol: 0.01 },
          { label: 'nilai z (dari baris terakhir setelah eliminasi y)', value: z, tol: 0.01 },
          { label: 'nilai y (substitusi balik ke baris-2 baru)', value: y, tol: 0.01 },
          { label: 'nilai x (substitusi balik ke R1)', value: x, tol: 0.01 }
        ],
        answer: { value: x + y + z, tol: 0.01 },
        solution: steps('Gauss 3×3', [
          st('R2′ = R2 − ' + m21 + '·R1 → 0·x + ' + b2 + 'y + ' + c2 + 'z = ' + r2p + ' (RHS baru ' + r2p + ').'),
          st('R3′ = R3 − ' + m31 + '·R1 → ' + b3 + 'y + ' + c3 + 'z = ' + r3p + '.'),
          st('Eliminasi y: R3″ = R3′ − ' + k + '·R2′ → 0y + ' + c3dd + 'z = ' + z3 + ' → z = ' + z + '.'),
          st('Substitusi balik: ' + b2 + 'y = ' + r2p + ' − ' + c2 + '×' + z + ' → y = ' + y + '.'),
          st('R1: ' + a1 + 'x = ' + r1 + ' − ' + b1 + '×' + y + ' − ' + c1 + '×' + z + ' → x = ' + x + '. Cek di R3 asli ✓')
        ], 'x=' + x + ', y=' + y + ', z=' + z, 'Gauss: buat segitiga atas baris demi baris, lalu substitusi balik dari bawah. Selalu cek ke baris asli.')
      };
    }
  });

  /* ===== v1.5.1: CRAMER 2×2 (format steps) ===== */
  E.registerFamily({
    familyId: 'cramer',
    make: function (rng, node, knobs) {
      var x = rng.int(2, 9), y = rng.int(2, 9);
      var a1 = rng.int(1, 4), b1 = rng.int(1, 4), a2 = rng.int(1, 4), b2 = rng.int(1, 4);
      while (a1 * b2 - a2 * b1 === 0) { b2 = rng.int(1, 6); }
      var c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
      var D = a1 * b2 - a2 * b1;
      var Dx = c1 * b2 - c2 * b1;
      var Dy = a1 * c2 - a2 * c1;
      return {
        format: 'steps',
        promptText: 'Gunakan ATURAN CRAMER: x = Dx/D dan y = Dy/D dengan Dx/Dy = determinan matriks koefisien yang kolom-x/y diganti RHS.',
        promptLatex: 'x=\\frac{D_x}{D}\\;,\\;y=\\frac{D_y}{D}',
        promptLatex2: null,
        steps: [
          { label: 'determinan utama D', value: D, tol: 0.01 },
          { label: 'Dx (kolom-x diganti RHS)', value: Dx, tol: 0.01 },
          { label: 'nilai x = Dx/D', value: x, tol: 0.01 },
          { label: 'nilai y = Dy/D (hitung Dy dulu)', value: y, tol: 0.01 }
        ],
        answer: { value: x, tol: 0.01 },
        solution: steps('Aturan Cramer', [
          st('D = ' + a1 + '·' + b2 + ' − ' + a2 + '·' + b1 + ' = ' + D + '.'),
          st('Dx = ' + c1 + '·' + b2 + ' − ' + c2 + '·' + b1 + ' = ' + Dx + ' → x = ' + Dx + '/' + D + ' = ' + x + '.'),
          st('Dy = ' + a1 + '·' + c2 + ' − ' + a2 + '·' + c1 + ' = ' + Dy + ' → y = ' + Dy + '/' + D + ' = ' + y + '.'),
          st('D = 0 → tidak ada solusi tunggal (kolinear).')
        ], 'x=' + x + ', y=' + y, 'Cramer: tukar kolom dengan RHS, bagi determinan. Cepat untuk sistem kecil.')
      };
    }
  });

  /* ===== v1.5.1: INTEGRAL PARSIAL (format steps) ===== */
  E.registerFamily({
    familyId: 'ipart',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 5), b = rng.int(1, 6), k = rng.pick([2, 3]);
      var c1 = Math.round(100 / k) / 100, c2 = Math.round(a * 100 / k) / 100, c3 = Math.round(a * 100 / (k * k)) / 100;
      return {
        format: 'steps',
        promptText: 'Hitung ∫(' + a + 'x + ' + b + ')e^{' + k + 'x}dx dengan integral PARSIAL (by parts): u = ' + a + 'x+' + b + ', dv = e^{' + k + 'x}dx. Rumus ∫u dv = uv − ∫v du. (jawaban 2-3 desimal bila pecahan)',
        promptLatex: '\\int(' + a + 'x+' + b + ')e^{' + k + 'x}dx=(' + a + 'x+' + b + ')\\frac{e^{' + k + 'x}}{' + k + '}-\\int\\frac{e^{' + k + 'x}}{' + k + '}\\cdot ' + a + '\\,dx',
        steps: [
          { label: 'koefisien v dari dv (v = c₁·e^{' + k + 'x}) → c₁', value: c1, tol: 0.01 },
          { label: 'koefisien ∫v du = a·c₁', value: c2, tol: 0.02 },
          { label: 'koefisien koreksi a/k² (dari integral sisa)', value: c3, tol: 0.02 }
        ],
        answer: { value: c3, tol: 0.02 },
        solution: steps('Integral parsial', [
          st('u = ' + a + 'x+' + b + ' → du = ' + a + 'dx; dv = e^{' + k + 'x}dx → v = e^{' + k + 'x}/' + k + ' (c₁ = ' + c1.toFixed(2).replace('.', ',') + ').'),
          st('∫u dv = (' + a + 'x+' + b + ')·e^{' + k + 'x}/' + k + ' − ∫(' + a + '/' + k + ')e^{' + k + 'x}dx.'),
          st('Integral sisa: (' + a + '/' + k + ')·e^{' + k + 'x}/' + k + ' = ' + c3.toFixed(2).replace('.', ',') + '·e^{' + k + 'x} + C.'),
          st('Hasil: e^{' + k + 'x}[(' + a + 'x+' + b + ')/' + k + ' − ' + c3.toFixed(2).replace('.', ',') + '] + C.')
        ], 'e^{' + k + 'x}(0,' + String(c1).replace('.', ',') + '(' + a + 'x+' + b + ') − ' + c3.toFixed(2).replace('.', ',') + ') + C', 'Pilih u = polinomial (turunannya makin sederhana), dv = eksponensial. Ulangi bila perlu.')
      };
    }
  });

  /* ===== v1.5.1: FRAKSI PARSIAL (format steps) ===== */
  E.registerFamily({
    familyId: 'ifrac',
    make: function (rng, node, knobs) {
      var A = rng.int(1, 5) * (rng.bool(0.7) ? 1 : -1);
      var B = rng.int(1, 5) * (rng.bool(0.7) ? 1 : -1);
      var c = rng.int(1, 6), d = rng.int(1, 6);
      while (d === c) d = rng.int(1, 7);
      var nx = A + B, nc = A * d + B * c;
      if (nx === 0) return null;
      return {
        format: 'steps',
        promptText: 'Uraikan menjadi fraksi parsial: ((' + nx + ')x + ' + nc + ')/((x+' + c + ')(x+' + d + ')) = A/(x+' + c + ') + B/(x+' + d + '). Tentukan A dan B (boleh negatif).',
        promptLatex: '\\frac{' + nx + 'x+' + nc + '}{(x+' + c + ')(x+' + d + ')}=\\frac{A}{x+' + c + '}+\\frac{B}{x+' + d + '}',
        steps: [
          { label: 'nilai A (substitusi x = −' + c + ' menghilangkan B)', value: A, tol: 0.01 },
          { label: 'nilai B (substitusi x = −' + d + ' menghilangkan A)', value: B, tol: 0.01 }
        ],
        answer: { value: A + B, tol: 0.01 },
        solution: steps('Fraksi parsial', [
          st('Kalikan silang: ' + nx + 'x + ' + nc + ' = A(x+' + d + ') + B(x+' + c + ').'),
          st('Substitusi x = −' + c + ' → ruas kanan tinggal A(−' + c + '+' + d + ') = A·' + (d - c) + '; ruas kiri = ' + (-nx * c + nc) + ' → A = ' + A + '.'),
          st('Substitusi x = −' + d + ' → B(−' + d + '+' + c + ') = B·' + (c - d) + '; ruas kiri = ' + (-nx * d + nc) + ' → B = ' + B + '.'),
          st('Cek koefisien x: A + B = ' + (A + B) + ' harus sama ' + nx + ' ✓')
        ], 'A=' + A + ', B=' + B, 'Substitusi akar penyebut = jalan pintas heuristik: satu variabel lenyap tiap kali.')
      };
    }
  });
})();