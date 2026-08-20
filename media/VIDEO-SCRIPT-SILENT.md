# 🎬 SCRIPT VIDEO IKLAN — VERSI SILENT-STYLE (final)
**Konsep:** teks yang bicara + sound design — tanpa VO (VO ElevenLabs bisa ditambahkan NANTI oleh pemilik produk di atas track ini; mux point tersedia).
**File final:** `final/VistaForgy-60s-1080p-FINAL.mp4` (60.00 dtk · 1080p · H.264+AAC · ±3 MB)

## BEAT SHEET + SOUND CUE

| Detik | Scene | Teks di layar | SFX |
|---|---|---|---|
| 0–3 | Hook A | SCROLL → 3 JAM. (type-on, kursor mint) | tick ketikan ×2/dtk |
| 3–6 | Hook B | MIKIR → 3 MENIT? (punch-in, garus merah) | punch sub + whoosh |
| 6–12 | Intro | logo VA → VISTA FORGY → chip GYM-NYA OTAK → 25 MENIT PER HARI | whoosh + pulse mulai (100 BPM) |
| 12–24 | Mesin | SOALNYA DIBIKIN MESIN + 3 kartu soal (12×8+15 / 17×6−22 / 25×4+40) berganti tiap 3 dtk + jawaban muncul + percikan | tick + coin tiap jawaban |
| 21.5–23 | Stempel | SELALU BARU (amber stamp scale 2.2→1.0) | coin |
| 24–34 | Reframe | SALAH = TUMBUH; 4×7=28 SALAH (merah) → 9×6=54 BENAR (percikan mint); "otak itu kayak otot" | punch + coin |
| 34–44 | Proof | STREAK 1→30 HARI + api amber tumbuh; heatmap 12×7 terisi; SHARPNESS 0→812 + ring | arpeggio mint naik (pentatonik) |
| 44–52 | Chorus | 3 HP (home/runner/summary) + chips GRATIS·OFFLINE·PRIVAT | stamp ×3 |
| 52–60 | End card | logo → SCROLL 3 JAM. MIKIR 3 MENIT? → OTAK JUGA BUTUH GYM → vistaforgy.pages.dev + QR | end hit + reverb; fade 58.5–60 |

## CATATAN PRODUKSI
- 1.800 frame dirender programatik (PIL) → rawvideo → x264 crf19 yuv420p
- Soundtrack digenerate `render_audio.py` (pulse 100 BPM, tick, whoosh bandpass, punch, arpeggio, coin, stamp, end hit; stereo delay 12 sampel; limiter −1 dBFS)
- QC piksel 8 titik: 8/8 frame hidup & elemen kunci terdeteksi (ink/mint pixel)
- VO nanti: generate di ElevenLabs pakai `VO-SCRIPT-ELEVENLABS.md`, mux ulang — timing gap sudah dirancang aman untuk tambahan VO
