// Scoring Heroes backend: OTP SMS from "SH Sports" + magic login link + live cricket proxy.
// Zero dependencies. Needs Node 20.6 or newer.   Run:  node --env-file=.env server.js
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const E = process.env;
const PORT = +E.PORT || 8080;
const APP_URL = (E.APP_URL || 'http://localhost:5500').replace(/\/$/, '');   // where the Scoring Heroes web app is hosted (HTTPS in production)
const ORIGINS = (E.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean); // empty = allow any origin (dev only)
const SMS_PROVIDER = E.SMS_PROVIDER || 'console';           // console | msg91
const COUNTRY = E.COUNTRY_CODE || '91';
const CRIC_KEY = E.CRIC_API_KEY || '';
const CRIC_BASE = E.CRIC_BASE || 'https://api.cricapi.com/v1';
const LIVE_TTL = (+E.LIVE_CACHE_SECONDS || 60) * 1000;
const ADMINS = (E.ADMIN_PHONES || '').split(',').map(s => s.replace(/\D/g, '').slice(-10)).filter(Boolean);
const SCORERS = (E.SCORER_PHONES || '').split(',').map(s => s.replace(/\D/g, '').slice(-10)).filter(Boolean);
const MO_NUMBER = E.MO_NUMBER || '';            // the SH Sports number users send the SMS to, e.g. +919XXXXXXXXX
const MO_KEYWORD = (E.MO_KEYWORD || 'SH').toUpperCase();
const WEBHOOK_SECRET = E.WEBHOOK_SECRET || '';
const WA_NUMBER = String(E.WA_NUMBER || '').replace(/\D/g, '');   // SH Sports WhatsApp number with country code, e.g. 919XXXXXXXXX
const WA_VERIFY_TOKEN = E.WA_VERIFY_TOKEN || '';                 // any secret word; paste the same in Meta webhook setup
const DATA_FILE = E.DATA_FILE || './data.json';
const SECRET = E.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!E.SESSION_SECRET) console.warn('SESSION_SECRET not set: sessions reset on every restart.');

let db = { users: {} };
try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch {}
const saveDb = () => fs.writeFileSync(DATA_FILE, JSON.stringify(db));

const pending = new Map();   // phone -> {hash,salt,exp,tries,mode,profile,linkToken}
const links = new Map();     // linkToken -> {phone,exp}
const sends = new Map();     // key -> [timestamps]

const digits = s => String(s || '').replace(/\D/g, '').slice(-10);
const validPhone = p => /^[6-9]\d{9}$/.test(p);
const hashCode = (code, salt) => crypto.createHash('sha256').update(salt + code).digest('hex');
const safeEq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const sign = phone => { const body = b64({ p: phone, e: Date.now() + 30 * 864e5 }); return body + '.' + crypto.createHmac('sha256', SECRET).update(body).digest('base64url'); };
function readSession(tok) {
  const [body, sig] = String(tok || '').split('.');
  if (!body || !sig) return null;
  const ok = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (!safeEq(sig, ok)) return null;
  try { const o = JSON.parse(Buffer.from(body, 'base64url').toString()); return o.e > Date.now() ? o.p : null; } catch { return null; }
}
function limited(key, max, windowMs) {
  const now = Date.now(), arr = (sends.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) { sends.set(key, arr); return true; }
  arr.push(now); sends.set(key, arr); return false;
}
function roleFor(phone, kind) {
  if (ADMINS.includes(phone) || Object.keys(db.users).length === 0) return 'admin';   // the very first user becomes admin
  if (kind === 'Scorer' && SCORERS.includes(phone)) return 'scorer';
  return 'viewer';                                                                    // everyone else; promote via ADMIN_PHONES / SCORER_PHONES
}
function cleanProfile(p) {
  p = p || {};
  const nick = String(p.nick || '').trim(), kind = ['Player', 'Fan', 'Scorer', 'Organiser'].includes(p.kind) ? p.kind : 'Fan';
  if (!/^[A-Za-z0-9_.]{3,20}$/.test(nick)) return { error: 'Nickname must be 3-20 letters, numbers, dot or underscore' };
  const age = Math.round(+p.age);
  if (!(age >= 5 && age <= 90)) return { error: 'Enter a valid age' };
  const email = String(p.email || '').trim().slice(0, 100);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Enter a valid email' };
  return { profile: { nick, name: nick, email, age, loc: String(p.loc || '').trim().slice(0, 60), kind } };
}
const pub = u => ({ nick: u.nick, name: u.nick, email: u.email, age: u.age, loc: u.loc, kind: u.kind, role: u.role, phone: u.phone });

async function sendSms(phone, code, link, cc) {
  cc = String(cc || '').replace(/\D/g, '').slice(0, 4) || COUNTRY;
  if (SMS_PROVIDER === 'console') { console.log(`[SMS to ${phone}] code ${code}  link ${link}`); return; }
  if (SMS_PROVIDER === 'msg91') {
    // MSG91 Flow API. Template variables in your MSG91 template: ##otp## and ##link##
    const r = await fetch('https://control.msg91.com/api/v5/flow', {
      method: 'POST',
      headers: { authkey: E.MSG91_AUTHKEY || '', 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ template_id: E.MSG91_TEMPLATE_ID, short_url: E.MSG91_SHORT_URL || '1', recipients: [{ mobiles: cc + phone, otp: code, link }] })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.type === 'error') throw new Error('MSG91 ' + JSON.stringify(j));
    return;
  }
  throw new Error('Unknown SMS_PROVIDER');
}

function complete(phone, p) {
  pending.delete(phone); links.delete(p.linkToken);
  let u = db.users[phone];
  if (!u && p.mode === 'reg' && p.profile) {
    u = db.users[phone] = { ...p.profile, phone, role: roleFor(phone, p.profile.kind), created: Date.now() };
    saveDb();
  }
  const session = sign(phone);
  return { ok: true, phone, profile: u ? pub(u) : null, session, token: session };
}

let live = { t: 0, data: null, ttl: LIVE_TTL, err: '' };
let sched = { t: 0, rows: [] };            // the "matches" (upcoming) list changes slowly, so fetch it rarely
const LIVE_FILE = path.join(path.dirname(E.DATA_FILE || './data.json'), 'live-cache.json');
try { const c = JSON.parse(fs.readFileSync(LIVE_FILE, 'utf8')); if (c && c.data) live = { t: 0, data: c.data, ttl: LIVE_TTL, err: '' }; } catch (e) {}
// The free cricket plan allows ~100 calls a day, so spread the remaining calls over the rest of the (UTC) day.
function liveTtl(info) {
  if ((+(info && info.hitsLimit) || 0) > 5000) return LIVE_TTL;   // generous plan: refresh every LIVE_CACHE_SECONDS (default 60 s)
  const lim = +(info && info.hitsLimit) || 100, used = +(info && info.hitsToday) || 0, left = Math.max(1, lim - used - 8);
  const now = new Date(), end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1), secs = (end - now) / 1000;
  return Math.min(60 * 60e3, Math.max(5 * 60e3, secs / left * 1000 * 1.15));
}
async function liveMatches() {
  if (!CRIC_KEY) throw Object.assign(new Error('CRIC_API_KEY is not set on the server'), { code: 503 });
  if (live.data && Date.now() - live.t < live.ttl) return live.data;
  try {
    const get = async ep => (await fetch(`${CRIC_BASE}/${ep}?apikey=${encodeURIComponent(CRIC_KEY)}&offset=0`)).json();
    const j = await get('currentMatches');
    if (j.status !== 'success') throw new Error(j.reason || 'Cricket API error');
    if (Date.now() - sched.t > 3 * 3600e3) {
      try { const j2 = await get('matches'); if (j2.status === 'success') sched = { t: Date.now(), rows: j2.data || [] }; else sched.t = Date.now() - 2 * 3600e3; } catch (e) { sched.t = Date.now() - 2 * 3600e3; }
    }
    const seen = new Set(), rows = [...(j.data || []), ...sched.rows].filter(m => m && m.id && !seen.has(m.id) && seen.add(m.id));
    const matches = rows.map(m => ({
      id: m.id, name: m.name, type: m.matchType, status: m.status, venue: m.venue, date: m.date, time: m.dateTimeGMT || '',
      started: !!m.matchStarted, ended: !!m.matchEnded,
      teams: (m.teamInfo && m.teamInfo.length ? m.teamInfo : (m.teams || []).map(n => ({ name: n, shortname: String(n).slice(0, 3).toUpperCase() })))
        .map(t => ({ name: t.name, short: t.shortname, img: t.img || '' })),
      score: (m.score || []).map(s => ({ inning: s.inning, r: s.r, w: s.w, o: s.o }))
    }));
    const info = { hitsToday: j.info && j.info.hitsToday, hitsLimit: j.info && j.info.hitsLimit };
    live = { t: Date.now(), ttl: liveTtl(j.info), err: '', data: { ok: true, matches, info, refreshEverySec: Math.round(liveTtl(j.info) / 1000), updated: new Date().toISOString() } };
    try { fs.writeFileSync(LIVE_FILE, JSON.stringify({ data: live.data })); } catch (e) {}
    return live.data;
  } catch (e) {
    live.t = Date.now(); live.ttl = 30 * 60e3; live.err = e.message;   // provider refused (usually the daily limit): back off 30 min
    if (live.data) return { ...live.data, stale: true, note: e.message };
    throw e;
  }
}

const routes = {
  'POST /api/otp/send': async (req, body, ip) => {
    const phone = digits(body.phone);
    if (!validPhone(phone)) return [400, { ok: false, error: 'Enter a valid 10-digit mobile number' }];
    const mode = body.mode === 'reg' ? 'reg' : body.mode === 'login' ? 'login' : 'plain', existing = db.users[phone];
    if (mode === 'reg' && existing) return [200, { ok: true, exists: true }];
    if (mode === 'login' && !existing) return [200, { ok: false, noAccount: true, error: 'No account for this number. Please register.' }];
    let profile = null;
    if (mode === 'reg') {
      const c = cleanProfile(body.profile);
      if (c.error) return [400, { ok: false, error: c.error }];
      if (Object.values(db.users).some(u => u.nick.toLowerCase() === c.profile.nick.toLowerCase())) return [400, { ok: false, error: 'That nickname is taken' }];
      profile = c.profile;
    }
    if (limited('p:' + phone + ':30s', 1, 30e3)) return [429, { ok: false, error: 'Please wait 30 seconds before asking for another code' }];
    if (limited('p:' + phone, 5, 36e5) || limited('ip:' + ip, 30, 36e5)) return [429, { ok: false, error: 'Too many requests. Try again later.' }];
    const code = String(crypto.randomInt(100000, 1000000)), salt = crypto.randomBytes(8).toString('hex'), linkToken = crypto.randomBytes(16).toString('hex');
    pending.set(phone, { hash: hashCode(code, salt), salt, exp: Date.now() + 5 * 60e3, tries: 0, mode, profile, linkToken });
    links.set(linkToken, { phone, exp: Date.now() + 10 * 60e3 });
    try { await sendSms(phone, code, `${APP_URL}/#v=${linkToken}`, body.cc); }
    catch (e) { console.error(e.message); return [502, { ok: false, error: 'SMS provider error' }]; }
    return [200, { ok: true, exists: false, ...(SMS_PROVIDER === 'console' ? { devCode: code, devOtp: code } : {}) }];
  },
  'POST /api/otp/verify': async (req, body) => {
    const phone = digits(body.phone), p = pending.get(phone);
    if (!p || p.exp < Date.now()) return [400, { ok: false, error: 'Code expired. Please request a new one.' }];
    if (p.tries >= 5) { pending.delete(phone); return [429, { ok: false, error: 'Too many wrong attempts. Request a new code.' }]; }
    p.tries++;
    if (!safeEq(hashCode(String(body.code || body.otp || ''), p.salt), p.hash)) return [400, { ok: false, error: 'Wrong code, try again' }];
    return [200, complete(phone, p)];
  },
  'POST /api/otp/link': async (req, body) => {
    const l = links.get(String(body.token || ''));
    if (!l || l.exp < Date.now()) return [400, { ok: false, error: 'This link has expired. Please request a new code.' }];
    const p = pending.get(l.phone);
    if (!p) return [400, { ok: false, error: 'This link was already used.' }];
    return [200, { ...complete(l.phone, p), phone: l.phone }];
  },
  'GET /api/me': async (req) => {
    const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, ''));
    const u = phone && db.users[phone];
    return u ? [200, { ok: true, profile: pub(u) }] : [401, { ok: false, error: 'Not signed in' }];
  },
  'GET /api/live': async () => {
    try { return [200, await liveMatches()]; }
    catch (e) { return [e.code || 502, { ok: false, error: e.message }]; }
  },
  'GET /health': async () => [200, { ok: true }]
};

// ---- Match scorecard / player profile proxy (key stays on the server) ----
const cricCache = new Map();
routes['GET /api/cric'] = async (req, body, ip) => {
  const ep = String(body.ep || ''), id = String(body.id || '');
  if (!['match_scorecard', 'players_info', 'match_info'].includes(ep) || !/^[0-9a-f-]{8,40}$/i.test(id)) return [400, { ok: false, error: 'Bad request' }];
  if (!CRIC_KEY) return [503, { ok: false, error: 'CRIC_API_KEY is not set on the server' }];
  if (limited('cric:' + ip, 120, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
  const k = ep + id, hit = cricCache.get(k), ttl = ep === 'players_info' ? 864e5 : 45e3;
  if (hit && Date.now() - hit.t < ttl) return [200, hit.d];
  try {
    const r = await fetch(`${CRIC_BASE}/${ep}?apikey=${encodeURIComponent(CRIC_KEY)}&id=${encodeURIComponent(id)}`);
    const j = await r.json();
    if (j.status !== 'success') return [502, { ok: false, error: j.reason || 'Cricket API error' }];
    const d = { ok: true, data: j.data }; cricCache.set(k, { t: Date.now(), d }); if (cricCache.size > 500) cricCache.clear();
    return [200, d];
  } catch { return [502, { ok: false, error: 'Cricket API unreachable' }]; }
};



const moPending = new Map();  // ref -> {code,phone,exp,verified,used}
const pick = (b, ...k) => { for (const x of k) if (b[x] != null && b[x] !== '') return String(b[x]); return ''; };
async function moInbound(req, body) {
  if (WEBHOOK_SECRET && body.key !== WEBHOOK_SECRET) return [403, { ok: false, error: 'Forbidden' }];
  const from = digits(pick(body, 'from', 'From', 'sender', 'mobile', 'msisdn', 'cli', 'number', 'mobiles'));
  const text = pick(body, 'text', 'Body', 'message', 'content', 'body', 'smstext', 'sms', 'keyword');
  const m = /(\d{6})/.exec(text);
  if (!from || !m) return [200, { ok: false }];
  for (const r of moPending.values()) {
    if (!r.verified && r.exp > Date.now() && r.code === m[1] && r.phone === from) { r.verified = true; return [200, { ok: true }]; }
  }
  return [200, { ok: false }];
}
routes['POST /api/mo/start'] = async (req, body, ip) => {
  if (!MO_NUMBER && !WA_NUMBER) return [404, { ok: false, error: 'SMS-to-number login is not enabled' }];
  const phone = digits(body.phone);
  if (!validPhone(phone)) return [400, { ok: false, error: 'Enter a valid 10-digit mobile number' }];
  if (limited('mo:' + phone, 10, 36e5) || limited('moip:' + ip, 40, 36e5)) return [429, { ok: false, error: 'Too many attempts. Try again later.' }];
  const code = String(crypto.randomInt(100000, 1000000)), ref = crypto.randomBytes(12).toString('hex');
  moPending.set(ref, { code, phone, exp: Date.now() + 10 * 60e3, verified: false, used: false });
  const text = MO_KEYWORD + ' ' + code;
  return [200, { ok: true, ref, to: MO_NUMBER, text, wa: WA_NUMBER ? 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text) : '' }];
};
routes['POST /api/mo/status'] = async (req, body) => {
  const r = moPending.get(String(body.ref || ''));
  if (!r || r.exp < Date.now() || r.used) return [200, { ok: false, expired: true }];
  if (!r.verified) return [200, { ok: true, verified: false }];
  r.used = true;
  return [200, { ok: true, verified: true, phone: r.phone, token: sign(r.phone) }];
};

// ---- WhatsApp login: user taps a button, WhatsApp opens with the code typed in, they press send.
// Meta WhatsApp Cloud API calls this webhook; we read the sender number + code and mark the login verified.
routes['GET /api/wa/webhook'] = async (req, body) => {
  if (body['hub.mode'] === 'subscribe' && WA_VERIFY_TOKEN && body['hub.verify_token'] === WA_VERIFY_TOKEN) return [200, String(body['hub.challenge'] || '')];
  return [403, { ok: false }];
};
routes['POST /api/wa/webhook'] = async (req, body) => {
  try {
    for (const en of body.entry || []) for (const ch of en.changes || []) for (const m of (ch.value && ch.value.messages) || []) {
      const from = digits(m.from), t = (m.text && m.text.body) || '', c = /(\d{6})/.exec(t);
      if (!from || !c) continue;
      for (const r of moPending.values()) if (!r.verified && r.exp > Date.now() && r.code === c[1] && r.phone === from) r.verified = true;
    }
  } catch {}
  return [200, { ok: true }];   // always 200 so Meta does not retry
};

// ---- Live stream links: anyone can read, admins and scorers can set ----
routes['GET /api/streams'] = async () => [200, { ok: true, streams: db.streams || {} }];
routes['POST /api/streams'] = async (req, body) => {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u || !['admin', 'scorer'].includes(u.role)) return [403, { ok: false, error: 'Only admins and scorers can set stream links' }];
  const key = String(body.key || ''), url = String(body.url || '').trim();
  if (!/^[mw][\w-]{1,80}$/.test(key)) return [400, { ok: false, error: 'Bad match key' }];
  if (url && (!/^https:\/\//i.test(url) || url.length > 500)) return [400, { ok: false, error: 'The link must start with https://' }];
  db.streams = db.streams || {};
  if (url) db.streams[key] = url; else delete db.streams[key];
  saveDb();
  return [200, { ok: true, streams: db.streams }];
};
routes['POST /api/mo/inbound'] = moInbound;
routes['GET /api/mo/inbound'] = moInbound;
setInterval(() => { const n = Date.now(); for (const [k, v] of moPending) if (v.exp < n) moPending.delete(k); }, 6e4).unref();


// ---- Sports news (Google News RSS, cached 10 min) ----
const NEWS_BASE = E.NEWS_BASE || 'https://news.google.com/rss/search';
const NEWS_QUERY = E.NEWS_QUERY || 'cricket';
let newsC = { t: 0, data: null };
const decode = x => String(x || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
routes['GET /api/news'] = async () => {
  if (newsC.data && Date.now() - newsC.t < 6e5) return [200, newsC.data];
  try {
    const r = await fetch(`${NEWS_BASE}?q=${encodeURIComponent(NEWS_QUERY)}&hl=en-IN&gl=IN&ceid=IN:en`);
    const xml = await r.text();
    const items = xml.split('<item>').slice(1, 15).map(it => {
      const g = re => { const m = re.exec(it); return m ? decode(m[1]) : ''; };
      let title = g(/<title>([\s\S]*?)<\/title>/), source = g(/<source[^>]*>([\s\S]*?)<\/source>/);
      if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
      return { title, link: g(/<link>([\s\S]*?)<\/link>/), source, date: g(/<pubDate>([\s\S]*?)<\/pubDate>/) };
    }).filter(x => x.title);
    newsC = { t: Date.now(), data: { ok: true, items } };
    return [200, newsC.data];
  } catch (e) { return newsC.data ? [200, newsC.data] : [502, { ok: false, error: 'News unavailable' }]; }
};


// ---- FREE login: mobile number + PIN (no SMS needed) ----
const validPin = x => /^\d{4,6}$/.test(String(x || ''));
const pinHash = (pin, salt) => crypto.scryptSync(String(pin), salt, 32).toString('hex');
const fails = new Map();
function locked(phone) { const f = fails.get(phone); return f && f.n >= 5 && Date.now() - f.t < 15 * 60e3; }
function bad(phone) { const f = fails.get(phone) || { n: 0, t: 0 }; if (Date.now() - f.t > 15 * 60e3) f.n = 0; f.n++; f.t = Date.now(); fails.set(phone, f); }
routes['POST /api/auth/register'] = async (req, body, ip) => {
  const phone = digits(body.phone);
  if (!validPhone(phone)) return [400, { ok: false, error: 'Enter a valid 10-digit mobile number' }];
  if (!validPin(body.pin)) return [400, { ok: false, error: 'PIN must be 4 to 6 digits' }];
  if (limited('reg:' + ip, 20, 36e5)) return [429, { ok: false, error: 'Too many sign-ups from this device. Try later.' }];
  if (db.users[phone]) return [200, { ok: false, exists: true, error: 'This number is already registered. Please login.' }];
  const c = cleanProfile(body.profile);
  if (c.error) return [400, { ok: false, error: c.error }];
  if (Object.values(db.users).some(u => u.nick.toLowerCase() === c.profile.nick.toLowerCase())) return [400, { ok: false, error: 'That nickname is taken' }];
  const salt = crypto.randomBytes(8).toString('hex');
  const u = db.users[phone] = { ...c.profile, phone, role: roleFor(phone, c.profile.kind), created: Date.now(), salt, ph: pinHash(body.pin, salt) };
  saveDb();
  return [200, { ok: true, profile: pub(u), token: sign(phone) }];
};
routes['POST /api/auth/login'] = async (req, body) => {
  const phone = digits(body.phone), u = db.users[phone];
  if (locked(phone)) return [429, { ok: false, error: 'Too many wrong PINs. Try again in 15 minutes.' }];
  if (!u) return [200, { ok: false, noAccount: true, error: 'No account for this number. Please register.' }];
  if (!u.ph) return [200, { ok: false, error: 'This account has no PIN yet. Ask the admin to reset it.' }];
  if (!safeEq(pinHash(body.pin || '', u.salt), u.ph)) { bad(phone); return [200, { ok: false, error: 'Wrong PIN' }]; }
  fails.delete(phone);
  return [200, { ok: true, profile: pub(u), token: sign(phone) }];
};
routes['POST /api/auth/pin'] = async (req, body) => {
  const phone = digits(body.phone), u = db.users[phone];
  if (!u || !u.ph || locked(phone)) return [400, { ok: false, error: 'Not allowed' }];
  if (!safeEq(pinHash(body.pin || '', u.salt), u.ph)) { bad(phone); return [200, { ok: false, error: 'Current PIN is wrong' }]; }
  if (!validPin(body.newPin)) return [400, { ok: false, error: 'New PIN must be 4 to 6 digits' }];
  u.salt = crypto.randomBytes(8).toString('hex'); u.ph = pinHash(body.newPin, u.salt); saveDb();
  return [200, { ok: true }];
};

const allow = o => ORIGINS.length === 0 ? '*' : (ORIGINS.includes(o) ? o : 'null');
http.createServer(async (req, res) => {
  const origin = req.headers.origin, path = new URL(req.url, 'http://x').pathname;
  const out = (code, obj) => {
    res.writeHead(code, { 'content-type': typeof obj === 'string' ? 'text/plain' : 'application/json', 'access-control-allow-origin': allow(origin), vary: 'origin', 'access-control-allow-headers': 'content-type,authorization', 'access-control-allow-methods': 'GET,POST,OPTIONS' });
    res.end(code === 204 ? '' : typeof obj === 'string' ? obj : JSON.stringify(obj));
  };
  if (req.method === 'OPTIONS') return out(204);
  const STATIC = { '/manifest.webmanifest': 'application/manifest+json', '/sw.js': 'application/javascript', '/icon-192.png': 'image/png', '/icon-512.png': 'image/png', '/icon-maskable.png': 'image/png', '/apple-touch-icon.png': 'image/png' };
  if (req.method === 'GET' && STATIC[path]) {   // installable-app files (PWA)
    try { const f = fs.readFileSync(new URL('./public' + path, import.meta.url)); res.writeHead(200, { 'content-type': STATIC[path], 'cache-control': path === '/sw.js' ? 'no-cache' : 'public, max-age=86400' }); return res.end(f); } catch { /* fall through */ }
  }
  if (req.method === 'GET' && (path === '/' || path === '/index.html')) {   // serve the app itself, same address as the API
    try {
      const html = fs.readFileSync(new URL('./app-index.html', import.meta.url));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
      return res.end(html);
    } catch { /* fall through to 404 */ }
  }
  const pth = path === '/otp/verify-link' ? '/api/otp/link' : (/^\/(otp|live|cric|streams|mo|wa|news|auth)/.test(path) ? '/api' + path : path);
  const h = routes[req.method + ' ' + pth];
  if (!h) return out(404, { ok: false, error: 'Not found' });
  let raw = '';
  for await (const c of req) { raw += c; if (raw.length > 20000) return out(413, { ok: false, error: 'Too large' }); }
  let body = {};
  try { body = raw ? (raw.trim().startsWith('{') ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw))) : {}; } catch { return out(400, { ok: false, error: 'Bad body' }); }
  if (req.method === 'GET') body = { ...Object.fromEntries(new URL(req.url, 'http://x').searchParams), ...body };
  else for (const [k, v] of new URL(req.url, 'http://x').searchParams) if (body[k] == null) body[k] = v;
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  try { const [code, obj] = await h(req, body, ip); out(code, obj); }
  catch (e) { console.error(e); out(500, { ok: false, error: 'Server error' }); }
}).listen(PORT, () => console.log(`Scoring Heroes API on :${PORT}  (SMS: ${SMS_PROVIDER}, live feed: ${CRIC_KEY ? 'on' : 'off'})`));
