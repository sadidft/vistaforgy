# 📋 VISTA FORGY — BACKLOG RESMI

> Dokumen jujur apa yang sudah/belum dibangun. Diperbarui per versi.
> **v1.6 — 19 Agustus 2026 (repo: github.com/sadidft/vistaforgy)**

## ✅ SELESAI (v1.1)

| Area | Detail |
|---|---|
| **Skill tree** | **142 node** — Tier 0 (31), Tier 1 (24), Tier 2 (15), Tier 3 (22), Tier 4 (33), Universal (6+5). v1.3: simpleks pivot (steps + tableau), sensitivitas c₁, goal programming, branch & bound (IP) |
| **Tier 3 lengkap** | Related rates, optimasi terikat, limit trig, integral substitusi, rata-rata fungsi & volume putar, perkalian matriks, determinan 3×3, vektor (dot/cross/cos), permutasi-kombinasi, peluang bersyarat (tabel), binomial, ekspektasi-variansi, normal & tabel-z, CI-t (tabel), uji-z & p-value, regresi |
| **Tier 4 lengkap** | LP pemodelan, **LP grafis interaktif (daerah layak + slider garis tujuan)**, transportasi NW-corner, PERT (+network SVG), CPM & slack, **Dijkstra & MST (+graph SVG)**, biaya sistem antrean, Little's Law, EPQ, ROP+safety stock, moving average, exponential smoothing, MAPE, MTBF & availability, keandalan seri-paralel, **control chart X̄ (+SPC chart SVG)**, Cp/Cpk, F/P-P/F, anuitas, NPV (+tabel faktor), payback, depresiasi |
| **Universal pack** | Break-even, margin & markup, PPN, bunga majemuk, IPK/rata-rata tertimbang, korelasi≠kausalitas |
| **Mode** | Harian (warm-up→review→fokus), Quick 5, Zeno, Ujian Promosi (gerbang+cooldown 48 jam), Boss mingguan (+shield), **Exam Sim (Tier 5 preview, buka di tier 2)** |
| **Fitur** | FSRS-lite, Elo per node, mastery & decay "memudar", Sharpness 0–1000, heatmap, proyeksi selesai, **Sertifikat PNG** saat promosi lulus, export/import `.fgy` (AES-GCM+PBKDF2), backup plain, snapshot & crash-resume, multi-tab safe, KOA + Serius Mode, suara synth, partikel, dark/light, reduce-motion, PWA |
| **v1.3 visual** | **KOA 3D** (drag-rotate) · pabrik isometrik · tableau simpleks |
| **Visual soal** | Tabel, bar chart (1–2 seri), boxplot, garis, parabola, **antrean M/M/1 animasi**, **kurva EOQ**, **LP interaktif**, **PERT network**, **graph Djikstra/MST**, **SPC chart** |
| **v1.2 baru** | **Format soal multi-langkah (steps)** — Gauss, rumus kuadrat, M/M/2; dualitas LP, EOQ diskon, kebijakan P/Q, ABC, WMA, trend LSQ, indeks musiman, Monte Carlo; **pabrik isometrik** di Beranda; **papan rekor pribadi**; modals edukasi SRS + glosarium; ikon PWA PNG |
| **v1.4 baru** | **Rebrand Vista Academy**: seluruh token warna (canvas/panel/mint/amber/blue/danger), KOA SVG + mesh 3D, pabrik isometrik, heatmap, sertifikat, ikon SVG+PNG, manifest · **Visual QA matrix 32/32** (7 viewport, zero overflow, zero error, tangkapan di `design/`) — sekalian membetulkan bug overflow nyata 23–27px di Peta Skill layar <520px |
| **v1.3 baru** | **KOA 3D** software-rendered (drag-rotate, painter’s algorithm, fallback SVG) · **E2E Playwright headless Chromium: 18/18, NOL error JS** · kalibrasi onboarding (Elo awal) · verifikasi independen simpleks 200× |
| **Test** | **13.992 assertion engine 0 gagal + E2E 20/20 + Visual 32/32** | (`node tests/run.js`) — 121 generator × validasi, scheduler, gerbang, kripto roundtrip + tamper, merge, storage |

## 🆕 v1.6 — FRONT-END SWEEP (selesai)
Bugfix nyata dari feedback pemakai: (1) **kalibrasi macet 1/6** — node format numeric bikin render berikutnya throw senyap → daftar node kalibrasi kini MC-only + guard skip-anti-macet; (2) **panel Setelan & Data nempel dempetan** — panel di luar .bento tidak pernah punya gap sejak v1.0 → `.screen>.panel+.panel{margin-top:14px}`; (3) jarak tombol↔catatan onboarding. Sweep: tombol ✕ di semua modal, transisi halaman, legend heatmap, focus-ring mint konsisten (a11y), scrollbar gelap halus, haptic keypad (Vibration API), runner header tahan layar sempit, toggle-row & dropdown responsif, pesan pencarian "tidak ketemu", kv-row dengan tombol dirapikan. **E2E +5 regression test (25/25), Visual 32/32.**

## 🆕 v1.5.1–v1.5.3 (selesai)
**v1.5.1** — Gauss 3×3 full & Cramer & integral parsial & fraksi parsial (semua format steps), M/M/s umum (s=3/4, rumus Erlang disediakan), simpleks 2 iterasi (tableau disimulasikan penuh di kode), tabel distribusi granular: Φ(z) eksak per 0,01 (aproksimasi A&S, galat <1e-7), tabel t dua/ satu sisi luas, binomial kumulatif eksak + node kumulatif baru → **142 node**.
**v1.5.2** — Riwayat sesi per-item (modal detail: tiap soal ✓/✗ + durasi), "Jam Emas" (akurasi & volume per jam belajar), dropdown Setelan custom (animasi max-height, chevron berputar, keyboard ↑↓ Enter Esc, klik-luar-tutup).
**v1.5.3** — Audit UX proses belajar (temuan nyata): **zeno bisa membypass node terkunci** → dijaga di runner + tombol Latihan modal dikunci; timer ring diperbaiki (dashoffset sungguhan, bukan rotasi hack); steps input auto-scroll saat fokus (keyboard mobile tak menutupi); hint keyboard 1–4 di pilihan ganda. Bugfix runtime `esc` di komponen dropdown. **Dipush ke GitHub (repo sadidft/vistaforgy) untuk Cloudflare Pages.**

## 🆕 v1.5 (selesai)
Logo resmi Vista Academy (disedot dari vistaacademy.pages.dev, dipoles: ring mint glow + float + shine) · KOA 3D maskot DIHAPUS sesuai feedback · **Topologi Pengetahuan 3D** interaktif ala referensi okp.sadid.my.id/topology (software-rendered, drag-rotate, zoom, hover, klik simpul → detail) di Beranda + Onboarding + kartu konsep ber-relasi · **Bugfix nyata: Stats desktop** (panel tanpa span = 12 kolom sempit → grid span 4/6/8 + dense) · pencarian Peta Skill · export CSV statistik · pengingat backup .fgy tiap 14 hari · verifikasi ulang penuh: engine 13.620 + E2E 18/18 + Visual QA 32/32.

## ⏳ BACKLOG NON-UI/UX TERSISA (v1.6+ — jujur & tercatat)

| # | Item | Tingkat |
|---|---|---|
| 1 | Konten steps tambahan: Gauss 3×3 full, Cramer 2×2/3×3, integral parsial & fraksi parsial, M/M/s umum (s>2), simpleks iterasi ke-2 + interpretasi slack | mudah — pola family & format steps sudah ada |
| 2 | Tabel distribusi lebih granular (z per 0,01; t satu sisi; binomial kumulatif) — sekarang versi ringkas | mudah — data saja |
| 3 | Histori sesi per-item (bukan agregat) + statistik per jam-belajar | sedang |
| 4 | E2E lintas-browser (WebKit/Firefox) + audit aksibilitas axe + Lighthouse CI formal | sedang — butuh deps tambahan |
| 5 | CI otomatis (GitHub Actions: unit + E2E tiap commit) & changelog otomatis | sedang — butuh repo GitHub |
| 6 | Mode multi-profil satu device (switch akun lokal) | opsional |

## 🎯 Filosofi backlog

Semua item di atas adalah **penambahan konten/fitur di tepi** — arsitektur inti (engine, scheduler, progression, storage, crypto) SUDAH final dan tidak perlu berubah untuk menampungnya. Tidak ada utang teknis struktural; hanya daftar kerja.
