# CHANGELOG — Vista Forgy

Format subversi mengikuti aturan pemilik produk: `1.x.y` — tidak pernah naik ke v2; setelah 1.9 langsung 1.10 (hingga 1.999). Update kecil = subversi, bukan lompatan minor.

## v1.6.5 — Multi-profil satu device
- Panel "Profil" di Setelan: buat/pindah/hapus profil; progress tiap profil terpisah penuh di slot lokal sendiri (`vf.p:<nama>`); profil aktif tetap di `vf.save` (kompatibel penuh dengan export `.fgy`).
- FIX race tulis saat pindah profil (`VF.persist()` setelah `switchProfile` sempat menimpa slot baru dengan save in-memory basi — tertangkap E2E baru lalu diperbaiki).
- E2E +4 test alur profil (buat → aktif → streak bersih → kembali → progress utuh): Chromium 29/29 & Firefox 29/29.

## v1.6.4 — QA penuh: a11y, Lighthouse, CI
- **Audit axe-core** (`tests/a11y.js`, 6 layar): ditemukan & diperbaiki — input password Data tanpa label, slider volume & slider LP tanpa nama aksesibel, tombol toggle tanpa aria-pressed/label, listbox dropdown tanpa nama, `<label>` tanpa kontrol, h3 melompati h2 → kini **NOL pelanggaran serious/critical**.
- **Lighthouse** (server lokal, headless): Performance **93** · Accessibility **100** · Best Practices **100** · SEO **100** (semua melebihi budget spec: ≥90/≥95/≥95/≥90).
- **CI GitHub Actions final**: unit + audit statis + build + E2E + recon browser + visual matrix + a11y, plus job **WebKit eksperimental** (continue-on-error; WebKit tak bisa jalan di sandbox Debian 13 — lib ICU66/ffi7 — tapi di runner ubuntu resmi GitHub tersedia).
- Workflow resmi terpush setelah PAT diberi scope `workflow`.

## v1.6.3 — Bug recon menyeluruh + non-UI/UX
- **BUG (dilaporkan pemakai)**: soal kalibrasi merujuk visual ("Lihat grafik…") tetapi jalur render kalibrasi tidak pernah memanggil `UI.renderVisual` → soal tidak bisa dijawab. FIX: kalibrasi kini merender visual + LaTeX + animasi (queue/LP) di setiap soalnya.
- **BUG (ditemukan recon statis)**: `inv.discount` bisa gagal generate 25× (konstrain integer Q terlalu ketat, mirip kasus EOQ v1.0). FIX: tabel `DISC_COMBOS` precomputed.
- **BARU: `tests/audit.js`** — recon statis 142 node × 60 seed (8.520 soal): deteksi visual-hilang, visual tak dikenal, string kotor, MC ganda/kosong, jawaban non-finite, pembahasan tidak konsisten dengan jawaban (parser angka: minus unicode, desimal koma, ribuan titik).
- **BARU: `tests/audit-browser.js`** — recon browser nyata: merender SATU soal dari SETIAP node di headless Chromium, menjamin prompt ber-visual benar-benar menampilkan visualnya, feedback muncul untuk semua format (MC/numeric/steps), nol error JS, dan jalur kalibrasi 6 soal maju + visual. **160/160 lulus.**
- Catatan desain yang terkonfirmasi benar (bukan bug): menjawab salah menurunkan status prasyarat → node anak ikut terkunci sementara (by design "naik level = kehormatan"); harness audit kini pulihkan prasyarat per node.
- Non-UI/UX: CHANGELOG ini, CI GitHub Actions (unit + audit + build standalone + E2E kontainer Playwright), parameter `PW_PATH`/`PW_BROWSER` pada E2E.

## v1.6.2 — (digabung ke v1.6.3)

## v1.6.1 — (digabung ke v1.6.3)

## v1.6 — Front-end sweep (feedback pemakai)
- FIX kalibrasi macet di soal 1/6 (node numeric membuat render berikutnya throw senyap → daftar MC-only + guard anti-macet).
- FIX panel Setelan/Data "nempel dempetan" (gap 0px laten sejak v1.0 → 14px; kini ada regression test E2E).
- Jarak onboarding, modal ✕, transisi halaman, legend heatmap, focus-ring a11y mint, scrollbar gelap, haptic keypad, runner header tahan 320px, toggle-row & dropdown responsif, pesan pencarian "tidak ketemu", kv-row tombol rapi.
- QA: E2E 25/25 (+5 regression), Visual 32/32.

## v1.5.3 — Audit UX proses belajar
- FIX zeno dapat membypass node terkunci → guard di runner + tombol Latihan dikunci di modal.
- Timer ring: dashoffset sungguhan (menggantikan hack rotasi). Steps input auto-scroll saat fokus. Hint keyboard 1–4 di MC. Fix runtime `esc` di komponen dropdown.
- Dipush ke GitHub (sadidft/vistaforgy) untuk Cloudflare Pages.

## v1.5.2 — Fitur belajar
- Riwayat sesi per-item (modal detail per soal: ✓/✗ + durasi), panel "Jam Emas" (akurasi & volume per jam belajar), dropdown Setelan custom (animasi + keyboard lengkap), `stats.sessionLog` (maks 120 sesi) + migrasi default stats.

## v1.5.1 — Konten & tabel granular
- Node baru (+6 → 142): Gauss 3×3 full, Cramer 2×2 (steps), integral parsial, fraksi parsial (steps), M/M/s umum (s=3/4, rumus Erlang disediakan), simpleks 2 iterasi (tableau disimulasikan penuh).
- `js/tables.js`: Φ(z) eksak per 0,01 (A&S 26.2-17, galat <1e-7), tabel t dua-sisi & satu-sisi, CDF binomial eksak; soal normal/CI-t/binomial kumulatif memakai tabel granular dinamis.

## v1.5 — Logo Vista Academy + Topologi 3D + fix Stats desktop
- Logo resmi VA (vistaacademy.pages.dev) di hero & onboarding, dipoles (ring glow mint, float, shine). Maskot 3D KOA dihapus.
- "Topologi Pengetahuan 3D" interaktif (software-rendered: drag-rotate, zoom, hover, klik simpul) di Beranda + Onboarding + kartu konsep ber-relasi.
- FIX Stats desktop (panel tanpa span grid → 12 kolom sempit; kini span 4/6/8 + dense). Pencarian Peta Skill, export CSV, pengingat backup .fgy 14 hari.

## v1.4 — Rebrand palet Vista Academy
- Token warna asli diekstrak dari CSS vistaacademy.pages.dev: canvas `#0B1220`, panel `#111C2E/#17263D`, mint `#55E6C1`, amber `#F5BD67`, blue `#7EA7FF`, danger `#FF8C8C` — diterapkan ke seluruh lapisan (CSS, KOA, pabrik, sertifikat, ikon SVG+PNG, manifest).
- Visual QA matrix `tests/visual.js`: 7 viewport × 4 layar — menemukan & memperbaiki overflow nyata 23–27px di Peta Skill <520px.

## v1.3 — Logo… (bukan) — Simpleks lanjutan + E2E
- Simpleks iterasi pivot (steps + tableau), sensitivitas c₁, goal programming, branch & bound (brute-force verified). KOA 3D software-rendered (kini sudah dihapus di v1.5). Kalibrasi onboarding (Elo awal). **E2E Playwright headless Chromium pertama: 18/18, nol error JS.**

## v1.2 — Steps & konten lanjutan
- Format soal multi-langkah (steps) + Gauss 2×2, rumus kuadrat, M/M/2. Dualitas LP, EOQ diskon, kebijakan P/Q, ABC, WMA, trend LSQ, indeks musiman, Monte Carlo. Pabrik isometrik, papan rekor, glosarium + edukasi SRS, ikon PWA PNG.

## v1.1 — Tier 3–4 lengkap
- 77 → 121 node. LP grafis interaktif (slider garis tujuan), PERT/CPM + network SVG, Dijkstra/MST + graph SVG, control chart SPC, EOQ/antrean biaya/Little, forecasting, keandalan, ekonomi teknik. Exam Sim + sertifikat PNG.

## v1.0 — Rilis pertama
- 77 node Tier 0–2 + showcase 3/4. QuestionForge (seeded, distraktor miskonsepsi, konteks), FSRS-lite, Elo, gerbang tier + ujian promosi + cooldown 48 jam, boss mingguan, .fgy (AES-GCM+PBKDF2), PWA, KOA humor + Serius Mode. 7.997 assertion.
