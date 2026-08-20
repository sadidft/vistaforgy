# render_audio.py — sound design 60s untuk iklan Vista Forgy (silent-style, no VO)
import numpy as np, wave, struct

SR = 44100
DUR = 60.0
N = int(SR * DUR)
t = np.arange(N) / SR
mix = np.zeros(N)

def add(sig, at):
    i0 = int(at * SR)
    i1 = min(N, i0 + len(sig))
    if i0 >= N: return
    mix[i0:i1] += sig[:i1 - i0]

# ---------- 1. PULSE GRID (100 BPM, sub-kick) ----------
bpm = 100
beat = 60 / bpm
for b in np.arange(0, DUR - 0.5, beat):
    dur = 0.22
    tt = np.arange(int(dur * SR)) / SR
    f = 58 * np.exp(-tt * 6) + 40
    kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 14) * 0.5
    # lembut di scene pelan (S7 52–60: redam)
    amp = 0.35 if b > 52 else 1.0
    add(kick * amp, b)

# ---------- 2. TICK (S1 typing 0.3–3.0; S3 soal 12–23) ----------
rng = np.random.default_rng(7)
def tick(vol=0.3):
    dur = 0.03
    tt = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * 1900 * tt) + 0.5 * np.sin(2 * np.pi * 3800 * tt)) * np.exp(-tt * 220) * vol
for x in np.arange(0.3, 2.9, 0.14): add(tick(0.22), x)
for x in np.arange(12.2, 23.0, 0.5): add(tick(0.15), x)

# ---------- 3. WHOOSH (transisi scene: 3.2, 6.0, 12, 24, 34, 44, 52) ----------
def whoosh(dur=0.7, rise=True):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    # lowpass sederhana via moving average (jendela mengecil/membesar)
    out = np.zeros(n)
    win = 48
    ker = np.ones(win) / win
    out = np.convolve(noise, ker, mode='same')
    env = np.hanning(n)
    if not rise: env = env[::-1]
    return out * env * 0.8
for x in [3.1, 5.9, 11.9, 23.9, 33.9, 43.9, 51.9]:
    add(whoosh(0.7), x - 0.35)

# ---------- 4. PUNCH (hook "MIKIR" 3.4 & "3 MENIT?" 4.6) ----------
def punch(vol=0.7):
    dur = 0.5
    tt = np.arange(int(dur * SR)) / SR
    f = 120 * np.exp(-tt * 10) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * vol
add(punch(0.8), 3.4); add(punch(0.8), 4.6)

# ---------- 5. ARPEGGIO MINT (S5 34–44, naik) ----------
notes = [220.0, 261.63, 329.63, 392.0, 440.0, 523.25, 659.25]
for i in range(28):
    x = 34.0 + i * 0.36
    if x > 43.5: break
    f = notes[min(len(notes) - 1, i % 5 + i // 5)]
    dur = 0.30
    tt = np.arange(int(dur * SR)) / SR
    pl = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2 * tt)) * np.exp(-tt * 12) * 0.22
    add(pl, x)

# ---------- 6. SPARK/COIN (S3 benar tiap 3s; S4 benar 28.5) ----------
def coin():
    dur = 0.24
    tt = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * 1046 * tt) + np.sin(2 * np.pi * 1568 * tt)) * np.exp(-tt * 24) * 0.3
for x in [15.2, 18.2, 21.2, 28.6]: add(coin(), x)

# ---------- 7. CHIP STAMPS (S6 45.7, 45.95, 46.2) ----------
def stampSfx():
    dur = 0.12
    tt = np.arange(int(dur * SR)) / SR
    base = np.sin(2 * np.pi * 300 * tt) * np.exp(-tt * 60) * 0.5
    tk = tick(0.2)
    return np.pad(base, (0, max(0, len(tk) - len(base)))) 
for x in [45.7, 45.95, 46.2]: add(stampSfx(), x)

# ---------- 8. END HIT (52.0 & 52.4 & tail) ----------
def endhit(vol=1.0):
    dur = 1.6
    tt = np.arange(int(dur * SR)) / SR
    f = 90 * np.exp(-tt * 3) + 38
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 4) * vol
    noise = rng.standard_normal(len(tt))
    noise = np.convolve(noise, np.ones(64) / 64, mode='same') * np.exp(-tt * 8) * 0.4
    return body + noise
add(endhit(0.9), 52.0)
add(coin(), 54.6)
add(coin(), 55.4)

# ---------- MASTER ----------
# highpass ringan (buang DC), limiter lunak, normalisasi -1 dBFS
mix = mix - mix.mean()
peak = np.abs(mix).max()
mix = mix / peak * (10 ** (-1 / 20))
# fade out akhir 58.5–60
fo = np.ones(N)
f0, f1 = int(58.5 * SR), int(59.8 * SR)
fo[f0:f1] = np.linspace(1, 0, f1 - f0)
fo[f1:] = 0
mix *= fo
# stereo ringan (delay 12 sample kanan)
delay = 12
stereo = np.zeros((N, 2))
stereo[:, 0] = mix
stereo[delay:, 1] = mix[:-delay] * 0.98
stereo[:delay, 1] = mix[:delay]

with wave.open('final/soundtrack-60s.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    data = (stereo * 32767).astype('<i2').tobytes()
    w.writeframes(data)
print('AUDIO OK → final/soundtrack-60s.wav', round(len(stereo)/SR, 2), 'detik')
