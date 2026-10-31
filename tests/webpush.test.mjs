import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { genVapid, vapidHeaders, encryptPayload } from '../webpush.mjs';
const unb64u = s => Buffer.from(s, 'base64url');
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
const hkdf = (salt, ikm, info, len) => { const prk = hmac(salt, ikm); let t = Buffer.alloc(0), out = Buffer.alloc(0), i = 1; while (out.length < len) { t = hmac(prk, Buffer.concat([t, info, Buffer.from([i++])])); out = Buffer.concat([out, t]); } return out.subarray(0, len); };

test('payload encrypts so the browser side can decrypt it (RFC 8291 round trip)', () => {
  const ua = crypto.createECDH('prime256v1'); ua.generateKeys(); const auth = crypto.randomBytes(16);
  const sub = { endpoint: 'https://push.example/x', keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } };
  const msg = JSON.stringify({ title: 'Wicket', body: 'India 120/4', url: '/?match=m1' });
  const rec = encryptPayload(sub, msg);
  const salt = rec.subarray(0, 16), rs = rec.readUInt32BE(16), idlen = rec[20], asPub = rec.subarray(21, 21 + idlen), ct = rec.subarray(21 + idlen);
  assert.equal(rs, 4096); assert.equal(idlen, 65);
  const shared = ua.computeSecret(asPub), uaPub = ua.getPublicKey();
  const ikm = hkdf(auth, shared, Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce); d.setAuthTag(ct.subarray(ct.length - 16));
  const plain = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  assert.equal(plain[plain.length - 1], 2); assert.equal(plain.subarray(0, plain.length - 1).toString(), msg);
});

test('RFC 8291 appendix A test vector decrypts to the known plaintext', () => {
  // values from RFC 8291 section 5 / appendix A
  const plaintext = 'When I grow up, I want to be a watermelon';
  const asPriv = unb64u('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw'), uaPub = unb64u('BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4');
  const auth = unb64u('BTBZMqHH6r4Tts7J_aSIgg'), salt = unb64u('DGv6ra1nlYgDCS1FRnbzlw');
  const sub = { endpoint: 'https://push.example/x', keys: { p256dh: uaPub.toString('base64url'), auth: auth.toString('base64url') } };
  const rec = encryptPayload(sub, plaintext, { asPriv, salt });
  const expected = unb64u('DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN');
  assert.equal(rec.toString('base64url'), expected.toString('base64url'));
});

test('VAPID header carries a valid ES256 signature for the endpoint origin', () => {
  const v = genVapid(); const h = vapidHeaders('https://fcm.googleapis.com/fcm/send/abc', 'mailto:a@b.c', v).Authorization;
  const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(h); assert.ok(m); assert.equal(m[4], v.pub);
  const claims = JSON.parse(Buffer.from(m[2], 'base64url')); assert.equal(claims.aud, 'https://fcm.googleapis.com'); assert.ok(claims.exp > Date.now() / 1000);
  const x = unb64u(v.pub); const key = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: x.subarray(1, 33).toString('base64url'), y: x.subarray(33).toString('base64url') }, format: 'jwk' });
  assert.ok(crypto.verify('sha256', Buffer.from(m[1] + '.' + m[2]), { key, dsaEncoding: 'ieee-p1363' }, unb64u(m[3])));
});
