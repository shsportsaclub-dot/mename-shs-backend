"""SH avatar GPU worker (our own service, open-source models only).
Turns a player's profile photo into a stylised 3D-render avatar PNG (transparent background):
  Stable Diffusion XL + IP-Adapter (face likeness) -> background removal (rembg) -> WebP.
Run on any rented NVIDIA GPU (16 GB+). See README.md. NOT yet tested on a GPU: first run needs checking."""
import base64, io, os
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from PIL import Image
import torch
from diffusers import StableDiffusionXLPipeline
from rembg import remove

KEY = os.environ.get("AVATAR_GPU_KEY", "")
BASE = os.environ.get("SDXL_BASE", "stabilityai/stable-diffusion-xl-base-1.0")
app = FastAPI()
pipe = None

def load():
    global pipe
    if pipe is None:
        pipe = StableDiffusionXLPipeline.from_pretrained(BASE, torch_dtype=torch.float16, variant="fp16").to("cuda")
        pipe.load_ip_adapter("h94/IP-Adapter", subfolder="sdxl_models", weight_name="ip-adapter-plus-face_sdxl_vit-h.safetensors")
        pipe.set_ip_adapter_scale(0.65)
    return pipe

class Req(BaseModel):
    photo: str
    colour: str = ""
    team: str = ""
    name: str = ""

def data_url_to_image(u):
    return Image.open(io.BytesIO(base64.b64decode(u.split(",", 1)[1]))).convert("RGB")

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/generate")
def generate(r: Req, authorization: str = Header(default="")):
    if KEY and authorization != "Bearer " + KEY:
        raise HTTPException(401, "bad key")
    p = load()
    face = data_url_to_image(r.photo)
    jersey = (r.colour + " " if r.colour else "") + "cricket jersey" + (" with %s team name" % r.team if r.team else "")
    prompt = ("3d render, pixar style stylised character, full body, standing, wearing a %s, friendly face, soft studio lighting, "
              "smooth skin, detailed hair, plain light background" % jersey)
    out = p(prompt=prompt, negative_prompt="photo, realistic skin pores, deformed, extra fingers, text, watermark, blurry",
            ip_adapter_image=face, num_inference_steps=30, guidance_scale=6.0, height=1024, width=768).images[0]
    cut = remove(out)
    cut.thumbnail((512, 700))
    buf = io.BytesIO(); cut.save(buf, "WEBP", quality=82)
    img = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    if len(img) > 380000:
        buf = io.BytesIO(); cut.save(buf, "WEBP", quality=60); img = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    return {"ok": True, "img": img}
