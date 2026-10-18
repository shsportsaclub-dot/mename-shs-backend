// Scoring Heroes backend: OTP SMS from "SH Sports" + magic login link + live cricket proxy.
// Zero dependencies. Needs Node 20.6 or newer.   Run:  node --env-file=.env server.js
import { createSportmonks } from './sportmonks.mjs';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import tls from 'node:tls';
import { createHistory, sameTeamName } from './history.mjs';
import { createRecent, buildBbb, buildFow, buildPartnerships, inningsTotals, RECENT_SOURCE } from './recent.mjs';

const E = process.env;
const PORT = +E.PORT || 8080;
const APP_URL = (E.APP_URL || 'http://localhost:5500').replace(/\/$/, '');   // where the Scoring Heroes web app is hosted (HTTPS in production)
const ORIGINS = (E.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean); // empty = allow any origin (dev only)
const svcLast = { email: null, sms: null };
const SMS_PROVIDER = E.SMS_PROVIDER || 'console';           // console | msg91 | textbee
// Allow a 50-user OTP burst behind a shared network; per-number and gateway quotas still apply.
const SMS_TOTAL_BUDGET = Math.max(0, parseInt(E.SMS_TOTAL_BUDGET, 10) || 0);   // trial pack cap (0 = unlimited)
const SMS_OTP_IP_HOURLY_LIMIT = Number.isInteger(Number(E.SMS_OTP_IP_HOURLY_LIMIT)) && Number(E.SMS_OTP_IP_HOURLY_LIMIT) >= 50 && Number(E.SMS_OTP_IP_HOURLY_LIMIT) <= 1000 ? Number(E.SMS_OTP_IP_HOURLY_LIMIT) : 100;
const EMAIL_PROVIDER = E.EMAIL_PROVIDER || 'console';       // console | resend | smtp (Gmail app password works)
const EMAIL_FROM = E.EMAIL_FROM || E.SMTP_USER || 'SH Sports <no-reply@example.com>';
const COUNTRY = E.COUNTRY_CODE || '91';
const CRIC_KEY = E.CRIC_API_KEY || '';
const CRIC_BASE = E.CRIC_BASE || 'https://api.cricapi.com/v1';
const SM_TOKEN = E.SPORTMONKS_TOKEN || '';
const SM = SM_TOKEN ? createSportmonks({ token: SM_TOKEN, base: E.SPORTMONKS_BASE || undefined }) : null;
const LIVE_TTL = (+E.LIVE_CACHE_SECONDS || 60) * 1000;
const envKey = s => { const d = String(s).replace(/\D/g, ''); return d.length === 10 ? d : (d.startsWith('91') && d.length === 12 ? d.slice(2) : d); };
const ADMINS = (E.ADMIN_PHONES || '').split(',').map(envKey).filter(Boolean);
const SCORERS = (E.SCORER_PHONES || '').split(',').map(envKey).filter(Boolean);
const MO_NUMBER = E.MO_NUMBER || '';            // the SH Sports number users send the SMS to, e.g. +919XXXXXXXXX
const MO_KEYWORD = (E.MO_KEYWORD || 'SH').toUpperCase();
const WEBHOOK_SECRET = E.WEBHOOK_SECRET || '';
const WA_NUMBER = String(E.WA_NUMBER || '').replace(/\D/g, '');   // SH Sports WhatsApp number with country code, e.g. 919XXXXXXXXX
const WA_VERIFY_TOKEN = E.WA_VERIFY_TOKEN || '';                 // any secret word; paste the same in Meta webhook setup
const DATA_FILE = E.DATA_FILE || './data.json';
const SECRET = E.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!E.SESSION_SECRET) console.warn('SESSION_SECRET not set: sessions reset on every restart.');

const DATABASE_URL = E.DATABASE_URL || '';   // optional Neon/Postgres connection string: makes accounts and shared data survive restarts
let db = { users: {}, shared: {} };
try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch {}
const neon = async (query, params = []) => {
  const host = new URL(DATABASE_URL).hostname;
  const r = await fetch(`https://${host}/sql`, { method: 'POST', headers: { 'content-type': 'application/json', 'Neon-Connection-String': DATABASE_URL }, body: JSON.stringify({ query, params }) });
  if (!r.ok) throw new Error('neon ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
};
let neonTimer = null, neonOk = false;
const saveDb = () => {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(db)); } catch {}
  if (!DATABASE_URL || !neonOk) return;
  clearTimeout(neonTimer);
  neonTimer = setTimeout(() => neon('insert into kv(k,v) values($1,$2) on conflict(k) do update set v=excluded.v', ['db', JSON.stringify(db)]).catch(e => console.error('db save failed', e.message)), 1500);
};
if (DATABASE_URL) {
  try {
    await neon('create table if not exists kv(k text primary key, v text not null)');
    const r = await neon('select v from kv where k=$1', ['db']);
    if (r.rows && r.rows[0]) db = JSON.parse(r.rows[0].v); else await neon('insert into kv(k,v) values($1,$2)', ['db', JSON.stringify(db)]);
    neonOk = true; console.log('Database connected: accounts and shared data are durable');
  } catch (e) { console.error('DATABASE_URL set but not usable, using the local file only:', e.message); }
}
db.users = db.users || {}; db.shared = db.shared || {};

const pending = new Map();   // phone -> {hash,salt,exp,tries,mode,profile,linkToken}
const links = new Map();     // linkToken -> {phone,exp}
const sends = new Map();     // key -> [timestamps]

const digits = s => String(s || '').replace(/\D/g, '').slice(-10);
const validPhone = p => /^[6-9]\d{9}$/.test(p);   // India only: used by the SMS-to-number (MO) flow
// International numbers: the account key is the 10-digit number for India (so existing accounts keep working) and country code + number elsewhere.
const validEmail = e => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e) && e.length <= 100;
const pk = b => { const raw = String(b.phone || '').trim(); if (raw.includes('@')) { const em = raw.replace(/^e:/i, '').toLowerCase(); return { cc: '', nat: '', key: 'e:' + em, email: em, isEmail: true }; } const cc = String(b.cc || '').replace(/\D/g, '').slice(0, 4) || COUNTRY; let nat = String(b.phone || '').replace(/\D/g, '').replace(/^0+/, ''); if (cc === '91') nat = nat.slice(-10); else { if (nat.startsWith(cc) && nat.length > 10) nat = nat.slice(cc.length); nat = nat.slice(0, 14); } return { cc, nat, key: cc === '91' ? nat : cc + nat }; };
const validIntl = ({ cc, nat, isEmail, email }) => isEmail ? validEmail(email) : cc === '91' ? /^[6-9]\d{9}$/.test(nat) : (/^\d{6,14}$/.test(nat) && cc.length + nat.length <= 15);
const BADNUM = 'Enter a valid mobile number for the selected country';
const e164 = ({ cc, nat, isEmail }) => isEmail ? '' : '+' + cc + nat;   // canonical international form, kept private (never shown publicly)
// Countries where OTP SMS is actually delivered. SMS_REGIONS="91,1,44" lists calling codes; unset means every code with the console provider, and only the home country with MSG91.
const SMS_REGIONS = E.SMS_REGIONS ? E.SMS_REGIONS.split(',').map(x => x.replace(/\D/g, '')).filter(Boolean) : null;
const smsOk = cc => SMS_REGIONS ? SMS_REGIONS.includes(cc) : (['msg91', 'textbee'].includes(SMS_PROVIDER) ? cc === COUNTRY : true);
const hashCode = (code, salt) => crypto.createHash('sha256').update(salt + code).digest('hex');
const safeEq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const sign = phone => { const body = b64({ p: phone, e: Date.now() + 3650 * 864e5 }); return body + '.' + crypto.createHmac('sha256', SECRET).update(body).digest('base64url'); };
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
  let age = Math.round(+p.age), dob = '';
  if (p.dob != null && p.dob !== '') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(p.dob)), d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (!d || isNaN(d) || d.getUTCDate() !== +m[3] || d > new Date()) return { error: 'Enter a valid date of birth' };
    const n = new Date(); age = n.getUTCFullYear() - d.getUTCFullYear();
    if (n.getUTCMonth() < d.getUTCMonth() || (n.getUTCMonth() === d.getUTCMonth() && n.getUTCDate() < d.getUTCDate())) age--;
    dob = m[0];
  }
  if (!(age >= 5 && age <= 90)) return { error: 'Enter a valid date of birth (age 5 to 90)' };
  const email = String(p.email || '').trim().slice(0, 100);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'That email does not look right. Fix it or leave it empty.' };   // optional
  return { profile: { nick, name: nick, email, age, dob, loc: String(p.loc || '').trim().slice(0, 60), kind } };
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
  if (SMS_PROVIDER === 'textbee') {
    if (!E.TEXTBEE_API_KEY || !E.TEXTBEE_DEVICE_ID) {
      throw Object.assign(new Error('TextBee API key and device ID are required'), { statusCode: 503, publicMessage: 'SMS gateway is not configured yet' });
    }
    const body = {
      recipients: ['+' + cc + phone],
      message: 'Your Scoring Heroes OTP is ' + code + '. Valid for 5 minutes. Do not share this code. - SH Sports',
      deviceId: E.TEXTBEE_DEVICE_ID
    };
    if (E.TEXTBEE_SIM_SUBSCRIPTION_ID) {
      const sim = Number(E.TEXTBEE_SIM_SUBSCRIPTION_ID);
      if (!Number.isInteger(sim) || sim < 0) throw Object.assign(new Error('Invalid TextBee SIM setting'), { statusCode: 503, publicMessage: 'SMS gateway SIM configuration is invalid' });
      body.simSubscriptionId = sim;
    }
    let r;
    try {
      r = await fetch('https://api.textbee.dev/api/v1/gateway/send-sms', {
        method: 'POST',
        headers: { 'x-api-key': E.TEXTBEE_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      });
    } catch {
      throw Object.assign(new Error('TextBee connection timed out or failed'), { statusCode: 502, publicMessage: 'SMS gateway did not confirm the request. Please try again later.' });
    }
    const j = await r.json().catch(() => null);
    if (r.status === 429) throw Object.assign(new Error('TextBee quota/rate limit reached'), { statusCode: 429, publicMessage: 'SMS gateway limit reached. Check the daily/monthly quota.' });
    if (!r.ok || j?.data?.success !== true || !j.data.smsBatchId) {
      throw Object.assign(new Error('TextBee rejected request: HTTP ' + r.status), { statusCode: 502, publicMessage: 'SMS gateway rejected the request. Check device connection and configuration.' });
    }
    return { deliveryStatus: 'queued', smsBatchId: j.data.smsBatchId, provider: 'textbee' };
  }
  throw new Error('Unknown SMS_PROVIDER');
}

function complete(phone, p) {
  pending.delete(phone); links.delete(p.linkToken);
  let u = db.users[phone];
  if (!u && p.mode === 'reg' && p.profile) {
    u = db.users[phone] = { ...p.profile, phone, e164: p.e164, role: roleFor(phone, p.profile.kind), created: Date.now() };
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
  if (SM) return smLive();
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

let smLiveC = { t: 0, data: null };
async function smLive() {
  if (smLiveC.data && Date.now() - smLiveC.t < 60e3) return smLiveC.data;
  try {
    const matches = await SM.liveMatches();
    smLiveC = { t: Date.now(), data: { ok: true, matches, info: {}, refreshEverySec: 60, updated: new Date().toISOString() } };
    return smLiveC.data;
  } catch (e) { if (smLiveC.data) return { ...smLiveC.data, stale: true, note: e.message }; throw e; }
}
const routes = {
  'POST /api/otp/send': async (req, body, ip) => {
    const P = pk(body), phone = P.key;
    if (!validIntl(P)) return [400, { ok: false, error: BADNUM }];
    if (!smsOk(P.cc)) return [200, { ok: false, unsupported: true, error: 'SMS codes are not available for +' + P.cc + ' yet. Please use the PIN option instead.' }];
    const mode = body.mode === 'reg' ? 'reg' : body.mode === 'login' ? 'login' : 'plain', existing = db.users[phone];
    if (mode === 'reg' && existing) return [200, { ok: true, exists: true }];
    if (mode === 'login' && !existing) return [200, { ok: false, noAccount: true, error: phone.startsWith('e:') ? 'No account for this email. Please register.' : 'No account for this number. Please register.' }];
    let profile = null;
    if (mode === 'reg') {
      const c = cleanProfile(body.profile);
      if (c.error) return [400, { ok: false, error: c.error }];
      if (Object.values(db.users).some(u => u.nick.toLowerCase() === c.profile.nick.toLowerCase())) return [400, { ok: false, error: 'That nickname is taken' }];
      profile = c.profile;
    }
    if (limited('p:' + phone + ':30s', 1, 30e3)) return [429, { ok: false, error: 'Please wait 30 seconds before asking for another code' }];
    if (limited('p:' + phone, 5, 36e5) || limited('ip:' + ip, SMS_OTP_IP_HOURLY_LIMIT, 36e5)) return [429, { ok: false, error: 'Too many requests. Try again later.' }];
    const code = String(crypto.randomInt(100000, 1000000)), salt = crypto.randomBytes(8).toString('hex'), linkToken = crypto.randomBytes(16).toString('hex');
    pending.set(phone, { e164: e164(P), hash: hashCode(code, salt), salt, exp: Date.now() + 5 * 60e3, tries: 0, mode, profile, linkToken });
    links.set(linkToken, { phone, exp: Date.now() + 10 * 60e3 });
    if (SMS_PROVIDER !== 'console' && SMS_TOTAL_BUDGET && (db.smsSent || 0) >= SMS_TOTAL_BUDGET) {
      pending.delete(phone); links.delete(linkToken);
      return [429, { ok: false, error: 'SMS trial quota is finished. Please use email to sign in.' }];
    }
    let transport;
    try { transport = await sendSms(P.nat, code, `${APP_URL}/#v=${linkToken}`, P.cc); svcLast.sms = SMS_PROVIDER === 'console' ? { ok: false, at: Date.now(), err: 'console mode: the code was only printed in the server log, no SMS was sent' } : { ok: true, at: Date.now() }; }
    catch (e) {
      svcLast.sms = { ok: false, at: Date.now(), err: String(e.message).slice(0, 300) };
      if (pending.get(phone)?.salt === salt) pending.delete(phone);
      links.delete(linkToken);
      console.error(e.message);
      return [e.statusCode || 502, { ok: false, error: e.publicMessage || 'SMS provider error' }];
    }
    if (SMS_PROVIDER !== 'console') { db.smsSent = (db.smsSent || 0) + 1; saveDb(); }
    return [200, { ok: true, exists: false, ...(transport || {}), ...(SMS_PROVIDER === 'console' ? { devCode: code, devOtp: code } : {}) }];
  },
  'POST /api/otp/verify': async (req, body) => {
    const phone = pk(body).key, p = pending.get(phone);
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
  'GET /health': async () => [200, { ok: true, version: String(E.RENDER_GIT_COMMIT || '').slice(0, 7) || 'local', commit: E.RENDER_GIT_COMMIT || null, appSha256: crypto.createHash('sha256').update(fs.readFileSync(new URL('./app-index.html', import.meta.url))).digest('hex') }]
};

// ---- Match scorecard / player profile proxy (key stays on the server) ----
const cricCache = new Map();
// ---- Open-data fill: when the live provider does not send officials, player of the match or the eleven for a FINISHED match, take them from Cricsheet (open data, ODC-By) and say so. Never guessed: only a single exact match of both teams and the date is used. ----
const csDay = d => String(d.dateTimeGMT || d.date || '').slice(0, 10);
const recentOf = d => (d && d.matchEnded && (d.teams || []).length >= 2) ? recent.find(d.teams[0], d.teams[1], csDay(d)) : null;
const histRow = d => {
  if (!d || !d.matchEnded) return null; const t = d.teams || [];
  const rr = recentOf(d); if (rr) return recent.facts(rr);
  return history.status().ready ? history.matchFacts(t[0], t[1], csDay(d)) : null;
};
function enrichInfo(d) {
  const r = histRow(d); if (!r) return d; const o = r.of || {}, out = { ...d }; let used = false;
  if (!out.umpires && o.u) { out.umpires = o.u; used = true; }
  if (!out.thirdUmpire && o.tv) { out.thirdUmpire = o.tv.join(', '); used = true; }
  if (!out.referee && o.rf) { out.referee = o.rf.join(', '); used = true; }
  if (!out.tossWinner && r.toss && r.toss.w) { out.tossWinner = (d.teams || []).find(t => sameTeamName(t, r.toss.w)) || r.toss.w; if (r.toss.d) out.tossChoice = r.toss.d; used = true; }
  if (!out.playerOfTheMatch && r.pom && r.pom.length) { out.playerOfTheMatch = r.pom; used = true; }
  if (used) out.factSrc = 'Cricsheet (open data, ODC-By)';
  return out;
}
const nameKey = n => { const p = String(n || '').replace(/[().]/g, ' ').trim().split(/\s+/).filter(Boolean); return p.length ? p[0][0].toLowerCase() + '|' + p[p.length - 1].toLowerCase() : ''; };
function enrichSquad(sq, info) {
  const r = histRow(info); if (!r || !r.xi || !Array.isArray(sq)) return sq;
  return sq.map(t => {
    const key = Object.keys(r.xi).find(k => sameTeamName(k, t.teamName)); if (!key || !Array.isArray(t.players)) return t;
    const xi = r.xi[key].map(nameKey), hit = new Array(t.players.length).fill(false), used = new Set();
    t.players.forEach((p, i) => { const k = nameKey(p.name), c = xi.filter(x => x === k).length; if (k && c === 1 && !used.has(k) && t.players.filter(q => nameKey(q.name) === k).length === 1) { hit[i] = true; used.add(k); } });
    if (hit.filter(Boolean).length < Math.max(9, Math.ceil(xi.length * 0.8))) return t;   // not reliable enough: show the squad only
    return { ...t, players: t.players.map((p, i) => hit[i] ? { ...p, playing: true } : p), xiSrc: 'Cricsheet (open data, ODC-By)' };
  });
}
async function enrichScorecard(sc, id) {
  if (!sc || !Array.isArray(sc.scorecard) || !sc.scorecard.length) return sc;
  const info = await infoOf(id).catch(() => null), teams = (info && info.teams) || []; if (teams.length < 2) return sc;
  // the provider sometimes names an innings "Team A,Team B" or in lower case: give each innings its real batting team (never guessed when two teams fit)
  const res = sc.scorecard.map(inn => { const parts = String(inn.inning || '').replace(/\s+Inning.*$/i, '').split(','); const m = teams.filter(t => parts.some(p => sameTeamName(p, t))); return m.length === 1 ? m[0] : null; });
  const pend = res.map((t, i) => t ? -1 : i).filter(i => i >= 0), free = teams.filter(t => !res.includes(t));
  if (pend.length === 1 && free.length === 1) res[pend[0]] = free[0];
  const rr = recentOf(info), cs = rr ? { fow: buildFow(rr.raw), par: buildPartnerships(rr.raw), tot: inningsTotals(rr.raw) } : null, seen = {}, seenCs = {};
  let credit = false;
  const out = sc.scorecard.map((inn, i) => {
    const t = res[i], o = { ...inn }; if (!t) return o;
    seen[t] = (seen[t] || 0) + 1; o.inning = t + ' Inning ' + seen[t];
    if (cs) {
      const idx = cs.tot.map((x, j) => ({ x, j })).filter(z => !z.x.super_over && sameTeamName(z.x.team, t)).map(z => z.j)[(seenCs[t] = (seenCs[t] || 0) + 1) - 1];
      const pr = inn.totals && inn.totals.R != null ? +inn.totals.R : null;
      if (idx != null && (pr == null || pr === cs.tot[idx].r)) {   // only when the totals agree with the provider
        if (!o.fow && cs.fow[idx].fow.length) { o.fow = cs.fow[idx].fow; credit = true; }
        if (!o.partnerships && cs.par[idx].partnerships.length) { o.partnerships = cs.par[idx].partnerships; credit = true; }
      }
    }
    return o;
  });
  return { ...sc, scorecard: out, ...(credit ? { factSrc: RECENT_SOURCE } : {}) };
}
async function infoOf(id) {
  const h = cricCache.get('match_info' + id); if (h && h.d && h.d.data) return h.d.data;
  const r = await fetch(`${CRIC_BASE}/match_info?apikey=${encodeURIComponent(CRIC_KEY)}&id=${encodeURIComponent(id)}`), j = await r.json();
  return j.status === 'success' ? j.data : null;
}
routes['GET /api/cric'] = async (req, body, ip) => {
  const ep = String(body.ep || ''), id = String(body.id || '');
  if (!['match_scorecard', 'players_info', 'match_info', 'match_squad', 'match_bbb'].includes(ep) || !/^(sm)?[0-9a-z-]{1,40}$/i.test(id)) return [400, { ok: false, error: 'Bad request' }];
  if (SM && /^sm?\d+$/i.test(id)) {
    const k0 = 'sm' + ep + id, h0 = cricCache.get(k0);
    if (h0 && Date.now() - h0.t < (ep === 'players_info' ? 864e5 : 30e3)) return [200, h0.d];
    if (limited('cric:' + ip, 300, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
      const num = id.replace(/^sm/i, '');
    try {
      const data = ep === 'match_scorecard' ? await SM.scorecard(num) : ep === 'match_info' ? await SM.matchInfo(num) : ep === 'match_squad' ? await SM.squad(num) : ep === 'match_bbb' ? await SM.bbb(num) : await SM.player(num);
      const d = { ok: true, data }; cricCache.set(k0, { t: Date.now(), d }); if (cricCache.size > 500) cricCache.clear(); return [200, d];
    } catch (e) { return [502, { ok: false, error: String(e.message || 'Sportmonks error').slice(0, 160) }]; }
  }
  if (!CRIC_KEY) return [503, { ok: false, error: 'CRIC_API_KEY is not set on the server' }];
  const k = ep + id, hit = cricCache.get(k), ttl = ep === 'players_info' ? 864e5 : 45e3;
  if (hit && Date.now() - hit.t < ttl) return [200, hit.d];
  if (limited('cric:' + ip, 300, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
  if (ep === 'match_bbb') {   // a finished match: Cricsheet has the full ball by ball
    try { const rr = recentOf(await infoOf(id)); if (rr) { const bbb = buildBbb(rr.raw); if (bbb.length) { const d = { ok: true, data: { bbb, source: RECENT_SOURCE } }; cricCache.set(k, { t: Date.now(), d }); return [200, d]; } } } catch {}
  }
  try {
    const r = await fetch(`${CRIC_BASE}/${ep}?apikey=${encodeURIComponent(CRIC_KEY)}&id=${encodeURIComponent(id)}`);
    const j = await r.json();
    if (j.status !== 'success') return [502, { ok: false, error: j.reason || 'Cricket API error' }];
    let data = j.data;
    try { if (ep === 'match_info') data = enrichInfo(data); else if (ep === 'match_squad') data = enrichSquad(data, await infoOf(id)); else if (ep === 'match_scorecard') data = await enrichScorecard(data, id); } catch {}
    const d = { ok: true, data }; cricCache.set(k, { t: Date.now(), d }); if (cricCache.size > 500) cricCache.clear();
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


// ---- 30-year history store (matches + player career totals from Cricsheet-format data) ----
const HISTORY_URL = E.HISTORY_URL || 'https://cricsheet.org/downloads/all_json.zip';
const HISTORY_YEARS = Math.min(60, Math.max(1, parseInt(E.HISTORY_YEARS, 10) || 30));
const history = createHistory({ dir: E.HISTORY_DIR || './history-data', log: m => console.log(m) });
const recent = createRecent({ dir: path.join(E.HISTORY_DIR || './history-data', 'recent'), log: m => console.log(m) });
if (E.RECENT_OPEN_DATA !== '0') { setTimeout(() => recent.refresh(), 25e3); setInterval(() => recent.refresh(), 3 * 3600e3); }
const histSince = () => new Date().getUTCFullYear() - HISTORY_YEARS;
const startHistory = () => history.importFrom({ url: HISTORY_URL, sinceYear: histSince() }).catch(e => console.error(e.message));
if (E.HISTORY_AUTOIMPORT === '1' && !history.status().ready) setTimeout(startHistory, 20000);
routes['GET /api/history/status'] = async () => [200, { ok: true, ...history.status(), url: HISTORY_URL, years: HISTORY_YEARS }];
routes['GET /api/history/players'] = async (req, body, ip) => {
  if (limited('hp:' + ip, 600, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
  return [200, { ok: true, players: history.searchPlayers(body.q, Math.min(50, +body.limit || 20)) }];
};
routes['GET /api/history/player'] = async (req, body) => {
  const p = history.player(body.id);
  return p ? [200, { ok: true, player: p }] : [404, { ok: false, error: 'Player not found in the history store' }];
};
routes['GET /api/history/matches'] = async (req, body, ip) => {
  if (limited('hm:' + ip, 600, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
  return [200, { ok: true, ...history.searchMatches({ q: body.q, type: body.type, year: body.year, team: body.team, gender: body.gender, limit: +body.limit || 30, offset: +body.offset || 0 }) }];
};
routes['GET /api/history/match'] = async (req, body, ip) => {
  if (limited('hm:' + ip, 120, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
  const m = history.matchFacts(String(body.a || '').slice(0, 80), String(body.b || '').slice(0, 80), String(body.date || ''));
  return m ? [200, { ok: true, match: m, source: 'Cricsheet (open data, ODC-By)' }] : [404, { ok: false, error: 'No single matching record in the history store' }];
};
routes['GET /api/history/venue'] = async (req, body, ip) => {
  if (limited('hv:' + ip, 600, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
  return [200, { ok: true, ...history.venueStats(String(body.name || '').slice(0, 120), body.type ? String(body.type).slice(0, 8) : '') }];
};
routes['POST /api/history/import'] = async (req, body) => {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can import history' }];
  if (history.status().job.state === 'running') return [409, { ok: false, error: 'An import is already running', ...history.status() }];
  startHistory();
  return [202, { ok: true, started: true, years: HISTORY_YEARS }];
};

// ---- Daily paper agent: every few hours it saves the facts of finished world matches for the day (the provider drops old matches), the app writes the articles from these facts ----
db.papers = db.papers || {};
const istDate = (t = Date.now()) => new Date(t + 5.5 * 3600e3).toISOString().slice(0, 10);
const PAPER_HOURS = Math.max(1, parseInt(E.PAPER_AGENT_HOURS, 10) || 3);
const agentStatus = { last: 0, ok: null, note: 'not run yet', added: 0 };
// ---- Own newsroom: the agent writes match reports and previews itself from the live match facts (no third-party headlines). With ANTHROPIC_API_KEY set, Claude re-words each report; the facts and numbers are checked so nothing invented gets through. ----
const NEWS_AI_KEY = E.ANTHROPIC_API_KEY || '', NEWS_AI_MODEL = E.NEWS_AI_MODEL || 'claude-haiku-5-5', NEWS_AI_BASE = (E.NEWS_AI_BASE || 'https://api.anthropic.com').replace(/\/$/, '');
const ovBalls = o => { const [a, b] = String(o).split('.'); return (+a || 0) * 6 + (+b || 0); };
const nm1 = (s, A, B) => { const x = String(s || '').toLowerCase().trim(); return x === String(A.name).toLowerCase() || x === String(A.short || '').toLowerCase() ? A : x === String(B.name).toLowerCase() || x === String(B.short || '').toLowerCase() ? B : null; };
function newsFacts(m) {
  const [A, B] = (m.teams || []).slice(0, 2); if (!A || !B || !A.name || !B.name) return null;
  const desc = String(m.name || '').split(',').slice(1).join(',').trim(), st = String(m.status || '').trim().replace(/\.$/, '');
  const used = new Set();   // the provider sometimes labels an innings oddly ("thailand", "Bhutan,Thailand"): match it to the real two teams
  const sc = (m.score || []).map(x => {
    const raw = String(x.inning || '').replace(/ Inning.*/i, '').trim();
    let t = nm1(raw, A, B);
    if (!t) t = raw.split(',').map(z => nm1(z, A, B)).find(z => z && !used.has(z.name)) || [A, B].find(z => !used.has(z.name));
    if (t) used.add(t.name);
    return { team: t ? t.name : raw, r: x.r, w: x.w, o: x.o };
  });
  return { A, B, desc, st, sc, venue: m.venue || '', type: String(m.type || '').toLowerCase(), date: String(m.time || m.date || '').slice(0, 10) };
}
function writeResult(m) {
  const f = newsFacts(m); if (!f) return null; const { A, B, desc, st, sc, venue, type } = f;
  const w = /^(.+?) won by (\d+) (runs?|wkts?|wickets?)\b/i.exec(st), win = w && nm1(w[1], A, B), lose = win && (win === A ? B : A);
  const unit = w ? (/^r/i.test(w[3]) ? 'run' : 'wicket') : '', mg = w ? `${w[2]} ${unit}${+w[2] === 1 ? '' : 's'}` : '';
  const P = [];
  P.push(win ? `${win.name} beat ${lose.name} by ${mg}${desc ? ' in the ' + desc : ''}${venue ? ' at ' + venue : ''}.` : `${A.name} and ${B.name} met${desc ? ' in the ' + desc : ''}${venue ? ' at ' + venue : ''}. ${st ? st + '.' : ''}`);
  if (sc[0]) P.push(`${sc[0].team} batted first and made ${sc[0].r}/${sc[0].w} in ${sc[0].o} overs.${sc[1] ? ` ${sc[1].team} replied with ${sc[1].r}/${sc[1].w} in ${sc[1].o} overs.` : ''}`);
  if (win && sc.length >= 2) {
    if (unit === 'run' && win.name.toLowerCase() === sc[0].team.toLowerCase()) P.push(`${win.name} set a target of ${sc[0].r + 1}, and ${lose.name} finished ${mg} short on ${sc[1].r}/${sc[1].w}.`);
    else if (unit === 'wicket' && win.name.toLowerCase() === sc[1].team.toLowerCase()) { const tot = type === 't20' || type === 't20i' ? 120 : type === 'odi' ? 300 : 0, left = tot ? tot - ovBalls(sc[1].o) : 0; P.push(`${win.name} chased down ${sc[0].r + 1} with ${mg} in hand${left > 0 ? ' and ' + left + ' balls to spare' : ''}.`); }
  }
  if (!win && st) P.push(st + '.');
  return { id: 'n-' + m.id + '-r', mid: m.id, kind: 'result', h: win ? `${win.name} beat ${lose.name} by ${mg}` : (st || m.name), sub: sc.map(x => `${x.team} ${x.r}/${x.w}`).join(' | '), body: P, card: { a: sc[0] ? sc[0].team : A.name, b: sc[1] ? sc[1].team : B.name, sa: sc[0] ? sc[0].r + '/' + sc[0].w : '', sb: sc[1] ? sc[1].r + '/' + sc[1].w : '', res: st, d: f.date }, ai: false, by: 'Scoring Heroes desk', t: Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(m.time || '') ? m.time : (m.time || '') + 'Z') || Date.now() };
}
function writePreview(m) {
  const f = newsFacts(m); if (!f) return null; const { A, B, desc, venue } = f, when = Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(m.time || '') ? m.time : (m.time || '') + 'Z');
  const ist = when ? new Date(when).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '';
  return { id: 'n-' + m.id + '-p', mid: m.id, kind: 'preview', h: `${A.name} take on ${B.name}${desc ? ': ' + desc : ''}`, sub: ist ? ist + ' IST' + (venue ? ' | ' + venue : '') : venue, body: [`${A.name} play ${B.name}${desc ? ' in the ' + desc : ''}${venue ? ' at ' + venue : ''}.`, ist ? `The match is scheduled for ${ist} IST.` : ''].filter(Boolean), card: { a: A.name, b: B.name, sa: '', sb: '', res: ist ? ist + ' IST' : 'Upcoming', d: f.date }, ai: false, by: 'Scoring Heroes desk', t: when || Date.now() };
}
async function aiPolish(a) {
  if (!NEWS_AI_KEY) return null;
  const facts = { headline: a.h, summary: a.sub, paragraphs: a.body, card: a.card };
  try {
    const r = await fetch(NEWS_AI_BASE + '/v1/messages', { method: 'POST', signal: AbortSignal.timeout(25000), headers: { 'content-type': 'application/json', 'x-api-key': NEWS_AI_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: NEWS_AI_MODEL, max_tokens: 700, messages: [{ role: 'user', content: 'You are the sports desk of a cricket scoring app. Re-write this match item as a short news article: a headline and 2 to 4 short paragraphs (90 to 140 words in total). Use ONLY the facts below. Do not add player names, statistics, records, quotes, reasons or any number that is not in the facts. Reply with JSON only: {"h":"...","body":["...","..."]}\nFACTS:\n' + JSON.stringify(facts) }] }) });
    const j = await r.json(), txt = (j.content || []).map(c => c.text || '').join(''), o = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
    if (!o || typeof o.h !== 'string' || !Array.isArray(o.body) || !o.body.length || o.body.length > 5) return null;
    const allowed = new Set((JSON.stringify(facts).match(/\d+/g) || [])), out = o.h + ' ' + o.body.join(' ');
    if ((out.match(/\d+/g) || []).some(n => !allowed.has(n))) return null;   // an invented number: reject
    if (/["“”]/.test(o.body.join(' '))) return null;                 // no quotes
    return { h: o.h.slice(0, 160), body: o.body.map(x => String(x).slice(0, 700)) };
  } catch { return null; }
}
async function newsroomRun(live) {
  let made = 0, polished = 0; const now = Date.now();
  for (const m of live.matches || []) {
    const when = Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(m.time || '') ? m.time : (m.time || '') + 'Z');
    if (!when) continue;
    const ended = m.ended, soon = !m.started && when > now - 36e5 && when < now + 24 * 36e5;
    if (!ended && !soon) continue;
    if (ended && now - when > 48 * 36e5) continue;
    const day = istDate(when), P = db.papers[day] = db.papers[day] || { world: [], sh: [] }; P.news = P.news || [];
    if (ended) { const pi = P.news.findIndex(x => x.id === 'n-' + m.id + '-p'); if (pi >= 0) P.news.splice(pi, 1); }
    const id = 'n-' + m.id + (ended ? '-r' : '-p'), old = P.news.find(x => x.id === id);
    const a = ended ? writeResult(m) : writePreview(m); if (!a) continue;
    if (old && old.sub === a.sub && old.card && old.card.res === a.card.res && (old.ai || !NEWS_AI_KEY || polished >= 6)) continue;
    if (polished < 6) { const p = await aiPolish(a); if (p) { a.h = p.h; a.body = p.body; a.ai = true; polished++; } }
    const i = P.news.findIndex(x => x.id === id); if (i < 0) { P.news.push(a); made++; } else P.news[i] = a;
  }
  return { made, polished };
}


// ---- Server status for the admin: which services are really switched on, and the last real error from the email/SMS provider ----
function svcStatus() {
  const emailKey = EMAIL_PROVIDER === 'resend' ? !!E.RESEND_API_KEY : EMAIL_PROVIDER === 'smtp' ? !!(E.SMTP_USER && E.SMTP_PASS) : false;
  const smsKey = SMS_PROVIDER === 'msg91' ? !!(E.MSG91_AUTHKEY && E.MSG91_TEMPLATE_ID) : SMS_PROVIDER === 'textbee' ? !!(E.TEXTBEE_API_KEY && E.TEXTBEE_DEVICE_ID) : false;
  const need = (p, ok, names) => p === 'console' ? 'Not switched on: set ' + names.join(' / ') : ok ? '' : 'Provider chosen but its key is missing';
  return {
    email: { provider: EMAIL_PROVIDER, ready: emailKey, from: EMAIL_PROVIDER === 'console' ? '' : EMAIL_FROM, problem: need(EMAIL_PROVIDER, emailKey, ['EMAIL_PROVIDER=resend + RESEND_API_KEY', 'EMAIL_PROVIDER=smtp + SMTP_USER + SMTP_PASS']), last: svcLast.email },
    sms: { provider: SMS_PROVIDER, ready: smsKey, sent: db.smsSent || 0, cap: SMS_TOTAL_BUDGET || 0, problem: need(SMS_PROVIDER, smsKey, ['SMS_PROVIDER=textbee + TEXTBEE_API_KEY + TEXTBEE_DEVICE_ID', 'SMS_PROVIDER=msg91 + MSG91_AUTHKEY + MSG91_TEMPLATE_ID']), last: svcLast.sms },
    live: { ready: !!(CRIC_KEY || SM), provider: SM ? 'sportmonks' : 'cricketdata', problem: (CRIC_KEY || SM) ? '' : 'Set CRIC_API_KEY (CricketData) or SPORTMONKS_TOKEN (Sportmonks)' },
    ai: { ready: !!NEWS_AI_KEY, model: NEWS_AI_KEY ? NEWS_AI_MODEL : '', problem: NEWS_AI_KEY ? '' : 'Optional: set ANTHROPIC_API_KEY for AI-polished articles (articles are still written without it)' },
    history: { autoimport: E.HISTORY_AUTOIMPORT === '1' },
    recent: { enabled: E.RECENT_OPEN_DATA !== '0', ...recent.status() }
  };
}
routes['GET /api/status'] = async () => { const x = svcStatus(); return [200, { ok: true, emailReady: x.email.ready, smsReady: x.sms.ready, liveReady: x.live.ready }]; };
routes['POST /api/admin/probe'] = async (req, body) => {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can see this' }];
  if (!SM) return [200, { ok: false, error: 'SPORTMONKS_TOKEN is not set on the server' }];
  const id = String(body.id || '').replace(/\D/g, '');
  try {
    let fid = id;
    if (!fid) { const L = await SM.liveMatches(); const m = L.find(x => x.started) || L[0]; if (!m) return [200, { ok: false, error: 'Sportmonks returned no fixtures' }]; fid = m.id.replace(/^sm/, ''); }
    return [200, { ok: true, id: fid, ...(await SM.probe(fid)) }];
  } catch (e) { return [200, { ok: false, error: String(e.message).slice(0, 300) }]; }
};
routes['POST /api/admin/status'] = async (req, body) => {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can see this' }];
  const out = { ok: true, status: svcStatus() };
  const to = String(body.testEmail || '').trim().toLowerCase();
  if (to) { if (!validEmail(to)) return [400, { ok: false, error: 'Enter a valid email address' }]; if (limited('te:' + phone, 5, 36e5)) return [429, { ok: false, error: 'Too many tests. Try later.' }];
    try { await sendMail(to, 'Scoring Heroes test email', 'This is a test email from your Scoring Heroes server. If you can read this, email codes will reach people.'); out.test = EMAIL_PROVIDER === 'console' ? { ok: false, error: 'EMAIL_PROVIDER is "console": nothing was sent. Set EMAIL_PROVIDER and its key in Render > Environment.' } : { ok: true }; }
    catch (e) { out.test = { ok: false, error: e.message }; }
    out.status = svcStatus(); }
  return [200, out];
};

async function paperAgentRun() {
  agentStatus.last = Date.now();
  try {
    const live = await liveMatches();
    const day = istDate(), P = db.papers[day] = db.papers[day] || { world: [], sh: [] };
    let added = 0;
    for (const m of live.matches || []) {
      if (!m.ended) continue;
      const when = Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(m.time || '') ? m.time : (m.time || '') + 'Z');
      if (!when || istDate(when) !== day) continue;
      const row = { id: m.id, name: m.name, type: m.type, venue: m.venue, status: m.status, time: m.time, teams: (m.teams || []).slice(0, 2), score: (m.score || []).slice(0, 4) };
      const i = P.world.findIndex(x => x.id === m.id);
      if (i < 0) { P.world.push(row); added++; } else P.world[i] = row;
    }
    let nr = { made: 0, polished: 0 }; try { nr = await newsroomRun(live); } catch (e) { agentStatus.newsErr = e.message; }
    agentStatus.news = nr; agentStatus.ai = NEWS_AI_KEY ? NEWS_AI_MODEL : 'rule-based (no ANTHROPIC_API_KEY)';
    for (const d of Object.keys(db.papers).sort().slice(0, -60)) delete db.papers[d];   // keep 60 days
    if (added || true) saveDb();
    Object.assign(agentStatus, { ok: true, note: 'saved ' + P.world.length + ' finished matches for ' + day, added });
  } catch (e) { Object.assign(agentStatus, { ok: false, note: e.message, added: 0 }); }
}
if (E.PAPER_AGENT !== '0') { setTimeout(paperAgentRun, 60e3); setInterval(paperAgentRun, PAPER_HOURS * 3600e3); }
routes['GET /api/paper'] = async (req, body) => {
  const day = /^\d{4}-\d\d-\d\d$/.test(body.date || '') ? body.date : istDate();
  const P = db.papers[day] || { world: [], sh: [] };
  const recent = Object.keys(db.papers).sort().slice(-4).flatMap(d => (db.papers[d].news || [])).sort((x, y) => y.t - x.t).slice(0, 40);
  return [200, { ok: true, date: day, world: P.world, sh: P.sh, news: P.news || [], recent, agent: agentStatus, days: Object.keys(db.papers).sort().slice(-14) }];
};
routes['POST /api/paper'] = async (req, body, ip) => {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  if (body.run === '1' || body.run === 1) { if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can run the agent' }]; await paperAgentRun(); return [200, { ok: true, agent: agentStatus }]; }
  if (u.role !== 'admin' && u.role !== 'scorer') return [403, { ok: false, error: 'Only scorers and admins can publish match reports' }];
  if (limited('pp:' + phone, 60, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
  const day = /^\d{4}-\d\d-\d\d$/.test(body.date || '') ? body.date : istDate();
  const items = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
  const t = (x, n) => String(x == null ? '' : x).slice(0, n);
  const clean = items.map(a => ({ id: t(a.id, 60), h: t(a.h, 200), sub: t(a.sub, 300), body: (Array.isArray(a.body) ? a.body : []).slice(0, 8).map(x => t(x, 900)), card: a.card && typeof a.card === 'object' ? { a: t(a.card.a, 60), b: t(a.card.b, 60), sa: t(a.card.sa, 40), sb: t(a.card.sb, 40), res: t(a.card.res, 160), d: t(a.card.d, 20) } : null, by: t(u.nick || u.name || 'Scorer', 40), at: Date.now() })).filter(a => a.id && a.h);
  const P = db.papers[day] = db.papers[day] || { world: [], sh: [] };
  for (const a of clean) { const i = P.sh.findIndex(x => x.id === a.id); if (i < 0) P.sh.push(a); else P.sh[i] = a; }
  saveDb(); return [200, { ok: true, saved: clean.length, date: day }];
};

// ---- Free-licence photo finder (Openverse: Creative Commons / public domain images, licence and creator kept with each picture) ----
const OV_BASE = (E.OPENVERSE_BASE || 'https://api.openverse.org/v1').replace(/\/$/, '');
const ovCache = new Map();
routes['GET /api/freephoto/search'] = async (req, body, ip) => {
  const q = String(body.q || '').trim().slice(0, 80);
  if (q.length < 2) return [400, { ok: false, error: 'Type at least 2 letters' }];
  if (limited('fp:' + ip, 60, 36e5)) return [429, { ok: false, error: 'Too many searches, try later' }];
  const hit = ovCache.get(q.toLowerCase());
  if (hit && Date.now() - hit.t < 10 * 60e3) return [200, hit.d];
  try {
    const r = await fetch(`${OV_BASE}/images/?q=${encodeURIComponent(q)}&license_type=commercial,modification&page_size=12&mature=false`, { headers: { 'user-agent': 'ScoringHeroes/1.0 (free photo finder)' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return [502, { ok: false, error: 'Photo source answered ' + r.status + (r.status === 429 ? ' (rate limit, try later)' : '') }];
    const j = await r.json();
    const results = (j.results || []).filter(x => /^[0-9a-f-]{36}$/i.test(x.id || '')).slice(0, 12).map(x => ({
      id: x.id, title: String(x.title || '').slice(0, 120), creator: String(x.creator || '').slice(0, 80), license: String(x.license || '').toUpperCase(), lv: String(x.license_version || ''),
      attr: String(x.attribution || '').slice(0, 400), page: String(x.foreign_landing_url || '').slice(0, 300), source: String(x.source || x.provider || '').slice(0, 40)
    }));
    const d = { ok: true, q, results };
    ovCache.set(q.toLowerCase(), { t: Date.now(), d }); if (ovCache.size > 200) ovCache.delete(ovCache.keys().next().value);
    return [200, d];
  } catch (e) { return [502, { ok: false, error: 'Photo source not reachable: ' + e.message }]; }
};
routes['GET /api/freephoto/img'] = async (req, body, ip) => {
  const id = String(body.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return [400, { ok: false, error: 'Bad id' }];
  if (limited('fi:' + ip, 300, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
  try {
    const r = await fetch(`${OV_BASE}/images/${id}/thumb/`, { headers: { 'user-agent': 'ScoringHeroes/1.0 (free photo finder)' }, signal: AbortSignal.timeout(20000) });
    const ct = String(r.headers.get('content-type') || '');
    if (!r.ok || !/^image\/(jpeg|png|webp|gif)/.test(ct)) return [502, { ok: false, error: 'Picture not available' }];
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 1.5e6) return [502, { ok: false, error: 'Picture too large' }];
    return [200, { ok: true, ct: ct.split(';')[0], b64: buf.toString('base64') }];
  } catch (e) { return [502, { ok: false, error: 'Picture not reachable' }]; }
};

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

// ---- Email OTP: one code mailed to the address proves the person can read it. No SMS or phone network needed. ----
function smtpSend({ host, port, user, pass, from, to, subject, text, mode }) {   // minimal SMTP client (implicit TLS on 465, STARTTLS on 587, plain only for local tests)
  return new Promise((resolve, reject) => {
    let sock = mode === 'ssl' ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    let buf = '', waiting = null, done = false;
    const fail = e => { if (!done) { done = true; try { sock.destroy(); } catch {} reject(e instanceof Error ? e : new Error(String(e))); } };
    const hook = s => { s.setEncoding('utf8'); s.on('data', d => { buf += d; const lines = buf.split('\r\n'); buf = lines.pop(); for (const l of lines) if (/^\d{3} /.test(l) && waiting) { const w = waiting; waiting = null; w(l); } }); s.on('error', fail); };
    hook(sock); const timer = setTimeout(() => fail(new Error('SMTP timeout')), 20000);
    const read = () => new Promise(r => { waiting = r; });
    const cmd = async (c, ok) => { if (c) sock.write(c + '\r\n'); const l = await read(); if (!ok.includes(l.slice(0, 3))) throw new Error('SMTP ' + l); return l; };
    (async () => {
      await cmd(null, ['220']); await cmd('EHLO sh', ['250']);
      if (mode === 'starttls') { await cmd('STARTTLS', ['220']); sock.removeAllListeners('data'); sock = tls.connect({ socket: sock, servername: host }); hook(sock); await cmd('EHLO sh', ['250']); }
      if (user) { await cmd('AUTH LOGIN', ['334']); await cmd(Buffer.from(user).toString('base64'), ['334']); await cmd(Buffer.from(pass).toString('base64'), ['235']); }
      const addr = x => (/<([^>]+)>/.exec(x) || [0, x])[1];
      await cmd('MAIL FROM:<' + addr(from) + '>', ['250']); await cmd('RCPT TO:<' + to + '>', ['250', '251']); await cmd('DATA', ['354']);
      const msg = ['From: ' + from, 'To: ' + to, 'Subject: ' + subject, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', '', text.replace(/^\./gm, '..')].join('\r\n');
      await cmd(msg + '\r\n.', ['250']); try { sock.write('QUIT\r\n'); } catch {} done = true; clearTimeout(timer); sock.end(); resolve();
    })().catch(e => { clearTimeout(timer); fail(e); });
  });
}
async function sendMail(to, subject, text) {
  try { await sendMail0(to, subject, text); svcLast.email = EMAIL_PROVIDER === 'console' ? { ok: false, at: Date.now(), err: 'console mode: the code was only printed in the server log, nothing was emailed' } : { ok: true, at: Date.now() }; } catch (e) { svcLast.email = { ok: false, at: Date.now(), err: String(e.message).slice(0, 300) }; throw e; }
}
async function sendMail0(to, subject, text) {
  if (EMAIL_PROVIDER === 'console') { console.log(`[EMAIL to ${to}] ${subject}: ${text}`); return; }
  if (EMAIL_PROVIDER === 'resend') {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + (E.RESEND_API_KEY || ''), 'content-type': 'application/json' }, body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, text }) });
    if (!r.ok) throw new Error('Resend ' + r.status + ' ' + (await r.text()).slice(0, 200)); return;
  }
  if (EMAIL_PROVIDER === 'smtp') { const port = +E.SMTP_PORT || 465; return smtpSend({ host: E.SMTP_HOST || 'smtp.gmail.com', port, user: E.SMTP_USER, pass: E.SMTP_PASS, from: EMAIL_FROM, to, subject, text, mode: E.SMTP_TLS || (port === 465 ? 'ssl' : 'starttls') }); }
  throw new Error('Unknown EMAIL_PROVIDER');
}
const EMAIL_OTP_DIGITS = 6;
const EMAIL_OTP_TTL_SECONDS = 10 * 60;
const createEmailOtp = () => String(crypto.randomInt(0, 10 ** EMAIL_OTP_DIGITS)).padStart(EMAIL_OTP_DIGITS, '0');
const mailOtp = new Map(), mailProof = new Map();   // email -> {hash,salt,exp,tries}; proof -> {email,exp}
routes['POST /api/email/send'] = async (req, body, ip) => {
  const email = String(body.email || '').trim().toLowerCase();
  if (!validEmail(email)) return [400, { ok: false, error: 'Enter a valid email address' }];
  const purpose = ['reset', 'login'].includes(body.purpose) ? body.purpose : 'register', existing = db.users['e:' + email];
  if (purpose === 'register' && existing) return [200, { ok: false, exists: true, error: 'This email is already registered. Please login.' }];
  if (purpose !== 'register' && !existing) return [200, { ok: false, noAccount: true, error: 'No account for this email. Please register.' }];
  if (limited('m:' + email + ':30s', 1, 30e3)) return [429, { ok: false, error: 'Please wait 30 seconds before asking for another code' }];
  if (limited('m:' + email, 5, 36e5) || limited('mip:' + ip, 30, 36e5)) return [429, { ok: false, error: 'Too many requests. Try again later.' }];
  const code = createEmailOtp(), salt = crypto.randomBytes(8).toString('hex');
  mailOtp.set(email + ':' + purpose, { hash: hashCode(code, salt), salt, exp: Date.now() + EMAIL_OTP_TTL_SECONDS * 1000, tries: 0 });
  try { await sendMail(email, 'Your SH Sports code: ' + code, `Your Scoring Heroes code is ${code}. It works for 10 minutes. If you did not ask for it, ignore this email.`); }
  catch (e) { if (mailOtp.get(email + ':' + purpose)?.salt === salt) mailOtp.delete(email + ':' + purpose); console.error('mail:', e.message); return [502, { ok: false, error: 'Could not send the email right now. Try again later.' }]; }
  return [200, { ok: true, digits: EMAIL_OTP_DIGITS, expiresInSeconds: EMAIL_OTP_TTL_SECONDS, ...(EMAIL_PROVIDER === 'console' ? { devCode: code } : {}) }];
};
routes['POST /api/email/verify'] = async (req, body) => {
  const email = String(body.email || '').trim().toLowerCase(), purpose = ['reset', 'login'].includes(body.purpose) ? body.purpose : 'register', k = email + ':' + purpose, p = mailOtp.get(k);
  if (!p || p.exp < Date.now()) return [400, { ok: false, error: 'Code expired. Please request a new one.' }];
  if (p.tries >= 5) { mailOtp.delete(k); return [429, { ok: false, error: 'Too many wrong attempts. Request a new code.' }]; }
  const code = String(body.code ?? body.otp ?? '').trim();
  if (!/^\d{6}$/.test(code)) return [400, { ok: false, error: 'Enter the 6-digit email OTP' }];
  p.tries++;
  if (!safeEq(hashCode(code, p.salt), p.hash)) return [400, { ok: false, error: 'Wrong code, try again' }];
  mailOtp.delete(k);
  const proof = crypto.randomBytes(20).toString('hex'); mailProof.set(proof, { email, purpose, exp: Date.now() + 15 * 60e3 });
  return [200, { ok: true, proof }];
};
const useProof = (proof, email, purpose) => { const p = mailProof.get(String(proof || '')); if (!p) return false; mailProof.delete(String(proof)); return p.exp > Date.now() && p.email === email && p.purpose === purpose; };
routes['POST /api/auth/email-login'] = async (req, body) => {   // new device: the emailed code is the login. The returned token keeps this device signed in.
  const email = String(body.email || '').trim().toLowerCase(), u = db.users['e:' + email];
  if (!u || !useProof(body.proof, email, 'login')) return [400, { ok: false, error: 'Verify your email with the code first' }];
  return [200, { ok: true, profile: pub(u), token: sign('e:' + email) }];
};
routes['POST /api/auth/reset'] = async (req, body) => {   // forgot PIN for email accounts: the emailed code is the proof
  const email = String(body.email || '').trim().toLowerCase(), u = db.users['e:' + email];
  if (!u || !useProof(body.proof, email, 'reset')) return [400, { ok: false, error: 'Verify your email first' }];
  if (!validPin(body.newPin)) return [400, { ok: false, error: 'New PIN must be 4 to 6 digits' }];
  u.salt = crypto.randomBytes(8).toString('hex'); u.ph = pinHash(body.newPin, u.salt); u.emailVerified = true; fails.delete('e:' + email); saveDb();
  return [200, { ok: true }];
};
routes['POST /api/auth/register'] = async (req, body, ip) => {
  const P = pk(body), phone = P.key;
  if (!validIntl(P)) return [400, { ok: false, error: P.isEmail ? 'Enter a valid email address' : BADNUM }];
  if (!validPin(body.pin)) return [400, { ok: false, error: 'PIN must be 4 to 6 digits' }];
  if (limited('reg:' + ip, 20, 36e5)) return [429, { ok: false, error: 'Too many sign-ups from this device. Try later.' }];
  if (db.users[phone]) return [200, { ok: false, exists: true, error: P.isEmail ? 'This email is already registered. Please login.' : 'This number is already registered. Please login.' }];
  if (P.isEmail && !useProof(body.proof, P.email, 'register')) return [400, { ok: false, needCode: true, error: 'Verify your email with the code we send you first' }];
  const c = cleanProfile(P.isEmail ? Object.assign({}, body.profile, { email: P.email }) : body.profile);
  if (c.error) return [400, { ok: false, error: c.error }];
  if (Object.values(db.users).some(u => u.nick.toLowerCase() === c.profile.nick.toLowerCase())) return [400, { ok: false, error: 'That nickname is taken' }];
  const salt = crypto.randomBytes(8).toString('hex');
  const u = db.users[phone] = { ...c.profile, phone, e164: e164(P), role: roleFor(phone, c.profile.kind), created: Date.now(), salt, ph: pinHash(body.pin, salt), ...(P.isEmail ? { emailVerified: true } : {}) };
  saveDb();
  return [200, { ok: true, profile: pub(u), token: sign(phone) }];
};
routes['POST /api/auth/login'] = async (req, body) => {
  const phone = pk(body).key, u = db.users[phone];
  if (locked(phone)) return [429, { ok: false, error: 'Too many wrong PINs. Try again in 15 minutes.' }];
  if (!u) return [200, { ok: false, noAccount: true, error: 'No account for this number. Please register.' }];
  if (!u.ph) return [200, { ok: false, error: 'This account has no PIN yet. Ask the admin to reset it.' }];
  if (!safeEq(pinHash(body.pin || '', u.salt), u.ph)) { bad(phone); return [200, { ok: false, error: 'Wrong PIN' }]; }
  fails.delete(phone);
  return [200, { ok: true, profile: pub(u), token: sign(phone) }];
};
routes['POST /api/auth/pin'] = async (req, body) => {
  const phone = pk(body).key, u = db.users[phone];
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
    res.writeHead(code, { 'content-type': typeof obj === 'string' ? 'text/plain' : 'application/json', 'access-control-allow-origin': allow(origin), vary: 'origin', 'access-control-allow-methods': 'GET,PUT,POST,DELETE,OPTIONS', 'access-control-allow-headers': 'authorization, content-type' });
    res.end(code === 204 ? '' : typeof obj === 'string' ? obj : JSON.stringify(obj));
  };
  if (req.method === 'OPTIONS') return out(204);
  const STATIC = { '/manifest.webmanifest': 'application/manifest+json', '/sw.js': 'application/javascript', '/icon-192.png': 'image/png', '/icon-512.png': 'image/png', '/icon-maskable.png': 'image/png', '/apple-touch-icon.png': 'image/png' };
  const em = /^\/emblems\/[a-z-]+\.webp$/.exec(path);
  if (req.method === 'GET' && em) { try { const f = fs.readFileSync(new URL('./public' + path, import.meta.url)); res.writeHead(200, { 'content-type': 'image/webp', 'cache-control': 'public, max-age=604800' }); return res.end(f); } catch { /* fall through */ } }
  if (req.method === 'GET' && STATIC[path]) {   // installable-app files (PWA)
    try { const f = fs.readFileSync(new URL('./public' + path, import.meta.url)); res.writeHead(200, { 'content-type': STATIC[path], 'cache-control': path === '/sw.js' ? 'no-cache' : 'public, max-age=86400' }); return res.end(f); } catch { /* fall through */ }
  }
  if (req.method === 'GET' && (path === '/' || path === '/index.html')) {   // serve the app itself, same address as the API
    try {
      const html = fs.readFileSync(new URL('./app-index.html', import.meta.url));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-sh-commit': String(E.RENDER_GIT_COMMIT || 'local') });
      return res.end(html);
    } catch { /* fall through to 404 */ }
  }
  if (path.startsWith('/api/shared/')) {   // shared public data: matches, tournaments, auctions (anyone reads, the owner writes)
    const [, , , col, id] = path.split('/'), COLS = ['matches', 'sports', 'tours', 'auc'];
    if (!COLS.includes(col)) return out(404, { ok: false, error: 'Unknown collection' });
    const bag = db.shared[col] = db.shared[col] || {};
    if (req.method === 'GET' && !id) {
      const since = +new URL(req.url, 'http://x').searchParams.get('since') || 0;
      const list = Object.values(bag).filter(d => d.updated > since).sort((a, b) => b.updated - a.updated).slice(0, 200);
      return out(200, { ok: true, items: list, now: Date.now() });
    }
    if (req.method === 'GET') return bag[id] ? out(200, { ok: true, item: bag[id] }) : out(404, { ok: false, error: 'Not found' });
    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), phone = readSession(tok), u = phone && db.users[phone];
    if (!u) return out(401, { ok: false, error: 'Please sign in again' });
    if (col === 'sports' && !['admin','scorer'].includes(u.role)) return out(403, { ok: false, error: 'Only an authorised scorer can publish or change sport matches' });
    if (!id || !/^[\w-]{3,40}$/.test(id)) return out(400, { ok: false, error: 'Bad id' });
    const cur = bag[id];
    if (cur && cur.owner !== phone && u.role !== 'admin') return out(403, { ok: false, error: 'Only the owner can change this' });
    if (req.method === 'DELETE') { delete bag[id]; saveDb(); return out(200, { ok: true }); }
    if (req.method !== 'PUT') return out(405, { ok: false, error: 'Method not allowed' });
    let raw = ''; for await (const c of req) { raw += c; if (raw.length > 400000) return out(413, { ok: false, error: 'Too large' }); }
    let b; try { b = JSON.parse(raw); } catch { return out(400, { ok: false, error: 'Bad body' }); }
    if (col === 'sports') {
      const m = b.data && b.data.m;
      if (!m || m.id !== id || !['football','kabaddi','bd','bd15','vb','vbb'].includes(m.sport) ||
          !Array.isArray(m.tn) || m.tn.length !== 2 || m.tn.some(n => typeof n !== 'string' || !n.trim() || n.length > 100) ||
          (m.ev != null && !Array.isArray(m.ev)) || (m.log != null && !Array.isArray(m.log))) {
        return out(400, { ok: false, error: 'Invalid sport match' });
      }
      delete m.rm; delete m._sh;
    }
    if (limited('shw:' + phone, 600, 36e5)) return out(429, { ok: false, error: 'Too many saves, slow down' });
    bag[id] = { id, owner: cur ? cur.owner : phone, ownerName: u.nick || u.name || '', updated: Date.now(), data: b.data };
    saveDb(); return out(200, { ok: true, updated: bag[id].updated });
  }
  if (path.startsWith('/api/aucreg/')) {   // auction player registrations: players submit, organiser reviews (server decides status)
    const [, , , aid, rid] = path.split('/');
    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), phone = readSession(tok), u = phone && db.users[phone];
    if (!u) return out(401, { ok: false, error: 'Please sign in first' });
    if (!aid || !/^[\w-]{3,40}$/.test(aid)) return out(400, { ok: false, error: 'Bad auction' });
    const au = db.shared && db.shared.auc && db.shared.auc[aid];
    if (!au) return out(404, { ok: false, error: 'This auction is not published yet' });
    const cfg = au.data && au.data.a && au.data.a.reg;
    const bag = (db.aucreg = db.aucreg || {}), regs = (bag[aid] = bag[aid] || {});
    const isOrg = au.owner === phone || u.role === 'admin';
    if (!u.shid) { let id; do { id = 'SH-' + crypto.randomBytes(5).toString('hex').slice(0, 8).toUpperCase(); } while (Object.values(db.users).some(x => x.shid === id)); u.shid = id; }
    const view = r => ({ id: r.id, pid: r.pid, status: r.status, form: r.form, cat: r.cat, base: r.base, max: r.max, fee: r.fee, paid: r.paid, note: r.note, created: r.created, updated: r.updated, audit: r.audit });
    const mine = Object.values(regs).find(r => r.owner === phone);
    if (req.method === 'GET') {
      if (isOrg && !rid) return out(200, { ok: true, org: true, regs: Object.values(regs).map(view) });
      return out(200, { ok: true, org: false, reg: mine ? view(mine) : null });
    }
    let raw = ''; for await (const c of req) { raw += c; if (raw.length > 300000) return out(413, { ok: false, error: 'Photo or form too large' }); }
    let b; try { b = JSON.parse(raw); } catch { return out(400, { ok: false, error: 'Bad body' }); }
    if (limited('areg:' + phone, 120, 36e5)) return out(429, { ok: false, error: 'Too many requests, slow down' });
    const now = Date.now();
    if (req.method === 'POST' && !rid) {   // player submits or re-submits own registration
      if (!cfg || !cfg.open) return out(400, { ok: false, error: 'Registration is not open for this auction' });
      const today = new Date().toISOString().slice(0, 10);
      if (cfg.from && today < cfg.from) return out(400, { ok: false, error: 'Registration opens on ' + cfg.from });
      if (cfg.to && today > cfg.to) return out(400, { ok: false, error: 'Registration closed on ' + cfg.to });
      const f = b.form || {}, str = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
      const form = { name: str(f.name, 60), dob: str(f.dob, 10), city: str(f.city, 60), role: str(f.role, 30), bat: str(f.bat, 30), bowl: str(f.bowl, 40), team: str(f.team, 60), link: str(f.link, 300), avail: str(f.avail, 120), prefCat: str(f.prefCat, 30), photo: str(f.photo, 200000), decl: !!f.decl, srcKind: str(f.srcKind, 30), srcNote: str(f.srcNote, 200) };
      if (!form.name) return out(400, { ok: false, error: 'Display name is required' });
      if (!/^data:image\/(png|jpe?g|webp);base64,/.test(form.photo)) return out(400, { ok: false, error: 'A player photo is required for this auction' });
      if (!form.decl) return out(400, { ok: false, error: 'Please accept the declaration' });
      if (form.dob && !/^\d{4}-\d{2}-\d{2}$/.test(form.dob)) return out(400, { ok: false, error: 'Date of birth looks wrong' });
      const fee = +cfg.fee || 0;
      if (mine) {
        if (!['CHANGES_REQUIRED', 'PAYMENT_PENDING'].includes(mine.status)) return out(409, { ok: false, error: 'You already registered (' + mine.status.replace(/_/g, ' ') + '). Edits are allowed only when changes are requested.' });
        mine.form = form; mine.updated = now; if (mine.status === 'CHANGES_REQUIRED') mine.status = (fee && !mine.paid) ? 'PAYMENT_PENDING' : 'SUBMITTED'; mine.audit.push({ t: now, by: 'player', a: 'resubmitted' });
      } else {
        const id = 'RG-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        regs[id] = { id, owner: phone, pid: u.shid, form, fee, paid: fee === 0, status: fee ? 'PAYMENT_PENDING' : 'SUBMITTED', created: now, updated: now, audit: [{ t: now, by: 'player', a: 'submitted' }] };
      }
      saveDb(); return out(200, { ok: true, reg: view(mine || Object.values(regs).find(r => r.owner === phone)) });
    }
    if (req.method === 'PUT' && rid) {   // organiser decision
      if (!isOrg) return out(403, { ok: false, error: 'Only the auction organiser can review registrations' });
      const r = regs[rid]; if (!r) return out(404, { ok: false, error: 'Registration not found' });
      const act = String(b.action || ''), note = String(b.note || '').slice(0, 300);
      if (act === 'paid') { r.paid = true; if (r.status === 'PAYMENT_PENDING') r.status = 'SUBMITTED'; r.audit.push({ t: now, by: 'organiser', a: 'payment recorded by organiser' }); }
      else if (act === 'review') { if (r.status === 'SUBMITTED') r.status = 'UNDER_REVIEW'; r.audit.push({ t: now, by: 'organiser', a: 'under review' }); }
      else if (act === 'approve') {
        if (!r.paid) return out(400, { ok: false, error: 'Fee is not recorded as paid yet' });
        const cat = String(b.cat || '').slice(0, 30), base = +b.base, max = b.max === '' || b.max == null ? null : +b.max;
        if (!cat || !(base > 0)) return out(400, { ok: false, error: 'Choose a category and a base price first' });
        if (max != null && !(max >= base)) return out(400, { ok: false, error: 'Maximum must not be below the base price' });
        r.status = 'APPROVED'; r.cat = cat; r.base = base; r.max = max; r.note = note; r.audit.push({ t: now, by: 'organiser', a: 'approved: ' + cat + ' base ' + base });
      } else if (act === 'changes' || act === 'reject') {
        if (!note) return out(400, { ok: false, error: 'Add a short reason for the player' });
        r.status = act === 'changes' ? 'CHANGES_REQUIRED' : 'REJECTED'; r.note = note; r.audit.push({ t: now, by: 'organiser', a: r.status.toLowerCase().replace(/_/g, ' ') + ': ' + note });
      } else return out(400, { ok: false, error: 'Unknown action' });
      r.updated = now; saveDb(); return out(200, { ok: true, reg: view(r) });
    }
    return out(405, { ok: false, error: 'Method not allowed' });
  }
  if (path === '/api/cases' || path.startsWith('/api/cases/')) {   // support / dispute cases: user files, admin decides, everything audited
    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), phone = readSession(tok), u = phone && db.users[phone];
    if (!u) return out(401, { ok: false, error: 'Please sign in first' });
    const cs = (db.cases = db.cases || {}), TYPES = ['identity', 'duplicate', 'career', 'score', 'ranking', 'payment', 'order'];
    const view = c => ({ id: c.id, type: c.type, ref: c.ref, text: c.text, evidence: c.evidence, status: c.status, decision: c.decision, role: c.role, created: c.created, updated: c.updated, audit: c.audit, by: c.byName });
    const rid = path.split('/')[3];
    if (req.method === 'GET') return out(200, { ok: true, admin: u.role === 'admin', cases: Object.values(cs).filter(c => u.role === 'admin' || c.owner === phone).sort((a, b) => b.created - a.created).slice(0, 200).map(view) });
    let raw = ''; for await (const c of req) { raw += c; if (raw.length > 20000) return out(413, { ok: false, error: 'Too large' }); }
    let b; try { b = JSON.parse(raw); } catch { return out(400, { ok: false, error: 'Bad body' }); }
    if (limited('case:' + phone, 60, 36e5)) return out(429, { ok: false, error: 'Too many requests, slow down' });
    const now = Date.now(), str = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
    if (req.method === 'POST' && !rid) {
      const type = str(b.type, 20), text = str(b.text, 1500);
      if (!TYPES.includes(type)) return out(400, { ok: false, error: 'Choose what the problem is about' });
      if (text.length < 10) return out(400, { ok: false, error: 'Describe the problem in a few words (at least 10 characters)' });
      const id = 'CS-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      cs[id] = { id, owner: phone, byName: u.nick || u.name || '', type, ref: str(b.ref, 200), text, evidence: str(b.evidence, 500), status: 'OPEN', role: type === 'payment' || type === 'order' ? 'admin (finance)' : 'admin', created: now, updated: now, audit: [{ t: now, by: u.nick || 'user', a: 'filed' }] };
      saveDb(); return out(200, { ok: true, case: view(cs[id]) });
    }
    if (req.method === 'PUT' && rid) {
      if (u.role !== 'admin') return out(403, { ok: false, error: 'Only an admin can decide cases' });
      const c = cs[rid]; if (!c) return out(404, { ok: false, error: 'Case not found' });
      const st = str(b.status, 20), dec = str(b.decision, 600);
      if (!['IN_REVIEW', 'RESOLVED', 'REJECTED'].includes(st)) return out(400, { ok: false, error: 'Bad status' });
      if (st !== 'IN_REVIEW' && !dec) return out(400, { ok: false, error: 'Write the decision and reason' });
      c.status = st; if (dec) c.decision = dec; c.updated = now; c.audit.push({ t: now, by: u.nick || 'admin', a: st.toLowerCase().replace('_', ' ') + (dec ? ': ' + dec : '') });
      saveDb(); return out(200, { ok: true, case: view(c) });
    }
    return out(405, { ok: false, error: 'Method not allowed' });
  }
  if (path === '/api/prefs' || path === '/api/catalogue') {   // account preferences (country, sports, primary sport) and the admin-managed sports catalogue
    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), phone = readSession(tok), u = phone && db.users[phone];
    if (path === '/api/catalogue') {
      if (req.method === 'GET') return out(200, { ok: true, cfg: db.catalogue || null });
      if (req.method !== 'PUT') return out(405, { ok: false, error: 'Method not allowed' });
      if (!u) return out(401, { ok: false, error: 'Please sign in again' });
      if (u.role !== 'admin') return out(403, { ok: false, error: 'Only an admin can change the sports catalogue' });
      let raw = ''; for await (const c of req) { raw += c; if (raw.length > 600000) return out(413, { ok: false, error: 'Too large' }); }
      let b; try { b = JSON.parse(raw); } catch { return out(400, { ok: false, error: 'Bad body' }); }
      const cfg = b.cfg;
      if (!cfg || !Array.isArray(cfg.cat) || cfg.cat.length > 3000 || typeof cfg.cdef !== 'object') return out(400, { ok: false, error: 'Bad catalogue' });
      if (limited('cat:' + phone, 120, 36e5)) return out(429, { ok: false, error: 'Too many saves, slow down' });
      db.catalogue = { updated: Date.now(), by: u.nick || u.name || phone, cat: cfg.cat, cdef: cfg.cdef };
      saveDb(); return out(200, { ok: true, updated: db.catalogue.updated });
    }
    if (!u) return out(401, { ok: false, error: 'Please sign in again' });
    if (!u.shid) { let id; do { id = 'SH-' + crypto.randomBytes(5).toString('hex').slice(0, 8).toUpperCase(); } while (Object.values(db.users).some(x => x.shid === id)); u.shid = id; saveDb(); }
    if (req.method === 'GET') return out(200, { ok: true, prefs: u.prefs || null, shid: u.shid });
    if (req.method !== 'PUT') return out(405, { ok: false, error: 'Method not allowed' });
    let raw = ''; for await (const c of req) { raw += c; if (raw.length > 20000) return out(413, { ok: false, error: 'Too large' }); }
    let b; try { b = JSON.parse(raw); } catch { return out(400, { ok: false, error: 'Bad body' }); }
    const q = b.prefs || {}, id = /^[\w-]{1,40}$/;
    if (!Array.isArray(q.sports) || q.sports.length > 100 || !q.sports.every(x => typeof x === 'string' && id.test(x))) return out(400, { ok: false, error: 'Bad sports list' });
    if (q.primary && !(typeof q.primary === 'string' && id.test(q.primary))) return out(400, { ok: false, error: 'Bad primary sport' });
    if (q.country && !/^[A-Z]{2}$/.test(q.country)) return out(400, { ok: false, error: 'Bad country' });
    if (limited('prf:' + phone, 300, 36e5)) return out(429, { ok: false, error: 'Too many saves, slow down' });
    u.prefs = { country: q.country || '', sports: q.sports, primary: q.primary || 'cricket', lang: String(q.lang || 'en').slice(0, 8), updated: Date.now() };
    saveDb(); return out(200, { ok: true, updated: u.prefs.updated, shid: u.shid });
  }
  const pth = path === '/otp/verify-link' ? '/api/otp/link' : (/^\/(otp|live|cric|streams|mo|wa|news|auth|paper|history|freephoto)/.test(path) ? '/api' + path : path);
  const h = routes[req.method + ' ' + pth];
  if (!h) return out(404, { ok: false, error: 'Not found' });
  let raw = '';
  for await (const c of req) { raw += c; if (raw.length > (pth === '/api/paper' ? 300000 : 20000)) return out(413, { ok: false, error: 'Too large' }); }
  let body = {};
  try { body = raw ? (raw.trim().startsWith('{') ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw))) : {}; } catch { return out(400, { ok: false, error: 'Bad body' }); }
  if (req.method === 'GET') body = { ...Object.fromEntries(new URL(req.url, 'http://x').searchParams), ...body };
  else for (const [k, v] of new URL(req.url, 'http://x').searchParams) if (body[k] == null) body[k] = v;
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  try { const [code, obj] = await h(req, body, ip); out(code, obj); }
  catch (e) { console.error(e); out(500, { ok: false, error: 'Server error' }); }
}).listen(PORT, () => console.log(`Scoring Heroes API on :${PORT}  (SMS: ${SMS_PROVIDER}, live feed: ${SM ? 'sportmonks' : CRIC_KEY ? 'cricketdata' : 'off'})`));
