/* Vista Forgy — generators-adv.js (Tier 3: probabilitas, inferensia, aljabar linear;
   Tier 4: teori antrean M/M/1, inventori EOQ, Universal: break-even) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var E = VF.ENGINE, U = E.util;
  function steps(title, arr, final, takeaway) { return { title: title, steps: arr, final: final, takeaway: takeaway }; }
  function st(text, latex) { return latex ? { text: text, latex: latex } : { text: text }; }

  /* ============ T3: BAYES 2 TAHAP ============ */
  E.registerFamily({
    familyId: 'bayes',
    make: function (rng, node, knobs) {
      var pa = rng.pick([0.4, 0.5, 0.6]);
      var pdA = rng.pick([0.02, 0.05, 0.08]);
      var pdB = rng.pick([0.1, 0.15, 0.2]);
      var jointA = pa * pdA, jointB = (1 - pa) * pdB;
      var total = jointA + jointB;
      var post = jointA / total;
      var ans = Math.round(post * 1000) / 1000;
      if (Math.abs(ans * 1000 - Math.round(ans * 1000)) > 1e-9) return null;
      return {
        format: 'numeric',
        promptText: 'Dua mesin di ' + 'lantai produksi. Mesin A memproduksi ' + Math.round(pa * 100) + '% output dengan tingkat cacat ' + (pdA * 100) + '%; Mesin B sisanya dengan tingkat cacat ' + (pdB * 100) + '%. Jika satu item terpilih ACAK dan ternyata CACAT, berapa peluang item itu dari Mesin A? (3 desimal, mis. 0,286)',
        promptLatex: 'P(A|C)=\\frac{P(C|A)P(A)}{P(C|A)P(A)+P(C|B)P(B)}',
        answer: { value: ans, tol: 0.01 },
        solution: steps('Teorema Bayes', [
          st('Hitung gabungan: P(C∩A) = ' + (pdA * 100) + '%×' + (pa * 100) + '% = ' + U.fmtID(jointA, 4).replace(',', '.') + '; P(C∩B) = ' + U.fmtID(jointB, 4).replace(',', '.') + '.'),
          st('Total cacat P(C) = ' + U.fmtID(total, 4).replace(',', '.') + '.'),
          st('P(A|C) = ' + U.fmtID(jointA, 4).replace(',', '.') + ' ÷ ' + U.fmtID(total, 4).replace(',', '.') + ' = ' + ans.toFixed(3).replace('.', ',') + '.'),
          st('Cek: hitung juga P(B|C) — keduanya harus berjumlah 1.')],
        ans.toFixed(3).replace('.', ','), 'Bayes = memperbarui keyakinan setelah bukti. QC, medis, spam filter — semua pakai ini.')
      };
    }
  });

  /* ============ T3: CONFIDENCE INTERVAL (z) ============ */
  E.registerFamily({
    familyId: 'ciZ',
    make: function (rng, node, knobs) {
      var n = rng.pick([25, 36, 49, 64, 100]);
      var mean = rng.int(40, 90);
      var sd = rng.pick([6, 8, 10, 12]);
      var conf = rng.pick([['95', 1.96], ['99', 2.575], ['90', 1.645]]);
      var se = sd / Math.sqrt(n);
      var me = conf[1] * se;
      var lo = mean - me, hi = mean + me;
      var askLoHi = rng.bool();
      var ans = askLoHi ? lo : hi;
      return {
        format: 'numeric',
        promptText: 'Sampel ' + n + ' produk: rata-rata ' + mean + ' gram, standar deviasi populasi σ = ' + sd + ' gram. Bangun interval kepercayaan ' + conf[0] + '% (z = ' + conf[1] + '). Berapa batas ' + (askLoHi ? 'BAWAH' : 'ATAS') + ' interval? (2 desimal)',
        promptLatex: '\\bar{x}\\pm z\\frac{\\sigma}{\\sqrt{n}}',
        answer: { value: ans, tol: 0.15 },
        solution: steps('Interval kepercayaan (z)', [
          st('Galat baku = σ/√n = ' + sd + '/√' + n + ' = ' + sd + '/' + Math.sqrt(n) + ' = ' + U.fmtID(se, 4).replace(',', '.') + '.'),
          st('Margin = z × SE = ' + conf[1] + ' × ' + U.fmtID(se, 4).replace(',', '.') + ' = ' + U.fmtID(me, 4).replace(',', '.') + '.'),
          st('Interval: ' + U.fmtID(lo, 2).replace(',', '.') + ' s.d. ' + U.fmtID(hi, 2).replace(',', '.') + '.')],
        U.fmtID(ans, 2), 'CI = estimasi ± margin; 95% berarti prosedur ini menangkap μ sungguhan 95 dari 100 kali.')
      };
    }
  });

  /* ============ T3: DETERMINAN ============ */
  E.registerFamily({
    familyId: 'det',
    make: function (rng, node, knobs) {
      var a = rng.int(-6, 9), b = rng.int(-6, 9), c = rng.int(-6, 9), d = rng.int(-6, 9);
      var det = a * d - b * c;
      return {
        format: 'numeric', promptText: 'Berapa determinan matriks berikut?',
        promptLatex: '\\begin{vmatrix}{' + a + '}&{' + b + '}\\\\{' + c + '}&{' + d + '}\\end{vmatrix}',
        answer: { value: det, tol: 0.01 },
        solution: steps('Determinan 2×2', [
          st('det = ad − bc = (' + a + ')(' + d + ') − (' + b + ')(' + c + ') = ' + (a * d) + ' − ' + (b * c) + '.')],
        String(det), 'ad − bc. Determinan 0 = matriks tak punya invers = kolom saling bergantung.')
      };
    }
  });

  /* ============ T3: INVERS MATRIKS 2×2 ============ */
  E.registerFamily({
    familyId: 'inv2',
    make: function (rng, node, knobs) {
      var a = rng.int(1, 5), d = rng.int(1, 5), b = rng.int(1, 5) * rng.sign(), c = rng.int(1, 5) * rng.sign();
      if (a === d) d = d % 5 + 1; // hindari opsi duplikat
      var det = a * d - b * c;
      if (det === 0 || Math.abs(det) > 12) return null;
      // A = [[a,b],[c,d]]; A^-1 = 1/det [[d,-b],[-c,a]] — tanya elemen (1,1) = d/det dengan bentuk pecahan
      var num = d, den = det;
      if (den < 0) { num = -num; den = -den; }
      var g = U.gcd(Math.abs(num), Math.abs(den));
      num /= g; den /= g;
      var label = den === 1 ? String(num) : num + '/' + den;
      var val = num / den;
      return {
        format: 'mc', promptText: 'Matriks A di bawah. Elemen baris-1 kolom-1 dari A⁻¹ (invers) adalah?',
        promptLatex: 'A=\\begin{pmatrix}{' + a + '}&{' + b + '}\\\\{' + c + '}&{' + d + '}\\end{pmatrix}\\;,\\;A^{-1}=\\frac{1}{ad-bc}\\begin{pmatrix}{d}&{-b}\\\\{-c}&{a}\\end{pmatrix}',
        choices: [
          { label: label, correct: true },
          { label: (den === 1 ? String(a) : a + '/' + den), tag: 'elemen diagonal salah — tukar posisi a dan d' },
          { label: String(1 / det).length > 6 ? U.fmtID(num / den, 2) : String(1 / det), tag: 'lupa bahwa elemennya tetap dibagi determinan' }
        ],
        solution: steps('Invers 2×2', [
          st('det = ' + det + '.'),
          st('Tukar diagonal utama (a↔d), negasikan diagonal lain (−b, −c), bagi semuanya dengan det.'),
          st('Elemen (1,1) = ' + d + '/' + det + ' = ' + label + '.')],
        label, 'Rumus: tukar, negasi, bagi det. Det = 0 → tidak ada invers.')
      };
    }
  });

  /* ============ T4: TEORI ANTREAN M/M/1 (FLAGSHIP + animasi) ============ */
  E.registerFamily({
    familyId: 'mm1',
    make: function (rng, node, knobs) {
      var lam = rng.pick([4, 5, 6, 8, 10, 12]);       // per jam
      var mu = rng.pick([6, 8, 10, 12, 15, 16, 20]);  // per jam
      var rho = lam / mu;
      if (rho < 0.5 || rho > 0.92) return null;
      var Lq = rho * rho / (1 - rho);
      var Ls = rho / (1 - rho);
      var Wq = Lq / lam * 60; // menit
      var Ws = Ls / lam * 60;
      var ask = rng.pick(['rho', 'Lq', 'Wq', 'Ls']);
      var ans, unit, formula;
      if (ask === 'rho') { ans = rho; unit = ''; formula = '\\rho=\\lambda/\\mu'; }
      else if (ask === 'Lq') { ans = Lq; unit = ' orang'; formula = 'L_q=\\frac{\\rho^2}{1-\\rho}'; }
      else if (ask === 'Wq') { ans = Wq; unit = ' menit'; formula = 'W_q=\\frac{L_q}{\\lambda}'; }
      else { ans = Ls; unit = ' orang'; formula = 'L_s=\\frac{\\rho}{1-\\rho}'; }
      if (Math.abs(ans * 10 - Math.round(ans * 10)) > 1e-9) return null;
      var ctx = rng.pick(['loket pembayaran kantin', 'loket layanan bank', 'gerbang gudang logistik', 'customer service toko']);
      var visual = { type: 'queue', caption: 'Animasi antrean: λ = ' + lam + '/jam, μ = ' + mu + '/jam', lam: lam, mu: mu };
      return {
        format: 'numeric',
        promptText: 'Antrean M/M/1 di ' + ctx + ': laju kedatangan (arrival rate) λ = ' + lam + ' pelanggan/jam, laju layanan (service rate) μ = ' + mu + ' pelanggan/jam. Berapa ' +
          (ask === 'rho' ? 'tingkat utilisasi ρ' : ask === 'Lq' ? 'panjang antrean rata-rata Lq' : ask === 'Wq' ? 'waktu tunggu rata-rata Wq' : 'jumlah pelanggan dalam sistem Ls') + (unit ? ' (' + unit.trim() + ', 2 desimal)' : ' (2 desimal)') + '? Rumus disediakan di bawah.',
        promptLatex: formula,
        visual: visual,
        answer: { value: ans, tol: Math.max(0.03, ans * 0.02) },
        solution: steps('Model antrean M/M/1', [
          st('ρ = λ/μ = ' + lam + '/' + mu + ' = ' + U.fmtID(rho, 2).replace(',', '.') + ' (sistem stabil karena ρ < 1).'),
          st('Lq = ρ²/(1−ρ) = ' + U.fmtID(Lq, 2).replace(',', '.') + '; Ls = ρ/(1−ρ) = ' + U.fmtID(Ls, 2).replace(',', '.') + '.'),
          st('Little\u2019s Law: W = L/λ → Wq = ' + U.fmtID(Wq, 1).replace(',', '.') + ' menit, Ws = ' + U.fmtID(Ws, 1).replace(',', '.') + ' menit. (Cek: L = λW ✓)')],
        U.fmtID(ans, 2), 'ρ mendekati 1 → antrean meledak eksponensial. Inilah kenapa kapasitas perlu buffer.')
      };
    }
  });

  /* ============ T4: EOQ (+ grafik interaktif) ============ */
  var EOQ_COMBOS = (function () {
    var out = [];
    [40, 50, 60, 80, 100, 120, 150, 200].forEach(function (q) {
      [20, 24, 30, 45, 50, 60, 75].forEach(function (S) {
        [3, 4, 5, 6, 8, 10, 12].forEach(function (H) {
          var D = H * q * q / (2 * S);
          if (D === Math.round(D) && D >= 600 && D <= 6000 && D % 10 === 0) out.push({ D: D, S: S, H: H, q: q });
        });
      });
    });
    return out;
  })();
  E.registerFamily({
    familyId: 'eoq',
    make: function (rng, node, knobs) {
      if (!EOQ_COMBOS.length) return null;
      var combo = rng.pick(EOQ_COMBOS);
      var D = combo.D, S = combo.S, H = combo.H, q = combo.q;
      var ask = rng.pick(['Q', 'N', 'TC']);
      var n = D / q;
      var tc = D / q * S + q / 2 * H;
      var q2 = 2 * D * S / H; // = q² (untuk pembahasan)
      var ctx = E.context(rng, node.id);
      var ans = ask === 'Q' ? q : ask === 'N' ? n : tc;
      var visual = { type: 'eoq', caption: 'Kurva biaya total persediaan', D: D, S: S, H: H, q: q };
      return {
        format: 'numeric',
        promptText: 'Manajer ' + ctx.place + ' mencatat: permintaan tahunan (demand) D = ' + U.fmtID(D, 0) + ' ' + ctx.unit + ', biaya pemesanan (ordering cost) S = ' + U.fmtID(S, 0) + ' ribu/pesan, biaya simpan (holding cost) H = ' + H + ' ribu/unit/tahun. Berapa ' + (ask === 'Q' ? 'EOQ — jumlah pesan ekonomis Q* (' + ctx.unit + ')' : ask === 'N' ? 'jumlah pemesanan per tahun' : 'total biaya persediaan tahunan (ribu)') + '?',
        promptLatex: 'Q^*=\\sqrt{\\frac{2DS}{H}}',
        visual: visual,
        answer: { value: ans, tol: Math.max(0.5, ans * 0.02) },
        solution: steps('Economic Order Quantity', [
          st('Q* = √(2DS/H) = √(2×' + D + '×' + S + '/' + H + ') = √' + q2 + ' = ' + q + ' ' + ctx.unit + '.'),
          st('Cek titik optimal: biaya pesan = biaya simpan saat Q = Q*. TC = (D/Q*)S + (Q*/2)H = ' + U.fmtID(tc, 1).replace(',', '.') + ' ribu.'),
          st('Frekuensi pesan = D/Q* = ' + U.fmtID(n, 1).replace(',', '.') + '×/tahun.')],
        U.fmtID(ans, 2), 'EOQ = titik di mana biaya pesan dan biaya simpan SEIMBANG — trade-off inti manajemen operasi.')
      };
    }
  });

  /* ============ UNIVERSAL: BREAK-EVEN ============ */
  E.registerFamily({
    familyId: 'breakeven',
    make: function (rng, node, knobs) {
      var FC = rng.pick([12, 18, 24, 30, 40, 60]) * 1000000;
      var p = rng.pick([50, 75, 100, 125, 150, 200]) * 1000;
      var vc = Math.round(p * rng.pick([0.4, 0.5, 0.6, 0.3]));
      var beq = FC / (p - vc);
      if (beq > 8000 || Math.abs(beq - Math.round(beq)) > 1e-9) return null;
      var ask = rng.pick(['BEQ', 'BEP', 'target']);
      var ans, targetTxt;
      if (ask === 'BEQ') { ans = beq; targetTxt = 'Berapa titik impas dalam UNIT (break-even quantity)?'; }
      else if (ask === 'BEP') { ans = beq * p; targetTxt = 'Berapa titik impas dalam RUPIAH (break-even point)?'; }
      else {
        var profit = rng.pick([10, 20, 30]) * 1000000;
        ans = (FC + profit) / (p - vc);
        if (Math.abs(ans - Math.round(ans)) > 1e-9) return null;
        targetTxt = 'Berapa unit yang harus dijual untuk laba ' + U.rupiah(profit) + '?';
      }
      var ctx = E.context(rng, node.id);
      return {
        format: 'numeric',
        promptText: 'Usaha ' + ctx.place + ': biaya tetap (fixed cost) ' + U.rupiah(FC) + ', harga jual ' + U.rupiah(p) + '/unit, biaya variabel (variable cost) ' + U.rupiah(vc) + '/unit. ' + targetTxt,
        promptLatex: 'Q_{BEP}=\\frac{FC}{p-v}',
        answer: { value: ans, tol: Math.max(1, ans * 0.01) },
        solution: steps('Analisis titik impas (break-even)', [
          st('Margin kontribusi per unit = p − v = ' + U.fmtID(p, 0) + ' − ' + U.fmtID(vc, 0) + ' = ' + U.fmtID(p - vc, 0) + '.'),
          st('Q_BEP = FC ÷ margin = ' + U.fmtID(FC, 0) + ' ÷ ' + U.fmtID(p - vc, 0) + ' = ' + U.fmtID(beq, 0) + ' unit.'),
          (ask !== 'BEQ' ? st('Untuk target laba: Q = (FC + target) ÷ margin.') : st('Setelah BEP, setiap unit terjual menambah laba sebesar margin.'))],
        ask === 'BEP' ? U.fmtID(ans, 0) : U.fmtID(ans, 0), 'BEP menjawab "kapan mulai untung?" — bahasa bersama semua jurusan bisnis.')
      };
    }
  });
})();
