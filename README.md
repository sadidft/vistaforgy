# 🔩 Vista Forgy — Gym Otak (v1.6.3)

> **Gym untuk otakmu — logika & matematika industri sampai di luar kepala.**
>
> 🆕 **v1.6.3 — Bug recon permanen + non-UI/UX**: FIX soal kalibrasi tanpa visual (kini jalur kalibrasi merender visual+LaTeX+animasi), FIX `inv.discount` gagal-generate, **suite recon ganda**: `tests/audit.js` (statis 8.520 soal) + `tests/audit-browser.js` (render semua 142 node di browser nyata, 160/160) — kelas bug "soal butuh visual tapi tak tampil" kini MUSTAHIL lolos senyap. Plus: CHANGELOG.md lengkap, CI GitHub Actions, **E2E lintas-browser: Chromium 25/25 & Firefox 25/25**.
> 🆕 **v1.6 — Front-end sweep**: FIX kalibrasi macet di soal 1/6 (node numeric kini diganti node MC + guard anti-macet), FIX gap panel Setelan/Data (dulu nempel 0px → 14px), jarak onboarding dirapikan, modal punya tombol ✕, transisi halaman halus, legend heatmap, focus-ring mint konsisten, scrollbar gelap, haptic keypad, runner header tahan layar 320px, toggle-row responsif, pesan "tidak ketemu" di pencarian Peta. QA: E2E 25/25 (5 regression test baru) + Visual 32/32.
> 🆕 **v1.5.1–v1.5.3**: Gauss 3×3 full (steps), Cramer (steps), integral parsial & fraksi parsial (steps), M/M/s umum, simpleks 2 iterasi, **tabel z granular per 0,01 (Φ eksak) + t satu-sisi + binomial kumulatif eksak**, **riwayat sesi per-item + "Jam Emas"** (akurasi per jam belajar), **dropdown Setelan custom dipoles** (animasi + keyboard), audit UX belajar: anti-bypass zeno terkunci, timer ring fix, hint keyboard MC.
> 🆕 **v1.5**: logo resmi Vista Academy di hero (dipoles: glow mint + float), **KOA 3D dihapus**, **Topologi Pengetahuan 3D** interaktif (drag/zoom/klik simpul) di Beranda + landing + kartu konsep, **bugfix Stats desktop** (grid span), pencarian Peta Skill, export CSV statistik, pengingat backup 14 hari.
>
> 🎨 **v1.4: Rebrand palet Vista Academy** — navy `#0B1220` · mint `#55E6C1` · amber `#F5BD67` · blue `#7EA7FF` (token asli diekstrak dari vistaacademy.pages.dev). Lihat `design/brand-preview.png`.
> Aplikasi web **100% statis, zero-dependency** (tanpa npm, tanpa build, tanpa server, tanpa API): tinggal buka `index.html`.

## Cara menjalankan

| Cara | Langkah |
|---|---|
| **Paling gampang** | Buka `VistaForgy-standalone.html` (satu file, semua di dalamnya — bisa dari flashdisk/file://) |
| **Folder lengkap** | Jalankan server statis apa pun: `python3 -m http.server 8000` di folder ini → buka `http://localhost:8000` |
| **PWA installable** | Saat dibuka via http/https, bisa di-install ke homescreen (manifest + service worker aktif) |

Semua progress disimpan di `localStorage` perangkat. Export/import via file terenkripsi `.fgy` (AES-256-GCM + PBKDF2 250.000 iterasi) di menu **Data**.

## Test

```bash
node tests/run.js    # engine: 13.620 assertion (142 generator × validasi, scheduler, gerbang, kripto)
```

E2E browser nyata **lintas-browser**: `tests/e2e.js` (Chromium 25/25 & Firefox 25/25) + `tests/audit-browser.js` (recon 142 node, 160/160) · **Visual QA matrix `tests/visual.js` (32/32)**: 7 viewport × 4 layar tanpa overflow horizontal, nol error JS, screenshot di `design/` — onboarding → sesi penuh (MC/numeric/steps) → streak → 4 layar → export `.fgy` + dekripsi roundtrip Node → modal konsep → pabrik → **nol error JS**. (Butuh `playwright-core`; sandbox workspace: `/home/user/e2e-work`.)

**13.992 assertion engine** + **E2E browser nyata 18/18** (headless Chromium 390px): onboarding → sesi penuh → semua layar → export `.fgy` + dekripsi roundtrip → **NOL error JS**. Generator (**136 node**) diuji 30× (validitas MC/numeric, pembahasan, determinisme), variasi anti-template, scheduler FSRS-lite, gerbang tier, ujian promosi + cooldown 48 jam, roundtrip kripto + tamper-detection, merge, storage fallback.

## Arsitektur (sesuai blueprint `RENCANA-GYM-OTAK.md`)

```
js/
  rng.js             RNG seeded (mulberry32 + cyrb128) — engine DILARANG Math.random
  engine.js          QuestionForge: pipeline generate→constraint→verifikasi→distraktor→konteks,
                     formatter angka Indonesia (koma desimal), mini-LaTeX renderer (tanpa KaTeX)
  generators-*.js    Family generator: Tier 0 (aritmetika/aljabar/logika/data), Tier 1 (persen
                     berlapis, soal cerita, sistem, Vieta, fungsi, statistika), Tier 2 (mental
                     rush, kalkulus cepat, trig, geometri), Tier 3 (Bayes, CI-z, matriks),
                     Tier 4 (antrean M/M/1 + animasi, EOQ + grafik), Universal (break-even)
  content.js         DATA: 77 node skill tree + kartu konsep + tier meta + 28 baris humor KOA
  scheduler.js       FSRS-lite (D/S/R, rating dari performa, decay "memudar", antrian harian)
  progression.js     Elo per node, mastery, gerbang tier, ujian promosi & boss, Sharpness, proyeksi
  storage.js         localStorage + snapshot 7 hari + migrasi schema + crash-resume + multi-tab
  crypto.js          File .fgy (magic "VFGY1", PBKDF2 250k, AES-GCM-256) + merge algorithm
  audio.js           Sound synth WebAudio (tanpa aset)
  koa.js             Maskot KOA (SVG) + dry humor + Serius Mode
  ui-*.js            Router hash, layar (Beranda/Peta/Statistik/Setelan/Data/Onboarding/Runner),
                     visual soal interaktif (bar chart, boxplot, garis, antrean animasi, EOQ)
```

Modul `engine/scheduler/progression/storage/crypto` **framework-agnostic** — bisa diporting ke SvelteKit/React tanpa perubahan.

## Yang sudah ada (v1.0)

- **142 node skill** di Tier 0–4 + Universal pack (v1.3: simpleks pivot multi-langkah + tabel, sensitivitas c₁, goal programming, branch & bound) — termasuk **format soal multi-langkah (steps)**: Gauss, rumus kuadrat, M/M/2; dualitas LP, EOQ diskon, P/Q & ABC, WMA, trend LSQ, indeks musiman, Monte Carlo
- **Loop harian**: Warm-up rush (8 soal mental) → Review SRS interleaved → Fokus node baru (8 soal) → Ringkasan + badge
- **FSRS-lite**: jadwal review per skill, status baru→belajar→lancar→mastered→memudar
- **Progresi keras**: mastery 90% + volume 400 soal/tier + sehat + **ujian promosi 25 soal (lulus ≥85%, tiap domain ≥70%, cooldown 48 jam)**
- **Boss mingguan** (streak shield), Quick 5, Zeno, **Exam Sim (Tier 5)**, streak + shield otomatis, **sertifikat PNG**, **pabrik isometrik** di dashboard, **papan rekor pribadi**, glosarium + edukasi SRS
- **Sharpness Score 0–1000**, heatmap, akurasi per domain, proyeksi tanggal selesai
- **KOA** maskot animasi + dry humor (toggle **Serius Mode**), suara synth, partikel, count-up
- **Data**: export/import `.fgy` terenkripsi + merge/replace + backup plain, snapshot & resume
- **Visual soal**: tabel, bar chart, boxplot, garis/parabola, **animasi antrean M/M/1**, **kurva EOQ**, **LP grafis interaktif (slider garis tujuan)**, **network PERT**, **graph Dijkstra/MST**, **control chart SPC**
- Dark/light, reduce-motion, keypad mobile, safe-area, responsif 360–1920px

## Roadmap

Lihat `BACKLOG.md` untuk daftar lengkap yang sudah/belum dibangun. Inti: tambah family di `generators-*.js` + node di `content.js` — arsitektur tidak berubah.
