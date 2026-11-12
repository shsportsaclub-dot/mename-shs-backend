// Permanent media storage adapter: Supabase Storage (REST) or Cloudflare R2 (S3 API, SigV4). No dependencies.
// Chosen by env; returns null when nothing is configured so the host keeps using its local disk.
import crypto from 'node:crypto';
const hex = b => Buffer.from(b).toString('hex');
const sha = d => crypto.createHash('sha256').update(d).digest();
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
const safeKey = k => String(k).split('/').map(p => p.replace(/[^a-zA-Z0-9._-]/g, '')).filter(Boolean).join('/');
const trim = s => String(s || '').replace(/\/+$/, '');

export function sigV4Put({host, path, region = 'auto', service = 's3', accessKey, secretKey, body, mime, extraHeaders = {}, now = new Date()}) {
  const amz = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), day = amz.slice(0, 8), payload = hex(sha(body));
  const headers = {...extraHeaders, host, 'x-amz-content-sha256': payload, 'x-amz-date': amz}; if (mime) headers['content-type'] = mime;
  const names = Object.keys(headers).sort(), canonH = names.map(n => n + ':' + headers[n] + '\n').join(''), signed = names.join(';');
  const canon = ['PUT', path, '', canonH, signed, payload].join('\n');
  const scope = `${day}/${region}/${service}/aws4_request`, sts = ['AWS4-HMAC-SHA256', amz, scope, hex(sha(canon))].join('\n');
  const k = hmac(hmac(hmac(hmac('AWS4' + secretKey, day), region), service), 'aws4_request');
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signed}, Signature=${hex(hmac(k, sts))}`;
  delete headers.host; return headers;
}

export function storageFromEnv(E = {}, fetchImpl = fetch) {
  const want = String(E.MEDIA_STORAGE_PROVIDER || '').toLowerCase();
  const sbUrl = trim(E.SUPABASE_URL), sbKey = E.SUPABASE_SERVICE_KEY || '', bucket = E.MEDIA_STORAGE_BUCKET || 'media';
  if ((want === 'supabase' || (!want && sbUrl && sbKey)) && sbUrl && sbKey) return {
    provider: 'supabase', bucket,
    async put(key, bytes, mime) {
      key = safeKey(key);
      try {
        const r = await fetchImpl(`${sbUrl}/storage/v1/object/${bucket}/${key}`, {method: 'POST', headers: {authorization: 'Bearer ' + sbKey, apikey: sbKey, 'content-type': mime, 'x-upsert': 'true', 'cache-control': 'max-age=31536000'}, body: bytes});
        if (!r.ok) return {ok: false, error: 'Supabase HTTP ' + r.status};
        return {ok: true, key, url: `${sbUrl}/storage/v1/object/public/${bucket}/${key}`};
      } catch (e) { return {ok: false, error: String(e.message || e).slice(0, 120)}; }
    }};
  const acct = E.R2_ACCOUNT_ID, ak = E.R2_ACCESS_KEY_ID, sk = E.R2_SECRET_ACCESS_KEY, pub = trim(E.MEDIA_PUBLIC_BASE_URL || E.R2_PUBLIC_URL);
  if ((want === 'r2' || !want) && acct && ak && sk && pub) return {
    provider: 'r2', bucket,
    async put(key, bytes, mime) {
      key = safeKey(key);
      const host = `${acct}.r2.cloudflarestorage.com`, p = `/${bucket}/${key}`;
      try {
        const h = sigV4Put({host, path: p, accessKey: ak, secretKey: sk, body: bytes, mime});
        const r = await fetchImpl(`https://${host}${p}`, {method: 'PUT', headers: h, body: bytes});
        if (!r.ok) return {ok: false, error: 'R2 HTTP ' + r.status};
        return {ok: true, key, url: `${pub}/${key}`};
      } catch (e) { return {ok: false, error: String(e.message || e).slice(0, 120)}; }
    }};
  return null;
}
