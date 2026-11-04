"""SH Sports Live Line - character animation themes (original characters, not copies of any sticker brand).
Every theme has its own character, backdrop and motion; every event inside a theme has its own choreography.

  umpire  - "Umpire Ramu": real ICC/MCC signals (Law 2.13 + ICC free-hit signal)
  tiger   - "Sher" the tiger mascot in an SH jersey
  digits  - "Bouncy Digits": the number itself with eyes, gloves and sneakers
  cheer   - "SH Cheer Squad": three pom-pom dancers

Run: python3 tools/characters.py [theme ...]  -> assets/themes/<theme>/<event>.mp4
"""
import math, os, random, subprocess, tempfile, shutil, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_animations import W, H, S, FPS, F, canvas, text_c, brand, dot, finish, seg, ease_out, ease_back, bounce, NAVY, RED

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'themes')
EVENTS = ['four', 'six', 'wicket', 'wide', 'freehit', 'review', 'fifty', 'hundred']

def lerp(a, b, k): return a + (b - a) * k
def smooth(t): t = max(0, min(1, t)); return t * t * (3 - 2 * t)

def keyed(keys, t):
    """keys: [(time, value)], value number or tuple -> eased interpolation."""
    if t <= keys[0][0]: return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            k = smooth((t - t0) / (t1 - t0) if t1 > t0 else 1)
            if isinstance(v0, tuple): return tuple(lerp(a, b, k) for a, b in zip(v0, v1))
            return lerp(v0, v1, k)
    return keys[-1][1]

# ------------------------------------------------------------------ humanoid rig
def capsule(d, a, b, w, fill, outline):
    (x1, y1), (x2, y2) = a, b
    d.line([(x1 * S, y1 * S), (x2 * S, y2 * S)], fill=outline, width=int((w + 4) * S))
    for x, y in (a, b): dot(d, x, y, (w + 4) / 2, outline)
    d.line([(x1 * S, y1 * S), (x2 * S, y2 * S)], fill=fill, width=int(w * S))
    for x, y in (a, b): dot(d, x, y, w / 2, fill)

def ik(sx, sy, tx, ty, L1, L2, bend=1):
    dx, dy = tx - sx, ty - sy
    dist = max(1e-3, min(L1 + L2 - .01, math.hypot(dx, dy)))
    a = math.atan2(dy, dx)
    c = (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist)
    b = math.acos(max(-1, min(1, c)))
    ea = a + bend * b
    ex, ey = sx + L1 * math.cos(ea), sy + L1 * math.sin(ea)
    k = dist / math.hypot(dx, dy) if math.hypot(dx, dy) > 0 else 1
    return (ex, ey), (sx + dx * k, sy + dy * k)

def leg(hx, hy, hip, knee, L):
    a = math.radians(hip)
    kx, ky = hx + L * math.sin(a), hy + L * math.cos(a)
    b = math.radians(hip - knee)
    return (kx, ky), (kx + L * math.sin(b), ky + L * math.cos(b))

POSE0 = dict(lean=0, jump=0, rot=0, hl=(-14, 60), hr=(14, 60), lhip=-8, lkn=0, rhip=8, rkn=0, tilt=0, mouth=0, sq=1.0)

def human(im, x, ground, pose, skin, sc=1.0, t=0.0):
    P = {**POSE0, **pose}
    d = ImageDraw.Draw(im, 'RGBA')
    LL, TL, AL = 30 * sc, 58 * sc * P['sq'], 33 * sc
    ol = skin['outline']
    hip = (x, ground - 2 * LL - P['jump'])
    lean = math.radians(P['lean'] + P['rot'])
    neck = (hip[0] + TL * math.sin(lean), hip[1] - TL * math.cos(lean))
    # legs (behind)
    for side, hipa, kn in ((-1, P['lhip'], P['lkn']), (1, P['rhip'], P['rkn'])):
        hx = hip[0] + side * 9 * sc
        k, f = leg(hx, hip[1], hipa + P['rot'], kn, LL)
        capsule(d, (hx, hip[1]), k, 15 * sc, skin['pants'], ol); capsule(d, k, f, 13 * sc, skin.get('socks', skin['pants']), ol)
        d.ellipse([(f[0] - 13 * sc) * S, (f[1] - 7 * sc) * S, (f[0] + 13 * sc) * S, (f[1] + 6 * sc) * S], fill=skin['shoes'], outline=ol, width=int(2 * S))
    if skin.get('tail'): skin['tail'](d, hip, sc, t, ol)
    # torso
    tw = 34 * sc
    perp = (math.cos(lean), math.sin(lean))
    poly = [(hip[0] - perp[0] * tw / 2 * .85, hip[1] - perp[1] * tw / 2 * .85), (hip[0] + perp[0] * tw / 2 * .85, hip[1] + perp[1] * tw / 2 * .85),
            (neck[0] + perp[0] * tw / 2, neck[1] + perp[1] * tw / 2), (neck[0] - perp[0] * tw / 2, neck[1] - perp[1] * tw / 2)]
    d.polygon([(px * S, py * S) for px, py in poly], fill=skin['shirt'], outline=ol, width=int(3 * S))
    if skin.get('torso'): skin['torso'](d, hip, neck, perp, tw, sc, ol)
    # head
    hx, hy = neck[0] + 22 * sc * math.sin(lean), neck[1] - 22 * sc * math.cos(lean)
    skin['head'](d, hx, hy, 21 * sc, P, t, ol)
    # arms (front)
    for side, key in ((-1, 'hl'), (1, 'hr')):
        sx, sy = neck[0] + side * 15 * sc * perp[0], neck[1] + side * 15 * sc * perp[1] + 4 * sc
        tx, ty = P[key]
        (ex, ey), (wx, wy) = ik(sx, sy, sx + tx * sc, sy + ty * sc, AL, AL, bend=-side)
        capsule(d, (sx, sy), (ex, ey), 12 * sc, skin['sleeve'], ol)
        capsule(d, (ex, ey), (wx, wy), 11 * sc, skin['skin'], ol)
        hand = skin.get('hand')
        if hand: hand(d, wx, wy, side, P, sc, t, ol)
        else: dot(d, wx, wy, 7.5 * sc, skin['skin'])
        if P.get('finger') == side:
            capsule(d, (wx, wy), (wx + 2 * sc, wy - 16 * sc), 5 * sc, skin['skin'], ol)
    return hip, neck, (hx, hy)

def face(d, hx, hy, r, P, t, ol, skin_col, eye=(30, 30, 30), mouth=None):
    d.ellipse([(hx - r) * S, (hy - r) * S, (hx + r) * S, (hy + r) * S], fill=skin_col, outline=ol, width=int(3 * S))
    blink = (int(t * 50) % 37) == 0
    for s_ in (-1, 1):
        ex = hx + s_ * r * .38 + P['tilt'] * .2
        if blink: d.line([((ex - 4) * S, (hy - 3) * S), ((ex + 4) * S, (hy - 3) * S)], fill=eye, width=int(2 * S))
        else: dot(d, ex, hy - 3, 3.4, eye); dot(d, ex + 1, hy - 4.2, 1.1, (255, 255, 255))
    m = P['mouth'] if mouth is None else mouth
    if m > .2: d.ellipse([(hx - 6 * m) * S, (hy + 5) * S, (hx + 6 * m) * S, (hy + 8 + 9 * m) * S], fill=(120, 20, 30), outline=ol, width=int(2 * S))
    else: d.arc([(hx - 8) * S, (hy + 1) * S, (hx + 8) * S, (hy + 11) * S], 20, 160, fill=ol, width=int(3 * S))

# ------------------------------------------------------------------ THEME 1: Umpire Ramu (ICC signals)
def ump_head(d, hx, hy, r, P, t, ol):
    face(d, hx, hy, r, P, t, ol, (198, 140, 98))
    d.ellipse([(hx - r * 1.35) * S, (hy - r * .95) * S, (hx + r * 1.35) * S, (hy - r * .55) * S], fill=(20, 22, 30), outline=ol, width=int(2 * S))   # brim
    d.chord([(hx - r * .95) * S, (hy - r * 1.75) * S, (hx + r * .95) * S, (hy - r * .35) * S], 180, 360, fill=(26, 28, 38), outline=ol, width=int(2 * S))
    d.line([((hx - r * .9) * S, (hy - r * .8) * S), ((hx + r * .9) * S, (hy - r * .8) * S)], fill=RED, width=int(3 * S))
    d.line([((hx - 9) * S, (hy + 1) * S), ((hx - 3) * S, (hy + 3) * S)], fill=(60, 40, 30), width=int(3 * S))                                   # moustache
    d.line([((hx + 9) * S, (hy + 1) * S), ((hx + 3) * S, (hy + 3) * S)], fill=(60, 40, 30), width=int(3 * S))
def ump_torso(d, hip, neck, perp, tw, sc, ol):
    d.line([(neck[0] * S, neck[1] * S), (hip[0] * S, (hip[1] - 4) * S)], fill=(200, 200, 210), width=int(2 * S))
    for k in (.3, .55, .8): dot(d, lerp(neck[0], hip[0], k) + 4, lerp(neck[1], hip[1], k), 2, (90, 90, 100))
    d.polygon([((neck[0] - 7) * S, neck[1] * S), ((neck[0] + 7) * S, neck[1] * S), (neck[0] * S, (neck[1] + 14) * S)], fill=NAVY)              # tie
UMP = dict(skin=(198, 140, 98), shirt=(244, 244, 248), sleeve=(244, 244, 248), pants=(30, 34, 52), shoes=(18, 18, 22), outline=(28, 24, 30), head=ump_head, torso=ump_torso)

def ground_bg(top=(70, 150, 230), field=(40, 120, 56)):
    im = canvas(top, (150, 200, 240))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 230 * S, W * S, H * S], fill=field)
    for k in range(0, W, 64): d.rectangle([k * S, 230 * S, (k + 32) * S, H * S], fill=(46, 132, 62))
    d.polygon([(250 * S, 230 * S), (390 * S, 230 * S), (430 * S, H * S), (210 * S, H * S)], fill=(196, 170, 110))     # pitch
    for x in (300, 320, 340): d.line([(x * S, 215 * S), (x * S, 246 * S)], fill=(240, 220, 170), width=int(4 * S))   # far stumps
    for x in range(0, W, 26): d.rectangle([x * S, 196 * S, (x + 22) * S, 230 * S], fill=(30 + (x * 7) % 40, 40, 70 + (x * 5) % 50))  # crowd
    return im

def label(im, txt, sub=None, col=(255, 255, 255), glow=(214, 32, 48, 160), y=62, size=56, k=1.0):
    if k <= .15: return
    text_c(im, (W / 2 + 150, y), txt, F(size * max(.05, k)), col, stroke=3, stroke_fill=(10, 10, 20), glow=glow)
    if sub and k >= 1: text_c(im, (W / 2 + 150, y + size * .72), sub, F(15), (240, 240, 250), stroke=2, stroke_fill=(10, 10, 20))

def umpire(ev, i, n):
    t = i / n
    im = ground_bg()
    x, g, SC = 200, 352, 1.45
    P, post = {}, []
    if ev == 'four':      # wave arm side to side, finish across the chest
        sw = t * 3.2 * math.pi
        P = dict(hr=(lerp(-10, 66, .5 + .5 * math.sin(sw)), 4 - 12 * abs(math.sin(sw))) if t < .7 else keyed([(.7, (40, 0)), (.85, (-34, 26))], t), hl=(-14, 58))
        label(im, 'FOUR', 'boundary signal', col=(130, 240, 255), glow=(0, 180, 230, 150), k=ease_back(seg(t, .2, .4)))
    elif ev == 'six':     # both arms straight above the head
        up = ease_out(seg(t, .1, .35))
        P = dict(hl=(lerp(-14, -16, up), lerp(60, -70, up)), hr=(lerp(14, 16, up), lerp(60, -70, up)), jump=6 * abs(math.sin(t * 12)) * up, mouth=.8 * up)
        label(im, 'SIX', 'both arms up', col=(255, 215, 70), glow=(255, 160, 0, 170), size=70, k=ease_back(seg(t, .3, .5)))
    elif ev == 'wicket':  # raised index finger
        up = ease_out(seg(t, .25, .45))
        P = dict(hr=(lerp(14, 6, up), lerp(60, -72, up)), finger=1 if up > .9 else 0, lean=-4 * up, tilt=0)
        def ring(d, neck):
            fx, fy = neck[0] + 15 * SC + 6 * SC, neck[1] + 4 * SC - 72 * SC - 14 * SC
            if up > .9 and int(t * 10) % 2: d.ellipse([(fx - 18) * S, (fy - 18) * S, (fx + 18) * S, (fy + 18) * S], outline=(255, 255, 255), width=int(3 * S))
        post.append(ring)
        label(im, 'OUT!', 'finger raised', col=(255, 80, 90), glow=(255, 0, 40, 170), size=74, k=ease_back(seg(t, .45, .62)))
    elif ev == 'wide':    # both arms horizontal
        out = ease_out(seg(t, .1, .4))
        P = dict(hl=(lerp(-14, -66, out), lerp(60, 0, out)), hr=(lerp(14, 66, out), lerp(60, 0, out)), lean=3 * math.sin(t * 9) * out)
        label(im, 'WIDE', '+1 run', col=(255, 196, 60), glow=(255, 150, 0, 150), k=ease_back(seg(t, .35, .55)))
    elif ev == 'freehit': # no-ball (one arm out) then free hit (arm up, hand circling)
        if t < .45:
            o = ease_out(seg(t, .05, .25)); P = dict(hr=(lerp(14, 66, o), lerp(60, 0, o)))
            label(im, 'NO BALL', 'one arm out', col=(255, 90, 90), glow=(255, 0, 40, 150), size=50, k=ease_back(seg(t, .15, .3)))
        else:
            a = (t - .45) * 26
            P = dict(hr=(18 + 12 * math.cos(a), -58 + 12 * math.sin(a)), finger=1)
            post.append(lambda d, neck: d.ellipse([(neck[0] + 15 * SC + 6 * SC) * S, (neck[1] - 82 * SC) * S, (neck[0] + 15 * SC + 42 * SC) * S, (neck[1] - 46 * SC) * S], outline=(150, 255, 120, 200), width=int(3 * S)))
            label(im, 'FREE HIT', 'arm up, hand circling', col=(170, 255, 120), glow=(40, 220, 60, 170), size=52, k=ease_back(seg(t, .5, .65)))
    elif ev == 'review':  # draws the TV rectangle with both hands
        path = [(.1, ((-4, -6), (4, -6))), (.35, ((-44, -6), (44, -6))), (.6, ((-44, 40), (44, 40))), (.8, ((-4, 40), (4, 40)))]
        lt = keyed([(k, v[0]) for k, v in path], t); rt = keyed([(k, v[1]) for k, v in path], t)
        P = dict(hl=lt, hr=rt)
        def trail(d, neck):
            sx, sy = neck[0], neck[1] + 4 * SC
            pts = []
            for tt in [k / 40 for k in range(41) if k / 40 <= t]:
                a, b = keyed([(k, v[0]) for k, v in path], tt), keyed([(k, v[1]) for k, v in path], tt)
                pts.append((sx - 15 * SC + a[0] * SC, sy + a[1] * SC)); pts.insert(0, (sx + 15 * SC + b[0] * SC, sy + b[1] * SC))
            if len(pts) > 2: d.line([(px * S, py * S) for px, py in pts], fill=(0, 230, 255, 230), width=int(5 * S))
        post.append(trail)
        label(im, 'DRS REVIEW', 'TV signal', col=(160, 240, 255), glow=(0, 160, 255, 160), size=46, k=ease_back(seg(t, .7, .85)))
    elif ev == 'fifty':   # applauding the batter
        c = abs(math.sin(t * 22))
        P = dict(hl=(-6 - 18 * c, 12), hr=(6 + 18 * c, 12), mouth=.4)
        label(im, 'FIFTY', 'well played', col=(225, 232, 245), glow=(160, 180, 220, 140), k=ease_back(seg(t, .15, .35)))
    elif ev == 'hundred': # little dance: arms up and down, hop
        ph = t * 8 * math.pi
        P = dict(hl=(-30, -40 + 30 * math.sin(ph)), hr=(30, -40 - 30 * math.sin(ph)), jump=10 * abs(math.sin(ph / 2)), lhip=-8 - 10 * math.sin(ph), rhip=8 - 10 * math.sin(ph), mouth=.9)
        d = ImageDraw.Draw(im)
        rng = random.Random(3)
        for k in range(60):
            px, py = rng.uniform(0, W), (rng.uniform(-H, 0) + t * 500 * rng.uniform(.6, 1.2))
            if 0 < py < H: d.rectangle([px * S, py * S, (px + 6) * S, (py + 3) * S], fill=rng.choice([(255, 215, 0), RED, (255, 255, 255), (40, 90, 220)]))
        label(im, 'CENTURY', '100 up!', col=(255, 214, 60), glow=(255, 150, 0, 170), size=58, k=ease_back(seg(t, .1, .3)))
    hip, neck, head = human(im, x, g, P, UMP, SC, t)
    d = ImageDraw.Draw(im, 'RGBA')
    for f in post: f(d, neck)
    brand(im)
    return finish(im)

# ------------------------------------------------------------------ THEME 2: Sher the tiger
ORANGE, DARK = (244, 140, 30), (40, 24, 10)
def tiger_head(d, hx, hy, r, P, t, ol):
    for s_ in (-1, 1):
        d.ellipse([(hx + s_ * r * .75 - 9) * S, (hy - r * 1.05) * S, (hx + s_ * r * .75 + 9) * S, (hy - r * .45) * S], fill=ORANGE, outline=ol, width=int(2 * S))
        d.ellipse([(hx + s_ * r * .75 - 4) * S, (hy - r * .95) * S, (hx + s_ * r * .75 + 4) * S, (hy - r * .6) * S], fill=(255, 210, 200))
    d.ellipse([(hx - r * 1.15) * S, (hy - r) * S, (hx + r * 1.15) * S, (hy + r) * S], fill=ORANGE, outline=ol, width=int(3 * S))
    for s_ in (-1, 1):
        for k in range(3): d.line([((hx + s_ * (r * 1.12)) * S, (hy - 6 + k * 7) * S), ((hx + s_ * r * .7) * S, (hy - 4 + k * 6) * S)], fill=DARK, width=int(3 * S))
    d.line([(hx * S, (hy - r) * S), (hx * S, (hy - r * .55) * S)], fill=DARK, width=int(4 * S))
    d.ellipse([(hx - 12) * S, (hy + 0) * S, (hx + 12) * S, (hy + r * .85) * S], fill=(255, 245, 230), outline=ol, width=int(2 * S))
    for s_ in (-1, 1): dot(d, hx + s_ * 8, hy - 6, 3.6, (20, 40, 20)); dot(d, hx + s_ * 8 + 1, hy - 7, 1.2, (255, 255, 255))
    d.polygon([((hx - 5) * S, (hy + 2) * S), ((hx + 5) * S, (hy + 2) * S), (hx * S, (hy + 7) * S)], fill=(230, 90, 110))
    m = P['mouth']
    if m > .2:
        d.ellipse([(hx - 9 * m) * S, (hy + 8) * S, (hx + 9 * m) * S, (hy + 10 + 12 * m) * S], fill=(140, 20, 30), outline=ol, width=int(2 * S))
        for s_ in (-1, 1): d.polygon([((hx + s_ * 6 * m) * S, (hy + 9) * S), ((hx + s_ * 3 * m) * S, (hy + 9) * S), ((hx + s_ * 4.5 * m) * S, (hy + 14) * S)], fill=(255, 255, 255))
    for s_ in (-1, 1):
        for k in (-1, 1): d.line([((hx + s_ * 12) * S, (hy + 9 + k * 2) * S), ((hx + s_ * 30) * S, (hy + 7 + k * 6) * S)], fill=(250, 250, 250), width=int(1.5 * S))
def tiger_torso(d, hip, neck, perp, tw, sc, ol):
    cx, cy = (hip[0] + neck[0]) / 2, (hip[1] + neck[1]) / 2
    d.text((cx * S, cy * S), 'SH', font=F(15), fill=(255, 255, 255), anchor='mm')
def tiger_tail(d, hip, sc, t, ol):
    pts = [(hip[0] - 4 - k * 6, hip[1] + 4 - 14 * math.sin(k / 3 + t * 10) - k * 2) for k in range(9)]
    d.line([(px * S, py * S) for px, py in pts], fill=ol, width=int(11 * S)); d.line([(px * S, py * S) for px, py in pts], fill=ORANGE, width=int(7 * S))
    for px, py in pts[2::2]: dot(d, px, py, 3, DARK)
def tiger_hand(d, wx, wy, side, P, sc, t, ol):
    dot(d, wx, wy, 9 * sc, ol); dot(d, wx, wy, 7.5 * sc, ORANGE)
    for k in (-1, 0, 1): dot(d, wx + k * 3.5 * sc, wy + 5 * sc, 2 * sc, (255, 240, 220))
TIG = dict(skin=ORANGE, shirt=NAVY, sleeve=ORANGE, pants=ORANGE, socks=ORANGE, shoes=(255, 245, 230), outline=(30, 16, 6), head=tiger_head, torso=tiger_torso, tail=tiger_tail, hand=tiger_hand)

def jungle_bg(t):
    im = canvas((255, 160, 60), (120, 30, 60))
    d = ImageDraw.Draw(im, 'RGBA')
    dot(d, 520, 120, 54, (255, 230, 150, 255))
    for k in range(9):
        x = k * 80 - 20
        d.polygon([(x * S, 260 * S), ((x + 40) * S, (130 + 30 * (k % 3)) * S), ((x + 80) * S, 260 * S)], fill=(60, 20, 40, 200))
    d.rectangle([0, 258 * S, W * S, H * S], fill=(70, 30, 30))
    for k in range(0, W, 18): d.line([(k * S, 258 * S), ((k + 6) * S, 240 * S)], fill=(110, 50, 30), width=int(3 * S))
    return im

def tiger(ev, i, n):
    t = i / n
    im = jungle_bg(t)
    x, g, SC = 200, 350, 1.3
    P, post = {}, []
    run = lambda ph, a=28: dict(lhip=a * math.sin(ph), lkn=30 + 30 * math.sin(ph + 1), rhip=-a * math.sin(ph), rkn=30 - 30 * math.sin(ph + 1), hl=(-20 * math.sin(ph) - 10, 40), hr=(20 * math.sin(ph) + 10, 40), lean=10, jump=4 * abs(math.sin(ph)))
    if ev == 'four':      # sprints in, skids, holds up a "4" card
        mv = ease_out(seg(t, 0, .45)); x = lerp(-60, 210, mv)
        P = run(t * 40) if t < .45 else dict(lean=-6 * (1 - seg(t, .45, .55)), hl=(-24, -40), hr=(24, -40), mouth=.5)
        if t >= .5:
            def card(d, neck, x=x):
                cy = neck[1] - 62 * SC
                d.rounded_rectangle([(x - 40) * S, (cy - 34) * S, (x + 40) * S, (cy + 34) * S], radius=10 * S, fill=(255, 255, 255), outline=NAVY, width=int(4 * S))
                text_c(im, (x, cy), '4', F(54), RED)
            post.append(card)
        if t < .5:
            d = ImageDraw.Draw(im, 'RGBA')
            for k in range(6): d.line([((x - 70 - k * 14) * S, (250 + k * 12) * S), ((x - 30 - k * 14) * S, (250 + k * 12) * S)], fill=(255, 255, 255, 120), width=int(3 * S))
        label(im, 'FOUR!', 'Sher brings the card', col=(255, 255, 255), glow=(0, 160, 230, 150), k=ease_back(seg(t, .55, .72)))
    elif ev == 'six':     # crouch, super jump, land with shake
        c = seg(t, 0, .2); up = seg(t, .2, .55); dn = seg(t, .55, .75)
        jump = 0 if t < .2 else (260 * math.sin(up * math.pi / 2) if t < .55 else 260 * (1 - bounce(dn)))
        P = dict(jump=jump, lhip=-30 * c if t < .2 else -15, lkn=50 * c if t < .2 else 30, rhip=30 * c if t < .2 else 15, rkn=50 * c if t < .2 else 30, hl=(-18, -70) if t >= .2 else (-20, 30), hr=(18, -70) if t >= .2 else (20, 30), mouth=1 if t > .2 else 0)
        shake = (random.Random(i).randint(-6, 6), 0) if .75 < t < .82 else (0, 0)
        label(im, 'SIX!', 'what a leap', col=(255, 215, 70), glow=(255, 120, 0, 170), size=72, k=ease_back(seg(t, .62, .78)))
        human(im, x, g, P, TIG, SC, t); brand(im); return finish(im, shake)
    elif ev == 'wicket':  # big roar with rings + fist pump
        r = seg(t, .25, 1)
        P = dict(mouth=1 if t > .25 else 0, lean=-8 if t > .25 else 4, hr=(30, keyed([(.25, 20), (.5, -60), (.62, 20), (.75, -60), (.85, 20)], t)), hl=(-30, 30))
        d = ImageDraw.Draw(im, 'RGBA')
        for k in range(4):
            p = (r * 2 + k * .25) % 1
            if r > 0: d.arc([(x - 40 - 160 * p) * S, (128 - 110 * p) * S, (x + 40 + 160 * p) * S, (168 + 110 * p) * S], -60, 60, fill=(255, 255, 255, int(220 * (1 - p))), width=int(4 * S))
        label(im, 'OUT!', 'ROAAAR', col=(255, 70, 80), glow=(255, 0, 30, 170), size=74, k=ease_back(seg(t, .35, .52)))
    elif ev == 'wide':    # stretches wide with a lazy yawn and sways
        s_ = ease_out(seg(t, .1, .4))
        P = dict(hl=(-66 * s_ - 14 * (1 - s_), 60 * (1 - s_) - 10 * s_), hr=(66 * s_ + 14 * (1 - s_), 60 * (1 - s_) - 10 * s_), mouth=.9 * s_ * (1 - seg(t, .6, .8)), lean=6 * math.sin(t * 10) * s_, lhip=-20 * s_, rhip=20 * s_)
        label(im, 'WIDE', 'too far, too lazy', col=(255, 200, 80), glow=(255, 140, 0, 150), k=ease_back(seg(t, .4, .6)))
    elif ev == 'freehit': # flexes, then swings a bat
        if t < .45:
            f = abs(math.sin(t * 18))
            P = dict(hl=(-40, -20 - 20 * f), hr=(40, -20 - 20 * f), mouth=.6)
            d = ImageDraw.Draw(im)
            label(im, 'NO BALL', 'Sher is pumped', col=(255, 90, 90), glow=(255, 0, 40, 150), size=50, k=ease_back(seg(t, .05, .2)))
        else:
            sw = keyed([(.45, -1.0), (.62, -1.0), (.75, 1.3), (1, 1.3)], t)
            hx, hy = 40 * math.cos(sw * 1.2 - .4), -10 + 50 * math.sin(sw * 1.2 - .4) * -1
            P = dict(hl=(hx - 8, hy), hr=(hx + 4, hy + 4), lean=-10 * sw, rhip=14, lhip=-20)
            hip, neck, head = human(im, x, g, P, TIG, SC, t)
            d = ImageDraw.Draw(im)
            bx, by = neck[0] + 15 * SC + hx * SC, neck[1] + 4 * SC + hy * SC
            ang = sw * 1.4 + math.pi / 2
            capsule(d, (bx, by), (bx + 90 * math.cos(ang), by - 90 * math.sin(ang)), 12, (230, 200, 140), (60, 40, 20))
            label(im, 'FREE HIT', 'swing hard!', col=(170, 255, 120), glow=(40, 220, 60, 170), size=52, k=ease_back(seg(t, .5, .65)))
            brand(im); return finish(im)
    elif ev == 'review':  # scratches head looking at a big screen, "?" pops
        sc = abs(math.sin(t * 16))
        P = dict(hr=(10, -56 - 6 * sc), hl=(-20, 30), tilt=10, lean=-4)
        d = ImageDraw.Draw(im, 'RGBA')
        d.rounded_rectangle([360 * S, 120 * S, 600 * S, 250 * S], radius=10 * S, fill=(10, 20, 50, 240), outline=(0, 220, 255), width=int(4 * S))
        for k in range(12): d.line([(370 * S, (130 + k * 10) * S), (590 * S, (130 + k * 10) * S)], fill=(0, 120, 200, 40 + (k * 30 + i * 8) % 80), width=S)
        text_c(im, (480, 186), 'DRS', F(42), (160, 240, 255))
        hip, neck, head = human(im, x, g, P, TIG, SC, t)
        if int(t * 6) % 2: text_c(im, (head[0] + 50, head[1] - 46), '?', F(48), (255, 255, 255), stroke=2, stroke_fill=(0, 0, 0))
        text_c(im, (480, 284), 'REVIEW', F(30), (255, 255, 255), stroke=2, stroke_fill=(0, 0, 0), glow=(0, 160, 255, 140))
        brand(im); return finish(im)
    elif ev == 'fifty':   # side-step dance with a 50 balloon
        ph = t * 6 * math.pi
        x = 200 + 24 * math.sin(ph / 2)
        P = dict(lhip=-8 + 18 * math.sin(ph), rhip=8 + 18 * math.sin(ph), hl=(-30, 20 * math.sin(ph) - 10), hr=(30, -20 * math.sin(ph) - 10), lean=6 * math.sin(ph), mouth=.5)
        d = ImageDraw.Draw(im)
        by = 90 - 10 * math.sin(t * 8)
        d.line([((x + 50) * S, (by + 40) * S), ((x + 34) * S, 230 * S)], fill=(255, 255, 255), width=int(2 * S))
        d.ellipse([(x + 14) * S, (by - 36) * S, (x + 86) * S, (by + 40) * S], fill=(200, 205, 220), outline=(60, 60, 80), width=int(3 * S))
        text_c(im, (x + 50, by), '50', F(32), NAVY)
        label(im, 'FIFTY', 'Sher dances', col=(235, 240, 250), glow=(160, 180, 220, 140), k=ease_back(seg(t, .15, .35)))
    elif ev == 'hundred': # backflip + confetti
        fl = seg(t, .15, .6)
        P = dict(rot=-360 * smooth(fl), jump=120 * math.sin(fl * math.pi), hl=(-20, -70), hr=(20, -70), lkn=60 * math.sin(fl * math.pi), rkn=60 * math.sin(fl * math.pi), mouth=.8)
        d = ImageDraw.Draw(im)
        rng = random.Random(9)
        for k in range(70):
            px, py = rng.uniform(0, W), rng.uniform(-H, 0) + t * 520 * rng.uniform(.6, 1.3)
            if 0 < py < H: d.ellipse([px * S, py * S, (px + 6) * S, (py + 6) * S], fill=rng.choice([(255, 215, 0), (255, 255, 255), RED, NAVY]))
        label(im, 'CENTURY', 'backflip!', col=(255, 214, 60), glow=(255, 150, 0, 170), size=58, k=ease_back(seg(t, .55, .72)))
    hip, neck, head = human(im, x, g, P, TIG, SC, t)
    d = ImageDraw.Draw(im, 'RGBA')
    for f in post: f(d, neck)
    brand(im)
    return finish(im)

# ------------------------------------------------------------------ THEME 3: Bouncy Digits
PASTEL = {'4': (255, 105, 180), '6': (120, 200, 255), 'W': (255, 120, 90), 'Wd': (255, 200, 80), 'NB': (255, 110, 110), 'FH': (120, 230, 140), '?': (180, 160, 255), '5': (255, 160, 220), '0': (140, 230, 220), '1': (255, 220, 120)}
def glyph(im, ch, x, y, size, col, sq=1.0, rot=0, eyes='open', shoes=True, legs=0.0, arms=None, t=0):
    """A digit/letter character drawn as ONE body (glyph + googly eyes + gloves + sneakers),
    then squashed/rotated around its feet, so eyes and limbs always stay attached."""
    B = int(size * 2.6)                      # local box (output px)
    cx, cy = B / 2, B / 2                    # glyph centre in the box
    lay = Image.new('RGBA', (B * S, B * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    ol = (40, 30, 60)
    if shoes:
        for s_ in (-1, 1):
            fx = cx + s_ * size * .2 + 12 * math.sin(legs) * s_
            fy = cy + size * .52
            d.line([((cx + s_ * size * .14) * S, (cy + size * .36) * S), (fx * S, fy * S)], fill=ol, width=int(6 * S))
            d.ellipse([(fx - 22) * S, (fy - 7) * S, (fx + 24) * S, (fy + 13) * S], fill=(250, 250, 250), outline=ol, width=int(3 * S))
            d.chord([(fx - 22) * S, (fy - 7) * S, (fx + 24) * S, (fy + 13) * S], 0, 180, fill=(70, 200, 120), outline=ol, width=int(2 * S))
    if arms:
        for s_, (ax, ay) in zip((-1, 1), arms):
            sx, sy = cx + s_ * size * .3, cy + size * .02
            d.line([(sx * S, sy * S), ((sx + ax) * S, (sy + ay) * S)], fill=ol, width=int(6 * S))
            d.ellipse([(sx + ax - 11) * S, (sy + ay - 11) * S, (sx + ax + 11) * S, (sy + ay + 11) * S], fill=(255, 255, 255), outline=ol, width=int(3 * S))
    d.text((cx * S, cy * S), ch, font=F(size), fill=col + (255,), anchor='mm', stroke_width=int(6 * S), stroke_fill=ol)
    hi = tuple(min(255, c + 60) for c in col)
    d.text(((cx - 3) * S, (cy - 4) * S), ch, font=F(size * .92), fill=hi + (90,), anchor='mm')
    ey = cy - size * .2
    for s_ in (-1, 1):
        ex = cx + s_ * size * .13
        d.ellipse([(ex - 15) * S, (ey - 17) * S, (ex + 15) * S, (ey + 17) * S], fill=(255, 255, 255), outline=ol, width=int(3 * S))
        if eyes == 'x':
            for a2 in (-1, 1): d.line([((ex - 8) * S, (ey - 8 * a2) * S), ((ex + 8) * S, (ey + 8 * a2) * S)], fill=ol, width=int(4 * S))
        elif eyes == 'wink' and s_ > 0: d.arc([(ex - 10) * S, (ey - 4) * S, (ex + 10) * S, (ey + 10) * S], 200, 340, fill=ol, width=int(4 * S))
        else:
            px = 4 * math.sin(t * 9); dot(d, ex + px, ey + 4, 7, (30, 30, 40)); dot(d, ex + px + 2.5, ey + 1.5, 2.4, (255, 255, 255))
    # squash/stretch keeps the feet on the floor; rotation pivots at the feet
    foot_y = cy + size * .62
    if sq != 1.0:
        w2, h2 = lay.size
        nw, nh = max(1, int(w2 / max(.35, sq) ** .5)), max(1, int(h2 * sq))
        sl = lay.resize((nw, nh), Image.BICUBIC)
        lay = Image.new('RGBA', (w2, h2), (0, 0, 0, 0))
        lay.paste(sl, (int((w2 - nw) / 2), int(foot_y * S - foot_y * S * sq)), sl)
    if rot:
        lay = lay.rotate(rot, center=(cx * S, foot_y * S), resample=Image.BICUBIC)
    im.paste(lay, (int((x - cx) * S), int((y - cy) * S)), lay)

def candy_bg(c1, c2):
    im = canvas(c1, c2)
    d = ImageDraw.Draw(im, 'RGBA')
    for k in range(-H, W, 46): d.line([(k * S, H * S), ((k + H) * S, 0)], fill=(255, 255, 255, 26), width=int(18 * S))
    d.ellipse([140 * S, 300 * S, 500 * S, 344 * S], fill=(0, 0, 0, 40))
    return im

def digits(ev, i, n):
    t = i / n
    if ev == 'four':      # runs in on sneakers, stops, winks
        im = candy_bg((255, 225, 240), (255, 190, 220))
        mv = ease_out(seg(t, 0, .5)); x = lerp(-80, 320, mv)
        glyph(im, '4', x, 200, 170, PASTEL['4'], sq=1 - .08 * abs(math.sin(t * 40)) * (t < .5), legs=t * 40 if t < .5 else 0, eyes='wink' if t > .7 else 'open', arms=[(-26, 30 - 50 * (t > .6)), (30, -40 if t > .6 else 30)], t=t)
        if t > .55: text_c(im, (320, 54), 'FOUR!', F(44 * ease_back(seg(t, .55, .7))), (255, 255, 255), stroke=4, stroke_fill=(200, 40, 120))
    elif ev == 'six':     # bounces higher and higher, then launches out of the top
        im = candy_bg((220, 240, 255), (160, 210, 255))
        b = t * 3
        h = [40, 80, 130][min(2, int(b))] * abs(math.sin((b % 1) * math.pi)) if t < .75 else 130 + (t - .75) * 2000
        sq = 1 - .25 * max(0, 1 - abs(math.sin((b % 1) * math.pi)) * 6) if t < .75 else 1.2
        glyph(im, '6', 320, 210 - h, 170, PASTEL['6'], sq=sq, arms=[(-30, -40), (30, -40)], t=t)
        if t > .7: text_c(im, (320, 180), 'SIX!', F(90 * ease_back(seg(t, .78, .92))), (255, 255, 255), stroke=5, stroke_fill=(30, 110, 220), glow=(80, 170, 255, 160))
    elif ev == 'wicket':  # W gets hit, eyes go X, topples over backwards
        im = candy_bg((255, 225, 210), (255, 170, 150))
        fall = ease_out(seg(t, .35, .7))
        glyph(im, 'W', 320, 205, 160, PASTEL['W'], rot=-80 * fall, eyes='x' if t > .35 else 'open', shoes=t < .35, arms=None if t > .35 else [(-30, 20), (30, 20)], t=t)
        if t < .35: dot(ImageDraw.Draw(im), lerp(-20, 300, t / .35), 150, 12, (220, 30, 40))
        if t > .4:
            d = ImageDraw.Draw(im)
            for k in range(5):
                a = t * 8 + k * 1.26
                sx_, sy_ = 455 + 46 * math.cos(a), 215 + 14 * math.sin(a)
                d.polygon([((sx_ + (11 if j % 2 == 0 else 4.5) * math.cos(-math.pi / 2 + j * math.pi / 5 + t * 6)) * S, (sy_ + (11 if j % 2 == 0 else 4.5) * math.sin(-math.pi / 2 + j * math.pi / 5 + t * 6)) * S) for j in range(10)], fill=(255, 200, 40), outline=(120, 80, 0))
            text_c(im, (320, 70), 'OUT!', F(64 * ease_back(seg(t, .55, .7))), (255, 255, 255), stroke=4, stroke_fill=(210, 40, 40))
    elif ev == 'wide':    # stretches sideways like rubber, arms out
        im = candy_bg((255, 245, 210), (255, 220, 150))
        st = .55 + .45 * math.sin(seg(t, .1, .9) * math.pi * 3) ** 2 if t > .1 else 1
        glyph(im, 'Wd', 320, 200, 140, PASTEL['Wd'], sq=st, arms=[(-90, 0), (90, 0)], t=t)
        text_c(im, (320, 56), 'W I D E', F(40), (255, 255, 255), stroke=4, stroke_fill=(220, 140, 0))
    elif ev == 'freehit': # NB spins and turns into FH
        im = candy_bg((255, 225, 225), (210, 255, 220)) if t > .5 else candy_bg((255, 225, 225), (255, 190, 190))
        sp = seg(t, .35, .65)
        ch, col = ('NB', PASTEL['NB']) if t < .5 else ('FH', PASTEL['FH'])
        glyph(im, ch, 320, 200 - 60 * math.sin(sp * math.pi), 140, col, sq=max(.15, abs(math.cos(sp * math.pi * 2))) if 0 < sp < 1 else 1, arms=[(-40, -30), (40, -30)], t=t)
        text_c(im, (320, 56), 'NO BALL' if t < .5 else 'FREE HIT!', F(40), (255, 255, 255), stroke=4, stroke_fill=(220, 50, 50) if t < .5 else (30, 160, 60))
    elif ev == 'review':  # ? mascot scans with a magnifying glass
        im = candy_bg((235, 230, 255), (200, 190, 255))
        a = math.sin(t * 7)
        glyph(im, '?', 300, 205, 170, PASTEL['?'], arms=[(-30, 30), (60 + 30 * a, -20)], t=t)
        d = ImageDraw.Draw(im)
        mx, my = 360 + 30 * a + 60, 175
        d.ellipse([(mx - 34) * S, (my - 34) * S, (mx + 34) * S, (my + 34) * S], fill=(220, 240, 255), outline=(60, 60, 90), width=int(6 * S))
        d.line([((mx - 24) * S, (my + 24) * S), ((mx - 48) * S, (my + 48) * S)], fill=(60, 60, 90), width=int(8 * S))
        text_c(im, (mx, my), 'TV', F(22), (80, 60, 180))
        text_c(im, (320, 50), 'DRS REVIEW', F(40), (255, 255, 255), stroke=4, stroke_fill=(110, 80, 220))
    elif ev == 'fifty':   # 5 and 0 hop in turns
        im = candy_bg((255, 235, 250), (230, 220, 255))
        ph = t * 6 * math.pi
        glyph(im, '5', 250, 200 - 40 * max(0, math.sin(ph)), 150, PASTEL['5'], arms=[(-30, -30), (20, 20)], t=t)
        glyph(im, '0', 400, 200 - 40 * max(0, -math.sin(ph)), 150, PASTEL['0'], arms=[(-20, 20), (30, -30)], t=t + .3)
        text_c(im, (320, 48), 'FIFTY!', F(40), (255, 255, 255), stroke=4, stroke_fill=(160, 80, 200))
    elif ev == 'hundred': # 1 rides in on two rolling 0 wheels
        im = candy_bg((255, 248, 220), (255, 225, 150))
        mv = ease_out(seg(t, 0, .6)); x = lerp(-150, 320, mv)
        rot = -mv * 720
        glyph(im, '0', x - 70, 230, 120, PASTEL['0'], rot=rot % 360, shoes=False, t=t)
        glyph(im, '0', x + 70, 230, 120, PASTEL['0'], rot=(rot + 40) % 360, shoes=False, t=t)
        glyph(im, '1', x, 120 - 10 * abs(math.sin(t * 20)) * (t < .6), 130, PASTEL['1'], shoes=False, arms=[(-40, -40), (40, -40)] if t > .6 else [(-30, 20), (30, 20)], t=t)
        d = ImageDraw.Draw(im); rng = random.Random(5)
        for k in range(50):
            px, py = rng.uniform(0, W), rng.uniform(-H, 0) + t * 480 * rng.uniform(.6, 1.2)
            if 0 < py < H and t > .55: d.rectangle([px * S, py * S, (px + 7) * S, (py + 4) * S], fill=rng.choice([(255, 105, 180), (120, 200, 255), (255, 220, 120), (120, 230, 140)]))
        if t > .62: text_c(im, (320, 330), 'CENTURY!', F(36), (255, 255, 255), stroke=4, stroke_fill=(220, 150, 0))
    brand(im)
    return finish(im)

# ------------------------------------------------------------------ THEME 4: SH Cheer Squad
def cheer_head(col_hair):
    def h(d, hx, hy, r, P, t, ol):
        d.ellipse([(hx - r * 1.1) * S, (hy - r * 1.1) * S, (hx + r * 1.1) * S, (hy + r * .4) * S], fill=col_hair)
        sw = 10 * math.sin(t * 14)
        d.ellipse([(hx + r * .6 + sw * .3) * S, (hy - r * 1.3) * S, (hx + r * 1.6 + sw) * S, (hy - r * .2) * S], fill=col_hair, outline=ol, width=int(2 * S))  # ponytail
        face(d, hx, hy + 2, r * .9, P, t, ol, (240, 190, 150))
        d.chord([(hx - r) * S, (hy - r * 1.05) * S, (hx + r) * S, (hy - r * .1) * S], 180, 360, fill=col_hair)
        d.line([((hx - r) * S, (hy - r * .5) * S), ((hx + r) * S, (hy - r * .5) * S)], fill=RED, width=int(3 * S))
    return h
def pom(col):
    def hd(d, wx, wy, side, P, sc, t, ol):
        rng = random.Random(int(wx) * 7 + side)
        for k in range(14):
            a = k / 14 * 6.28 + t * 6
            r = 14 * sc + 3 * math.sin(a * 3)
            dot(d, wx + r * .7 * math.cos(a), wy + r * .7 * math.sin(a), 6 * sc, col)
        dot(d, wx, wy, 7 * sc, tuple(min(255, c + 40) for c in col))
    return hd
def cheer_skin(hair, top, pomc):
    return dict(skin=(240, 190, 150), shirt=top, sleeve=(240, 190, 150), pants=(240, 190, 150), socks=(255, 255, 255), shoes=(250, 250, 250), outline=(40, 24, 30),
                head=cheer_head(hair), hand=pom(pomc), torso=lambda d, hip, neck, perp, tw, sc, ol: d.polygon([((hip[0] - 22 * sc) * S, (hip[1] + 16 * sc) * S), ((hip[0] + 22 * sc) * S, (hip[1] + 16 * sc) * S), ((hip[0] + 14 * sc) * S, (hip[1] - 4 * sc) * S), ((hip[0] - 14 * sc) * S, (hip[1] - 4 * sc) * S)], fill=top, outline=ol))
SQUAD = [cheer_skin((60, 30, 20), NAVY, (0, 170, 255)), cheer_skin((20, 20, 24), RED, (255, 215, 0)), cheer_skin((150, 70, 30), NAVY, (0, 170, 255))]

def stage_bg(t, tint=(40, 10, 60)):
    im = canvas(tint, (10, 4, 20))
    d = ImageDraw.Draw(im, 'RGBA')
    for k, ox in enumerate((120, 320, 520)):
        a = math.sin(t * 5 + k * 2) * 60
        d.polygon([(ox * S, 0), ((ox + a - 70) * S, 300 * S), ((ox + a + 70) * S, 300 * S)], fill=(255, 255, 255, 26))
    d.rectangle([0, 290 * S, W * S, H * S], fill=(30, 20, 40))
    d.line([(0, 290 * S), (W * S, 290 * S)], fill=(214, 32, 48), width=int(4 * S))
    return im

def cheer(ev, i, n):
    t = i / n
    im = stage_bg(t, (30, 10, 70) if ev not in ('wicket', 'freehit') else (70, 10, 20))
    xs, g, sc = (150, 320, 490), 348, 1.15
    poses = []
    for k, x in enumerate(xs):
        ph = t * 2 * math.pi * 3 + k * .9
        if ev == 'four':      # Mexican wave: arms go up one after another
            w = max(0, math.sin(t * 2 * math.pi * 2 - k * 1.2))
            P = dict(hl=(-20, 40 - 110 * w), hr=(20, 40 - 110 * w), jump=12 * w, mouth=.5 * w)
        elif ev == 'six':     # high kicks, then all jump
            if t < .55: P = dict(rhip=8 + 100 * max(0, math.sin(ph)), rkn=0, hl=(-60, -10), hr=(60, -10), lean=-6)
            else: j = math.sin(seg(t, .55, .85) * math.pi); P = dict(jump=90 * j, hl=(-26, -70), hr=(26, -70), lkn=50 * j, rkn=50 * j, mouth=.9)
        elif ev == 'wicket':  # stomp and point down, then OUT placard
            d0 = seg(t, .2, .4)
            P = dict(hr=(30, 60) if t < .6 else (40, -50), hl=(-20, 40), lean=10 * d0, lhip=-14, rhip=14, mouth=.6)
        elif ev == 'wide':    # arms wide, swaying left-right in sync
            P = dict(hl=(-64, 2), hr=(64, 2), lean=14 * math.sin(t * 10), lhip=-14, rhip=14)
        elif ev == 'freehit': # spin (squash width) then pom-poms up
            sp = seg(t, .2 + k * .05, .6 + k * .05)
            P = dict(sq=1.0, hl=(-30 * math.cos(sp * 12), -50), hr=(30 * math.cos(sp * 12), -50), rot=0, mouth=.6)
        elif ev == 'review':  # frame a TV with both hands, lean in
            P = dict(hl=(-30, -10), hr=(30, -10), lean=keyed([(0, 0), (.5, -10), (1, -10)], t), tilt=8)
        elif ev == 'fifty':   # pom-pom shake, alternating hops
            P = dict(hl=(-30, -40 + 20 * math.sin(ph * 2)), hr=(30, -40 - 20 * math.sin(ph * 2)), jump=14 * max(0, math.sin(ph + k)), mouth=.5)
        else:                 # hundred: pyramid - middle girl lifted
            up = ease_out(seg(t, .15, .5))
            P = dict(hl=(-26, -70), hr=(26, -70), jump=(110 * up if k == 1 else 0), mouth=.9) if k == 1 else dict(hl=(10 if k == 0 else -10, -60), hr=(30 if k == 0 else -30, -60), lean=(8 if k == 0 else -8) * up)
        human(im, x, g, P, SQUAD[k], sc, t + k * .2)
    d = ImageDraw.Draw(im)
    if ev == 'review':
        ny = g - 60 * sc - 58 * sc
        for x in xs: d.rectangle([(x - 40 * sc) * S, (ny - 30 * sc) * S, (x + 40 * sc) * S, (ny + 8 * sc) * S], outline=(0, 230, 255), width=int(4 * S))
    if ev == 'wicket' and t >= .6:
        for x in xs: d.rounded_rectangle([(x + 14) * S, 82 * S, (x + 88) * S, 124 * S], radius=6 * S, fill=(255, 255, 255), outline=RED, width=int(3 * S)); text_c(im, (x + 51, 103), 'OUT', F(22), RED)
    if ev == 'hundred':
        rng = random.Random(2)
        for k in range(70):
            px, py = rng.uniform(0, W), rng.uniform(-H, 0) + t * 520 * rng.uniform(.6, 1.2)
            if 0 < py < H: d.rectangle([px * S, py * S, (px + 6) * S, (py + 6) * S], fill=rng.choice([(255, 215, 0), (0, 170, 255), RED, (255, 255, 255)]))
    words = dict(four='FOUR!', six='SIX!', wicket='OUT!', wide='WIDE', freehit='FREE HIT!' if t > .3 else 'NO BALL', review='DRS REVIEW', fifty='FIFTY!', hundred='CENTURY!')
    cols = dict(four=(0, 200, 255), six=(255, 200, 0), wicket=(255, 60, 70), wide=(255, 180, 40), freehit=(120, 255, 120), review=(0, 220, 255), fifty=(220, 225, 240), hundred=(255, 210, 40))
    text_c(im, (W / 2, 44), words[ev], F(44), (255, 255, 255), stroke=3, stroke_fill=(20, 10, 30), glow=cols[ev] + (160,))
    brand(im)
    return finish(im)

THEMES = {'umpire': umpire, 'tiger': tiger, 'digits': digits, 'cheer': cheer}
SECS = dict(four=2.6, six=2.8, wicket=2.6, wide=2.4, freehit=3.2, review=3.2, fifty=2.8, hundred=3.2)

def render(theme, ev):
    fn, n = THEMES[theme], int(SECS[ev] * FPS)
    tmp = tempfile.mkdtemp()
    try:
        for i in range(n): fn(ev, i, n).save(os.path.join(tmp, f'{i:04d}.png'))
        for i in range(int(FPS * .5)): fn(ev, n - 1, n).save(os.path.join(tmp, f'{n + i:04d}.png'))
        os.makedirs(os.path.join(OUT, theme), exist_ok=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(tmp, '%04d.png'), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', os.path.join(OUT, theme, ev + '.mp4')], check=True)
    finally: shutil.rmtree(tmp)

def sheet(path, themes=None, fr=(.3, .6, .95)):
    themes = themes or list(THEMES)
    rows = [(th, ev) for th in themes for ev in EVENTS]
    im = Image.new('RGB', (W // 3 * len(fr), H // 3 * len(rows)))
    for r, (th, ev) in enumerate(rows):
        n = int(SECS[ev] * FPS)
        for c, f in enumerate(fr): im.paste(THEMES[th](ev, int(f * (n - 1)), n).resize((W // 3, H // 3)), (c * W // 3, r * H // 3))
    im.save(path)

if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] == '--sheet': sheet(args[1], args[2:] or None); sys.exit()
    for th in args or list(THEMES):
        for ev in EVENTS: render(th, ev); print('made', th, ev)
