# render_video.py — Vista Forgy silent ad 60s @30fps 1920x1080
# Scene: S1 hook scroll/mikir · S2 logo intro · S3 soal mesin · S4 salah=tumbuh
#        S5 streak/heatmap/sharpness · S6 3 HP chips · S7 end card
import sys, os, math, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib_ad import *
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np

W, H = 1920, 1080
FPS = 30
DUR = 60
N = FPS * DUR
URL = 'vistaforgy.pages.dev'

# ---------- util ----------
def ease_out(t): return 1 - (1 - t) ** 3
def ease_in(t): return t ** 3
def clamp01(t): return max(0.0, min(1.0, t))
def seg(t, a, b): return clamp01((t - a) / (b - a)) if b > a else 0.0
def lerp(a, b, t): return a + (b - a) * t

_cache = {}
def text_layer(text, font, fill):
    key = (text, id(font), fill)
    if key in _cache: return _cache[key]
    tmp = Image.new('RGBA', (10, 10)); td = ImageDraw.Draw(tmp)
    tw = int(td.textlength(text, font=font)) + 40
    th = font.size + 60
    im = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
    td = ImageDraw.Draw(im)
    td.text((20, 10), text, font=font, fill=fill)
    _cache[key] = im
    return im

def paste_c(img, layer, cx, cy, scale=1.0, alpha=1.0):
    if scale != 1.0:
        layer = layer.resize((max(1, int(layer.width * scale)), max(1, int(layer.height * scale))), Image.BICUBIC)
    if alpha < 1.0:
        layer = layer.copy()
        a = layer.getchannel('A').point(lambda v: int(v * alpha))
        layer.putalpha(a)
    img.paste(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)), layer)
    return img

def scan_streaks(base, prog, rng_seed=5):
    """garis scroll horizontal berlalu (latar S1)."""
    img = base.copy()
    d = ImageDraw.Draw(img, 'RGBA')
    import random
    rnd = random.Random(rng_seed)
    n = int(26 * prog)
    for i in range(n):
        y = rnd.randint(60, H - 60)
        x = (rnd.randint(0, W) + int(prog * W * 1.6)) % (W + 600) - 300
        ln = rnd.randint(180, 520)
        c = rnd.choice([(255, 255, 255, 26), (126, 167, 255, 34), (85, 230, 193, 40)])
        d.rounded_rectangle([x, y, x + ln, y + 10], radius=5, fill=c)
    return img

def spark(img, cx, cy, t, seed=1, col=MINT):
    """percikan percikan las: partikel radial. t 0..1"""
    import random
    rnd = random.Random(seed)
    d = ImageDraw.Draw(img, 'RGBA')
    for _ in range(22):
        a = rnd.uniform(0, math.pi * 2)
        sp = rnd.uniform(60, 320)
        r = sp * ease_out(t)
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r * 0.8
        s = max(1, int(5 * (1 - t)))
        cc = col if rnd.random() < 0.6 else AMBER
        d.rectangle([x, y, x + s, y + s], fill=cc + (int(230 * (1 - t)),))
    return img

def ring(img, cx, cy, r, pct, width=14, col=MINT, track=True):
    d = ImageDraw.Draw(img, 'RGBA')
    if track:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, 26), width=width)
    if pct > 0.01:
        bbox = [cx - r, cy - r, cx + r, cy + r]
        d.arc(bbox, start=-90, end=-90 + 360 * pct, fill=col, width=width)
    return img

def mini_phone(img, cx, cy, ph_h, shot_path, pop=1.0):
    if pop <= 0: return img
    return phone(img, cx, cy, int(ph_h * ease_out(pop)), shot_path, tilt=0, glow_mint=False) if pop >= 1 else _phone_partial(img, cx, cy, ph_h, shot_path, pop)

def _phone_partial(img, cx, cy, ph_h, shot_path, pop):
    h2 = int(ph_h * ease_out(pop))
    if h2 < 120: return img
    return phone(img, cx, cy, h2, shot_path, tilt=0, glow_mint=False)

# latar per-scene (pre-render sekali)
BG_A = bg(W, H, seed=11)
BG_D = bg(W, H, seed=42, glow=False)

def scene_bg(s_idx, t):
    if s_idx == 1:
        return scan_streaks(BG_D, (t % 6) / 6, rng_seed=7)
    if s_idx in (2, 3, 7):
        return BG_A.copy()
    return BG_D.copy()

# ---------- SCENES (t = detik global) ----------
def S1(img, t):
    d = ImageDraw.Draw(img, 'RGBA')
    if t < 3.0:
        f = F(SG, 300)
        words = ['SCROLL', '3 JAM.']
        xs = [W//2, W//2]
        ys = [H//2 - 180, H//2 + 160]
        p1 = seg(t, 0.2, 0.9); p2 = seg(t, 1.4, 2.1)
        if p1 > 0: paste_c(img, text_layer(words[0], f, INK), xs[0], ys[0], scale=ease_out(p1) * 1 + 0.001, alpha=min(1, p1 * 2))
        if p2 > 0: paste_c(img, text_layer(words[1], f, INK), xs[1], ys[1], scale=ease_out(p2), alpha=min(1, p2 * 2))
        # kursor ketik
        if 0.2 < t < 0.9 and int(t * 6) % 2 == 0:
            tw = text_layer(words[0], F(SG, 300), INK).width
            d.rectangle([W//2 + tw//2 + 20, ys[0] - 120, W//2 + tw//2 + 44, ys[0] + 120], fill=MINT)
    else:
        f = F(SG, 300)
        p3 = seg(t, 3.4, 4.0)
        # fade out bagian 1
        a1 = 1 - seg(t, 3.0, 3.5)
        if a1 > 0:
            paste_c(img, text_layer('SCROLL', f, INK), W//2, H//2 - 180, alpha=a1 * 0.4)
            paste_c(img, text_layer('3 JAM.', f, INK), W//2, H//2 + 160, alpha=a1 * 0.4)
        if p3 > 0:
            sc = lerp(1.5, 1.0, ease_out(p3))
            paste_c(img, text_layer('MIKIR', f, MINT), W//2, H//2 - 170, scale=sc, alpha=min(1, p3 * 3))
        p4 = seg(t, 4.6, 5.2)
        if p4 > 0:
            sc = lerp(1.5, 1.0, ease_out(p4))
            paste_c(img, text_layer('3 MENIT?', f, AMBER), W//2, H//2 + 170, scale=sc, alpha=min(1, p4 * 3))
        if 4.0 < t < 5.6 and (int(t * 10) % 2 == 0):
            d.rectangle([0, H//2 + 300, W, H//2 + 316], fill=(255, 140, 140, 120))
    return img

def S2(img, t):
    lt = t - 6.0
    p = seg(lt, 0.0, 0.7)
    if p > 0:
        l = LOGO.resize((int(220 * ease_out(p)),) * 2, Image.LANCZOS)
        img.paste(l, (W//2 - l.width//2, 220 - l.height//2), l)
    p2 = seg(lt, 0.5, 1.2)
    if p2 > 0:
        paste_c(img, text_layer('VISTA FORGY', F(SG, 150), INK), W//2, 480, alpha=min(1, p2 * 2))
    p3 = seg(lt, 1.1, 1.7)
    if p3 > 0:
        d = ImageDraw.Draw(img, 'RGBA')
        chip = text_layer('GYM-NYA OTAK', F(SG, 64), (11, 18, 32))
        bw, bh = chip.width + 80, chip.height + 20
        a = min(1, p3 * 2)
        d.rounded_rectangle([W//2 - bw/2, 610 - bh/2, W//2 + bw/2, 610 + bh/2], radius=24, fill=MINT + (int(255 * a),))
        paste_c(img, chip, W//2, 610, alpha=a)
    p4 = seg(lt, 1.9, 2.6)
    if p4 > 0:
        d = ImageDraw.Draw(img, 'RGBA')
        for i, txt in enumerate(['25 MENIT', 'PER', 'HARI']):
            layer = text_layer(txt, F(JBM, 52), MINT)
            a = seg(lt, 1.9 + i * 0.25, 2.3 + i * 0.25)
            paste_c(img, layer, W//2 + (i - 1) * 250, 760, alpha=a, scale=lerp(0.5, 1.0, ease_out(a)) if a < 1 else 1.0)
    return img

def S3(img, t):
    lt = t - 12.0
    d = ImageDraw.Draw(img, 'RGBA')
    paste_c(img, text_layer('SOALNYA', F(SG, 110), INK), W//2, 130)
    paste_c(img, text_layer('DIBIKIN MESIN', F(SG, 110), MINT), W//2, 250)
    # 3 kartu soal berganti dengan angka beda
    cards = [
        ('12 × 8 + 15 = ?', '111'),
        ('17 × 6 − 22 = ?', '80'),
        ('25 × 4 + 40 = ?', '140'),
    ]
    idx = min(2, int(lt // 3))
    card = cards[idx]
    cp = seg((lt % 3), 0.0, 0.35)
    box = [W//2 - 560, 400, W//2 + 560, 640]
    d.rounded_rectangle(box, radius=28, fill=STEEL, outline=(85, 230, 193, 90), width=2)
    if cp > 0:
        paste_c(img, text_layer(card[0], F(JBM, 74), INK), W//2, 490, alpha=min(1, cp * 2))
    ap = seg((lt % 3), 1.2, 1.6)
    if ap > 0:
        d.rounded_rectangle([W//2 + 340, 440, W//2 + 540, 600], radius=16, fill=(35, 58, 48))
        paste_c(img, text_layer(card[1], F(JBM, 64), MINT), W//2 + 440, 520, alpha=min(1, ap * 2))
    if (lt % 3) > 1.9 and (lt % 3) < 2.1:
        spark(img, W//2 + 440, 520, ((lt % 3) - 1.9) / 0.2, seed=int(lt * 3))
    # stempel SELALU BARU
    sp = seg(lt, 9.5, 10.1)
    if sp > 0:
        sc = lerp(2.2, 1.0, ease_out(sp))
        stamp = text_layer('SELALU BARU', F(SG, 96), (11, 18, 32))
        sw, sh_ = stamp.width + 90, stamp.height + 30
        d2 = ImageDraw.Draw(img, 'RGBA')
        a = min(1, sp * 2)
        d2.rounded_rectangle([W//2 - sw/2 * sc, 800 - sh_/2 * sc, W//2 + sw/2 * sc, 800 + sh_/2 * sc], radius=20, fill=AMBER + (int(255 * a),))
        paste_c(img, stamp, W//2, 800, scale=sc, alpha=a)
        if 0.3 < sp < 0.8: img = spark(img, W//2, 800, (sp - 0.3) / 0.5, seed=99, col=AMBER)
    return img

def S4(img, t):
    lt = t - 24.0
    d = ImageDraw.Draw(img, 'RGBA')
    paste_c(img, text_layer('SALAH', F(SG, 130), DANGER), W//2, 150)
    paste_c(img, text_layer('= TUMBUH', F(SG, 130), MINT), W//2, 300)
    # key sequence: 4×7 → salah merah; benar → mint
    seq = [('4 × 7', '28', False, 1.0), ('9 × 6', '54', True, 4.5)]
    for i, (q, ans, ok, st) in enumerate(seq):
        p = seg(lt, st, st + 0.5)
        if p <= 0: continue
        if lt > st + 3.0: continue
        y = 520 + i * 220
        d.rounded_rectangle([W//2 - 500, y - 80, W//2 + 100, y + 80], radius=20, fill=STEEL)
        paste_c(img, text_layer(q + ' = ' + ans, F(JBM, 62), INK), W//2 - 200, y)
        col = MINT if ok else DANGER
        cp = seg(lt, st + 1.0, st + 1.4)
        if cp > 0:
            d.rounded_rectangle([W//2 + 60, y - 60, W//2 + 480, y + 60], radius=16, outline=col, width=4)
            paste_c(img, text_layer('SALAH' if not ok else 'BENAR', F(SG, 46), col), W//2 + 270, y)
            if ok and cp > 0.3:
                spark(img, W//2 + 270, y, min(1, (cp - 0.3) / 0.6), seed=int(lt))
    bp = seg(lt, 7.5, 8.5)
    if bp > 0:
        paste_c(img, text_layer('otak itu kayak otot', F(INT, 44), MUT), W//2, 940, alpha=bp)
    return img

def S5(img, t):
    lt = t - 34.0
    d = ImageDraw.Draw(img, 'RGBA')
    # streak counter kiri
    d.text((200, 150), 'STREAK', font=F(JBM, 44), fill=MUT)
    streak = int(lerp(1, 30, ease_out(seg(lt, 0.3, 4.0))))
    col = AMBER if streak >= 7 else MUT
    d.text((200, 200), '%d HARI' % streak, font=F(SG, 120), fill=col)
    # api polygon sederhana (amber) yang membesar
    if seg(lt, 0.5, 4.0) > 0:
        fh_ = lerp(40, 130, ease_out(seg(lt, 0.5, 4.0)))
        fx, fy = 300, 470
        d.polygon([(fx, fy - fh_), (fx - fh_ * 0.5, fy + fh_ * 0.4), (fx + fh_ * 0.5, fy + fh_ * 0.4)], fill=AMBER)
    # heatmap tengah
    d.text((W//2 - 240, 150), 'KONSISTENSI', font=F(JBM, 44), fill=MUT)
    cells = 7 * 12
    lit = int(cells * ease_out(seg(lt, 1.0, 5.0)))
    for r in range(7):
        for c in range(12):
            i = r * 12 + c
            x0 = W//2 - 240 + c * 40; y0 = 220 + r * 40
            on = i < lit
            lvl = (i % 4) + 1 if on else 0
            cols = [(255,255,255,20), (85,230,193,60), (85,230,193,110), (85,230,193,170), (85,230,193,255)]
            d.rounded_rectangle([x0, y0, x0 + 30, y0 + 30], radius=6, fill=cols[lvl])
    # sharpness kanan
    d.text((W - 500, 150), 'SHARPNESS', font=F(JBM, 44), fill=MUT)
    sc = int(lerp(0, 812, ease_out(seg(lt, 2.0, 5.5))))
    d.text((W - 500, 200), str(sc), font=F(SG, 120), fill=MINT)
    ring(img, W - 330, 560, 130, seg(lt, 2.0, 5.5))
    return img

def S6(img, t):
    lt = t - 44.0
    shots = ['shots/home.png', 'shots/runner.png', 'shots/summary.png']
    labels = ['track harian', 'drill 25 mnt', 'naik level']
    for i, sp in enumerate(shots):
        pp = seg(lt, 0.1 + i * 0.3, 0.9 + i * 0.3)
        if pp <= 0: continue
        cx = 400 + i * 560
        _phone_partial(img, cx, 540, 660, sp, pp)
        if pp >= 1:
            d = ImageDraw.Draw(img, 'RGBA')
            tw = d.textlength(labels[i], font=F(INT, 38))
            d.text((cx - tw / 2, 900), labels[i], font=F(INT, 38), fill=MUT)
    chips = ['GRATIS', 'OFFLINE', 'PRIVAT']
    for i, c in enumerate(chips):
        p = seg(lt, 1.6 + i * 0.25, 2.0 + i * 0.25)
        if p <= 0: continue
        d = ImageDraw.Draw(img, 'RGBA')
        layer = text_layer(c, F(SG, 60), (11, 18, 32))
        bw = layer.width + 70
        a = min(1, p * 2)
        x0 = W//2 - (len(chips) * 300) // 2 + i * 300 - bw // 2
        d.rounded_rectangle([x0, 80, x0 + bw, 180], radius=18, fill=MINT + (int(255 * a),))
        paste_c(img, layer, x0 + bw / 2, 130, alpha=a)
    return img

def S7(img, t):
    lt = t - 52.0
    d = ImageDraw.Draw(img, 'RGBA')
    fade_bg = seg(lt, 0, 0.4)
    if fade_bg < 1:
        overlay = Image.new('RGBA', img.size, NAVY + (int(255 * fade_bg),))
        img.alpha_composite(overlay) if img.mode == 'RGBA' else img.paste(Image.new('RGB', img.size, NAVY), (0, 0), overlay)
    p = seg(lt, 0.4, 1.1)
    if p > 0:
        l = LOGO.resize((int(180 * ease_out(p)),) * 2, Image.LANCZOS)
        img.paste(l, (W//2 - l.width // 2, 150), l)
    p2 = seg(lt, 0.9, 1.5)
    if p2 > 0:
        paste_c(img, text_layer('SCROLL 3 JAM.', F(SG, 92), INK), W//2, 430, alpha=min(1, p2 * 2))
        paste_c(img, text_layer('MIKIR 3 MENIT?', F(SG, 92), MINT), W//2, 545, alpha=min(1, p2 * 2))
    p3 = seg(lt, 1.6, 2.2)
    if p3 > 0:
        paste_c(img, text_layer('OTAK JUGA BUTUH GYM', F(SG, 56), AMBER), W//2, 690, alpha=min(1, p3 * 2))
    p4 = seg(lt, 2.1, 2.7)
    if p4 > 0:
        d2 = ImageDraw.Draw(img, 'RGBA')
        d2.rounded_rectangle([W//2 - 330, 760, W//2 + 330, 830], radius=18, fill=(35, 58, 48))
        paste_c(img, text_layer(URL, F(JBM, 52), MINT), W//2, 795, alpha=min(1, p4 * 2))
    p5 = seg(lt, 2.6, 3.2)
    if p5 > 0:
        q = qr('https://' + URL, 160)
        qa = q.copy().convert('RGBA')
        a = qa.getchannel('A').point(lambda v: int(v * min(1, p5 * 2)))
        qa.putalpha(a)
        img.paste(qa, (W//2 - 80, 860), qa)
    # fade out akhir
    if lt > 7.0:
        a = seg(lt, 7.0, 8.0)
        ov = Image.new('RGBA', img.size, NAVY + (int(255 * a),))
        img.paste(Image.new('RGB', img.size, NAVY), (0, 0), ov)
    return img

SCENES = [(S1, 0, 6), (S2, 6, 12), (S3, 12, 24), (S4, 24, 34), (S5, 34, 44), (S6, 44, 52), (S7, 52, 60)]

def frame(fidx):
    t = fidx / FPS
    # pilih scene
    for fn, a, b in SCENES:
        if a <= t < b:
            lt_s = t - a
            img = scene_bg(1 if fn is S1 else (2 if fn in (S2, S3, S7) else 0), t)
            img = img.convert('RGBA')
            img = fn(img, t)
            # crossfade antar scene 0.4 dtk
            if lt_s < 0.4 and fidx > 0:
                pass  # transisi hard-cut dengan motion cukup — tetap sinematik
            return img.convert('RGB')
    return Image.new('RGB', (W, H), NAVY)

if __name__ == '__main__':
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    out = os.path.join(BASE, 'final', 'VistaForgy-60s-1080p.mp4')
    cmd = [ffmpeg, '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for i in range(N):
        proc.stdin.write(frame(i).tobytes())
        if i % 300 == 0:
            print(f'frame {i}/{N} ({i/FPS:.0f}s)')
    proc.stdin.close()
    proc.wait()
    print('VIDEO OK →', out)
