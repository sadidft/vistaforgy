/* Vista Forgy — content.js
   DATA murni: skill tree (77 node), tier, kartu konsep, humor KOA. Bukan logika. */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var E = VF.ENGINE;
  var reg = E.registerNode;

  /* ---------- KARTU KONSEP (dipakai bersama oleh node satu family) ---------- */
  var CARDS = {
    addsub: { title: 'Penjumlahan & Pengurangan', body: 'Kerjakan per nilai tempat (satuan, puluhan, ratusan) dan kuasai carry (menyimpan) serta pinjam. Teknik cepat: bulatkan ke puluhan terdekat lalu koreksi (47 + 38 → 47 + 40 − 2 = 85).', latex: '47+38=(47+40)-2=85', miss: 'Melewatkan carry/pinjam saat terburu-buru — tulis menyusun kalau tidak yakin.', why: 'Semua perhitungan industri — biaya, stok, waktu — berdiri di atas aritmetika cepat yang akurat.' },
    muldiv: { title: 'Perkalian & Pembagian', body: 'Hafalkan tabel sampai 12×12 sampai refleks. Untuk 2 digit, pecah: 24×6 = 20×6 + 4×6. Pembagian = perkalian terbalik: 132 ÷ 12? Pikirkan 12 × ? = 132.', latex: '24\\times6=20\\times6+4\\times6', miss: 'Perkalian dihitung sebagai penjumlahan berulang (lambat) — latih sampai otomatis.', why: 'EOQ, lot sizing, dan kapasitas produksi semuanya perkalian-pembagian cepat.' },
    mixops: { title: 'Urutan Operasi', body: 'Kurung dulu, lalu kali/bagi (kiri ke kanan), terakhir tambah/kurang. Kombinasi tanpa kurung adalah sumber jebakan nomor satu.', latex: 'a+b\\times c=a+(b\\times c)', miss: 'Mengerjakan kiri-ke-kanan mentah: 3 + 4×2 dihitung 14 (salah, harus 11).', why: 'Formula Excel/ERP di dunia kerja mengikuti precedensi yang sama.' },
    signed: { title: 'Bilangan Negatif', body: 'Tanda sama → jumlahkan, hasil ikut tanda bersama. Tanda beda → kurangkan, ikuti yang lebih besar. Kali/bagi: tanda sama hasil positif, beda hasil negatif.', latex: '(-7)+(+4)=-3\\;,\\;(-3)\\times(-2)=+6', miss: 'Menulis −3 × −4 = −12 (harusnya +12).', why: 'Selisih periode, deviasi standar, dan arus kas negatif tiada henti di analisis.' },
    fraction: { title: 'Pecahan', body: 'Senilai: kali/bagi pembilang & penyebut dengan angka sama. Menyederhanakan: bagi keduanya dengan FPB. Membandingkan: samakan penyebut atau bagi langsung ke desimal.', latex: '\\frac{3}{4}=\\frac{9}{12}\\;,\\;\\frac{18}{24}=\\frac{3}{4}', miss: 'Menjumlahkan pembilang dan penyebut langsung: 1/2 + 1/3 dihitung 2/5 (salah).', why: 'Rasio campuran bahan, fraksi cacat, dan utilmesin memakai bahasa pecahan.' },
    decimal: { title: 'Desimal', body: 'Luruskan koma saat menjumlah/mengurang. Konversi kunci: 1/2=0,5 · 1/4=0,25 · 1/5=0,2 · 1/8=0,125 · 1/10=0,1.', latex: '3,5+2,8=6,3\\;,\\;\\frac{3}{8}=0{,}375', miss: 'Koma tidak diluruskan saat menyusun: 3,5 + 2,8 dihitung 5,13.', why: 'Pengukuran presisi dan uang rupiah sehari-hari memakai desimal.' },
    round: { title: 'Pembulatan & Estimasi', body: 'Lihat satu angka di kanan posisi target: ≥5 naik, <5 tetap. Estimasi dulu sebelum hitung presisi untuk menangkap kesalahan besar.', latex: '2\\,748\\to 2\\,750\\text{ (puluhan)}', miss: 'Membulatkan dua kali bertingkat dari hasil pembulatan (akumulasi galat).', why: 'Estimasi adalah alarm keteledoran insinyur: "masuk akal nggak, nih?"' },
    percent: { title: 'Persen Dasar', body: 'Persen = per seratus. x% dari N = x/100 × N. Pecah persen susah: 15% = 10% + setengahnya lagi (5%).', latex: '15\\%\\times 240=24+12=36', miss: 'Menukar persen dan angka: "25% dari 80" dihitung "25 dari 80".', why: 'Diskon, margin, defect rate, utilisasi — persen adalah bahasa bisnis.' },
    ratio: { title: 'Rasio & Proporsi', body: 'Rasio a:b berarti a bagian dan b bagian. Kunci: cari nilai SATU bagian dulu (total ÷ jumlah bagian), lalu kalikan.', latex: '3:5\\;,\\;\\text{total }240\\Rightarrow 1\\text{ bagian}=30', miss: 'Membagi total dengan selisih (b − a), bukan jumlah bagian (a + b).', why: 'Campuran bahan, pembagian mesin, dan komposisi produk memakai rasio.' },
    units: { title: 'Konversi Satuan', body: 'Tulis faktor konversinya: 1 km = 1000 m, 1 kg = 1000 g, 1 jam = 60 menit, 1 lusin = 12. Besar→kecil KALI, kecil→besar BAGI.', latex: '2{,}5\\,km=2{,}5\\times1000=2500\\,m', miss: 'Mengalih saat seharusnya membagi (atau sebaliknya).', why: 'Satuan yang tidak konsisten adalah penyebab error hitung teknik nomor satu.' },
    subst: { title: 'Substitusi Variabel', body: 'Ganti variabel dengan nilainya dalam kurung, lalu hitung dengan urutan operasi normal.', latex: '3x+5\\;,\\;x=4\\Rightarrow 3(4)+5=17', miss: 'Lupa kurung saat substitusi negatif: 3x dengan x=−2 dihitung +6.', why: 'Memasukkan parameter ke model (permintaan, biaya) adalah rutinitas analisis.' },
    liketerms: { title: 'Suku Sejenis', body: 'Hanya suku sejenis bisa digabung: 5x + 3x = 8x, dan 7 + 2 = 9, tapi 5x + 7 tidak bisa disatukan.', latex: '5x+3x+7=8x+7', miss: 'Menjumlahkan 5x + 7 menjadi 12x.', why: 'Penyederhanaan model biaya/permintaan dimulai dari mengelompokkan suku.' },
    lin12: { title: 'Persamaan Linear', body: 'Target: x sendirian. Pindahkan konstanta (kurangi kedua ruas), lalu bagi koefisien. Apa pun yang dilakukan pada satu ruas, lakukan juga di ruas lain.', latex: '4x+7=19\\Rightarrow 4x=12\\Rightarrow x=3', miss: 'Hanya memindahkan sebagian (4x + 7 = 19 → 4x = 19 + 7).', why: 'Menemukan kuantitas dari kendala: berapa unit agar biaya pas?' },
    distrib: { title: 'Sifat Distributif', body: 'a(b + c) = ab + ac. Dipakai maju untuk menghitung cepat dan mundur untuk memfaktorkan.', latex: '6(20+7)=6\\times20+6\\times7=162', miss: 'Hanya mengali suku pertama: 6(20+7) dihitung 127.', why: 'Basis manipulasi aljabar: ekspansi biaya, faktorisasi, dan mental math.' },
    ineq0: { title: 'Pertidaksamaan Dasar', body: 'Seperti persamaan, TAPI kalau kali/bagi dengan bilangan negatif, arah tanda BERBALIK. Untuk > (strict), batas tidak ikut.', latex: '3x>17\\Rightarrow x>5{,}67\\Rightarrow\\text{bulat min }6', miss: 'Memasukkan batas untuk tanda > (padahal harus benar-benar lebih).', why: 'Kendala kapasitas dan standar minimum ditulis sebagai pertidaksamaan.' },
    syssub: { title: 'Sistem Jumlah & Selisih', body: 'x + y = S dan x − y = D: jumlahkan → 2x = S + D; kurangkan → 2y = S − D. Kasus khusus yang sering muncul.', latex: 'x+y=15\\;,\\;x-y=7\\Rightarrow x=11,y=4', miss: 'Bingung membagi dua hasil akhir dengan 2.', why: 'Polanya sama dengan eliminasi di sistem besar (riset operasi).' },
    negate: { title: 'Negasi pernyataan', body: 'Negasi "Semua A adalah B" adalah "Ada A yang tidak B" — cukup satu pengecualian untuk membantah pernyataan universal.', latex: '\\neg(\\forall)=\\exists\\,\\neg', miss: 'Menjawab "Semua A tidak B" (terlalu kuat).', why: 'QC membantah klaim "semua produk bagus" dengan satu sampel cacat.' },
    andor: { title: 'DAN vs ATAU', body: 'Konjungsi (DAN) benar hanya jika keduanya benar. Disjungsi (ATAU) benar jika minimal satu benar.', latex: 'T\\wedge F=F\\;,\\;T\\vee F=T', miss: 'Menganggap DAN dan ATAU sama saja.', why: 'Logika kendala: "mesin hidup DAN antrian < 5" vs "atau".' },
    imply: { title: 'Implikasi (→)', body: 'p → q hanya bernilai salah pada satu kasus: p benar dan q salah. Jika p salah, implikasi otomatis benar.', latex: 'F\\to F=T\\;,\\;T\\to F=F', miss: 'Mengira p salah membuat implikasi salah.', why: '"Jika permintaan naik maka produksi naik" — seluruh rule-based system berdiri di atas ini.' },
    ttable: { title: 'Tabel Kebenaran', body: 'Empat kombinasi p,q: (B,B), (B,S), (S,B), (S,S). Evaluasi operator: ¬ dulu, lalu ∧/∨, lalu →.', latex: 'p\\wedge\\neg q', miss: 'Salah urutan operator (mengerjakan ∧ sebelum ¬).', why: 'Verifikasi kondisi sistem & debugging logika.' },
    syllog: { title: 'Silogisme', body: 'Pola: Semua A adalah B; X adalah A; maka X adalah B. Validitas soal STRUKTUR, bukan kandungan.', latex: '\\forall a\\in A:a\\in B\\;,\\;x\\in A\\Rightarrow x\\in B', miss: 'Menilai kesimpulan berdasarkan "terasa benar", bukan strukturnya.', why: 'Argumen manajerial yang valid = keputusan yang bisa dipertanggungjawabkan.' },
    deduce: { title: 'Deduksi Bertingkat', body: 'Rangkai fakta menjadi satu urutan/penyimpanan, lalu baca jawabannya. Tulis tabel kecil bila perlu.', latex: 'a>b\\;,\\;b>c\\Rightarrow a>c', miss: 'Melompat ke kesimpulan tanpa merangkai semua fakta.', why: 'Diagnosis akar masalah (root cause) adalah deduksi bertingkat.' },
    seqpat: { title: 'Pola Barisan', body: 'Cek tiga pola dulu: selisih tetap (aritmetika), rasio tetap (geometri), jumlah dua suku sebelumnya (Fibonacci).', latex: 'a_n=a_{n-1}+d', miss: 'Menebak angka tanpa mengidentifikasi pola.', why: 'Membaca tren data adalah melihat pola barisan.' },
    tableRead: { title: 'Membaca Tabel', body: 'Baca judul dan dulu label baris/kolom, baru angkanya. Tentukan sel yang ditanya dengan teliti.', latex: '', miss: 'Salah baris/kolom karena terburu-buru.', why: 'Laporan produksi harian = tabel. Salah baca = salah keputusan.' },
    barRead: { title: 'Membaca Grafik Batang', body: 'Grafik batang membandingkan kategori. Bandingkan tinggi; baca sumbu untuk nilai presisi.', latex: '', miss: 'Salah membaca sumbu (unit ribuan dianggap satuan).', why: 'Dashboard KPI mingguan berbentuk grafik batang.' },
    meanSimple: { title: 'Rata-rata (Mean)', body: 'Mean = jumlah semua nilai ÷ banyak data. Sensitif terhadap pencilan.', latex: '\\bar{x}=\\frac{\\sum x_i}{n}', miss: 'Membagi dengan angka yang salah (n−1 vs n).', why: 'Rata-rata output, waktu siklus, dan lead time — statistik deskriptif dasar.' },
    medmode: { title: 'Median & Modus', body: 'Median = nilai tengah SETELAH diurutkan (tahan pencilan). Modus = nilai tersering (untuk data kategori).', latex: '', miss: 'Median tanpa mengurutkan dulu.', why: 'Waktu siklus bimodal → proses tidak stabil; median lebih jujur daripada mean.' },
    compare: { title: 'Membandingkan Grafik', body: 'Bandingkan pada posisi/kategori yang sama. Perhatikan skala kedua sumbu bisa berbeda.', latex: '', miss: 'Membandingkan titik dari kategori berbeda.', why: 'Membandingkan kinerja dua lini/periode adalah tugas harian analis.' },
    percent2: { title: 'Perubahan Persen & Diskon Bertingkat', body: 'Selalu pakai faktor pengali: naik 20% = ×1,2; turun 20% = ×0,8. Diskon kedua dihitung dari harga BARU. Naik 20% lalu turun 20% ≠ kembali awal.', latex: '250000\\times0{,}8\\times0{,}9=180000', miss: 'Menjumlahkan dua persen diskon (30% sekali jalan).', why: 'Margin, inflasi, dan diskon berlapis — arus utama analisis harga.' },
    interest: { title: 'Bunga Sederhana', body: 'Bunga = P × r × t (pokok tidak ikut berbunga). Berbeda dengan bunga majemuk yang berbunga berulang.', latex: 'I=P\\cdot r\\cdot t', miss: 'Menganggap semua bunga majemuk.', why: 'Dasar ekonomi teknik & keuangan pribadi.' },
    ratio3: { title: 'Rasio Tiga Bagian', body: 'Sama dengan rasio dua bagian: jumlahkan semua bagian, bagi total untuk nilai satu bagian, lalu kalikan sesuai porsi.', latex: '2:3:5\\;,\\;\\text{total }=10x', miss: 'Hanya membagi ke dua bagian pertama.', why: 'Alokasi anggaran bahan–upah–overhead memakai rasio tiga bagian.' },
    scale: { title: 'Skala', body: 'Skala 1:n berarti 1 satuan di gambar = n satuan nyata. Kalikan lalu konversi satuan terakhir.', latex: '1:200\\Rightarrow 5\\,cm=1000\\,cm=10\\,m', miss: 'Lupa konversi cm→m di langkah akhir.', why: 'Tata letak fasilitas (facility layout) bekerja di atas gambar berskala.' },
    fracmix: { title: 'Operasi Pecahan', body: 'Penyebut sama → operasikan pembilang. Beda penyebut → samakan dengan KPK dulu. Sederhanakan hasilnya.', latex: '\\frac{2}{5}+\\frac{1}{5}=\\frac{3}{5}', miss: 'Mengjumlahkan penyebut juga.', why: 'Fraksi bahan campuran di resep produksi.' },
    exproot: { title: 'Pangkat & Akar', body: 'aⁿ = a dikali dirinya n kali. √x = bilangan yang kuadratnya x. Hafal kuadrat 1–20.', latex: '2^{10}=1024\\;,\\;\\sqrt{144}=12', miss: '2⁵ dihitung 10 (itu 2×5).', why: 'Pertumbuhan eksponensial & kuadrat dalam rumus jarak/energi.' },
    wordLin: { title: 'Soal Cerita Linear', body: 'Resep: (1) definisikan variabel, (2) susun persamaan dari kalimat, (3) selesaikan, (4) cek balik ke cerita. Untuk kecepatan rata-rata: total jarak ÷ total waktu.', latex: 'v_{rata}=\\frac{\\sum d}{\\sum t}', miss: 'Rata-rata kecepatan dihitung rata-rata dua kecepatan.', why: 'Semua pemodelan kata → matematika dimulai dari keterampilan ini.' },
    sysEq: { title: 'Sistem Dua Persamaan', body: 'Eliminasi: samakan satu koefisien lalu kurangkan. Substitusi: nyatakan satu variabel lalu gantikan. Pilih jalur yang angkanya paling ramah.', latex: '\\begin{cases}2x+3y=16\\\\3x+2y=14\\end{cases}', miss: 'Salah tanda saat mengurangkan persamaan.', why: 'Titik ekuilibrium dan solusi LP dua variabel = sistem persamaan.' },
    quadFactor: { title: 'Akar Kuadrat & Vieta', body: 'x² − Sx + P punya akar yang jumlahnya S dan hasil kalinya P (tanda: untuk x² + bx + c, akar berjumlah −b dan bersalian c).', latex: 'p+q=-b\\;,\\;pq=c', miss: 'Salah tanda Vieta (lupa negatif b).', why: 'Titik impas kuadrat & analisis profit sering berujung akar kuadrat.' },
    expoRules: { title: 'Aturan Eksponen', body: 'Sesama basis dikali → pangkat dijumlah. Dibagi → dikurang. Pangkat dipangkatkan → dikali. (ab)ⁿ = aⁿbⁿ.', latex: 'x^a x^b=x^{a+b}\\;,\\;(x^a)^b=x^{ab}', miss: 'Menjumlahkan pangkat saat seharusnya mengali (pangkat dipangkat).', why: 'Pertumbuhan majemuk, peluruhan, dan skala algoritma.' },
    absval: { title: 'Nilai Mutlak', body: '|x − a| = jarak x ke a. Persamaan |x−a| = b punya dua solusi: a+b dan a−b.', latex: '|x-5|=3\\Rightarrow x=8\\text{ atau }2', miss: 'Hanya menjawab satu solusi (sisi positif saja).', why: 'Toleransi dimensi |x − target| ≤ batas adalah bahasa kualitas.' },
    contrapose: { title: 'Kontraposisi', body: 'p → q setara dengan ¬q → ¬p. Invers (¬p → ¬q) dan konvers (q → p) TIDAK setara.', latex: 'p\\to q\\equiv\\neg q\\to\\neg p', miss: 'Mengira konvers setara dengan aslinya.', why: 'Membuktikan "jika A maka B" sering lebih mudah lewat kontraposisi.' },
    demorgan: { title: 'Hukum De Morgan', body: '¬(p ∧ q) = ¬p ∨ ¬q dan ¬(p ∨ q) = ¬p ∧ ¬q — negasi masuk, konektivitas berganti.', latex: '\\neg(p\\wedge q)=\\neg p\\vee\\neg q', miss: 'Lupa membalik DAN↔ATAU.', why: 'Menyederhanakan kondisi sistem & pencarian database.' },
    quantor: { title: 'Negasi Kuantor', body: '¬(Semua P) = Ada yang tidak P. ¬(Ada P) = Semua tidak P. Kuantor berganti, isi dinegasi.', latex: '\\neg\\forall=\\exists\\neg', miss: 'Menegasi isinya saja tanpa mengganti kuantor.', why: 'Spesifikasi kualitas ditulis dengan kuantor: "semua unit lulus uji".' },
    zebra: { title: 'Puzzle Deduksi (Einstein mini)', body: 'Buat tabel orang × atribut. Tandai ✓/✗ dari petunjuk eksplisit, eliminasi, isi yang tersisa.', latex: '', miss: 'Menyimpan semuanya di kepala tanpa tabel.', why: 'Penjadwalan & penugasan adalah puzzle deduksi berskala besar.' },
    slopeIntercept: { title: 'Gradien dari Dua Titik', body: 'm = (y₂−y₁)/(x₂−x₁). Gradien = laju perubahan y per satu x.', latex: 'm=\\frac{y_2-y_1}{x_2-x_1}', miss: 'Selisih dibalik (x₁−y)/... — konsisten satu format.', why: 'Gradien = turunan versi garis lurus — konsep laju perubahan.' },
    readGraph: { title: 'Membaca Grafik Garis', body: 'y = mx + c: c = titik potong sumbu-y (awal), m = kemiringan (laju). Baca keduanya dari grafik.', latex: 'y=mx+c', miss: 'Membaca intersep sebagai gradien.', why: 'Grafik permintaan–biaya–produksi dibaca tiap hari di dunia kerja.' },
    compose: { title: 'Komposisi Fungsi', body: '(f ∘ g)(x) = f(g(x)): kerjakan DALAM dulu. f(g(x)) ≠ g(f(x)) umumnya.', latex: '(f\\circ g)(x)=f(g(x))', miss: 'Mengerjakan fungsi luar dulu.', why: 'Rantai proses produksi = komposisi fungsi (output stasiun 1 jadi input 2).' },
    inverse: { title: 'Invers Fungsi', body: 'Invers membalik proses: untuk y = ax + b, x = (y − b)/a. Grafiknya cermin terhadap y = x.', latex: 'f^{-1}(y)=\\frac{y-b}{a}', miss: 'Membagi dulu baru mengurangi (urutan terbalik).', why: 'Dari output yang diinginkan → kebutuhan input (perencanaan mundur).' },
    quadGraph: { title: 'Parabola', body: 'y = x² + bx + c: akar = potong sumbu-x, puncak di x = −b/2a (tengah dua akar). Simetris.', latex: 'x_{puncak}=-\\frac{b}{2a}', miss: 'Lupa bahwa puncak = tengah dua akar.', why: 'Lintasan proyektil, biaya minimum, dan profit maksimum berbentuk parabola.' },
    freqStats: { title: 'Mean Data Berfrekuensi', body: 'Rata-rata tertimbang: Σ(nilai×frekuensi) ÷ Σfrekuensi.', latex: '\\bar{x}=\\frac{\\sum f_i x_i}{\\sum f_i}', miss: 'Rata-rata kolom nilai tanpa bobot frekuensi.', why: 'Data inspeksi & hasil survei hampir selalu dalam tabel frekuensi.' },
    spread: { title: 'IQR & Variansi', body: 'IQR = Q3 − Q1 (lebar kotak tengah, tahan pencilan). Variansi populasi σ² = Σ(x−m)²/n.', latex: 'IQR=Q_3-Q_1\\;,\\;\\sigma^2=\\frac{\\sum(x-\\bar{x})^2}{n}', miss: 'Variansi dibagi n−1 padahal populasi (atau sebaliknya) — baca soal.', why: 'Six Sigma: nama program kualitas paling terkenal lahir dari kata variansi.' },
    boxRead: { title: 'Boxplot', body: 'Lima ringkasan: min, Q1, median, Q3, max. Kotak = 50% data tengah; kumis = rentang; titik = pencilan.', latex: '', miss: 'Mengira kotak = seluruh data.', why: 'Boxplot membandingkan distribusi antar shift/mesin dalam sekali pandang.' },
    rush: { title: 'Mental Math Rush', body: 'Teknik: pecah (24×6=20×6+4×6), bulatkan-koreksi (49+33 → 50+33−1), 1%-dulu untuk persen, dan trik ×11/×5/×25.', latex: '49+33=50+33-1=82', miss: 'Menghitung dengan cara panjang saat ada jalan pintas aman.', why: 'Otomatisasi aritmetika membebaskan memori kerja untuk berpikir strategis.' },
    limitPoly: { title: 'Limit', body: 'Kalau substitusi langsung lancar → substitusi. Kalau 0/0 → faktorkan atau rasionalisasi dulu, coret, baru substitusi.', latex: '\\lim_{x\\to 2}\\frac{x^2-4}{x-2}=4', miss: 'Menjawab 0/0 atau ∞ sebagai hasil akhir.', why: 'Limit mendefinisikan turunan — fondasi kalkulus.' },
    power: { title: 'Turunan — Aturan Pangkat', body: 'Turunan mengukur laju perubahan sesaat. d/dx xⁿ = n·xⁿ⁻¹ — pangkat turun jadi koefisien; konstanta menghilang.', latex: '\\frac{d}{dx}x^n=nx^{n-1}', miss: 'Menulis n·xⁿ (lupa kurangi satu) atau menurunkan konstanta jadi 1.', why: 'Turunan = mesin optimasi: biaya minimum, laba maksimum, buffer terkecil.' },
    prodRule: { title: 'Aturan Hasil Kali', body: '(uv)′ = u′v + uv′ — turunkan bergantian, jumlahkan dua hasil kali.', latex: '(uv)\'=u\'v+uv\'', miss: 'Menurunkan perkalian sebagai perkalian turunan (u′v′).', why: 'Biaya total = harga × jumlah — keduanya bisa berubah; butuh aturan ini.' },
    chain: { title: 'Aturan Rantai', body: '[f(g(x))]′ = f′(g(x))·g′(x) — turunkan luar, KALI turunan dalam.', latex: '\\left(u^n\\right)\'=n u^{n-1}u\'', miss: 'Lupa mengali turunan bagian dalam.', why: 'Hampir semua turunan dunia nyata berlapis — rantai adalah aturan paling sering dipakai.' },
    tangent: { title: 'Garis Singgung', body: 'Gradien singgung kurva di titik = nilai turunan di titik itu. y − y₁ = m(x − x₁).', latex: 'm_{singgung}=f\'(x_1)', miss: 'Memakai gradien rata-rata dua titik.', why: 'Optimasi & sensitivitas: "kalau x digeser sedikit, y berubah seberapa?"' },
    indefInt: { title: 'Integral Tak Tentu', body: 'Antiturunan: naikkan pangkat +1, bagi dengan pangkat baru, tambah +C.', latex: '\\int x^n dx=\\frac{x^{n+1}}{n+1}+C', miss: 'Lupa membagi dengan pangkat baru atau lupa +C.', why: 'Integral = akumulasi: total produksi dari laju produksi.' },
    defInt: { title: 'Integral Tentu', body: '∫ₐᵇ f(x)dx = F(b) − F(a): luas bersih di bawah kurva.', latex: '\\int_a^b f=F(b)-F(a)', miss: 'Menjumlahkan F(a)+F(b).', why: 'Luas, volume, total biaya kumulatif — semua akumulasi.' },
    trigVal: { title: 'Sudut Istimewa Trigonometri', body: 'Hafal tabel sin/cos/tan untuk 0°, 30°, 45°, 60°, 90° dari dua segitiga istimewa (45-45-90 dan 30-60-90).', latex: '\\sin 30^\\circ=\\frac{1}{2}\\;,\\;\\cos 60^\\circ=\\frac{1}{2}', miss: 'sin dan cos tertukar untuk 30°/60°.', why: 'Getaran, gaya miring, dan sinyal — trigonometri ada di mana-mana.' },
    trigRatio: { title: 'Perbandingan Trigonometri', body: 'SOH-CAH-TOA: sin = depan/hipotenusa, cos = samping/hipotenusa, tan = depan/samping.', latex: '\\sin\\theta=\\frac{depan}{hip}', miss: 'Salah pilih sisi karena sudut referensi berpindah.', why: 'Mengukur ketinggian/jarak tak terjangkau dan analisis gaya.' },
    pythApp: { title: 'Pythagoras Terapan', body: 'a² + b² = c² hanya di segitiga siku-siku; c = sisi terpanjang. Kenali tripel: 3-4-5, 5-12-13, 8-15-17.', latex: 'a^2+b^2=c^2', miss: 'Memakai rumus pada segitiga tidak siku.', why: 'Diagonal layout pabrik, jarak terpendek, dan resultan gaya.' },
    geoAV: { title: 'Luas, Volume & Optimasi Mini', body: 'L persegi panjang = p×l; V tabung = πr²t. Keliling tetap → luas maks saat persegi (intuisi optimasi).', latex: 'V=\\pi r^2 t', miss: 'Lupa kuadrat pada r saat volume tabung.', why: 'Material, kapasitas gudang, dan tata letak mulai dari geometri.' },
    bayes: { title: 'Teorema Bayes', body: 'P(A|C) = P(C|A)P(A) / P(C). Bangun tabel joint dari 100 (atau 10.000) item — lebih sulit tersesat daripada hafalan rumus.', latex: 'P(A|C)=\\frac{P(C|A)P(A)}{P(C)}', miss: 'Melaporkan P(C|A) sebagai jawaban (tertukar dengan P(A|C)).', why: 'Bayar klaim asuransi, rute QC "dari mesin mana item cacat ini?" — Bayes.' },
    ciZ: { title: 'Interval Kepercayaan (z)', body: 'CI = x̄ ± z·σ/√n. z: 90%→1,645 · 95%→1,96 · 99%→2,575. Sampel besar → interval sempit.', latex: '\\bar{x}\\pm z\\frac{\\sigma}{\\sqrt{n}}', miss: 'Lupa √n atau memakai σ bukan s pada kasus t.', why: '"Berat rata-rata 250±4 gram (95%)" — cara ilmiah menyampaikan ketidakpastian.' },
    det: { title: 'Determinan 2×2', body: 'det = ad − bc. Nol → tidak ada invers, kolom/baris bergantung, sistem punya tak tunggal atau tanpa solusi.', latex: 'det=ad-bc', miss: 'ad + bc atau ab − cd.', why: 'Determinan = "luas faktor skala" transformasi; deteksi ketergantungan linier.' },
    inv2: { title: 'Invers Matriks 2×2', body: 'A⁻¹ = 1/det × [d −b; −c a]: tukar diagonal utama, negasi diagonal lain, bagi determinan.', latex: 'A^{-1}=\\frac{1}{ad-bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}', miss: 'Lupa membagi seluruh matriks dengan determinan.', why: 'Menyelesaikan Ax = b untuk banyak b sekaligus: x = A⁻¹b.' },
    mm1: { title: 'Teori Antrean M/M/1', body: 'Satu server, kedatangan Poisson (λ), layanan eksponensial (μ). ρ=λ/μ (utilisasi), Lq=ρ²/(1−ρ), Ls=ρ/(1−ρ), W=L/λ (Little\u2019s Law). Stabil jika ρ<1.', latex: 'L_q=\\frac{\\rho^2}{1-\\rho}\\;,\\;W_q=\\frac{L_q}{\\lambda}', miss: 'Lupa bahwa Ls = Lq + ρ, dan menukar λ dengan μ.', why: 'Antrean = buang waktu pelanggan. TI mengoptimalkan server, kasir, mesin, APD — semuanya antrean.' },
    eoq: { title: 'EOQ — Persediaan Ekonomis', body: 'Q* = √(2DS/H): keseimbangan biaya pesan (turun saat Q besar) dan biaya simpan (naik saat Q besar). Di Q*, dua biaya itu SAMA.', latex: 'Q^*=\\sqrt{\\frac{2DS}{H}}', miss: 'Menukar posisi D dan H, atau menghitung TC hanya satu komponen.', why: 'Model persediaan paling terkenal di dunia — trade-off klasik manajemen operasi.' },
    breakeven: { title: 'Analisis Titik Impas', body: 'Q_BEP = FC/(p−v): biaya tetap dibagi margin kontribusi. Target laba L: Q = (FC+L)/margin.', latex: 'Q_{BEP}=\\frac{FC}{p-v}', miss: 'Memakai harga p (bukan margin p−v) sebagai pembagi.', why: 'Bahasa bersama TI, manajemen, akuntansi, dan bisnis digital: "kapan mulai untung?"' }
  };

  var CARDS2 = {
    related: { title: 'Laju Berhubung (Related Rates)', body: 'Hubungkan variabel dengan persamaan (mis. Pythagoras), turunkan terhadap waktu t, lalu substitusi nilai yang diketahui. dy/dt muncul dari diferensiasi implisit terhadap t.', latex: 'x^2+y^2=L^2\\Rightarrow 2x\\frac{dx}{dt}+2y\\frac{dy}{dt}=0', miss: 'Menurunkan lalu mensubstitusi angka SEBELUM menurunkan (urutan terbalik).', why: 'Mengisi tangki, menarik kabel, tangga sliding — laju yang saling terkait di lapangan.' },
    optim: { title: 'Optimasi Terikat', body: 'Dua langkah: (1) substitusi kendala ke fungsi tujuan sehingga tersisa satu variabel, (2) turunan = nol, cek maksimum. Pagar 3 sisi (tembok menutup sisi ke-4): x = P/4, y = P/2.', latex: '2x+y=P\\Rightarrow A=P x-2x^2\\Rightarrow x=P/4', miss: 'Membagi pagar menjadi 4 sisi sama padahal satu sisi tembok gratis.', why: 'Luas gudang maksimum, biaya minimum, layout terbaik — inti decision engineering.' },
    limtrig: { title: 'Limit Trigonometri', body: 'Limit dasar: sin(x)/x → 1 dan x/sin(x) → 1 saat x → 0. Samakan "isi" sinus dengan penyebut lalu kalikan faktor penyeimbang.', latex: '\\lim_{x\\to 0}\\frac{\\sin kx}{x}=k', miss: 'Menganggap sin(kx) = kx selamanya — hanya BERDEKATAN saat x kecil.', why: 'Dasar turunan trigonometri & aproksimasi getaran kecil.' },
    usub: { title: 'Integral Substitusi', body: 'Pilih u = "bagian dalam", hitung du, ganti dx. Hasil akhir dikembalikan ke x dan jangan lupa +C. Untuk ∫(ax+b)ⁿ dx hasil dibagi a.', latex: '\\int u^n\\frac{du}{dx}dx=\\frac{u^{n+1}}{n+1}+C', miss: 'Lupa membagi dengan turunan bagian dalam (a).', why: 'Teknik integrasi paling sering dipakai setelah power rule.' },
    favg: { title: 'Rata-rata Fungsi & Volume Putar', body: 'Rata-rata f di [a,b] = (1/(b−a))∫f dx. Volume benda putar cakram: V = π∫y² dx (y = radius).', latex: '\\bar{f}=\\frac{1}{b-a}\\int_a^b f\\,dx\\;,\\;V=\\pi\\int y^2dx', miss: 'Lupa π atau lupa membagi (b−a).', why: 'Rata-rata output proses & volume tangki/poros — hitungan teknik nyata.' },
    mtops: { title: 'Perkalian Matriks', body: 'C(i,j) = baris-i A dikali kolom-j B lalu dijumlahkan. Syarat: kolom A = baris B. Tidak komutatif (AB ≠ BA umumnya).', latex: 'C_{ij}=\\sum_k A_{ik}B_{kj}', miss: 'Mengalikan elemen ke elemen (itu bukan perkalian matriks).', why: 'Transformasi geometri, rantai proses, dan jaringan saraf semua perkalian matriks.' },
    det3: { title: 'Determinan 3×3', body: 'Ekspansi kofaktor baris pertama dengan pola tanda + − +: a(ei−fh) − b(di−fg) + c(dh−eg).', latex: 'det=a(ei-fh)-b(di-fg)+c(dh-eg)', miss: 'Salah tanda kofaktor atau menghitung minor dengan kolom yang salah.', why: 'Volume paralelepiped; deteksi ketergantungan & keberadaan invers.' },
    vektor: { title: 'Vektor: Dot, Cross & Sudut', body: 'u·v = u₁v₁+u₂v₂ (skalar; 0 = tegak lurus). u×v (2D) komponen-z = u₁v₂−u₂v₁. cosθ = u·v/(|u||v|).', latex: '\\cos\\theta=\\frac{\\vec u\\cdot\\vec v}{|\\vec u||\\vec v|}', miss: 'Menukar subskrip pada cross product (tanda berubah).', why: 'Gaya, resultan, dan proyeksi — bahasa fisika teknik.' },
    counting: { title: 'Permutasi & Kombinasi', body: 'Urutan penting → permutasi P(n,r) = n!/(n−r)!. Urutan tidak penting → kombinasi C(n,r) = n!/(r!(n−r)!).', latex: 'P=\\frac{n!}{(n-r)!}\\;,\\;C=\\frac{n!}{r!(n-r)!}', miss: 'Memakai kombinasi padahal posisi dibedakan (atau sebaliknya).', why: 'Penjadwalan, penugasan, dan peluang — gerbang riset operasi.' },
    cond: { title: 'Peluang Bersyarat', body: 'P(A|B) = P(A∩B)/P(B): dunia dipersempit ke B. Pada tabel dua arah: baris/kolom yang diketahui menjadi penyebut.', latex: 'P(A|B)=\\frac{P(A\\cap B)}{P(B)}', miss: 'Penyebut memakai total keseluruhan (itu bukan bersyarat).', why: 'QC: "dari item cacat, peluang dari mesin mana?" — dasar Bayes.' },
    binom: { title: 'Distribusi Binomial', body: 'n percobaan independen, peluang sukses p: P(X=k) = C(n,k)·p^k·(1−p)^(n−k). Dengan p=0,5 semua pola berpeluang sama.', latex: 'P(X=k)=C(n,k)p^k(1-p)^{n-k}', miss: 'Lupa faktor C(n,k) — urutan kemunculan bisa banyak cara.', why: 'Jumlah item cacat dalam sampel — nada QC harian.' },
    expvar: { title: 'Ekspektasi & Variansi Diskrit', body: 'E[X] = Σpᵢxᵢ (rata-rata tertimbang). σ² = Σpᵢ(xᵢ−μ)² = E[X²]−μ².', latex: 'E[X]=\\sum p_ix_i\\;,\\;\\sigma^2=E[X^2]-\\mu^2', miss: 'Menghitung variansi tanpa mengurangi μ dulu (E[X²] saja salah).', why: 'Nilai harapan & risiko — dasar analisis keputusan.' },
    normal: { title: 'Distribusi Normal & z', body: 'z = (x−μ)/σ menstandardisasi. Tabel Z memberi Φ(z) = luas kumulatif kiri. P(Z>z)=1−Φ; luas tengah = 2Φ−1.', latex: 'z=\\frac{x-\\mu}{\\sigma}', miss: 'Membaca tabel sebagai luas ekor kanan padahal kumulatif kiri.', why: 'Kontrol kualitas & Six Sigma hidup di kurva normal.' },
    cit: { title: 'CI dengan t (σ tak diketahui)', body: 'x̄ ± t·s/√n dengan df = n−1. t sedikit > z — harga sampel kecil dan estimasi σ.', latex: '\\bar{x}\\pm t_{n-1}\\frac{s}{\\sqrt n}', miss: 'Memakai z=1,96 padahal σ tidak diketahui & n kecil.', why: 'Realitas data: σ hampir selalu tidak diketahui.' },
    ujiz: { title: 'Uji Hipotesis z', body: 'z = (x̄−μ₀)/(σ/√n). Bandingkan dengan ±1,96 (α=5%). p < α → tolak H₀. Gagal tolak ≠ H₀ benar.', latex: 'z=\\frac{\\bar x-\\mu_0}{\\sigma/\\sqrt n}', miss: 'Menyimpulkan "H₀ terbukti benar" saat gagal tolak.', why: 'Klaim pemasok "rata-rata 250 gram" diuji persis lewat ini.' },
    reg: { title: 'Regresi Linier Sederhana', body: 'ŷ = b₀ + b₁x; b₁ = kemiringan (rata-rata perubahan y per x), b₀ = nilai saat x=0. Prediksi = substitusi.', latex: '\\hat y=b_0+b_1x', miss: 'Menukar b₀ dan b₁ saat menginterpretasi.', why: 'Trend permintaan → forecasting teknologi berikutnya.' },
    lpModel: { title: 'Pemodelan Program Linear', body: '3 langkah: definisikan variabel keputusan → tulis fungsi tujuan (Maks/Min) → tulis kendala sumber daya (≤ untuk ketersediaan) + non-negativitas.', latex: '\\max Z=c_1x_1+c_2x_2', miss: 'Arah kendala terbalik (≥ padahal ketersediaan) atau tujuan Min padahal maks laba.', why: 'SKILL inti Teknik Industri: alokasi sumber daya terbatas demi tujuan terbaik.' },
    lpGrafis: { title: 'LP Metode Grafis', body: 'Gambar kendala, arsir daerah layak (feasible region), evaluasi Z di SEMUA titik sudut — optimum pasti di salah satunya (teorema sudut).', latex: '\\text{optimum}\\in\\{\\text{titik sudut}\\}', miss: 'Mengevaluasi titik di dalam daerah layak padahal optimum di sudut.', why: 'Cara paling jujur memahami simpleks: sudut = kandidat solusi.' },
    transport: { title: 'Masalah Transportasi', body: 'Seimbangkan supply–demand, lalu alokasikan. North-West Corner: mulai pojok kiri atas, habiskan baris/kolom. Solusi awal, belum optimal.', latex: '\\min\\sum c_{ij}x_{ij}', miss: 'Menganggap hasil NW sudah optimal — masih perlu iterasi perbaikan.', why: 'Distribusi pabrik→gudang dengan biaya minimum — logistik klasik.' },
    pert: { title: 'PERT — Waktu Ekspektasi', body: 'Tiap aktivitas punya 3 estimasi (optimis a, realistis m, pesimis b): TE = (a+4m+b)/6. Durasi proyek = jalur kritis (terpanjang).', latex: 'TE=\\frac{a+4m+b}{6}', miss: 'Menjumlahkan SEMUA aktivitas padahal jalur paralel tidak dijumlahkan.', why: 'Manajemen proyek: jadwal realistis dari estimasi optimis–pesimis.' },
    cpm: { title: 'CPM & Slack', body: 'Jalur kritis = rantai terpanjang (slack 0). Aktivitas non-kritis punya slack = panjang kritis − panjang jalurnya: kelonggaran tanpa menunda proyek.', latex: '\\text{slack}=CP-\\text{jalur}', miss: 'Mengira semua aktivitas sama pentingnya untuk jadwal.', why: 'Crashing & prioritas: fokus energi di jalur kritis.' },
    dijkstra: { title: 'Dijkstra — Jalur Terpendek', body: 'Dari simpul asal, perbarui jarak tetangga; selalu proses simpul termurah yang belum diproses (greedy + relaxasi tepi).', latex: 'd(v)=\\min\\{d(u)+w(u,v)\\}', miss: 'Memilih tepi termurah lokal tanpa melihat total jarak terakumulasi.', why: 'Routing GPS, jaringan, dan penjadwalan — algoritma paling terpakai di dunia.' },
    mst: { title: 'Minimum Spanning Tree (Kruskal)', body: 'Urutkan semua sisi termurah→mahal, ambil yang tidak membentuk siklus, sampai semua simpul terhubung (n−1 sisi).', latex: '\\text{MST}: n-1\\;\\text{sisi termuruh tanpa siklus}', miss: 'Menambahkan sisi murah yang membentuk siklus.', why: 'Jaringan pipa/fiber/kabel minimum — infrastruktur berbiaya efisien.' },
    antCost: { title: 'Biaya Sistem Antrean', body: 'Total = biaya tunggu (Cw·L) + biaya layanan (Cs). Trade-off: tambah kapasitas mahal, tapi antrean juga mahal.', latex: 'TC=C_w L+C_s', miss: 'Hanya menghitung salah satu komponen biaya.', why: 'Keputusan "tambah kasir atau tidak" dirumuskan persis di sini.' },
    little: { title: "Little's Law", body: 'L = λ·W berlaku hampir semua sistem stabil: jumlah dalam sistem = laju kedatangan × waktu dalam sistem. Ketiganya saling menukar.', latex: 'L=\\lambda W', miss: 'Mencampur W (dalam sistem) dengan Wq (hanya menunggu).', why: 'Diagnosis cepat rumah sakit, call center, pipeline software.' },
    eoqProd: { title: 'EPQ — Lot Produksi Ekonomis', body: 'Saat produksi bertahap (bukan instan), holding efektif turun: Q* = √(2DS/(H(1−d/p))), d = laju permintaan, p = laju produksi.', latex: 'Q^*=\\sqrt{\\frac{2DS}{H(1-d/p)}}', miss: 'Memakai EOQ biasa padahal produksi bertahap (stok terisi sambil dipakai).', why: 'Pabrik memproduksi sendiri → EPQ, bukan EOQ.' },
    rop: { title: 'Reorder Point + Safety Stock', body: 'ROP = pemakaian selama lead time + pengaman: d·LT + z·σd·√LT. z dari tingkat layanan (service level) yang diinginkan.', latex: 'ROP=d\\,LT+z\\sigma_d\\sqrt{LT}', miss: 'Lupa √LT pada safety stock (variansi menumpuk per periode).', why: 'Stok habis = produksi berhenti; kelebihan = modal mati. ROP menyeimbangkan.' },
    fma: { title: 'Moving Average', body: 'F = rata-rata n data terakhir. Menghaluskan fluktuasi; n besar = halus tapi lambat merespons perubahan.', latex: 'F_t=\\frac{1}{n}\\sum_{i=1}^{n}D_{t-i}', miss: 'Memasukkan nilai forecast ke dalam rata-rata (harus data AKTUAL).', why: 'Peramalan baseline sebelum metode pintar.' },
    fes: { title: 'Exponential Smoothing', body: 'F(t+1) = α·D(t) + (1−α)·F(t). α besar → responsif; α kecil → halus. Iterasi berantai dari F₁.', latex: 'F_{t+1}=\\alpha D_t+(1-\\alpha)F_t', miss: 'Menukar posisi α (bobot aktual vs forecast terbalik).', why: 'Peramalan standar ERP; satu parameter, komputasi murah.' },
    fmape: { title: 'MAD & MAPE', body: 'MAD = rata-rata |error|. MAPE = rata-rata |error|/aktual × 100%. <10% sangat baik; >50% gawat.', latex: 'MAPE=\\frac{1}{n}\\sum\\left|\\frac{A-F}{A}\\right|', miss: 'Membagi error dengan forecast (harus aktual).', why: 'Menilai kualitas peramalan sebelum dipakai keputusan.' },
    mtbf: { title: 'MTBF & Availability', body: 'MTBF = waktu operasi ÷ jumlah kegagalan. Availability = MTBF/(MTBF+MTTR) — gabungan keandalan & kecepatan perbaikan.', latex: 'A=\\frac{MTBF}{MTBF+MTTR}', miss: 'Menghitung availability dengan MTBF saja tanpa MTTR.', why: 'Metrik perawatan (maintenance) paling dasar di industri.' },
    relsys: { title: 'Keandalan Sistem', body: 'Seri (semua harus hidup): Rs = ΠRi. Paralel (redundan): Rp = 1 − Π(1−Ri). Pecah sistem jadi blok, hitung dalam→luar.', latex: 'R_s=\\prod R_i\\;,\\;R_p=1-\\prod(1-R_i)', miss: 'Menjumlahkan keandalan paralel (bisa >1, mustahil).', why: 'Desain redundansi mesin & sistem kritis.' },
    spc: { title: 'Control Chart X̄', body: 'UCL/LCL = x̿ ± A₂R̄ (atau ±3σ/√n). Titik keluar batas = sinyal out of control → cari special cause. Variasi wajar tetap ada.', latex: 'UCL=\\bar{\\bar x}+A_2\\bar R', miss: 'Menuduh operator atas variasi wajar (common cause).', why: 'SPC = jantung pengendalian kualitas statistik.' },
    cpk: { title: 'Cp & Cpk', body: 'Cp = (USL−LSL)/6σ potensi terpusat. Cpk = jarak ke batas terdekat / 3σ — memperhitungkan pusat proses. ≥1,33 = mampu.', latex: 'C_{pk}=\\frac{\\min(USL-\\mu,\\;\\mu-LSL)}{3\\sigma}', miss: 'Puas dengan Cp tinggi padahal proses tidak terpusat (Cpk kecil).', why: 'Barometer kemampuan proses memenuhi spesifikasi.' },
    efp: { title: 'Nilai Waktu Uang (F/P, P/F)', body: 'F = P(1+i)ⁿ; P = F/(1+i)ⁿ. Uang berpindah waktu lewat faktor bunga.', latex: 'F=P(1+i)^n', miss: 'Membagi (1+i)ⁿ padahal seharusnya mengali (atau sebaliknya).', why: 'Fondasi seluruh ekonomi teknik & keuangan.' },
    eann: { title: 'Anuitas (F/A)', body: 'Menabung A per periode: F = A·((1+i)ⁿ−1)/i. Faktornya menjumlah setoran + bunga berbunga.', latex: 'F=A\\frac{(1+i)^n-1}{i}', miss: 'Mengali (1+i)ⁿ sekali lagi di akhir (double counting).', why: 'Dana tujuan, cicilan, dana pensiun — semua anuitas.' },
    npv: { title: 'NPV — Net Present Value', body: 'Diskontokan semua arus kas ke hari ini (faktor P/F disediakan), kurangi investasi. NPV > 0 = layak.', latex: 'NPV=-I+\\sum CF_t(P/F,i,t)', miss: 'Menjumlahkan arus kas nominal tanpa diskonto.', why: 'SATU angka untuk keputusan investasi.' },
    payback: { title: 'Payback Period', body: 'Kumulatifkan arus kas sampai investasi terlampaui; tahun pecahan = sisa ÷ CF tahun itu. Simple, tapi abaikan waktu-uang.', latex: '\\text{payback}=k+\\frac{\\text{sisa}}{CF_k}', miss: 'Membulatkan ke atas ke tahun penuh padahal pecahan dihitung.', why: 'Ukuran risiko likuiditas favorit manajer.' },
    dep: { title: 'Depresiasi Garis Lurus', body: 'D per tahun = (harga perolehan − nilai sisa) ÷ umur ekonomis.', latex: 'D=\\frac{C-S_v}{n}', miss: 'Membagi harga penuh tanpa mengurangi nilai sisa.', why: 'Akuntansi biaya mesin per periode — dasar biaya produksi.' },
    margin: { title: 'Margin vs Markup', body: 'Margin = laba ÷ harga JUAL. Markup = laba ÷ harga BELI. Angka sama, basis beda — markup 50% ≈ margin 33%.', latex: 'margin=\\frac{p-c}{p}\\;,\\;markup=\\frac{p-c}{c}', miss: 'Menukar basis pembagi saat pricing.', why: 'Bahasa bisnis lintas jurusan — salah hitung = margin lenyap.' },
    ppn: { title: 'PPN', body: 'PPN = tarif × nilai jual; total = nilai + PPN. Tarif mengikuti regulasi yang berlaku (dinyatakan di soal).', latex: 'PPN=t\\times\\text{nilai}', miss: 'Menghitung tarif dari harga sudah-termasuk-pajak.', why: 'Transaksi sehari-hari & laporan keuangan.' },
    majemuk: { title: 'Bunga Majemuk', body: 'F = P(1+i)ⁿ — bunga ikut berbunga. Selisih vs bunga sederhana meledak di horizon panjang.', latex: 'F=P(1+i)^n', miss: 'Menggunakan bunga sederhana P·i·n untuk periode panjang.', why: 'Tabungan, utang, investasi — default dunia nyata.' },
    weighted: { title: 'Rata-rata Tertimbang', body: 'Boboti tiap nilai dengan bobotnya (SKS, rupiah, unit): x̄w = Σwᵢxᵢ/Σwᵢ.', latex: '\\bar x_w=\\frac{\\sum w_ix_i}{\\sum w_i}', miss: 'Rata-rata biasa padahal bobot berbeda.', why: 'IPK, harga rata-rata pembelian, indeks komposit.' },
    corr: { title: 'Korelasi ≠ Kausalitas', body: 'Korelasi = bergerak bersama; kausalitas = menyebabkan. Variabel perancu (confounder) bisa menciptakan korelasi palsu. Minta mekanisme & eksperimen.', latex: 'r\\neq\\text{sebab}', miss: 'Langsung menyimpulkan sebab-akibat dari data observasional.', why: 'Literasi data — antibodi untuk berita & klaim bisnis.' }
  };
  Object.keys(CARDS2).forEach(function (k) { CARDS[k] = CARDS2[k]; });

  var CARDS3 = {
    gauss: { title: 'Eliminasi Gauss (Sistem Persamaan)', body: 'Samakan satu koefisien (kalikan baris dengan pengali m), kurangkan untuk menghilangkan satu variabel, selesaikan sisanya, substitusi balik, lalu CEK ke persamaan asli.', latex: '\\begin{cases}a_1x+b_1y=c_1\\\\a_2x+b_2y=c_2\\end{cases}', miss: 'Salah tanda saat mengurangkan baris, atau lupa cek jawaban akhir.', why: 'Gauss adalah mesin umum menyelesaikan sistem besar — nenek moyang simpleks & solver numerik.' },
    quadSteps: { title: 'Rumus Kuadrat', body: 'x = (−b ± √D)/2a dengan D = b² − 4ac. D > 0 dua akar real, D = 0 akar kembar, D < 0 imajiner. Selalu cek dengan Vieta: jumlah = −b/a, hasil kali = c/a.', latex: 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}', miss: 'Salah tanda pada −b, atau lupa membagi 2a.', why: 'Titik impas kuadrat, waktu jatuh, optimasi — semua berakhir di sini.' },
    mms: { title: 'Antrean M/M/2 (Multi-Server)', body: 'Dua server paralel: ρ = λ/(sμ), p0 dari rumus Erlang, Lq = p0·a²·ρ/(s!(1−ρ)²) dengan a = λ/μ, Wq = Lq/λ. Rumus selalu disediakan di soal — yang diuji pemakaiannya.', latex: 'L_q=p_0\\frac{a^s\\rho}{s!(1-\\rho)^2}', miss: 'Memakai rumus M/M/1 padahal dua server — p0 & faktorial s berubah.', why: 'Menambah kasir/server ke-2 punya efek superlinear — hitung dulu sebelum menambah orang.' },
    dual: { title: 'Dualitas LP', body: 'Primal Maks (≤) ↔ dual Min (≥): koefisien tujuan ↔ RHS, matriks kendala DITRANSPOS. Nilai optimal Z* = W*; variabel dual = shadow price (nilai marginal sumber daya).', latex: '\\max c^Tx\\;(Ax\\le b)\\leftrightarrow\\min b^Ty\\;(A^Ty\\ge c)', miss: 'Lupa mentranspos matriks kendala.', why: 'Shadow price menjawab: "layak bayar berapa untuk 1 jam mesin ekstra?"' },
    disc: { title: 'EOQ dengan Quantity Discount', body: 'Bandingkan TOTAL biaya tahunan (pesan + simpan + pembelian) pada Q* vs Q minimum diskon — harga & holding ikut turun saat diskon. Pilih yang lebih murah.', latex: 'TC=\\frac{D}{Q}S+\\frac Q2 H+Dp', miss: 'Membandingkan hanya harga beli tanpa biaya simpan yang membesar.', why: 'Pemasok selalu menawarkan diskon jumlah — keputusan tetap di tangan total biaya.' },
    pq: { title: 'Kebijakan Persediaan P vs Q', body: 'Q = continuous review: pantau terus, pesan Q* di titik ROP — item bernilai tinggi/kritis. P = periodic review: cek & pesan tiap interval tetap — item bernilai rendah/banyak jenis.', latex: '', miss: 'Kebalik: review mahal dipakai untuk item receh.', why: 'Administrasi juga biaya — sistem persediaan harus sebanding nilai itemnya.' },
    abc: { title: 'Analisis ABC (Pareto Persediaan)', body: 'A: ±20% item dengan ±80% nilai — kendali ketat, hitung teliti. B: sedang. C: banyak item nilai kecil — kendali longgar, stok besar tak apa.', latex: '', miss: 'Mengurutkan berdasarkan jumlah unit, bukan nilai rupiah tahunan.', why: 'Energi manajemen terbatas — ABC mengarahkannya ke yang paling berdampak.' },
    fwma: { title: 'Weighted Moving Average', body: 'Bobot lebih besar ke data terbaru (mis. 0,5–0,3–0,2; total bobot = 1). Responsif terhadap perubahan tanpa mengabaikan history.', latex: 'F=\\sum w_iD_i', miss: 'Memberi bobot terbesar ke data TERLAMA.', why: 'Peramalan jangka pendek untuk item bermusim ringan.' },
    ftrend: { title: 'Regresi Trend (Least Squares)', body: 'b1 = (nΣxy − ΣxΣy)/(nΣx² − (Σx)²); b0 = (Σy − b1Σx)/n. Prediksi = substitusi x masa depan.', latex: 'b_1=\\frac{n\\sum xy-\\sum x\\sum y}{n\\sum x^2-(\\sum x)^2}', miss: 'Menukar pembilang/penyebut, atau memakai Σx² bukan (Σx)² di penyebut.', why: 'Trend line = forecast objektif, bukan feeling.' },
    fseason: { title: 'Indeks Musiman', body: 'Indeks kuartal = rata-rata kuartal ÷ rata-rata tahunan (musiman multiplikatif). Ramalan = trend × indeks kuartal.', latex: 'I_k=\\frac{\\bar q_k}{\\bar q}', miss: 'Membagi dengan total (bukan rata-rata) tahunan.', why: 'Batik ramai Lebaran, kopi naik musim hujan — musiman itu nyata di bisnis.' },
    mcvar: { title: 'Monte Carlo (Variate Diskrit)', body: 'Bangun interval kumulatif dari peluang, petakan angka acak (RN) ke nilai. Ulangi → distribusi hasil simulasi. Semakin banyak run, semakin dekat ke teori.', latex: 'RN\\in[l_k,u_k)\\Rightarrow X=x_k', miss: 'Salah membaca batas interval kumulatif (kumulatif = dari kiri).', why: 'Menguji kebijakan (stok, kapasitas) terhadap ribuan "hari" sintetis tanpa risiko nyata.' }
  };
  Object.keys(CARDS3).forEach(function (k) { CARDS[k] = CARDS3[k]; });

  var CARDS4 = {
    simpleks: { title: 'Metode Simpleks — Iterasi', body: 'Tableau awal: basis slack. ENTERING = koefisien Z-row paling negatif (paling menaikkan Z). LEAVING = uji rasio RHS ÷ kolom entering, ambil terkecil. Pivot elemen perpotongannya; setelah pivot, Z naik. Ulangi sampai Z-row bebas negatif.', latex: '\\theta=\\min\\frac{b_i}{a_{i,e}}', miss: 'Ambil rasio terkecil tanpa syarat a>0, atau lupa Z naik = θ × koefisien entering.', why: 'Simpleks = grafis untuk dimensi berapapun — dipakai solver LP dunia nyata hingga kini.' },
    sensi: { title: 'Sensitivitas Koefisien Tujuan', body: 'Solusi optimal tetap selama kemiringan fungsi tujuan berada DI ANTARA kemiringan dua kendala yang IKAT (binding) di titik optimum: c₁/c₂ ∈ [a₁/b₁, a₂/b₂]. Di luar itu, titik sudut lain yang menang.', latex: '\\frac{a_1}{b_1}\\le\\frac{c_1}{c_2}\\le\\frac{a_2}{b_2}', miss: 'Menghitung rentang dari kendala yang TIDAK ikat.', why: '"Seberapa aman margin laba unit ini?" — jawaban analisis sensitivitas.' },
    goal: { title: 'Goal Programming', body: 'Banyak tujuan saling tarik: target bukan batu mati. Definisikan deviasi d⁺ (melampaui target) dan d⁻ (di bawah target), beri bobot penalti masing-masing, minimalkan total deviasi tertimbang.', latex: '\\min z=p^+d^++p^-d^-', miss: 'Menganggap kelebihan dan kekurangan sama murahnya.', why: 'LP klasik punya satu tujuan; dunia nyata punya banyak — GP jembatannya.' },
    bab: { title: 'Branch & Bound (Integer Programming)', body: 'Selesaikan relaksasi LP (abaikan syarat bulat) → batas atas optimistis. Bila pecahan, CABANGKAN: x ≤ ⌊x*⌋ dan x ≥ ⌊x*⌋+1. Pangkas cabang yang bound-nya lebih buruk dari solusi bulat terbaik yang sudah ada.', latex: 'Z_{IP}\\le Z_{LP\\;relaksasi}', miss: 'Membulatkan solusi LP ke bawah dan mengira itu optimal.', why: 'Orang, mesin, kemasan — semuanya bulat. IP adalah realita operasional.' }
  };
  Object.keys(CARDS4).forEach(function (k) { CARDS[k] = CARDS4[k]; });

  var CARDS5 = {
    gauss3: { title: 'Gauss 3×3 Penuh', body: 'Eliminasi baris demi baris sampai bentuk segitiga atas (nol di bawah diagonal), lalu substitusi balik dari variabel terakhir. Semua pengali bulat bila sistem dikonstruksi ramah — dan selalu CEK ke persamaan asli.', latex: 'U\\!E\\cdot x=b\\Rightarrow x\\;\\text{(substitusi balik)}', miss: 'Salah baris saat eliminasi kedua, atau lupa cek jawaban akhir.', why: 'Solver sistem persamaan besar (SPSS: standard package) semuanya Gauss modern.' },
    cramer: { title: 'Aturan Cramer', body: 'x = Dx/D, y = Dy/D — Dx/Dy = determinan matriks koefisien dengan kolom x/y diganti kolom RHS. D = 0 → tidak ada solusi tunggal.', latex: 'x=\\frac{D_x}{D}\\;,\\;y=\\frac{D_y}{D}', miss: 'Menukar kolom yang salah saat mengganti RHS.', why: 'Cara paling mekanik menyelesaikan sistem kecil — dan menghubungkan langsung ke determinan.' },
    ipart: { title: 'Integral Parsial', body: '∫u dv = uv − ∫v du. Pilih u = polinomial (makin sederhana saat diturunkan), dv = eksponensial/trig. Untuk ∫(ax+b)e^{kx}: hasilnya e^{kx}[(ax+b)/k − a/k²] + C.', latex: '\\int u\\,dv=uv-\\int v\\,du', miss: 'Salah memilih u/dv sehingga integral sisa makin rumit.', why: 'Teknik wajib untuk energi, arus, dan fungsi produk di teknik.' },
    ifrac: { title: 'Fraksi Parsial', body: 'Pecahan rasional diuraikan: (nx+c)/((x+p)(x+q)) = A/(x+p) + B/(x+q). Jalan pintas: substitusi x = −p memusnahkan B, x = −q memusnahkan A.', latex: '\\frac{N(x)}{(x+p)(x+q)}=\\frac{A}{x+p}+\\frac{B}{x+q}', miss: 'Salih substitusi (pakai akar penyebut yang salah).', why: 'Pintu masuk integral rasional & transformasi Laplace.' },
    mms3: { title: 'M/M/s Umum (s Server)', body: 'ρ = λ/(sμ); p0 = [Σ_{n<s} aⁿ/n! + a^s/(s!(1−ρ))]⁻¹ dengan a = λ/μ; Lq = p0·a^s·ρ/(s!(1−ρ)²); Wq = Lq/λ. Rumus selalu disediakan — yang diuji pemakaiannya.', latex: 'L_q=p_0\\frac{a^s\\rho}{s!(1-\\rho)^2}', miss: 'Memakai rumus s=2 padahal s berbeda (s! dan pangkat a berubah).', why: 'Kasir 3-4 orang, loket layanan, lini paralel — realita operasional.' },
    simpleks2: { title: 'Simpleks: Dua Iterasi', body: 'Ulangi siklus entering → rasio → pivot sampai baris Z bebas negatif. Tiap pivot = pindah satu titik sudut ke tetangga yang lebih baik; Z selalu naik (tidak pernah turun).', latex: '\\text{pivot}\\Rightarrow Z\\uparrow\\;\\text{(monotone)}', miss: 'Berhenti sebelum Z-row bebas negatif, atau salah kolom entering di iterasi kedua.', why: 'Masalah nyata butuh banyak iterasi — disiplin siklusnya adalah keterampilan.' }
  };
  Object.keys(CARDS5).forEach(function (k) { CARDS[k] = CARDS5[k]; });

  /* ---------- NODE ---------- */
  function node(id, name, tier, family, targetMs, prereq, card, domain, track) {
    reg({ id: id, name: name, tier: tier, family: family, targetMs: targetMs, prereq: prereq || [], card: CARDS[card], domain: domain, track: track || 'ti' });
  }
  /* TIER 0 */
  node('ari.tambah', 'Tambah Cepat', 0, 'addsub', 12000, [], 'addsub', 'aritmetika');
  node('ari.kurang', 'Kurang Cepat', 0, 'addsub', 12000, ['ari.tambah'], 'addsub', 'aritmetika');
  node('ari.kali', 'Kali', 0, 'muldiv', 15000, ['ari.tambah'], 'muldiv', 'aritmetika');
  node('ari.bagi', 'Bagi', 0, 'muldiv', 15000, ['ari.kali'], 'muldiv', 'aritmetika');
  node('ari.campur', 'Operasi Campur', 0, 'mixops', 20000, ['ari.kali'], 'mixops', 'aritmetika');
  node('ari.negatif', 'Bilangan Negatif', 0, 'signed', 15000, ['ari.kurang'], 'signed', 'aritmetika');
  node('ari.pecahan', 'Pecahan', 0, 'fraction', 25000, ['ari.bagi'], 'fraction', 'aritmetika');
  node('ari.desimal', 'Desimal', 0, 'decimal', 20000, ['ari.pecahan'], 'decimal', 'aritmetika');
  node('ari.bulat', 'Pembulatan & Estimasi', 0, 'round', 15000, ['ari.desimal'], 'round', 'aritmetika');
  node('ari.persen', 'Persen Dasar', 0, 'percent', 20000, ['ari.bulat'], 'percent', 'aritmetika');
  node('ari.rasio', 'Rasio & Proporsi', 0, 'ratio', 25000, ['ari.bagi'], 'ratio', 'aritmetika');
  node('ari.satuan', 'Konversi Satuan', 0, 'units', 20000, ['ari.kali'], 'units', 'aritmetika');
  node('alj.substitusi', 'Substitusi', 0, 'subst', 25000, ['ari.campur'], 'subst', 'aljabar');
  node('alj.sukusejenis', 'Suku Sejenis', 0, 'liketerms', 25000, ['alj.substitusi'], 'liketerms', 'aljabar');
  node('alj.linear1', 'Persamaan 1 Langkah', 0, 'lin12', 30000, ['alj.sukusejenis'], 'lin12', 'aljabar');
  node('alj.linear2', 'Persamaan 2 Langkah', 0, 'lin12', 40000, ['alj.linear1'], 'lin12', 'aljabar');
  node('alj.distributif', 'Distributif', 0, 'distrib', 25000, ['alj.linear1'], 'distrib', 'aljabar');
  node('alj.pertidaksamaan', 'Pertidaksamaan Dasar', 0, 'ineq0', 35000, ['alj.linear2'], 'ineq0', 'aljabar');
  node('alj.sistem', 'Sistem Jumlah–Selisih', 0, 'syssub', 45000, ['alj.linear2'], 'syssub', 'aljabar');
  node('log.negasi', 'Negasi', 0, 'negate', 30000, [], 'negate', 'logika');
  node('log.danau', 'DAN / ATAU', 0, 'andor', 30000, ['log.negasi'], 'andor', 'logika');
  node('log.implikasi', 'Implikasi', 0, 'imply', 35000, ['log.danau'], 'imply', 'logika');
  node('log.tabel', 'Tabel Kebenaran', 0, 'ttable', 45000, ['log.danau'], 'ttable', 'logika');
  node('log.silogisme', 'Silogisme', 0, 'syllog', 40000, ['log.implikasi'], 'syllog', 'logika');
  node('log.deduksi', 'Deduksi Bertingkat', 0, 'deduce', 50000, ['log.silogisme'], 'deduce', 'logika');
  node('log.pola', 'Pola Barisan', 0, 'seqpat', 40000, ['ari.campur'], 'seqpat', 'logika');
  node('dat.tabel', 'Baca Tabel', 0, 'tableRead', 30000, [], 'tableRead', 'data');
  node('dat.barchart', 'Baca Grafik Batang', 0, 'barRead', 35000, ['dat.tabel'], 'barRead', 'data');
  node('dat.mean', 'Rata-rata', 0, 'meanSimple', 30000, ['dat.tabel'], 'meanSimple', 'data');
  node('dat.medianmodus', 'Median & Modus', 0, 'medmode', 35000, ['dat.mean'], 'medmode', 'data');
  node('dat.banding', 'Banding Dua Grafik', 0, 'compare', 40000, ['dat.barchart'], 'compare', 'data');

  /* TIER 1 */
  node('ari2.persen-naik', 'Persen Naik/Turun', 1, 'percent2', 30000, ['ari.persen'], 'percent2', 'aritmetika');
  node('ari2.diskon', 'Diskon Bertingkat', 1, 'percent2', 40000, ['ari2.persen-naik'], 'percent2', 'aritmetika');
  node('ari2.bunga', 'Bunga Sederhana', 1, 'interest', 45000, ['ari2.persen-naik'], 'interest', 'aritmetika');
  node('ari2.rasio3', 'Rasio Tiga Bagian', 1, 'ratio3', 45000, ['ari.rasio'], 'ratio3', 'aritmetika');
  node('ari2.skala', 'Skala', 1, 'scale', 40000, ['ari.satuan'], 'scale', 'aritmetika');
  node('ari2.pecahancampur', 'Operasi Pecahan Campur', 1, 'fracmix', 40000, ['ari.pecahan'], 'fracmix', 'aritmetika');
  node('ari2.pangkat-akar', 'Pangkat & Akar', 1, 'exproot', 35000, ['ari.kali'], 'exproot', 'aritmetika');
  node('alj2.cerita-linear', 'Soal Cerita Linear', 1, 'wordLin', 70000, ['alj.linear2'], 'wordLin', 'aljabar');
  node('alj2.sistem', 'Sistem 2 Variabel', 1, 'sysEq', 80000, ['alj.sistem'], 'sysEq', 'aljabar');
  node('alj2.kuadrat-faktor', 'Kuadrat & Vieta', 1, 'quadFactor', 60000, ['alj2.sistem'], 'quadFactor', 'aljabar');
  node('alj2.eksponen', 'Aturan Eksponen', 1, 'expoRules', 40000, ['ari2.pangkat-akar'], 'expoRules', 'aljabar');
  node('alj2.mutlak', 'Nilai Mutlak', 1, 'absval', 50000, ['alj.linear2'], 'absval', 'aljabar');
  node('log2.kontraposisi', 'Kontraposisi', 1, 'contrapose', 45000, ['log.tabel'], 'contrapose', 'logika');
  node('log2.demorgan', 'De Morgan', 1, 'demorgan', 45000, ['log2.kontraposisi'], 'demorgan', 'logika');
  node('log2.kuantor', 'Negasi Kuantor', 1, 'quantor', 40000, ['log2.demorgan'], 'quantor', 'logika');
  node('log2.zebra', 'Puzzle Deduksi', 1, 'zebra', 90000, ['log.deduksi', 'log2.kuantor'], 'zebra', 'logika');
  node('fng.gradien', 'Gradien Dua Titik', 1, 'slopeIntercept', 45000, ['alj.linear2'], 'slopeIntercept', 'fungsi');
  node('fng.bacagrafik', 'Baca Grafik Garis', 1, 'readGraph', 40000, ['fng.gradien'], 'readGraph', 'fungsi');
  node('fng.komposisi', 'Komposisi Fungsi', 1, 'compose', 45000, ['alj.substitusi', 'fng.gradien'], 'compose', 'fungsi');
  node('fng.invers', 'Invers Fungsi', 1, 'inverse', 40000, ['fng.komposisi'], 'inverse', 'fungsi');
  node('fng.kuadratgrafik', 'Parabola', 1, 'quadGraph', 60000, ['alj2.kuadrat-faktor', 'fng.bacagrafik'], 'quadGraph', 'fungsi');
  node('dat2.frekuensi', 'Mean Berfrekuensi', 1, 'freqStats', 60000, ['dat.mean'], 'freqStats', 'data');
  node('dat2.sebaran', 'IQR & Variansi', 1, 'spread', 70000, ['dat2.frekuensi'], 'spread', 'data');
  node('dat2.boxplot', 'Boxplot', 1, 'boxRead', 60000, ['dat.medianmodus'], 'boxRead', 'data');

  /* TIER 2 */
  node('mm.campur2', 'Rush: Campur', 2, 'rush', 9000, ['ari.campur'], 'rush', 'mental');
  node('mm.persen-cepat', 'Rush: Persen', 2, 'rush', 9000, ['ari.persen'], 'rush', 'mental');
  node('mm.trick', 'Rush: Trik Kali', 2, 'rush', 9000, ['ari.kali'], 'rush', 'mental');
  node('mm.jam', 'Rush: Aritmetika Jam', 2, 'rush', 9000, ['mm.campur2'], 'rush', 'mental');
  node('kald.limit', 'Limit', 2, 'limitPoly', 30000, ['fng.bacagrafik'], 'limitPoly', 'kalkulus');
  node('kald.power', 'Turunan: Aturan Pangkat', 2, 'power', 20000, ['kald.limit'], 'power', 'kalkulus');
  node('kald.produk', 'Turunan: Hasil Kali', 2, 'prodRule', 30000, ['kald.power'], 'prodRule', 'kalkulus');
  node('kald.chain', 'Turunan: Aturan Rantai', 2, 'chain', 30000, ['kald.produk'], 'chain', 'kalkulus');
  node('kald.tangent', 'Garis Singgung', 2, 'tangent', 25000, ['kald.power'], 'tangent', 'kalkulus');
  node('kald.integral-tak-tentu', 'Integral Tak Tentu', 2, 'indefInt', 30000, ['kald.power'], 'indefInt', 'kalkulus');
  node('kald.integral-tentu', 'Integral Tentu', 2, 'defInt', 40000, ['kald.integral-tak-tentu'], 'defInt', 'kalkulus');
  node('trig.istimewa', 'Sudut Istimewa', 2, 'trigVal', 9000, ['ari.pecahan'], 'trigVal', 'trigonometri');
  node('trig.rasio', 'SOH-CAH-TOA', 2, 'trigRatio', 20000, ['trig.istimewa'], 'trigRatio', 'trigonometri');
  node('geo.luasvolume', 'Luas & Volume', 2, 'geoAV', 30000, ['ari.kali'], 'geoAV', 'geometri');
  node('geo.pythagoras', 'Pythagoras Terapan', 2, 'pythApp', 25000, ['geo.luasvolume'], 'pythApp', 'geometri');

  /* TIER 3 */
  node('pro.bayes', 'Teorema Bayes', 3, 'bayes', 120000, ['dat2.sebaran'], 'bayes', 'probabilitas');
  node('inf.ci-z', 'Interval Kepercayaan', 3, 'ciZ', 150000, ['dat2.sebaran'], 'ciZ', 'statistika');
  node('lin.determinan', 'Determinan 2×2', 3, 'det', 30000, ['alj2.sistem'], 'det', 'aljabar-linear');
  node('lin.invers2', 'Invers Matriks 2×2', 3, 'inv2', 60000, ['lin.determinan'], 'inv2', 'aljabar-linear');

  /* TIER 4 */
  node('ant.mm1', 'Antrean M/M/1', 4, 'mm1', 240000, ['pro.bayes'], 'mm1', 'riset-operasi');
  node('inv.eoq', 'EOQ Persediaan', 4, 'eoq', 300000, ['alj2.kuadrat-faktor'], 'eoq', 'riset-operasi');

  /* UNIVERSAL PACK */
  node('uni.break-even', 'Titik Impas (Break-even)', 1, 'breakeven', 90000, ['alj.linear2'], 'breakeven', 'bisnis', 'uni');

  /* TIER 3 — tambahan (lengkap) */
  node('kald2.related', 'Laju Berhubung (Related Rates)', 3, 'related', 150000, ['kald.tangent'], 'related', 'kalkulus');
  node('kald2.optim', 'Optimasi Terikat', 3, 'optim', 150000, ['kald.tangent'], 'optim', 'kalkulus');
  node('kald2.limtrig', 'Limit Trigonometri', 3, 'limtrig', 60000, ['kald.limit'], 'limtrig', 'kalkulus');
  node('kali.usub', 'Integral Substitusi', 3, 'usub', 120000, ['kald.integral-tak-tentu'], 'usub', 'kalkulus');
  node('kali.favg', 'Rata-rata Fungsi & Volume Putar', 3, 'favg', 120000, ['kald.integral-tentu'], 'favg', 'kalkulus');
  node('lin.mtops', 'Perkalian Matriks', 3, 'mtops', 60000, ['lin.determinan'], 'mtops', 'aljabar-linear');
  node('lin.det3', 'Determinan 3×3', 3, 'det3', 120000, ['lin.determinan'], 'det3', 'aljabar-linear');
  node('lin.vektor', 'Vektor: Dot, Cross & Sudut', 3, 'vektor', 60000, ['lin.invers2'], 'vektor', 'aljabar-linear');
  node('pro.counting', 'Permutasi & Kombinasi', 3, 'counting', 60000, ['pro.bayes'], 'counting', 'probabilitas');
  node('pro.bersyarat', 'Peluang Bersyarat', 3, 'cond', 90000, ['pro.bayes'], 'cond', 'probabilitas');
  node('pro.binomial', 'Distribusi Binomial', 3, 'binom', 120000, ['pro.counting'], 'binom', 'probabilitas');
  node('pro.ekspektasi', 'Ekspektasi & Variansi', 3, 'expvar', 90000, ['dat2.sebaran'], 'expvar', 'probabilitas');
  node('pro.normal', 'Distribusi Normal (z)', 3, 'normal', 90000, ['inf.ci-z'], 'normal', 'probabilitas');
  node('inf.ci-t', 'Interval Kepercayaan (t)', 3, 'cit', 150000, ['inf.ci-z'], 'cit', 'statistika');
  node('inf.ujiz', 'Uji Hipotesis z & p-value', 3, 'ujiz', 150000, ['inf.ci-z'], 'ujiz', 'statistika');
  node('inf.regresi', 'Regresi Linier', 3, 'reg', 120000, ['dat2.frekuensi'], 'reg', 'statistika');

  /* TIER 4 — tambahan (lengkap) */
  node('rso.lp-model', 'LP: Pemodelan', 4, 'lpModel', 300000, ['alj2.sistem'], 'lpModel', 'riset-operasi');
  node('rso.lp-grafis', 'LP: Metode Grafis', 4, 'lpGrafis', 420000, ['rso.lp-model'], 'lpGrafis', 'riset-operasi');
  node('rso.transportasi', 'Transportasi (NW Corner)', 4, 'transport', 300000, ['rso.lp-model'], 'transport', 'riset-operasi');
  node('rso.pert', 'PERT', 4, 'pert', 300000, ['alj2.cerita-linear'], 'pert', 'riset-operasi');
  node('rso.cpm', 'CPM & Slack', 4, 'cpm', 300000, ['rso.pert'], 'cpm', 'riset-operasi');
  node('rso.dijkstra', 'Dijkstra: Jalur Terpendek', 4, 'dijkstra', 300000, ['log2.zebra'], 'dijkstra', 'riset-operasi');
  node('rso.mst', 'MST (Kruskal)', 4, 'mst', 300000, ['rso.dijkstra'], 'mst', 'riset-operasi');
  node('ant.biaya', 'Biaya Sistem Antrean', 4, 'antCost', 240000, ['ant.mm1'], 'antCost', 'riset-operasi');
  node('ant.little', "Little's Law", 4, 'little', 120000, ['ant.mm1'], 'little', 'riset-operasi');
  node('inv.eoq-prod', 'EPQ: Lot Produksi', 4, 'eoqProd', 300000, ['inv.eoq'], 'eoqProd', 'riset-operasi');
  node('inv.rop', 'ROP & Safety Stock', 4, 'rop', 240000, ['inv.eoq'], 'rop', 'riset-operasi');
  node('frc.ma', 'Moving Average', 4, 'fma', 120000, ['dat.mean'], 'fma', 'riset-operasi');
  node('frc.es', 'Exponential Smoothing', 4, 'fes', 180000, ['frc.ma'], 'fes', 'riset-operasi');
  node('frc.mape', 'MAD & MAPE', 4, 'fmape', 150000, ['frc.ma'], 'fmape', 'riset-operasi');
  node('rel.mtbf', 'MTBF & Availability', 4, 'mtbf', 90000, ['pro.ekspektasi'], 'mtbf', 'keandalan-kualitas');
  node('rel.sistem', 'Keandalan Seri-Paralel', 4, 'relsys', 150000, ['rel.mtbf'], 'relsys', 'keandalan-kualitas');
  node('rel.spc', 'Control Chart X̄', 4, 'spc', 180000, ['dat2.sebaran'], 'spc', 'keandalan-kualitas');
  node('rel.cpk', 'Cp & Cpk', 4, 'cpk', 180000, ['rel.spc'], 'cpk', 'keandalan-kualitas');
  node('eko.fp', 'Nilai Waktu Uang (F/P)', 4, 'efp', 120000, ['ari2.bunga'], 'efp', 'ekonomi-teknik');
  node('eko.anuitas', 'Anuitas', 4, 'eann', 150000, ['eko.fp'], 'eann', 'ekonomi-teknik');
  node('eko.npv', 'NPV', 4, 'npv', 240000, ['eko.fp'], 'npv', 'ekonomi-teknik');
  node('eko.payback', 'Payback Period', 4, 'payback', 180000, ['eko.npv'], 'payback', 'ekonomi-teknik');
  node('eko.depresiasi', 'Depresiasi Garis Lurus', 4, 'dep', 90000, ['eko.fp'], 'dep', 'ekonomi-teknik');

  /* v1.2 — steps & konten lanjutan */
  node('lin.gauss', 'Eliminasi Gauss (Langkah)', 3, 'gauss', 240000, ['lin.mtops'], 'gauss', 'aljabar-linear');
  node('alj2.kuadrat-steps', 'Rumus Kuadrat (Langkah)', 3, 'quadSteps', 180000, ['alj2.kuadrat-faktor'], 'quadSteps', 'aljabar');
  node('ant.mms', 'Antrean M/M/2', 4, 'mms', 420000, ['ant.biaya'], 'mms', 'riset-operasi');
  node('rso.dual', 'Dualitas LP', 4, 'dual', 300000, ['rso.lp-grafis'], 'dual', 'riset-operasi');
  node('inv.discount', 'EOQ Quantity Discount', 4, 'disc', 300000, ['inv.eoq'], 'disc', 'riset-operasi');
  node('inv.pq', 'Kebijakan P vs Q', 4, 'pq', 90000, ['inv.rop'], 'pq', 'riset-operasi');
  node('inv.abc', 'Analisis ABC', 4, 'abc', 90000, ['inv.pq'], 'abc', 'riset-operasi');
  node('frc.wma', 'Weighted Moving Average', 4, 'fwma', 120000, ['frc.ma'], 'fwma', 'riset-operasi');
  node('frc.trend', 'Regresi Trend (LSQ)', 4, 'ftrend', 300000, ['frc.wma'], 'ftrend', 'riset-operasi');
  node('frc.seasonal', 'Indeks Musiman', 4, 'fseason', 240000, ['frc.trend'], 'fseason', 'riset-operasi');
  node('sim.mc', 'Monte Carlo Diskrit', 4, 'mcvar', 240000, ['pro.ekspektasi'], 'mcvar', 'riset-operasi');

  node('rso.simpleks', 'Simpleks: Iterasi Pivot', 4, 'simpleks', 480000, ['rso.lp-grafis'], 'simpleks', 'riset-operasi');
  node('rso.sensitivitas', 'Sensitivitas c₁ (LP)', 4, 'sensitif', 360000, ['rso.lp-grafis'], 'sensi', 'riset-operasi');
  node('rso.goal', 'Goal Programming', 4, 'goal', 240000, ['rso.lp-grafis'], 'goal', 'riset-operasi');
  node('rso.bab', 'Branch & Bound (IP)', 4, 'bab', 420000, ['rso.lp-grafis'], 'bab', 'riset-operasi');

  node('lin.gauss3', 'Gauss 3×3 Penuh (Langkah)', 3, 'gauss3', 480000, ['lin.gauss'], 'gauss3', 'aljabar-linear');
  node('lin.cramer', 'Aturan Cramer (Langkah)', 3, 'cramer', 300000, ['lin.det3'], 'cramer', 'aljabar-linear');
  node('kali.parsial', 'Integral Parsial (Langkah)', 3, 'ipart', 300000, ['kali.usub'], 'ipart', 'kalkulus');
  node('kali.fraksi', 'Fraksi Parsial (Langkah)', 3, 'ifrac', 300000, ['alj2.kuadrat-faktor'], 'ifrac', 'aljabar');
  node('ant.mms3', 'Antrean M/M/s Umum', 4, 'mms3', 420000, ['ant.mms'], 'mms3', 'riset-operasi');
  node('rso.simpleks2', 'Simpleks: Dua Iterasi', 4, 'simpleks2', 540000, ['rso.simpleks'], 'simpleks2', 'riset-operasi');

  /* UNIVERSAL — tambahan */
  node('uni.margin', 'Margin & Markup', 1, 'margin', 45000, ['uni.break-even'], 'margin', 'bisnis', 'uni');
  node('uni.ppn', 'PPN', 1, 'ppn', 30000, ['ari.persen'], 'ppn', 'bisnis', 'uni');
  node('uni.majemuk', 'Bunga Majemuk', 1, 'majemuk', 60000, ['ari2.bunga'], 'majemuk', 'bisnis', 'uni');
  node('uni.ipk', 'Rata-rata Tertimbang (IPK)', 1, 'weighted', 60000, ['dat.mean'], 'weighted', 'bisnis', 'uni');
  node('uni.korelasi', 'Korelasi ≠ Kausalitas', 1, 'corr', 45000, ['dat2.frekuensi'], 'corr', 'bisnis', 'uni');

  /* ---------- TIER META ---------- */
  VF.TIERS = [
    { n: 0, name: 'Pemanasan', desc: 'MC + hint, tanpa timer — bangun fondasi & kebiasaan', volume: 400, examSize: 25, passPct: 85 },
    { n: 1, name: 'Dasar', desc: 'Tanpa hint, isian numerik — retrieval murni', volume: 400, examSize: 25, passPct: 85 },
    { n: 2, name: 'Tanpa Alat', desc: 'Timer ketat + mental math — otomatisasi', volume: 400, examSize: 25, passPct: 85 },
    { n: 3, name: 'Langkah', desc: 'Multi-langkah & notasi penuh — prosedur lengkap', volume: 250, examSize: 20, passPct: 85 },
    { n: 4, name: 'Kasus', desc: 'Soal cerita industri dengan data & visual', volume: 200, examSize: 15, passPct: 85 }
  ];

  /* ---------- HUMOR KOA (dry, deadpan; kategori = trigger) ---------- */
  VF.HUMOR = {
    'benar-cepat': ['Kecepatan yang bertanggung jawab. KOA terkesan. Sedikit.', 'Presisi pabrik grade A. Lanjut.', 'KOA mencatat waktu itu. Dengan hormat.'],
    'benar': ['Benar. Mesin terus berjalan.', 'Tercatat. Dengan baik.', 'Sistem stabil. KOA mengangguk dalam batin.'],
    'benar-lambat': ['Benar. Lambat. Tapi benar. Pabrik menoleransi ini.', 'Kalkulasi mencapai target. Dengan jalan memutar.'],
    'salah': ['λ kedatangan naik. KOA tetap tenang. KOA selalu tenang.', 'Error tercatat. Bukan gagal. Data.', 'Satu cacat terdeteksi. QC tidak panik. Kamu juga jangan.'],
    'salah2': ['Dua kali. Bukan pola. Semoga.', 'KOA menahan komentar. KOA gagal menahannya: cek soalnya sekali lagi.'],
    'streak3': ['Tiga beruntun. Gear mulai hangat.'],
    'streak7': ['Tujuh hari. Mesin ini butuh perawatan. Otakmu tampaknya tidak.'],
    'streak30': ['Sebulan. KOA mempertimbangkan memberi kamu nama panggilan. Nanti.'],
    'boss-lulus': ['Boss tumbang. KOA memperbarui catatan produksi.', 'Misi selesai. KOA merayakan dengan diam yang bermakna.'],
    'boss-gagal': ['Ujian gagal. Cooldown 48 jam. KOA pakai waktu itu untuk... tidak apa-apa.', 'Skor di bawah ambang. KOA tidak bercanda soal 85%. Coba lagi setelah cooldown.'],
    'promosi-lulus': ['Tier naik. Selamat, Forge-er. KOA menyalakan lampu pabrik.'],
    'promosi-gagal': ['Gerbang masih terkunci. Syaratnya jelas. KOA percaya kamu bisa membaca checklist.'],
    'kembali': ['KOA tidak menghitung hari. KOA hanya... mencatatnya.', 'Sistem standby. Selamat datang kembali di lantai produksi.'],
    'sesi-selesai': ['Sesi selesai. Otak sudah diangkat beban hari ini.', 'Sesi tuntas. KOA menutup shift dengan rapi.'],
    'serius-on': ['Serius Mode aktif. KOA diam.'],
    'serius-off': ['Serius Mode nonaktif. KOA kembali. Secara terbatas.'],
    'malam': ['Shift malam. KOA tetap bekerja. KOA tidak tidur.'],
    'pagi': ['Pagi. Pabrik dingin dan siap.']
  };

  /* Glosarium konsisten */
  VF.GLOSSARY = [
    ['daerah layak', 'feasible region'], ['kendala', 'constraint'], ['fungsi tujuan', 'objective function'],
    ['persediaan', 'inventory'], ['biaya pemesanan', 'ordering cost'], ['biaya simpan', 'holding cost'],
    ['antrean', 'queue'], ['laju kedatangan', 'arrival rate λ'], ['laju layanan', 'service rate μ'],
    ['titik kritis', 'critical point'], ['turunan', 'derivative'], ['integral tentu', 'definite integral'],
    ['interval kepercayaan', 'confidence interval'], ['peramalan', 'forecasting'], ['titik impas', 'break-even point']
  ];
})();
