"""SH Sports Live Line - event animations for Telegram (sendAnimation, silent MP4 loops).
Each event has its own look AND its own motion; nothing is a reskin of another.
  four      Boundary Rush   - ball streaks along a curved rope, rope ripples, skewed 4 slides in
  six       Sky Launch      - floodlight beams, ball arcs out of the ground, 6 drops + gold sparks
  wicket    Stumps Shatter  - ball hits stumps, bails spin away, red strobe, OUT slam with shake
  wide      Arms Spread     - umpire's wide signal: two arms extend to the edges, letters spread
  freehit   Crease Alarm    - front foot over the crease flashes NO BALL, wipe to neon FREE HIT
  review    DRS Box         - glowing point draws the TV box, radar sweep, typewriter DRS REVIEW
  fifty     Silver Odometer - digits roll up to 50, silver rings pulse outward
  hundred   Century Blaze   - gold 100 rises through fireworks and falling confetti
Run: python3 tools/make_animations.py  (needs Pillow + ffmpeg). Output: assets/<name>.mp4
"""
import math, os, random, subprocess, tempfile, shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, S = 640, 360, 2           # output size, supersample factor
FPS = 25
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets')
FB = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
FBI = '/usr/share/fonts/truetype/google-fonts/Poppins-BoldItalic.ttf'
NAVY, RED = (11, 27, 74), (214, 32, 48)

def F(size, italic=False):
    return ImageFont.truetype(FBI if italic else FB, max(4, int(size * S)))

def ease_out(t): t = max(0, min(1, t)); return 1 - (1 - t) ** 3
def ease_back(t):
    t = max(0, min(1, t)); c = 1.70158
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2
def bounce(t):
    t = max(0, min(1, t))
    if t < 1 / 2.75: return 7.5625 * t * t
    if t < 2 / 2.75: t -= 1.5 / 2.75; return 7.5625 * t * t + .75
    if t < 2.5 / 2.75: t -= 2.25 / 2.75; return 7.5625 * t * t + .9375
    t -= 2.625 / 2.75; return 7.5625 * t * t + .984375
def seg(t, a, b): return max(0.0, min(1.0, (t - a) / (b - a)))

def canvas(top, bottom):
    im = Image.new('RGB', (W * S, H * S), top)
    d = ImageDraw.Draw(im)
    for y in range(H * S):
        k = y / (H * S)
        d.line([(0, y), (W * S, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * k) for i in range(3)))
    return im

def text_c(im, xy, s, font, fill, stroke=0, stroke_fill=(0, 0, 0), glow=None, anchor='mm', skew=0.0):
    x, y = xy
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text((x * S, y * S), s, font=font, fill=fill, anchor=anchor, stroke_width=int(stroke * S), stroke_fill=stroke_fill)
    if skew:
        layer = layer.transform(layer.size, Image.AFFINE, (1, skew, -skew * y * S, 0, 1, 0), resample=Image.BICUBIC)
    if glow:
        g = Image.new('RGBA', im.size, (0, 0, 0, 0))
        ImageDraw.Draw(g).text((x * S, y * S), s, font=font, fill=glow, anchor=anchor, stroke_width=int((stroke + 6) * S), stroke_fill=glow)
        if skew: g = g.transform(g.size, Image.AFFINE, (1, skew, -skew * y * S, 0, 1, 0), resample=Image.BICUBIC)
        im.paste(g.filter(ImageFilter.GaussianBlur(14 * S)), (0, 0), g.filter(ImageFilter.GaussianBlur(14 * S)))
    im.paste(layer, (0, 0), layer)

def brand(im, color=(255, 255, 255)):
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([(W - 196) * S, (H - 30) * S, (W - 10) * S, (H - 10) * S], radius=10 * S, fill=NAVY)
    d.rounded_rectangle([(W - 196) * S, (H - 30) * S, (W - 150) * S, (H - 10) * S], radius=10 * S, fill=RED)
    d.text(((W - 173) * S, (H - 20) * S), 'SH', font=F(12), fill=color, anchor='mm')
    d.text(((W - 80) * S, (H - 20) * S), 'SPORTS LIVE LINE', font=F(10), fill=color, anchor='mm')

def dot(d, x, y, r, fill):
    d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=fill)

def finish(im, shake=(0, 0)):
    out = im.resize((W, H), Image.LANCZOS)
    if shake != (0, 0):
        sh = Image.new('RGB', (W, H), (0, 0, 0)); sh.paste(out, shake); out = sh
    return out

# ---------------------------------------------------------------- FOUR: Boundary Rush
def four(i, n):
    t = i / n
    im = canvas((6, 40, 52), (3, 18, 30))
    d = ImageDraw.Draw(im)
    # outfield stripes
    for k in range(8):
        d.polygon([((k * 90 - 40) * S, H * S), ((k * 90 + 5) * S, H * S), ((k * 90 + 120) * S, 200 * S), ((k * 90 + 80) * S, 200 * S)], fill=(8, 52, 64) if k % 2 else (5, 44, 56))
    hit = seg(t, .0, .42)
    rip = seg(t, .42, .8)
    pts = []
    for x in range(-10, W + 11, 6):
        base = 250 + 0.00055 * (x - W / 2) ** 2 * -1 + 40
        amp = 16 * math.sin(rip * math.pi) * math.exp(-abs(x - W * .82) / 120)
        y = base + amp * math.sin(x / 18 - rip * 14)
        pts.append((x * S, y * S))
    d.line(pts, fill=(240, 250, 255), width=int(5 * S))
    d.line([(p[0], p[1] + 9 * S) for p in pts], fill=(0, 190, 210), width=int(2 * S))
    bx = -20 + (W * .82 + 20) * ease_out(hit)
    by = 250 - 0.00055 * (bx - W / 2) ** 2 + 30
    for k in range(10):                       # speed trail
        tx = bx - k * 18 * (1 - rip)
        dot(d, tx, by + k * .6, max(1, 8 - k * .7), (255, 70 + k * 15, 80 + k * 14))
    if hit < 1 or rip < .3:
        dot(d, bx, by, 9, (230, 30, 45)); d.arc([(bx - 9) * S, (by - 9) * S, (bx + 9) * S, (by + 9) * S], 200, 340, fill=(255, 230, 230), width=int(2 * S))
    k = ease_back(seg(t, .45, .72))
    if seg(t, .45, .72) > 0:
        x = -120 + (W * .34 + 120) * k
        text_c(im, (x, 150), '4', F(190, True), (255, 255, 255), stroke=3, stroke_fill=(0, 150, 170), glow=(0, 220, 240, 150), skew=-0.18)
        sp = 2 + 18 * (1 - ease_out(seg(t, .55, .85)))
        word = 'FOUR'
        for j, ch in enumerate(word):
            text_c(im, (W * .58 + j * (46 + sp), 162), ch, F(54, True), (0, 230, 245), stroke=1, stroke_fill=(2, 30, 40))
        text_c(im, (W * .7, 214), 'BOUNDARY', F(18), (190, 240, 245))
    brand(im)
    return finish(im)

# ---------------------------------------------------------------- SIX: Sky Launch
RNG6 = random.Random(6)
SPARK = [(RNG6.uniform(0, 2 * math.pi), RNG6.uniform(120, 300), RNG6.choice([(255, 210, 70), (255, 240, 160), (255, 150, 40)])) for _ in range(70)]
def six(i, n):
    t = i / n
    im = canvas((10, 6, 40), (40, 14, 70))
    d = ImageDraw.Draw(im, 'RGBA')
    for k, ox in enumerate((60, W - 60)):     # sweeping floodlight beams
        ang = math.radians(-70 + 35 * math.sin(t * 6 + k * 2))
        x2, y2 = ox + 700 * math.cos(ang) * (1 if k == 0 else -1), H + 700 * math.sin(ang)
        d.polygon([(ox * S, H * S), ((x2 - 60) * S, y2 * S), ((x2 + 60) * S, y2 * S)], fill=(255, 245, 200, 38))
        dot(d, ox, H - 6, 10, (255, 250, 220, 255))
    # stadium crowd silhouette
    for x in range(0, W, 8):
        d.rectangle([x * S, (H - 40 - 10 * abs(math.sin(x * .37))) * S, (x + 7) * S, H * S], fill=(16, 8, 30, 255))
    a = seg(t, 0, .38)
    if a < 1:
        bx, by = 120 + 420 * a, 300 - 520 * a + 330 * a * a
        for k in range(8): dot(d, bx - k * 9, by + k * (10 - 18 * a), 7 - k * .7, (255, 200 - k * 18, 90, 255 - k * 28))
        dot(d, bx, by, 8, (230, 40, 50, 255))
    b = seg(t, .38, .7)
    if b > 0:
        y = -120 + 300 * bounce(b)
        burst = seg(t, .5, .95)
        if burst > 0:
            for ang, dist, col in SPARK:
                r = dist * ease_out(burst)
                x, yy = W / 2 + r * math.cos(ang), 170 + r * math.sin(ang) * .7
                dot(d, x, yy, max(.5, 3.5 * (1 - burst)), col + (int(255 * (1 - burst * .8)),))
        text_c(im, (W / 2, y), '6', F(200), (255, 214, 60), stroke=4, stroke_fill=(120, 60, 0), glow=(255, 180, 40, 170))
        if b > .85: text_c(im, (W / 2, 292), 'S I X !', F(34), (255, 240, 200))
    brand(im)
    return finish(im)

# ---------------------------------------------------------------- WICKET: Stumps Shatter
def wicket(i, n):
    t = i / n
    strobe = seg(t, .3, .55)
    on = strobe > 0 and int(strobe * 8) % 2 == 0
    im = canvas((120, 0, 10), (30, 0, 6)) if on else canvas((22, 6, 12), (8, 2, 6))
    d = ImageDraw.Draw(im)
    cx, base, top = W / 2, 300, 150
    hit = seg(t, 0, .3)
    fall = ease_out(seg(t, .3, .7))
    for k, dx in enumerate((-26, 0, 26)):      # stumps
        ang = math.radians((0, 24, -12)[k] * fall)
        x1, y1 = cx + dx, base
        x2, y2 = x1 + (base - top) * math.sin(ang), base - (base - top) * math.cos(ang)
        d.line([(x1 * S, y1 * S), (x2 * S, y2 * S)], fill=(245, 225, 190), width=int(10 * S))
    for k, dirx in enumerate((-1, 1)):         # bails fly and spin
        bx = cx + dirx * 13 + dirx * 230 * fall
        by = top - 6 - 160 * fall + 260 * fall * fall
        ang = dirx * 720 * fall
        L = 16
        dx, dy = L * math.cos(math.radians(ang)), L * math.sin(math.radians(ang))
        d.line([((bx - dx) * S, (by - dy) * S), ((bx + dx) * S, (by + dy) * S)], fill=(255, 210, 120), width=int(6 * S))
    if hit < 1:
        bx = -20 + (cx + 20) * hit
        dot(d, bx, 230 + 40 * hit, 9, (255, 40, 50))
    slam = seg(t, .5, .66)
    shake = (0, 0)
    if slam > 0:
        sc = 2.4 - 1.4 * ease_out(slam)
        if slam < 1: shake = (random.Random(i).randint(-7, 7), random.Random(i + 9).randint(-5, 5))
        text_c(im, (cx, 108), 'OUT', F(110 * sc), (255, 255, 255), stroke=5, stroke_fill=(150, 0, 20), glow=(255, 30, 60, 180))
        text_c(im, (cx, 334), 'W I C K E T', F(20), (255, 170, 170))
    brand(im)
    return finish(im, shake)

# ---------------------------------------------------------------- WIDE: Arms Spread
def wide(i, n):
    t = i / n
    im = canvas((48, 30, 0), (20, 12, 0))
    d = ImageDraw.Draw(im)
    for y in range(0, H, 6):                   # horizontal scanlines drift
        if (y + i * 2) % 24 < 3: d.line([(0, y * S), (W * S, y * S)], fill=(70, 46, 6), width=S)
    cx, cy = W / 2, 170
    reach = ease_out(seg(t, .05, .45)) * (W / 2 - 20)
    d.rounded_rectangle([(cx - 34) * S, (cy - 60) * S, (cx + 34) * S, (cy + 60) * S], radius=26 * S, fill=(30, 18, 0), outline=(255, 176, 0), width=int(3 * S))
    dot(d, cx, cy - 86, 22, (255, 176, 0))
    for sgn in (-1, 1):
        x2 = cx + sgn * (34 + reach)
        d.rounded_rectangle([min(cx + sgn * 34, x2) * S, (cy - 12) * S, max(cx + sgn * 34, x2) * S, (cy + 12) * S], radius=12 * S, fill=(255, 176, 0))
        dot(d, x2, cy, 14, (255, 220, 120))
    sp = ease_out(seg(t, .4, .8))
    word = 'WIDE'
    gap = 40 + 70 * sp
    for j, ch in enumerate(word):
        text_c(im, (cx + (j - 1.5) * gap, 278), ch, F(58), (255, 196, 40), stroke=2, stroke_fill=(60, 30, 0))
    p = ease_back(seg(t, .7, .9))
    if seg(t, .7, .9) > 0: text_c(im, (cx + 200, 92), '+1', F(48 * p), (255, 255, 255), glow=(255, 176, 0, 160))
    brand(im)
    return finish(im)

# ---------------------------------------------------------------- NO BALL -> FREE HIT: Crease Alarm
def freehit(i, n):
    t = i / n
    wipe = ease_out(seg(t, .42, .58))
    a = canvas((16, 18, 22), (6, 8, 10)); d = ImageDraw.Draw(a)
    d.rectangle([0, 0, W * S, H * S], fill=(24, 60, 30))
    d.line([(0, 210 * S), (W * S, 210 * S)], fill=(255, 255, 255), width=int(6 * S))   # popping crease
    fx = 300
    foot = [(fx - 20, 182), (fx + 92, 182), (fx + 110, 204), (fx + 104, 226), (fx - 26, 226)]
    flash = int(seg(t, 0, .42) * 9) % 2 == 0
    d.polygon([(x * S, y * S) for x, y in foot], fill=(230, 40, 50) if flash else (250, 250, 250))
    d.ellipse([(fx - 40) * S, 160 * S, (fx + 130) * S, 250 * S], outline=(255, 60, 60), width=int(4 * S))
    text_c(a, (W / 2, 90), 'NO BALL', F(70), (255, 255, 255), stroke=3, stroke_fill=(170, 0, 20), glow=(255, 40, 60, 140) if flash else None)
    b = canvas((2, 18, 10), (0, 6, 4)); db = ImageDraw.Draw(b)
    for k in range(0, W, 40): db.line([(k * S, 0), ((k - 160) * S, H * S)], fill=(4, 34, 18), width=int(10 * S))
    fl = 1 if t > .7 else (1 if int(t * 40) % 3 else 0)                                   # neon flicker in
    if t > .58 and fl:
        text_c(b, (W / 2, 160), 'FREE HIT', F(92), (190, 255, 120), stroke=2, stroke_fill=(20, 80, 10), glow=(80, 255, 80, 200))
        text_c(b, (W / 2, 250), 'NEXT BALL — BATTER CAN ONLY BE RUN OUT', F(15), (170, 230, 170))
    im = a.copy()
    if wipe > 0:
        cut = int(W * S * wipe)
        im.paste(b.crop((0, 0, cut, H * S)), (0, 0))
        ImageDraw.Draw(im).line([(cut, 0), (cut, H * S)], fill=(190, 255, 120), width=int(6 * S))
    brand(im)
    return finish(im)

# ---------------------------------------------------------------- DRS REVIEW: DRS Box
def review(i, n):
    t = i / n
    im = canvas((4, 10, 34), (2, 4, 16))
    d = ImageDraw.Draw(im, 'RGBA')
    for x in range(0, W, 32): d.line([(x * S, 0), (x * S, H * S)], fill=(20, 40, 90, 90), width=S)
    for y in range(0, H, 32): d.line([(0, y * S), (W * S, y * S)], fill=(20, 40, 90, 90), width=S)
    x0, y0, x1, y1 = 120, 60, W - 120, H - 80
    per = 2 * ((x1 - x0) + (y1 - y0))
    L = per * ease_out(seg(t, 0, .4))
    pts = [(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)]
    run, head = 0, (x0, y0)
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        sl = abs(bx - ax) + abs(by - ay)
        if run + sl <= L:
            d.line([(ax * S, ay * S), (bx * S, by * S)], fill=(0, 230, 255, 255), width=int(5 * S)); head = (bx, by)
        elif run < L:
            k = (L - run) / sl; hx, hy = ax + (bx - ax) * k, ay + (by - ay) * k
            d.line([(ax * S, ay * S), (hx * S, hy * S)], fill=(0, 230, 255, 255), width=int(5 * S)); head = (hx, hy)
        run += sl
    if t < .45:
        for r in (18, 11, 6): dot(d, head[0], head[1], r, (120, 240, 255, 60 if r > 6 else 255))
    sw = seg(t, .35, 1)
    if sw > 0:                                   # radar sweep inside the box
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 + 10
        ang = sw * 2 * math.pi * 1.5
        for k in range(18):
            a2 = ang - k * .05
            d.line([(cx * S, cy * S), ((cx + 150 * math.cos(a2)) * S, (cy + 90 * math.sin(a2)) * S)], fill=(0, 255, 200, max(0, 120 - k * 7)), width=int(3 * S))
        for k in range(9):                       # ball-tracking dotted path towards stumps
            if seg(t, .45, .9) * 9 > k: dot(d, x0 + 40 + k * 28, y1 - 30 - 6 * math.sin(k / 2.5), 4, (255, 90, 90, 255))
    txt = 'DRS REVIEW'
    shown = txt[:int(len(txt) * seg(t, .45, .8) + .999)] if t > .45 else ''
    if shown:
        cursor = '▌' if int(t * 20) % 2 and len(shown) < len(txt) else ''
        text_c(im, (W / 2, y0 + 50), shown + cursor, F(46), (220, 250, 255), glow=(0, 200, 255, 120))
    if t > .82: text_c(im, (W / 2, y1 + 34), 'DECISION PENDING…', F(16), (120, 200, 230))
    brand(im)
    return finish(im)

# ---------------------------------------------------------------- FIFTY: Silver Odometer
def fifty(i, n):
    t = i / n
    im = canvas((34, 38, 48), (12, 14, 20))
    d = ImageDraw.Draw(im, 'RGBA')
    cx, cy = W / 2, 160
    for k in range(4):
        p = (t * 1.4 + k * .25) % 1
        r = 40 + 260 * p
        d.ellipse([(cx - r) * S, (cy - r * .6) * S, (cx + r) * S, (cy + r * .6) * S], outline=(220, 228, 240, int(200 * (1 - p))), width=int(3 * S))
    roll = ease_out(seg(t, 0, .6))
    for col, target in ((0, 5), (1, 0)):
        val = target * roll + (1 - roll) * (9 if col else 0) * 0 + (0 if roll >= 1 else (roll * 30 * (col + 1)) % 10)
        digit = target if roll >= 1 else int(val) % 10
        nxt = (digit + 1) % 10
        frac = 0 if roll >= 1 else val % 1
        x = cx - 52 + col * 104
        d.rounded_rectangle([(x - 48) * S, (cy - 72) * S, (x + 48) * S, (cy + 72) * S], radius=12 * S, fill=(22, 26, 34, 255), outline=(200, 210, 225, 255), width=int(3 * S))
        clip = Image.new('RGBA', im.size, (0, 0, 0, 0)); cd = ImageDraw.Draw(clip)
        cd.text((x * S, (cy - 110 * frac) * S), str(digit), font=F(120), fill=(235, 240, 250), anchor='mm')
        if frac > 0: cd.text((x * S, (cy + 110 - 110 * frac) * S), str(nxt), font=F(120), fill=(235, 240, 250), anchor='mm')
        mask = Image.new('L', im.size, 0); ImageDraw.Draw(mask).rectangle([(x - 46) * S, (cy - 70) * S, (x + 46) * S, (cy + 70) * S], fill=255)
        im.paste(clip, (0, 0), Image.composite(clip, Image.new('RGBA', im.size, (0, 0, 0, 0)), mask))
    if t > .62: text_c(im, (cx, 282), 'F I F T Y', F(40 * ease_back(seg(t, .62, .8))), (220, 228, 240), stroke=1, stroke_fill=(60, 70, 90))
    brand(im)
    return finish(im)

# ---------------------------------------------------------------- HUNDRED: Century Blaze
RNGC = random.Random(100)
CONF = [(RNGC.uniform(0, W), RNGC.uniform(-H, 0), RNGC.uniform(60, 140), RNGC.uniform(0, 6.28), RNGC.choice([(255, 215, 0), (214, 32, 48), (255, 255, 255), (40, 90, 220)])) for _ in range(90)]
FW = [(RNGC.uniform(80, W - 80), RNGC.uniform(50, 160), RNGC.uniform(.05, .6)) for _ in range(5)]
def hundred(i, n):
    t = i / n
    im = canvas((40, 22, 0), (10, 4, 0))
    d = ImageDraw.Draw(im, 'RGBA')
    for fx, fy, t0 in FW:                         # fireworks
        p = seg(t, t0, t0 + .35)
        if 0 < p < 1:
            for k in range(26):
                a = k / 26 * 2 * math.pi
                r = 80 * ease_out(p)
                dot(d, fx + r * math.cos(a), fy + r * math.sin(a) + 30 * p * p, 2.6 * (1 - p) + .5, (255, 200, 60, int(255 * (1 - p))))
    for x, y, v, ph, col in CONF:                 # confetti
        yy = y + v * t * 4.2
        if 0 <= yy <= H:
            xx = x + 14 * math.sin(ph + t * 12)
            w2 = 5 * abs(math.cos(ph + t * 10)) + 1
            d.rectangle([(xx - w2) * S, (yy - 3) * S, (xx + w2) * S, (yy + 3) * S], fill=col + (255,))
    rise = ease_out(seg(t, .1, .5))
    y = H + 80 - (H + 80 - 150) * rise
    text_c(im, (W / 2, y), '100', F(150), (255, 210, 40), stroke=4, stroke_fill=(110, 50, 0), glow=(255, 160, 0, 190))
    if t > .5: text_c(im, (W / 2, 262), 'C E N T U R Y', F(36), (255, 245, 210), glow=(255, 120, 0, 90))
    brand(im)
    return finish(im)

ANIMS = {'four': (four, 2.4), 'six': (six, 2.6), 'wicket': (wicket, 2.4), 'wide': (wide, 2.2), 'freehit': (freehit, 3.0), 'review': (review, 3.0), 'fifty': (fifty, 2.6), 'hundred': (hundred, 3.0)}

def render(name, only_frame=None):
    fn, secs = ANIMS[name]
    n = int(secs * FPS)
    if only_frame is not None: return fn(only_frame, n)
    tmp = tempfile.mkdtemp()
    try:
        for i in range(n): fn(i, n).save(os.path.join(tmp, f'{i:04d}.png'))
        for i in range(int(FPS * .6)): fn(n - 1, n).save(os.path.join(tmp, f'{n + i:04d}.png'))   # hold last frame
        os.makedirs(OUT, exist_ok=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(tmp, '%04d.png'), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', os.path.join(OUT, name + '.mp4')], check=True)
    finally:
        shutil.rmtree(tmp)

if __name__ == '__main__':
    import sys
    names = sys.argv[1:] or list(ANIMS)
    for nm in names: render(nm); print('made', nm)
