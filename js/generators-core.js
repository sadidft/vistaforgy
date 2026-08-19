/* Vista Forgy — generators-core.js (Tier 0: aritmetika, aljabar permulaan, logika dasar, data) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var E = VF.ENGINE, U = E.util;
  var R = function (rng) { return rng; };

  function steps(title, arr, final, takeaway) {
    return { title: title, steps: arr, final: final, takeaway: takeaway };
  }
  function st(text, latex) { return latex ? { text: text, latex: latex } : { text: text }; }

  /* ================= ARI. TAMBAH & KURANG ================= */
  E.registerFamily({
    familyId: 'addsub',
    make: function (rng, node, knobs) {
      var L = knobs.level; // 0..3
      var mag = [2, 3, 3, 4][L]; // digit
      var isAdd = node.id === 'ari.tambah';
      var a = rng.int(Math.pow(10, mag - 1), Math.pow(10, mag) - 1);
      var b = rng.int(Math.pow(10, mag - 1), Math.pow(10, mag) - 1);
      var ans, text;
      if (isAdd) { ans = a + b; text = fmt(a) + ' + ' + fmt(b) + ' = ?'; }
      else {
        if (b > a) { var t = a; a = b; b = t; }
        if (L === 0 && b === a) b = Math.max(1, b - 7);
        ans = a - b; text = fmt(a) + ' − ' + fmt(b) + ' = ?';
      }
      function fmt(n) { return U.fmtID(n, 0); }
      var w1 = isAdd ? a - b : a + b;
      var w2 = ans + rng.int(1, 3) * 10;
      var w3 = ans - rng.int(1, 2) * 10;
      return {
        format: 'mc',
        promptText: 'Hitung cepat (tanpa kalkulator).',
        promptLatex: text.replace(/,/g, '').replace(/\./g, '').replace(/−/g, '-'),
        choices: U.mkMc(fmt(ans), [
          { label: fmt(w1), tag: isAdd ? 'pengurangan, bukan penjumlahan' : 'penjumlahan, bukan pengurangan' },
          { label: fmt(w2), tag: 'salah carry/pinjam' },
          { label: fmt(w3), tag: 'salah carry/pinjam' }
        ], rng),
        solution: steps('Kerjakan per nilai tempat',
          [st('Susun ke bawah per nilai tempat, kerjakan dari satuan, ingat carry/pinjam.'),
           st('Hasil akhir:', isAdd ? a + ' + ' + b : a + ' − ' + b)],
          fmt(ans), 'Latih penjumlahan/pengurangan sampai refleks — ini fondasi semua hitungan.')
      };
    }
  });

  /* ================= ARI. KALI & BAGI ================= */
  E.registerFamily({
    familyId: 'muldiv',
    make: function (rng, node, knobs) {
      var L = knobs.level;
      var isMul = node.id === 'ari.kali';
      if (isMul) {
        var a = L === 0 ? rng.int(2, 9) : rng.int(11, 39);
        var b = L <= 1 ? rng.int(2, 9) : rng.int(12, 25);
        var ans = a * b;
        var t = U.fmtID(a) + ' × ' + U.fmtID(b) + ' = ?';
        return {
          format: 'mc', promptText: 'Hitung cepat (tanpa kalkulator).', promptLatex: '' + a + '\\times ' + b,
          choices: U.mkMc(U.fmtID(ans), [
            { label: U.fmtID(ans + a), tag: 'satu kali perkalian kurang (+' + a + ')' },
            { label: U.fmtID(ans - b), tag: 'satu kali perkalian kurang (−' + b + ')' },
            { label: U.fmtID(a + b), tag: 'dijumlah, bukan dikali' }
          ], rng),
          solution: steps('Perkalian', [st('Pecah jadi bagian yang mudah bila perlu, atau susun perkalian bersusun.'),
            st('Hasil:', a + ' × ' + b)], U.fmtID(ans), 'Perkalian lancar = kecepatan semua topik lanjutan.')
        };
      }
      var q = L === 0 ? rng.int(2, 9) : rng.int(6, 15);
      var res = L <= 1 ? rng.int(2, 12) : rng.int(12, 40);
      var dividend = q * res;
      var w = rng.pick([q * (res + 1), q * (res - 1), dividend - 1]);
      return {
        format: 'mc', promptText: 'Hitung cepat (tanpa kalkulator).', promptLatex: dividend + '\\div ' + q,
        choices: U.mkMc(String(res), [
          { label: String(res + 1), tag: 'satu kelompok kelebihan' },
          { label: String(res - 1), tag: 'satu kelompok kurang' },
          { label: String(w), tag: 'cek ulang perkalian pembalik' }
        ], rng),
        solution: steps('Pembagian', [st('Pikirkan: ' + dividend + ' = ' + q + ' × ?'), st('Karena ' + q + ' × ' + res + ' = ' + dividend + ', hasilnya ' + res + '.')],
          String(res), 'Pembagian = perkalian terbalik. Hafal tabel perkalian membuat ini refleks.')
      };
    }
  });

  /* ================= ARI. CAMPUR (urutan operasi) ================= */
  E.registerFamily({
    familyId: 'mixops',
    make: function (rng, node, knobs) {
      var L = knobs.level;
      var a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 9), d = rng.int(2, 6);
      var mode = rng.int(0, L === 0 ? 1 : 3);
      var expr, ans, wrongSeq;
      if (mode === 0) { expr = a + ' + ' + b + ' × ' + c; ans = a + b * c; wrongSeq = (a + b) * c; }
      else if (mode === 1) { expr = a + ' × ' + b + ' − ' + c; ans = a * b - c; wrongSeq = a * (b - c); }
      else if (mode === 2) { expr = '(' + a + ' + ' + b + ') ÷ ' + c; ans = 0; var s = a + b; if (s % c !== 0) { s = Math.ceil(s / c) * c; } expr = '(' + (s - c) + ' + ' + c + ') ÷ ' + c; ans = s / c; wrongSeq = s - c + c / c; }
      else { expr = a + ' × ' + d + ' + ' + b + ' × ' + c; ans = a * d + b * c; wrongSeq = a * (d + b) * c; }
      if (isNaN(ans) || ans < 0) return null;
      return {
        format: 'mc', promptText: 'Hitung (perhatikan urutan operasi).', promptLatex: expr.replace(/÷/g, '\\div ').replace(/×/g, '\\times '),
        choices: U.mkMc(String(ans), [
          { label: String(wrongSeq), tag: 'dihitung kiri-ke-kanan, abaikan kali/bagi lebih dulu' },
          { label: String(ans + 1), tag: 'kurang teliti satu langkah' },
          { label: String(ans - 1), tag: 'kurang teliti satu langkah' }
        ], rng),
        solution: steps('Urutan operasi', [st('Kali & bagi lebih dulu, baru tambah & kurang. Kurung selalu paling awal.'),
          st('Kerjakan bertahap pada: ' + expr), st('Hasil:')],
          String(ans), 'Kali–bagi dulu, baru tambah–kurang. Klasik, tapi tetap menjebak saat terburu-buru.')
      };
    }
  });

  /* ================= ARI. NEGATIF ================= */
  E.registerFamily({
    familyId: 'signed',
    make: function (rng, node, knobs) {
      var L = knobs.level;
      var a = rng.int(2, 9 + L * 5) * rng.sign();
      var b = rng.int(2, 9 + L * 5) * rng.sign();
      var op = rng.pick(['+', '−', '×']);
      var ans, expr;
      if (op === '+') { ans = a + b; expr = '(' + a + ') + (' + b + ')'; }
      else if (op === '−') { ans = a - b; expr = '(' + a + ') − (' + b + ')'; }
      else { a = Math.abs(a); b = Math.abs(b) * rng.sign(); ans = a * b; expr = '(' + a + ') × (' + b + ')'; }
      var signFlip = -ans;
      var absAns = Math.abs(ans);
      return {
        format: 'mc', promptText: 'Hitung (perhatikan tanda).', promptLatex: expr.replace(/−/g, '-').replace(/×/g, '\\times ').replace(/\(/g, '\\left(').replace(/\)/g, '\\right)'),
        choices: U.mkMc(String(ans), [
          { label: String(signFlip), tag: 'tanda hasil terbalik' },
          { label: String(absAns), tag: 'tanda diabaikan' },
          { label: String(ans + 2 * Math.abs(b)), tag: 'aturan tanda kurang/bilangan kedua diabaikan tandanya' }
        ], rng),
        solution: steps('Bilangan negatif', [st('Tanda sama → jumlahkan, hasil ikut tanda. Tanda beda → kurangkan, ikuti yang lebih besar.'),
          st('Selesaikan: ' + expr), st('Hasil:')],
          String(ans), 'Tanda adalah detail paling sering kelewat saat cepat. Perlambat satu napas.')
      };
    }
  });

  /* ================= ARI. PECAHAN ================= */
  E.registerFamily({
    familyId: 'fraction',
    make: function (rng, node, knobs) {
      var L = knobs.level;
      var mode = rng.int(0, L === 0 ? 1 : 2);
      function frac(n, d) { return n + '/' + d; }
      if (mode === 0) { // senilai
        var d = rng.int(3, 12), n = rng.int(1, d - 1);
        var k = rng.int(2, 4);
        var ans = frac(n * k, d * k);
        // pertanyaan: mana yang senilai n/d → mc
        var w1 = frac(n * k, d * (k + 1));
        var w2 = frac(n + k, d + k);
        var w3 = frac(n * k + 1, d * k);
        return {
          format: 'mc', promptText: 'Pecahan manakah yang SENILAI dengan pecahan berikut?', promptLatex: '\\frac{' + n + '}{' + d + '}',
          choices: [{ label: ans, correct: true }, { label: w1, tag: 'penyebut tidak dikali k' }, { label: w2, tag: 'dijumlah, bukan dikali' }, { label: w3, tag: 'pembilang meleset' }],
          solution: steps('Pecahan senilai', [st('Kalikan (atau bagi) pembilang DAN penyebut dengan bilangan yang sama.'),
            st(k + ' × ' + n + ' = ' + (n * k) + ' dan ' + k + ' × ' + d + ' = ' + (d * k) + '.')], ans,
            'Senilai = dikali/dibagi penuh atas-bawah. Dijumlah TIDAK senilai.')
        };
      }
      if (mode === 1) { // sederhanakan
        var d2 = rng.int(6, 24), n2 = rng.int(1, d2 - 1);
        var g = U.gcd(n2, d2);
        if (g === 1) { d2 *= 2; n2 *= 2; g = U.gcd(n2, d2); }
        var simp = U.simplify(n2, d2);
        return {
          format: 'mc', promptText: 'Sederhanakan pecahan berikut.', promptLatex: '\\frac{' + n2 + '}{' + d2 + '}',
          choices: [{ label: frac(simp[0], simp[1]), correct: true },
            { label: frac(n2 / (g || 1) + 1, d2 / (g || 1)), tag: 'pembilang meleset saat membagi FPB' },
            { label: frac(d2 - n2, d2), tag: 'selisih dipakai sebagai pembilang' },
            { label: frac(simp[1], simp[0]), tag: 'terbalik' }],
          solution: steps('Menyederhanakan', [st('Cari FPB pembilang & penyebut: FPB(' + n2 + ',' + d2 + ') = ' + g + '.'),
            st('Bagi keduanya: ' + n2 + '÷' + g + ' = ' + simp[0] + ', ' + d2 + '÷' + g + ' = ' + simp[1] + '.')],
            frac(simp[0], simp[1]), 'Sederhanakan = bagi atas-bawah dengan FPB, bukan dikurangi.')
        };
      }
      // bandingkan
      var da = rng.pick([3, 4, 5, 6, 8, 10, 12]), na = rng.int(1, da - 1);
      var db = rng.pick([3, 4, 5, 6, 8, 10, 12]), nb = rng.int(1, db - 1);
      if (na / da === nb / db) return null;
      var bigger = na / da > nb / db;
      return {
        format: 'mc', promptText: 'Manakah yang lebih besar?', promptLatex: '\\frac{' + na + '}{' + da + '}\\quad\\text{atau}\\quad\\frac{' + nb + '}{' + db + '}',
        choices: [{ label: frac(na, da), correct: bigger }, { label: frac(nb, db), correct: !bigger }, { label: 'Sama besar', correct: false }],
        solution: steps('Membandingkan pecahan', [st('Samakan penyebut (KPK) atau bandingkan silang.'),
          st(frac(na, da) + ' = ' + U.fmtID(na / da, 2) + ' dan ' + frac(nb, db) + ' = ' + U.fmtID(nb / db, 2) + '.')],
          (bigger ? frac(na, da) : frac(nb, db)), 'Bandingkan nilainya (bagi langsung pun sah), bukan besar kecilnya angka.')
      };
    }
  });

  /* ================= ARI. DESIMAL ================= */
  E.registerFamily({
    familyId: 'decimal',
    make: function (rng, node, knobs) {
      var L = knobs.level;
      var mode = rng.int(0, 1);
      var a = Math.round((rng.int(5, 90) / 10) * 10) / 10;
      var b = Math.round((rng.int(5, 90) / 10) * 10) / 10;
      if (mode === 0) { // tambah/kurang desimal
        var ans = Math.round((a + b) * 10) / 10;
        return {
          format: 'numeric', promptText: 'Hitung (tulis dengan koma atau titik desimal, mis. 3,5).', promptLatex: U.fmtID(a, 1).replace(',', '.') + '+' + U.fmtID(b, 1).replace(',', '.'),
          answer: { value: ans, tol: 0.001 },
          solution: steps('Operasi desimal', [st('Luruskan koma desimal saat menyusun.'),
            st('Hasil:'), ], U.fmtID(ans, 1), 'Koma harus lurus — desimal adalah soal kerapian.')
        };
      }
      // pecahan <-> desimal
      var dmap = [[2, 5], [4, 25], [5, 20], [8, 125], [10, 100]];
      var pick = rng.pick(dmap);
      var n = rng.int(1, pick[1] - 1);
      var val = Math.round(n / pick[0] * 100) / 100; // n/5 dkk
      // pastikan cantik
      if (Math.abs(val * 100 - Math.round(val * 100)) > 1e-9) return null;
      return {
        format: 'numeric', promptText: 'Ubah pecahan ini menjadi desimal (mis. 0,75).', promptLatex: '\\frac{' + n + '}{' + pick[0] + '}',
        answer: { value: val, tol: 0.005 },
        solution: steps('Pecahan → desimal', [st('Bagi pembilang dengan penyebut: ' + n + ' ÷ ' + pick[0] + '.'),
          st('Atau: penyebut ' + pick[0] + ' → kalikan sampai 100 (×' + (100 / pick[0]) + '), pembilang pun dikali sama.')],
        U.fmtID(val, 2), 'Hafal konversi kunci: 1/2=0,5 · 1/4=0,25 · 1/5=0,2 · 1/8=0,125.')
      };
    }
  });

  /* ================= ARI. PEMBULATAN ================= */
  E.registerFamily({
    familyId: 'round',
    make: function (rng, node, knobs) {
      var L = knobs.level;
      var digits = [2, 3, 3, 4][L];
      var raw = rng.int(Math.pow(10, digits - 1), Math.pow(10, digits) - 1) + rng.int(1, 99) / 100;
      var pick = L === 0 ? rng.pick([['satuan', -1], ['puluhan', 0]]) : rng.pick([['puluhan', 0], ['ratusan', 1]]);
      var t = pick[1];
      var f = Math.pow(10, Math.max(0, t));
      var ans = t === -1 ? Math.round(raw) : Math.round(raw / f) * f;
      var down = t === -1 ? Math.floor(raw) : Math.floor(raw / f) * f;
      var up = down + f;
      return {
        format: 'mc', promptText: 'Bulatkan angka berikut ke ' + pick[0] + ' terdekat.', promptLatex: raw.toFixed(2).replace('.', '{,}'),
        choices: U.mkMc(U.fmtID(ans, 0), [
          { label: U.fmtID(down, 0), tag: 'dibulatkan ke bawah — cek angka setelah posisi pembulatan ≥ 5' },
          { label: U.fmtID(up, 0), tag: 'dibulatkan ke atas padahal angka penandanya < 5' },
          { label: U.fmtID(Math.round(raw), 0), tag: 'dibulatkan ke satuan, bukan sesuai target' }
        ], rng),
        solution: steps('Pembulatan', [st('Lihat SATU angka di kanan posisi target: ≥5 → naik, <5 → tetap.'),
          st('Angka: ' + U.fmtID(raw, 2) + ', target: ' + pick[0] + '.')], U.fmtID(ans, 0),
        'Estimasi dulu, presisi belakangan — kebiasaan insinyur.')
      };
    }
  });

  /* ================= ARI. PERSEN ================= */
  E.registerFamily({
    familyId: 'percent',
    make: function (rng, node, knobs) {
      var L = knobs.level;
      var pct = rng.pick(L === 0 ? [10, 20, 25, 50] : [5, 12, 15, 18, 24, 35, 40, 60, 75]);
      var base = rng.pick([60, 80, 120, 150, 200, 240, 300, 400, 500, 800]);
      var ans = pct * base / 100;
      if (Math.abs(ans - Math.round(ans)) > 1e-9) return null;
      return {
        format: 'numeric', promptText: 'Berapakah ' + pct + '% dari ' + U.fmtID(base, 0) + '?',
        promptLatex: pct + '\\% \\times ' + base,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Persen', [st('Persen = per seratus: ' + pct + '% = ' + pct + '/100.'),
          st('Kalikan: ' + pct + '/100 × ' + base + ' = ' + pct + ' × ' + base + '/100 = ' + (pct * base) + '/100.')],
        U.fmtID(ans, 0), 'Pecah persen jadi bagian mudah: 15% = 10% + 5%.')
      };
    }
  });

  /* ================= ARI. RASIO ================= */
  E.registerFamily({
    familyId: 'ratio',
    make: function (rng, node, knobs) {
      var L = knobs.level;
      var a = rng.int(2, 7), b = rng.int(2, 9), k = rng.int(3, 12);
      var total = (a + b) * k;
      var ctx = E.context(rng, node.id);
      var askA = rng.bool();
      var ans = (askA ? a : b) * k;
      return {
        format: 'numeric',
        promptText: 'Di ' + ctx.place + ', perbandingan ' + ctx.items[0] + ' dan ' + ctx.items[1] + ' adalah ' + a + ' : ' + b + '. Jika total keduanya ' + U.fmtID(total, 0) + ' ' + ctx.unit + ', berapa banyak ' + (askA ? ctx.items[0] : ctx.items[1]) + '?',
        promptLatex: a + ':' + b + '\\;,\\;' + a + 'x+' + b + 'x=' + total,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Rasio', [st('Jumlah bagian = ' + a + ' + ' + b + ' = ' + (a + b) + '.'),
          st('Nilai satu bagian = ' + total + ' ÷ ' + (a + b) + ' = ' + k + '.'),
          st((askA ? a : b) + ' bagian = ' + (askA ? a : b) + ' × ' + k + '.')],
        U.fmtID(ans, 0), 'Rasio: cari nilai SATU bagian dulu, sisanya kalikan.')
      };
    }
  });

  /* ================= ARI. SATUAN ================= */
  E.registerFamily({
    familyId: 'units',
    make: function (rng, node, knobs) {
      var table = [
        { u: 'm', to: 'cm', k: 100 }, { u: 'kg', to: 'g', k: 1000 }, { u: 'km', to: 'm', k: 1000 },
        { u: 'jam', to: 'menit', k: 60 }, { u: 'menit', to: 'detik', k: 60 }, { u: 'lusin', to: 'buah', k: 12 },
        { u: 'm', to: 'mm', k: 1000 }, { u: 'liter', to: 'ml', k: 1000 }
      ];
      var p = rng.pick(table);
      var val = rng.int(2, 45);
      var up = rng.bool(); // true: besar->kecil
      var ans = up ? val * p.k : val;
      var input = up ? val : val * p.k;
      var from = up ? p.u : p.to, to = up ? p.to : p.u;
      return {
        format: 'numeric', promptText: 'Konversi: ' + U.fmtID(input, 0) + ' ' + from + ' = ? ' + to,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Konversi satuan', [st('1 ' + p.u + ' = ' + p.k + ' ' + p.to + '.'),
          st(up ? 'Satuan besar → kecil: KALI. ' + input + ' × ' + p.k : 'Satuan kecil → besar: BAGI. ' + input + ' ÷ ' + p.k)],
        U.fmtID(ans, 0), 'Besar→kecil kali, kecil→besar bagi. Tulis faktornya, jangan hafal buta.')
      };
    }
  });

  /* ================= ALJ. SUBSTITUSI ================= */
  E.registerFamily({
    familyId: 'subst',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 9), b = rng.int(2, 20), x = rng.int(2, 9);
      var op = rng.pick(['+', '×']);
      var ans = op === '+' ? a + x + b : a * x + b;
      var expr = op === '+' ? a + ' + x + ' + b : a + 'x + ' + b;
      return {
        format: 'numeric', promptText: 'Jika x = ' + x + ', berapa nilai: ' + expr + '?',
        promptLatex: expr.replace('×', '').replace(/\+/g, '+'),
        answer: { value: ans, tol: 0.01 },
        solution: steps('Substitusi', [st('Ganti x dengan ' + x + ': ' + (op === '+' ? a + ' + ' + x + ' + ' + b : a + '(' + x + ') + ' + b) + '.'),
          st('Hitung sesuai urutan operasi.')], String(ans), 'Substitusi = mengganti variabel dengan nilainya, lalu hitung biasa.')
      };
    }
  });

  /* ================= ALJ. SUKU SEJENIS ================= */
  E.registerFamily({
    familyId: 'liketerms',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 15);
      var plus = rng.bool();
      var ansA = a + (plus ? b : -b);
      if (ansA <= 0) return null;
      return {
        format: 'mc', promptText: 'Sederhanakan bentuk aljabar berikut.', promptLatex: a + 'x' + (plus ? '+' : '-') + b + 'x+' + c,
        choices: U.mkMc(ansA + 'x+' + c, [
          { label: (a + b) + 'x', tag: 'konstanta dibuang' },
          { label: ansA + 'x+' + (c + 1), tag: 'konstanta ikut dijumlah dengan koefisien' },
          { label: (ansA + c) + 'x', tag: 'konstanta dijumlahkan ke koefisien' }
        ], rng),
        solution: steps('Suku sejenis', [st('Hanya suku SEJENIS bisa digabung: ' + a + 'x ' + (plus ? '+' : '−') + ' ' + b + 'x.'),
          st('Konstanta ' + c + ' tetap sendiri.')], ansA + 'x+' + c, 'x dengan x, angka dengan angka. Jangan campur.')
      };
    }
  });

  /* ================= ALJ. LINEAR 1 & 2 LANGKAH ================= */
  E.registerFamily({
    familyId: 'lin12',
    make: function (rng, node, knobs) {
      var two = node.id === 'alj.linear2';
      var a = rng.int(2, 9), x = rng.int(2, 12), b = two ? rng.int(2, 20) : 0;
      var c = a * x + b;
      var ans = x;
      var eq = two ? a + 'x + ' + b + ' = ' + c : a + 'x = ' + c;
      return {
        format: 'numeric', promptText: 'Selesaikan persamaan (nilai x).', promptLatex: eq,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Persamaan linear', two ? [
          st('Kurangi kedua ruas dengan ' + b + ': ' + a + 'x = ' + (c - b) + '.'),
          st('Bagi kedua ruas dengan ' + a + ': x = ' + (c - b) + ' ÷ ' + a + '.')] : [
          st('Bagi kedua ruas dengan ' + a + ': x = ' + c + ' ÷ ' + a + '.')],
          'x = ' + ans, 'Pindahkan, lalu bagi — targetnya x sendirian.')
      };
    }
  });

  /* ================= ALJ. DISTRIBUTIF ================= */
  E.registerFamily({
    familyId: 'distrib',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 9), b = rng.int(2, 12), c = rng.int(2, 12);
      var ans = a * b + a * c;
      return {
        format: 'numeric', promptText: 'Hitung dengan sifat distributif.', promptLatex: a + '\\left(' + b + '+' + c + '\\right)',
        answer: { value: ans, tol: 0.01 },
        solution: steps('Distributif', [st(a + ' × ' + b + ' = ' + (a * b) + ', lalu ' + a + ' × ' + c + ' = ' + (a * c) + '.'),
          st('Jumlahkan.')], String(ans), 'a(b+c) = ab + ac. Berguna untuk hitung cepat tanpa kalkulator.')
      };
    }
  });

  /* ================= ALJ. PERTIDAKSAMAAN DASAR ================= */
  E.registerFamily({
    familyId: 'ineq0',
    make: function (rng, node, knobs) {
      var a = rng.int(2, 9), x = rng.int(2, 12);
      var bound = a * x + rng.int(1, a - 1);
      var ans = x; // pertanyaan: nilai x TERKECIL bulat yang memenuhi ax > bound? x* = x+1... 
      // ax > bound → x > bound/a = x + fraksi → bulat terkecil = x+1
      var minx = x + 1;
      return {
        format: 'numeric', promptText: 'Berapa bilangan bulat TERKECIL yang memenuhi pertidaksamaan berikut?',
        promptLatex: a + 'x > ' + bound,
        answer: { value: minx, tol: 0.01 },
        solution: steps('Pertidaksamaan', [st('Bagi kedua ruas dengan ' + a + ': x > ' + U.fmtID(bound / a, 2).replace(',', '.') + '.'),
          st('Bulat terkecil yang LEBIH BESAR (bukan sama) dari nilai itu.')],
        String(minx), 'Perhatikan tanda > : batasnya tidak ikut. Kalau ≥, batas ikut.')
      };
    }
  });

  /* ================= ALJ. SISTEM MUDAH ================= */
  E.registerFamily({
    familyId: 'syssub',
    make: function (rng, node, knobs) {
      var x = rng.int(2, 9), y = rng.int(2, 9);
      var ctx = E.context(rng, node.id);
      var p1 = x + y, p2 = x - y; // gunakan jumlah & selisih (substitusi ringan)
      if (p2 <= 0) { var t = x; x = y; y = t; p2 = x - y; if (p2 <= 0) return null; }
      var askX = rng.bool();
      var ans = askX ? x : y;
      return {
        format: 'numeric',
        promptText: 'Harga 1 ' + ctx.items[0] + ' dan 1 ' + ctx.items[1] + ' (dalam ribuan rupiah): jumlahnya ' + p1 + ', selisihnya ' + p2 + '. Berapa harga ' + (askX ? ctx.items[0] : ctx.items[1]) + ' (ribuan rupiah)?',
        promptLatex: 'x+y=' + p1 + '\\;,\\;x-y=' + p2,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Sistem dengan jumlah & selisih', [st('Jumlahkan dua persamaan: 2x = ' + (p1 + p2) + ' → x = ' + (x) + '.'),
          st('Kurangkan: 2y = ' + (p1 - p2) + ' → y = ' + y + '.')],
        String(ans), 'Jumlah & selisih: jumlahkan untuk variabel pertama, kurangkan untuk yang kedua.')
      };
    }
  });

  /* ================= LOG. NEGASI ================= */
  E.registerFamily({
    familyId: 'negate',
    make: function (rng, node, knobs) {
      var pool = [
        { p: 'Semua produk lulus uji kualitas', n: 'Ada produk yang tidak lulus uji kualitas', trap: 'Semua produk tidak lulus uji kualitas' },
        { p: 'Semua mesin beroperasi hari ini', n: 'Ada mesin yang tidak beroperasi hari ini', trap: 'Semua mesin tidak beroperasi hari ini' },
        { p: 'Setiap karyawan hadir tepat waktu', n: 'Ada karyawan yang tidak hadir tepat waktu', trap: 'Semua karyawan terlambat' },
        { p: 'Semua pengiriman tiba besok', n: 'Ada pengiriman yang tidak tiba besok', trap: 'Semua pengiriman tidak tiba besok' }
      ];
      var it = rng.pick(pool);
      return {
        format: 'mc', promptText: 'Manakah NEGASI (ingkaran) yang benar dari pernyataan: "' + it.p + '"?',
        choices: [{ label: it.n, correct: true }, { label: it.trap, correct: false, tag: 'negasi "semua" adalah "ada yang tidak", bukan "semua tidak"' }, { label: 'Tidak bisa dinegasikan', correct: false }],
        solution: steps('Negasi kuantor', [st('Negasi "Semua A adalah B" = "Ada A yang TIDAK B" (cukup satu contoh).'),
          st('"Semua tidak…" terlalu kuat — itu bukan ingkaran, itu pernyataan lain.')], it.n,
        'Satu burung gagak sudah cukup membantah "semua burung putih".')
      };
    }
  });

  /* ================= LOG. DAN/ATAU ================= */
  E.registerFamily({
    familyId: 'andor',
    make: function (rng, node, knobs) {
      var a = rng.bool(), b = rng.bool();
      var P = 'Mesin A beroperasi', Q = 'Mesin B beroperasi';
      var op = rng.pick(['DAN', 'ATAU']);
      var ans = op === 'DAN' ? (a && b) : (a || b);
      var truth = function (v) { return v ? 'BENAR' : 'SALAH'; };
      return {
        format: 'mc', promptText: 'Pernyataan: "' + P + '" adalah ' + truth(a) + ', "' + Q + '" adalah ' + truth(b) + '. Maka "' + P + ' ' + op + ' ' + Q + '" bernilai?',
        choices: [{ label: 'BENAR', correct: ans }, { label: 'SALAH', correct: !ans }],
        solution: steps('DAN vs ATAU', [st('DAN (konjungsi): butuh KEDUANYA benar.'),
          st('ATAU (disjungsi): cukup SALAH SATU benar.'),
          st('Di sini: A=' + truth(a) + ', B=' + truth(b) + '.')], truth(ans),
        'AND = rantai (putus di satu titik). OR = jalan alternatif.')
      };
    }
  });

  /* ================= LOG. IMPLIKASI ================= */
  E.registerFamily({
    familyId: 'imply',
    make: function (rng, node, knobs) {
      var cases = [
        { p: true, q: true }, { p: true, q: false }, { p: false, q: true }, { p: false, q: false }
      ];
      var c = rng.pick(cases);
      var P = 'Permintaan naik', Q = 'Produksi ditambah';
      var val = !c.p || c.q; // p → q
      return {
        format: 'mc', promptText: 'Jika "' + P + '" bernilai ' + (c.p ? 'BENAR' : 'SALAH') + ' dan "' + Q + '" bernilai ' + (c.q ? 'BENAR' : 'SALAH') + ', maka "' + P + ' → ' + Q + '" bernilai?',
        choices: [{ label: 'BENAR', correct: val }, { label: 'SALAH', correct: !val }],
        solution: steps('Implikasi', [st('p → q hanya SALAH pada satu kasus: p BENAR tapi q SALAH (janji diingkari).'),
          st('Kalau p SALAH, implikasi otomatis BENAR (tidak ada janji yang dilanggar).')],
        val ? 'BENAR' : 'SALAH', 'Implikasi hanya bohong saat premis benar & kesimpulan salah.')
      };
    }
  });

  /* ================= LOG. TABEL KEBENARAN ================= */
  E.registerFamily({
    familyId: 'ttable',
    make: function (rng, node, knobs) {
      var forms = [
        { f: 'p ∧ q', fn: function (p, q) { return p && q; }, name: 'konjungsi' },
        { f: 'p ∨ q', fn: function (p, q) { return p || q; }, name: 'disjungsi' },
        { f: 'p → q', fn: function (p, q) { return !p || q; }, name: 'implikasi' },
        { f: '¬p ∨ q', fn: function (p, q) { return !p || q; }, name: 'implikasi bentuk lain' }
      ];
      var it = rng.pick(forms);
      var rows = [[false, false], [false, true], [true, false], [true, true]];
      var r = rng.pick(rows);
      var p = r[0], q = r[1];
      var val = it.fn(p, q);
      return {
        format: 'mc',
        promptText: 'Dengan p = ' + (p ? 'B' : 'S') + ' dan q = ' + (q ? 'B' : 'S') + ', berapakah nilai ' + it.f + '?',
        choices: [{ label: 'BENAR', correct: val }, { label: 'SALAH', correct: !val }],
        solution: steps('Evaluasi bentuk logika', [st('Substitusi nilai p dan q, kerjakan operator dari dalam: ¬ dulu, lalu ∧/∨, lalu →.'),
          st('Bentuk: ' + it.f + ' (' + it.name + ').')], val ? 'BENAR' : 'SALAH',
        'Tabel kebenaran 4 baris (p,q): SS, SB, BS, BB — hafal polanya.')
      };
    }
  });

  /* ================= LOG. SILOGISME ================= */
  E.registerFamily({
    familyId: 'syllog',
    make: function (rng, node, knobs) {
      var pool = [
        { m: 'Semua produk prima dikirim hari ini', a: 'Produk X adalah produk prima', c: 'Produk X dikirim hari ini' },
        { m: 'Semua mesin lama sudah diganti', a: 'Mesin CNC-7 adalah mesin lama', c: 'Mesin CNC-7 sudah diganti' },
        { m: 'Semua karyawan shift pagi dapat insentif', a: 'Rina karyawan shift pagi', c: 'Rina dapat insentif' }
      ];
      var it = rng.pick(pool);
      var valid = true;
      return {
        format: 'mc', promptText: 'Premis 1: ' + it.m + '. Premis 2: ' + it.a + '. Kesimpulan yang SAH (valid) adalah?',
        choices: [{ label: it.c, correct: valid }, { label: 'Kesimpulan sebaliknya: yang tidak disebut premis pasti salah', correct: false, tag: 'tidak bisa disimpulkan dari premis' }, { label: 'Tidak ada kesimpulan sahih', correct: false, tag: 'ada — ini pola silogisme valid' }],
        solution: steps('Silogisme', [st('Pola: Semua A adalah B; X adalah A; maka X adalah B. Valid.'),
          st('Kesimpulan harus mengikuti premis, bukan pengetahuan lain.')], it.c,
        'Silogisme soal STRUKTUR, bukan konten. Kalau polanya valid, kesimpulan mengikuti.')
      };
    }
  });

  /* ================= LOG. DEDUKSI ================= */
  E.registerFamily({
    familyId: 'deduce',
    make: function (rng, node, knobs) {
      var names = ['Arif', 'Bela', 'Chika'];
      var order = rng.shuffle(names.slice());
      var facts = [
        order[0] + ' lebih tinggi dari ' + order[1] + '.',
        order[1] + ' lebih tinggi dari ' + order[2] + '.'
      ];
      var ask = rng.pick(['tertinggi', 'terpendek']);
      var ans = ask === 'tertinggi' ? order[0] : order[2];
      return {
        format: 'mc', promptText: 'Fakta: (1) ' + facts[0] + ' (2) ' + facts[1] + ' Siapa yang ' + ask + '?',
        choices: [{ label: ans, correct: true }, { label: order[1], correct: false, tag: 'posisi tengah' }, { label: order[2], correct: false, tag: 'urutan terbalik' }],
        solution: steps('Deduksi bertingkat', [st('Rangkai fakta: ' + order[0] + ' > ' + order[1] + ' > ' + order[2] + '.'),
          st('Baca jawaban dari urutan itu.')], ans, 'Rangkai relasi jadi satu urutan — lalu jawabannya kelihatan.')
      };
    }
  });

  /* ================= LOG. POLA BARISAN ================= */
  E.registerFamily({
    familyId: 'seqpat',
    make: function (rng, node, knobs) {
      var L = knobs.level;
      var mode = rng.int(0, 2);
      var a, d, seq, ans;
      if (mode === 0) { a = rng.int(2, 12); d = rng.int(2, 9); seq = [a, a + d, a + 2 * d, a + 3 * d]; ans = a + 4 * d; }
      else if (mode === 1) { a = rng.int(2, 4); d = rng.int(2, 3); seq = [a, a * d, a * d * d, a * d * d * d]; ans = a * Math.pow(d, 4); if (ans > 999) return null; }
      else { var f1 = rng.int(1, 5), f2 = rng.int(2, 6); seq = [f1, f2, f1 + f2, f2 + (f1 + f2)]; ans = (f1 + f2) + (f2 + f1 + f2); }
      return {
        format: 'numeric', promptText: 'Lanjutkan pola: ' + seq.join(', ') + ', … ?',
        answer: { value: ans, tol: 0.01 },
        solution: steps('Pola barisan', [st(mode === 0 ? 'Selisih antar suku tetap: +' + d + ' (aritmetika).'
          : mode === 1 ? 'Setiap suku dikali ' + d + ' (geometri).' : 'Pola Fibonacci: dua suku sebelumnya dijumlahkan.'),
          st('Suku berikutnya:')],
        String(ans), 'Cek dulu: selisih tetap? rasio tetap? jumlah dua sebelumnya? Tiga pola ini menutup 90% kasus.')
      };
    }
  });

  /* ================= DAT. TABEL ================= */
  E.registerFamily({
    familyId: 'tableRead',
    make: function (rng, node, knobs) {
      var ctx = E.context(rng, node.id);
      var v = [];
      for (var i = 0; i < 3; i++) v.push(rng.int(15, 90));
      var ask = rng.int(0, 2);
      var sum = v[0] + v[1] + v[2];
      var askTotal = rng.bool();
      var ans = askTotal ? sum : v[ask];
      var visual = { type: 'table', caption: 'Produksi ' + ctx.place + ' (per hari, ' + ctx.unit + ')',
        head: ['Senin', 'Selasa', 'Rabu'], rows: [[String(v[0]), String(v[1]), String(v[2])]] };
      return {
        format: 'numeric', promptText: askTotal ? 'Lihat tabel. Berapa TOTAL produksi tiga hari?' : 'Lihat tabel. Berapa produksi hari ' + ['Senin', 'Selasa', 'Rabu'][ask] + '?',
        visual: visual,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Membaca tabel', [st(askTotal ? 'Jumlahkan ketiga nilai: ' + v.join(' + ') + '.' : 'Baca baris dan kolom yang sesuai.')],
          U.fmtID(ans, 0), 'Baca sumbu/label dulu, baru angka — jangan terburu-buru.')
      };
    }
  });

  /* ================= DAT. BAR CHART ================= */
  E.registerFamily({
    familyId: 'barRead',
    make: function (rng, node, knobs) {
      var ctx = E.context(rng, node.id);
      var v = [];
      for (var i = 0; i < 4; i++) v.push(rng.int(20, 100));
      var hi = v.indexOf(Math.max.apply(null, v));
      var visual = { type: 'bars', caption: 'Penjualan ' + ctx.place + ' (' + ctx.unit + '/minggu)', labels: ['W1', 'W2', 'W3', 'W4'], values: v };
      var askDiff = rng.bool();
      if (v[0] === v[3]) return null;
      var ans = askDiff ? v[3] - v[0] : hi;
      return {
        format: 'numeric', promptText: askDiff ? 'Lihat grafik. Berapa SELISIH W4 dan W1?' : 'Lihat grafik. Minggu mana penjualan TERTINGGI? (1–4)',
        visual: visual,
        answer: { value: ans, tol: 0.01 },
        solution: steps('Membaca grafik batang', [st('Bandingkan tinggi batang; untuk selisih: ' + v[3] + ' − ' + v[0] + '.')],
          String(ans), 'Grafik untuk membandingkan kategori; tabel untuk angka presisi.')
      };
    }
  });

  /* ================= DAT. MEAN ================= */
  E.registerFamily({
    familyId: 'meanSimple',
    make: function (rng, node, knobs) {
      var n = 5, vals = [], sum = 0;
      var mean = rng.int(6, 30);
      for (var i = 0; i < n - 1; i++) { var x = rng.int(2, 45); vals.push(x); sum += x; }
      var last = mean * n - sum;
      if (last < 0 || last > 60) return null;
      vals.push(last);
      return {
        format: 'numeric', promptText: 'Data: ' + vals.join(', ') + '. Berapa rata-ratanya?',
        answer: { value: mean, tol: 0.01 },
        solution: steps('Rata-rata (mean)', [st('Jumlahkan semua: ' + vals.join(' + ') + ' = ' + (mean * n) + '.'),
          st('Bagi banyak data: ' + (mean * n) + ' ÷ ' + n + '.')], String(mean),
        'Mean = total ÷ banyak. Sensitif terhadap nilai ekstrem — ingat ini saat data ada pencilan.')
      };
    }
  });

  /* ================= DAT. MEDIAN & MODUS ================= */
  E.registerFamily({
    familyId: 'medmode',
    make: function (rng, node, knobs) {
      var askMedian = rng.bool();
      if (askMedian) {
        var vals = [];
        for (var i = 0; i < 5; i++) vals.push(rng.int(3, 40));
        var s = vals.slice().sort(function (a, b) { return a - b; });
        var ans = s[2];
        return {
          format: 'numeric', promptText: 'Data: ' + vals.join(', ') + '. Berapa mediannya?',
          answer: { value: ans, tol: 0.01 },
          solution: steps('Median', [st('Urutkan dulu: ' + s.join(', ') + '.'),
            st('Median (5 data) = nilai ke-3 setelah diurutkan.')], String(ans),
          'Median = nilai tengah SETELAH diurutkan. Tahan pencilan.')
        };
      }
      var mode = rng.int(4, 25);
      var oth = rng.int(3, 30);
      while (oth === mode) oth = rng.int(3, 30);
      var data = rng.shuffle([mode, mode, oth, mode, oth + 1]);
      return {
        format: 'numeric', promptText: 'Data: ' + data.join(', ') + '. Berapa modusnya?',
        answer: { value: mode, tol: 0.01 },
        solution: steps('Modus', [st('Hitung frekuensi tiap nilai: ' + mode + ' muncul 3×, paling sering.')],
          String(mode), 'Modus = nilai paling sering muncul. Berguna untuk data kategorik (produk terlaris).')
      };
    }
  });

  /* ================= DAT. BANDING DUA GRAFIK ================= */
  E.registerFamily({
    familyId: 'compare',
    make: function (rng, node, knobs) {
      var a = [], b = [];
      for (var i = 0; i < 3; i++) { a.push(rng.int(20, 80)); b.push(rng.int(20, 80)); }
      if (a[0] === b[0]) return null;
      var ans = a[0] > b[0];
      var visual = { type: 'bars2', caption: 'Produksi Lini A vs Lini B (unit/hari)', labels: ['Sen', 'Sel', 'Rab'], valuesA: a, valuesB: b };
      return {
        format: 'mc', promptText: 'Bandingkan grafik. Pada hari Senin, lini mana yang lebih tinggi?',
        visual: visual,
        choices: [{ label: 'Lini A', correct: ans }, { label: 'Lini B', correct: !ans }, { label: 'Sama', correct: false }],
        solution: steps('Perbandingan grafik', [st('Senin: A = ' + a[0] + ', B = ' + b[0] + '.')], ans ? 'Lini A' : 'Lini B',
        'Perbandingan = baca posisi yang sama (hari yang sama), baru bandingkan.')
      };
    }
  });
})();
