# lib_ad.py — pustaka produksi iklan Vista Forgy (mockup, bg, teks, QR)
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math, random

BASE = os.path.dirname(os.path.abspath(__file__))
NAVY = (11, 18, 32); PANEL = (17, 28, 46); STEEL = (23, 38, 61)
MINT = (85, 230, 193); MINT_D = (52, 168, 141); AMBER = (245, 189, 103)
SPARK = (255, 178, 82); BLUE = (126, 167, 255); INK = (232, 238, 247); MUT = (148, 163, 184)
DANGER = (255, 140, 140)
SG = os.path.join(BASE, 'fonts-ttf/SpaceGrotesk.ttf')
INT = os.path.join(BASE, 'fonts-ttf/Inter.ttf')
JBM = os.path.join(BASE, 'fonts-ttf/JetBrainsMono.ttf')
LOGO = Image.open(os.path.join(BASE, '..', 'assets', 'vista-512.png')).convert('RGBA')

def F(path, size): return ImageFont.truetype(path, size)

def bg(w, h, seed=7, grid=44, glow=True):
    img = Image.new('RGB', (w, h), NAVY)
    if glow:
        g = Image.new('RGB', (w, h), NAVY)
        gd = ImageDraw.Draw(g)
        gd.ellipse([w * 0.52, -h * 0.35, w * 1.55, h * 0.95], fill=(15, 34, 49))
        gd.ellipse([w * 0.6, -h * 0.12, w * 1.28, h * 0.6], fill=(19, 48, 60))
        img = Image.blend(img, g, 0.6)
    d = ImageDraw.Draw(img, 'RGBA')
    for x in range(0, w, grid): d.line([(x, 0), (x, h)], fill=(255, 255, 255, 7))
    for y in range(0, h, grid): d.line([(0, y), (w, y)], fill=(255, 255, 255, 7))
    rnd = random.Random(seed)
    for _ in range(max(20, (w * h) // 90000)):
        x, y = rnd.randint(0, w), rnd.randint(0, h); s = rnd.choice([2, 2, 3])
        c = rnd.choice([MINT, AMBER, BLUE])
        d.rectangle([x, y, x + s, y + s], fill=c + (rnd.randint(80, 190),))
    return img

def wrap(d, text, font, maxw):
    words = text.split(); lines = []; cur = ''
    for w2 in words:
        t = (cur + ' ' + w2).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w2
    if cur: lines.append(cur)
    return lines

def draw_lines(d, lines, font, x, y, lh, fill, align='left', maxw=None, center_x=None):
    for i, l in enumerate(lines):
        if align == 'center':
            tw = d.textlength(l, font=font)
            d.text((center_x - tw / 2, y + i * lh), l, font=font, fill=fill)
        else:
            d.text((x, y + i * lh), l, font=font, fill=fill)

def rounded_shadow(img, box, radius, blur=18, alpha=120, offset=(0, 14)):
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    x0, y0, x1, y1 = box
    sd.rounded_rectangle([x0 + offset[0], y0 + offset[1], x1 + offset[0], y1 + offset[1]], radius=radius, fill=(0, 0, 0, alpha))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    img.paste(Image.new('RGB', img.size, (0, 0, 0)), (0, 0), sh)

def phone(img, cx, cy, ph_h, shot_path, tilt=0, glow_mint=True, scale=2):
    """Mockup HP: frame + screenshot (390x844 @scale) di (cx,cy) pusat, tinggi ph_h, tilt derajat."""
    shot = Image.open(shot_path).convert('RGB')
    sw, sh_ = 390 * scale, 844 * scale
    ratio = ph_h / sh_
    pw_ = int(sw * ratio)
    shot = shot.resize((pw_, ph_h), Image.LANCZOS)
    frame_w = int(pw_ * 0.055)
    rad = int(ph_h * 0.045)
    fw, fh = pw_ + frame_w * 2, ph_h + frame_w * 2
    # frame
    body = Image.new('RGBA', (fw + 60, fh + 60), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    bd.rounded_rectangle([30, 30, 30 + fw, 30 + fh], radius=rad, fill=STEEL)
    bd.rounded_rectangle([30 + 4, 30 + 4, 30 + fw - 4, 30 + fh - 4], radius=rad - 4, fill=(7, 17, 23))
    # punch hole
    hole_r = int(frame_w * 0.85)
    bd.ellipse([30 + fw / 2 - hole_r, 30 + hole_r * 0.7, 30 + fw / 2 + hole_r, 30 + hole_r * 2.7], fill=(0, 0, 0, 255))
    mask = Image.new('L', (pw_, ph_h), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, pw_, ph_h], radius=rad - 6, fill=255)
    body.paste(shot, (30 + frame_w, 30 + frame_w), mask)
    if tilt:
        body = body.rotate(tilt, expand=True, resample=Image.BICUBIC)
    if glow_mint:
        gl = Image.new('RGBA', img.size, (0, 0, 0, 0))
        gd2 = ImageDraw.Draw(gl)
        bx = int(cx - body.width / 2); by = int(cy - body.height / 2)
        gd2.rounded_rectangle([bx - 26, by - 26, bx + body.width + 26, by + body.height + 26], radius=rad + 26, fill=MINT + (60,))
        gl = gl.filter(ImageFilter.GaussianBlur(42))
        img.paste(Image.new('RGB', img.size, (0, 0, 0)), (0, 0), gl)
    px = int(cx - body.width / 2); py = int(cy - body.height / 2)
    # drop shadow
    rounded_shadow(img, [px + 20, py + 20, px + body.width - 20, py + body.height - 20], rad, blur=30, alpha=140, offset=(0, 26))
    img.paste(body, (px, py), body)
    return img

def qr(url, size, dark=(11, 18, 32), light=(255, 255, 255)):
    import segno
    q = segno.make(url, error='m')
    fn = '/tmp/_vf_qr.png'
    q.save(fn, scale=16, border=2, dark='#%02x%02x%02x' % dark, light='#%02x%02x%02x' % light)
    return Image.open(fn).convert('RGB').resize((size, size), Image.LANCZOS)

def logo_badge(img, x, y, h=86, with_text=True, text_color=INK):
    l = LOGO.resize((h, h), Image.LANCZOS)
    img.paste(l, (x, y), l)
    if with_text:
        d = ImageDraw.Draw(img)
        f = F(SG, int(h * 0.42))
        d.text((x + h + 14, y + h * 0.16), 'VISTA FORGY', font=f, fill=text_color)
        f2 = F(JBM, int(h * 0.2))
        d.text((x + h + 16, y + h * 0.62), 'GYM-NYA OTAK', font=f2, fill=MINT)
    return img
