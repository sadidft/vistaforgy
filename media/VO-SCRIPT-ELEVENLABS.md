# 🎙️ PAKET SCRIPT VOICEOVER — ELEVENLABS
**Proyek:** Iklan Vista Forgy 60 detik (+ cut 15 detik) · **URL end-card:** vistaforgy.pages.dev

---

## ⚙️ SETUP ELEVENLABS (sekali setel, semua segmen)

| Parameter | Nilai | Alasan |
|---|---|---|
| Model | **Multilingual v2** (atau v3 jika ada) | pelafalan Indonesia paling stabil |
| Voice | cari: *warm, energetic, young adult, Indonesian-friendly* (pria/wanita sama kuat — ini brand netral) | nada "teman yang ngajak gas", bukan announcer kaku |
| Stability | **35–40%** | ruang ekspresif tapi gak dramatis |
| Similarity | 75% | konsisten antar segmen |
| Style | 10% | cukup, jangan lebih |
| Speed | 1.0 (jangan dipercepat — timing 60 detik sudah dihitung) | |

**PENTING:**
- Generate **PER SEGMEN** (S1–S7), bukan satu blok — supaya timing mux ke video presisi. Simpan sebagai `VF-VO-S1.mp3` … `VF-VO-S7.mp3`.
- "..." = jeda napas ±400ms. "—" = jeda pendek ±200ms.
- Kalau "Vista Forgy" dilafalkan aneh, ganti penulisannya jadi **"Vista Forgi"** di teks (jangan ubah cara baca lain).
- Semua angka sudah ditulis dengan huruf ("dua puluh lima") supaya dijamin dibaca bahasa Indonesia.

---

## 🎬 SCRIPT UTAMA 60 DETIK (7 segmen)

### S1 · 0–5 dtk · HOOK (nada: sok santai, lalu ngeteh)
> Badanmu ikut gym... otakmu cuma ikut scroll.

### S2 · 5–12 dtk · PERKENALAN (nada: excited, ngajak)
> Kenalan — **Vista Forgy**. Gym-nya otak. Cukup dua puluh lima menit... sehari.

### S3 · 12–22 dtk · DIFFERENTIATOR (nada: pamer dikit)
> Semua soal dibikin mesin — angkanya, ceritanya, bahkan cara nanyainnya... selalu baru. Jadi nggak bisa dihafal. Harus... mikir.

### S4 · 22–32 dtk · REFRAME SALAH (nada: bijak, hangat)
> Salah? Justru bagus. Otak itu kayak otot — justru waktu lelah... dia tumbuh.

### S5 · 32–42 dtk · PROOF (nada: bangga, melihat layar)
> Dari hari ke hari, lihat — streak-mu nyala, level naik, otakmu... naik kelas.

### S6 · 42–50 dtk · PRIBADI (nada: pelan, meyakinkan)
> Gratis. Offline. Progres cuma tersimpan di HP kamu — bukan di mana-mana.

### S7 · 50–60 dtk · CLOSER (nada: tegas, senyum)
> Vista Forgy. Otak juga butuh gym. Coba gratis — hari ini juga.

**Total: ±100 kata + jeda = pas 60 detik di speed 1.0.** Kalau hasil S3/S5 kepanjangan, buang kata "bahkan" (S3) dan "Dari hari ke hari," (S5) — cadangan aman.

---

## 🎬 CUT 15 DETIK (story ad) — 3 segmen

### S1 · 0–4 dtk
> Otakmu cuma ikut scroll?

### S2 · 4–10 dtk
> Vista Forgy — gym-nya otak. Soal baru tiap hari. Dua puluh lima menit.

### S3 · 10–15 dtk
> Gratis. Otak juga butuh gym — coba sekarang.

---

## 📋 ON-SCREEN TEXT PER SEGMEN (untuk sinkron video — gue yang eksekusi)

| Seg | Teks di layar |
|---|---|
| S1 | OTAK JUGA BUTUH GYM. (per kata) |
| S2 | logo + "25 MENIT/HARI" |
| S3 | "SELALU BARU" + soal berganti |
| S4 | "SALAH = TUMBUH" |
| S5 | streak 1→7→30 + SHARPNESS ▲ |
| S6 | GRATIS · OFFLINE · PRIVAT |
| S7 | END CARD: logo + OTAK JUGA BUTUH GYM. + vistaforgy.pages.dev + QR |

## ✅ CHECKLIST PENGERJAAN LU
1. Generate 7 file (S1–S7) + 3 file versi 15s → simpan nama persis `VF-VO-S1.mp3` dst.
2. Kirim/letakin file di `vista-forgy/media/vo/` (atau kabari gue, gue ambil dari workspace).
3. Gue mux: VO + musik synth + 1.800 frame animasi = MP4 1080p60 final.

*Alternatif kalau gak mau ribet segmen: generate versi GABUNGAN (S1..S7 disambung, jeda pakai "..." sesuai naskah) — gue auto-split di mux.*
