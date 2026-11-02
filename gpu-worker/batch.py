"""Batch runner for a GPU you cannot reach from outside (free Lightning AI Studio, Colab, a home PC).
Pulls queued players from the SH server, generates each avatar with the same pipeline as app.py, pushes results back.
Env: APP_URL (e.g. https://scoring-heroes-api.onrender.com), AVATAR_GPU_KEY (same value as set in Render). Run: python batch.py"""
import base64, io, os, sys, time, json, urllib.request

APP = os.environ.get("APP_URL", "https://scoring-heroes-api.onrender.com").rstrip("/")
KEY = os.environ.get("AVATAR_GPU_KEY", "")
if not KEY:
    sys.exit("Set AVATAR_GPU_KEY first")

def call(method, path, body=None):
    req = urllib.request.Request(APP + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"x-avatar-key": KEY, "content-type": "application/json", "user-agent": "sh-avatar-batch"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())

def fetch_photo(u):
    if u.startswith("data:"):
        return u
    req = urllib.request.Request(u, headers={"user-agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read(4_000_000)
    from PIL import Image
    im = Image.open(io.BytesIO(data)).convert("RGB"); im.thumbnail((512, 512))
    b = io.BytesIO(); im.save(b, "JPEG", quality=88)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()

import app as W  # same folder: reuses load() and generate()

def main():
    q = call("GET", "/api/avatars/queue").get("players", [])
    print("queued:", len(q), flush=True)
    ok = 0
    for p in q:
        try:
            ph = fetch_photo(p["photo"]) if p.get("photo") else None
            if not ph:
                print("skip (no photo):", p["name"]); continue
            r = W.generate(W.Req(photo=ph, colour=p.get("colour", ""), team=p.get("team", ""), name=p["name"]))
            call("POST", "/api/avatars/push", {"name": p["name"], "img": r["img"]})
            ok += 1; print("done:", p["name"], flush=True)
        except Exception as e:
            print("failed:", p.get("name"), e, flush=True)
    print("finished, pushed", ok)

if __name__ == "__main__":
    main()
