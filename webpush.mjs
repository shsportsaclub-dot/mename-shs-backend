// Web Push without dependencies: VAPID (RFC 8292, ES256) + aes128gcm payload encryption (RFC 8291 / RFC 8188).
import crypto from 'node:crypto';
const b64u = b => Buffer.from(b).toString('base64url');
const unb64u = s => Buffer.from(String(s), 'base64url');

export function genVapid() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = publicKey.export({ format: 'jwk' });
  const pub = Buffer.concat([Buffer.from([4]), unb64u(jwk.x), unb64u(jwk.y)]);
  return { pub: b64u(pub), priv: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64') };
}

export function vapidHeaders(endpoint, subject, v) {
  const aud = new URL(endpoint).origin, exp = Math.floor(Date.now() / 1000) + 12 * 3600;
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })), body = b64u(JSON.stringify({ aud, exp, sub: subject }));
  const key = crypto.createPrivateKey({ key: Buffer.from(v.priv, 'base64'), format: 'der', type: 'pkcs8' });
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key, dsaEncoding: 'ieee-p1363' });
  return { Authorization: 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + v.pub };
}

const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
const hkdf = (salt, ikm, info, len) => { const prk = hmac(salt, ikm); let t = Buffer.alloc(0), out = Buffer.alloc(0), i = 1; while (out.length < len) { t = hmac(prk, Buffer.concat([t, info, Buffer.from([i++])])); out = Buffer.concat([out, t]); } return out.subarray(0, len); };

// sub = { endpoint, keys: { p256dh, auth } }; payload = string
export function encryptPayload(sub, payload, opts = {}) {
  const uaPub = unb64u(sub.keys.p256dh), authSecret = unb64u(sub.keys.auth);
  const ecdh = crypto.createECDH('prime256v1'); if (opts.asPriv) ecdh.setPrivateKey(opts.asPriv); else ecdh.generateKeys();
  const asPub = ecdh.getPublicKey(), shared = ecdh.computeSecret(uaPub);
  const salt = opts.salt || crypto.randomBytes(16);
  const ikm = hkdf(authSecret, shared, Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const plain = Buffer.concat([Buffer.from(payload, 'utf8'), Buffer.from([2])]);   // 0x02 = last record delimiter
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce), ct = Buffer.concat([c.update(plain), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, ct]);
}

export async function sendPush(sub, payload, vapid, subject = 'mailto:admin@scoringheroes.app') {
  const body = encryptPayload(sub, payload);
  const r = await fetch(sub.endpoint, { method: 'POST', headers: { ...vapidHeaders(sub.endpoint, subject, vapid), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '3600', Urgency: 'normal' }, body, signal: AbortSignal.timeout(10000) });
  return { status: r.status, gone: r.status === 404 || r.status === 410 };
}
