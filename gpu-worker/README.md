# SH avatar GPU worker

Our own avatar generator: open-source models (Stable Diffusion XL + IP-Adapter + rembg) that we run ourselves.
It makes a stylised 3D-render avatar from a player's profile photo. Needs an NVIDIA GPU with 16 GB+ memory, so it cannot run on Render's normal servers.

## One-time setup (the owner)
1. Rent a GPU pod (any provider with pay-as-you-go GPUs, e.g. RunPod, Modal, Vast). Pick a 24 GB card with a PyTorch template and expose port 8000.
2. In the pod: `git clone` this repo, `cd gpu-worker`, `pip install -r requirements.txt`, then
   `AVATAR_GPU_KEY=<a long random secret you choose> uvicorn app:app --host 0.0.0.0 --port 8000`
   (first start downloads about 8 GB of model files; later starts are quick).
3. In Render, Environment tab, add `AVATAR_GPU_URL` (the pod's public https URL) and `AVATAR_GPU_KEY` (the same secret). Never paste the secret in chat.
4. In the app: Virtual match, Profile avatar, Generate avatar. Each player is generated once and saved; stop the pod when not generating to save cost.

Status: server code is tested with a mock worker; this worker has not been run on a GPU yet.

## Free Lightning AI Studio (batch mode, no inbound access needed)
A free Studio is a short session and not publicly reachable, so it pulls work instead of receiving it.
1. In Render, set env `AVATAR_GPU_KEY` to a long random string (never paste it in chat) and redeploy.
2. In the app (admin) open Profile avatar -> **Queue all players for GPU**.
3. In Lightning: New Studio, pick a GPU (T4/L4), open a terminal and run:
```
git clone https://github.com/shsportsaclub-dot/mename-shs-backend && cd mename-shs-backend/gpu-worker
pip install -r requirements.txt
export APP_URL=https://scoring-heroes-api.onrender.com AVATAR_GPU_KEY=<same key as Render>
python batch.py
```
4. Finished avatars are pushed to the server and appear in matches. Re-run in the next session for new players (already-done ones are skipped).
Untested on a real GPU: first run may need small fixes (model download size ~7 GB).
