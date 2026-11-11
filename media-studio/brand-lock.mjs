// Scoring Heroes Brand Asset Lock v1
// A generated poster/reel must never ask an AI model to redraw official branding.
// Supply an approved original PNG/SVG as bytes, not a text prompt or search result.
import {createHash} from 'node:crypto';

const REGISTRY = Object.freeze({
  'scoring-heroes': Object.freeze({
    id: 'scoring-heroes',
    file: 'public/assets/brand/scoring-heroes-master.png',
    mime: 'image/png',
    // Configure after the approved master asset is uploaded.
    sha256: process.env.SH_MASTER_LOGO_SHA256 || ''
  })
});

export function brandAsset(id='scoring-heroes') {
  const asset=REGISTRY[id];
  if (!asset) throw new Error('Unregistered brand logo: '+id);
  return asset;
}

export function verifiedBrandDataUri(bytes,{id='scoring-heroes'}={}) {
  const asset=brandAsset(id);
  if (!asset.sha256 || !/^[a-f0-9]{64}$/i.test(asset.sha256))
    throw new Error('Brand master SHA-256 not configured: publishing blocked');
  if (!Buffer.isBuffer(bytes) || bytes.length<100)
    throw new Error('Missing master logo bytes: publishing blocked');
  const actual=createHash('sha256').update(bytes).digest('hex');
  if(actual.toLowerCase()!==asset.sha256.toLowerCase())
    throw new Error('Brand logo changed: publishing blocked');
  return 'data:'+asset.mime+';base64,'+bytes.toString('base64');
}

export function lockedLogoOverlay(dataUri,{x=80,y=70,width=230,height=130}={}) {
  if(!/^data:image\/(png|svg\+xml);base64,[a-z0-9+/=]+$/i.test(dataUri))
    throw new Error('Unverified brand image');
  const numeric=[x,y,width,height];
  if(numeric.some(n=>!Number.isFinite(n)||n<0)) throw new Error('Invalid logo position');
  return '<image x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+
    '" preserveAspectRatio="xMidYMid meet" href="'+dataUri+'"/>';
}

// Safe publishing contract:
// 1. Load the original approved logo bytes from the server's read-only assets.
// 2. Call verifiedBrandDataUri(bytes) once per render.
// 3. Add lockedLogoOverlay(dataUri) to the final SVG layer AFTER AI artwork.
// 4. Use the same original bytes for social, ePaper, reels, thumbnails and watermarks.
// 5. Never regenerate, recolor, crop, or substitute the master logo.
