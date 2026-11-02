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
