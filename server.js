// Scoring Heroes backend: OTP SMS from "SH Sports" + magic login link + live cricket proxy.
// Run npm install, then npm start. Environment may come from Render or dotenv.
import './env.mjs';
import { createNeonQuery } from './neon-postgres.mjs';
import { createMatchJournal } from './match-journal.mjs';
import { createSportmonks } from './sportmonks.mjs';
import { createFootball } from './sportmonks-football.mjs';
import { createHighlightly, SPORTS as HL_SPORTS } from './highlightly.mjs';
import { createLiveTennis } from './livetennis.mjs';
import http from 'node:http';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
const path_ = path;
import net from 'node:net';
import { answersFrom, board as pollBoard, POLL_POINTS } from './poll-score.mjs';
import tls from 'node:tls';
import { createHistory, sameTeamName } from './history.mjs';
import { genVapid, sendPush } from './webpush.mjs';
import { snapshotOf, diffSnapshots } from './observer.mjs';
import { createRecent, buildBbb, buildFow, buildPartnerships, inningsTotals, RECENT_SOURCE } from './recent.mjs';
import { oddsOrWinningProbability } from './odds-probability.mjs';

const E = process.env;
const PORT = +E.PORT || 8080;
const APP_URL = (E.APP_URL || 'http://localhost:5500').replace(/\/$/, '');   // where the Scoring Heroes web app is hosted (HTTPS in production)
const ORIGINS = (E.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean); // empty = allow any origin (dev only)
const svcLast = { email: null, sms: null };
const SMS_PROVIDER = E.SMS_PROVIDER || 'console';           // console | msg91 | textbee
// Allow a 50-user OTP burst behind a shared network; per-number and gateway quotas still apply.
const SMS_TOTAL_BUDGET = Math.max(0, parseInt(E.SMS_TOTAL_BUDGET, 10) || 0);   // trial pack cap (0 = unlimited)
const SMS_OTP_IP_HOURLY_LIMIT = Number.isInteger(Number(E.SMS_OTP_IP_HOURLY_LIMIT)) && Number(E.SMS_OTP_IP_HOURLY_LIMIT) >= 50 && Number(E.SMS_OTP_IP_HOURLY_LIMIT) <= 1000 ? Number(E.SMS_OTP_IP_HOURLY_LIMIT) : 100;
const EMAIL_PROVIDER = E.EMAIL_PROVIDER || 'console';       // console | brevo | resend | smtp (Render free blocks SMTP ports; use brevo)
const EMAIL_FROM = E.EMAIL_FROM || E.SMTP_USER || 'SH Sports <no-reply@example.com>';
const COUNTRY = E.COUNTRY_CODE || '91';
const CRIC_KEY = E.CRIC_API_KEY || '';
const CRIC_BASE = E.CRIC_BASE || 'https://api.cricapi.com/v1';
const SM_TOKEN = E.SPORTMONKS_TOKEN || '';
let SM = SM_TOKEN ? createSportmonks({ token: SM_TOKEN, base: E.SPORTMONKS_BASE || undefined }) : null;
const HL_KEY = E.HIGHLIGHTLY_KEY || '';
const TN = E.LIVETENNIS_KEY ? createLiveTennis({ key: E.LIVETENNIS_KEY, base: E.LIVETENNIS_BASE || undefined }) : null;
let HL = HL_KEY ? createHighlightly({ key: HL_KEY, base: E.HIGHLIGHTLY_BASE || undefined }) : null;
const FB_TOKEN = E.FOOTBALL_TOKEN || '';
let FB = FB_TOKEN ? createFootball({ token: FB_TOKEN, base: E.FOOTBALL_BASE || undefined }) : null;
const LIVE_TTL = (+E.LIVE_CACHE_SECONDS || 60) * 1000;
const envKey = s => { if (String(s).includes('@')) return 'e:' + String(s).trim().toLowerCase().replace(/^e:/i, ''); const d = String(s).replace(/\D/g, ''); return d.length === 10 ? d : (d.startsWith('91') && d.length === 12 ? d.slice(2) : d); };
// Test mode: SMS_SCREEN_OTP=1 shows the code on the phone screen instead of sending an SMS. Anyone who knows a number can then sign in as it, so admin/scorer numbers are always excluded.
const SCREEN_OTP = E.SMS_SCREEN_OTP === '1';
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
const neon = createNeonQuery(DATABASE_URL);
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
db.providerKeys = db.providerKeys || {};
if (!SM && db.providerKeys.sportmonks) SM = createSportmonks({ token: db.providerKeys.sportmonks, base: E.SPORTMONKS_BASE || undefined });
if (!HL && db.providerKeys.highlightly) HL = createHighlightly({ key: db.providerKeys.highlightly, base: E.HIGHLIGHTLY_BASE || undefined });
if (!FB && db.providerKeys.football) FB = createFootball({ token: db.providerKeys.football, base: E.FOOTBALL_BASE || undefined });
// Server journal: a shared replay log; observations never become invented deliveries.
const JOURNAL_FILE=E.MATCH_JOURNAL_FILE||path.join(path.dirname(DATA_FILE),'match-journal.json');
let journalState={},journalTimer=null,journalRemote=Promise.resolve();
const journalStorage={databaseConnected:!!neonOk,localSavedAt:0,remoteSavedAt:0,error:''};
try{journalState=JSON.parse(fs.readFileSync(JOURNAL_FILE,'utf8'));journalStorage.localSavedAt=fs.statSync(JOURNAL_FILE).mtimeMs}catch{}
if(neonOk){try{const r=await neon('select v from kv where k=$1',['match-journal-v1']);if(r.rows?.[0])journalState=JSON.parse(r.rows[0].v)}catch{journalStorage.error='Could not restore database journal'}}
const journalArchivePending=new Map();
function shTeamCode(name,given){name=String(name||'').trim();const w=name.split(/\s+/),q=w.length>1?w[w.length-1].replace(/['\u2019]s$/i,''):'';const isQ=/^(A|B|C|XI|U-?\d{2}|Women|Emerging|Academy|Development|Juniors?|Select)$/i.test(q);let base=String(given||'').trim().toUpperCase();if(!base)base=(isQ?w.slice(0,-1).join(' '):name).replace(/[^A-Za-z ]/g,'').slice(0,3).toUpperCase();if(!isQ)return base;const tag=({women:'W',emerging:'EM',academy:'ACA',development:'DEV',junior:'JR',juniors:'JR',select:'SEL'})[q.toLowerCase()]||q.toUpperCase().replace('-','');return new RegExp('\\b'+tag+'$').test(base)?base:base+' '+tag}
function saveMatchJournal(state){
 for(const [id,match] of Object.entries(state.matches||{}))journalArchivePending.set(id,JSON.stringify({match,engine:state.engine?.[id]}));
 clearTimeout(journalTimer);journalTimer=setTimeout(()=>{const raw=JSON.stringify(state),rows=[...journalArchivePending];journalArchivePending.clear();
  try{fs.mkdirSync(JOURNAL_FILE+'.matches',{recursive:true});for(const [id,value]of rows){const file=path.join(JOURNAL_FILE+'.matches',id+'.json');fs.writeFileSync(file+'.tmp',value);fs.renameSync(file+'.tmp',file)}fs.writeFileSync(JOURNAL_FILE+'.tmp',raw);fs.renameSync(JOURNAL_FILE+'.tmp',JOURNAL_FILE);journalStorage.localSavedAt=Date.now();journalStorage.error=''}catch{journalStorage.error='Server file save failed'}
  if(neonOk)journalRemote=journalRemote.then(async()=>{for(const [id,value]of rows)await neon('insert into kv(k,v) values($1,$2) on conflict(k) do update set v=excluded.v',['match-journal:'+id,value]);await neon('insert into kv(k,v) values($1,$2) on conflict(k) do update set v=excluded.v',['match-journal-v1',raw]);journalStorage.remoteSavedAt=Date.now()}).catch(()=>{journalStorage.error='Database journal save failed; server file retained'})
 },500);journalTimer.unref()
}
async function restoreArchivedJournal(id){let row;try{row=JSON.parse(fs.readFileSync(path.join(JOURNAL_FILE+'.matches',id+'.json'),'utf8'))}catch{}if(!row&&neonOk){try{const r=await neon('select v from kv where k=$1',['match-journal:'+id]);if(r.rows?.[0])row=JSON.parse(r.rows[0].v)}catch{}}if(row)matchJournal.restore(row)}

const matchJournal=createMatchJournal({state:journalState,save:saveMatchJournal,load:id=>{try{return JSON.parse(fs.readFileSync(path.join(JOURNAL_FILE+'.matches',id+'.json'),'utf8'))}catch{return null}}});
const matchWatch=new Map(),matchWatchBusy=new Set();
async function pollMatchJournal(id){if(matchWatchBusy.has(id))return;const watch=matchWatch.get(id);if(!watch)return;matchWatchBusy.add(id);try{const n=Date.now(),j=matchJournal.view(id),eps=['match_scorecard'];if(!watch.infoAt||n-watch.infoAt>=60000){eps.push('match_info');watch.infoAt=n}if(!watch.squadAt||n-watch.squadAt>=300000){eps.push('match_squad');watch.squadAt=n}if(!watch.ballAt||n-watch.ballAt>=(j?.balls?.length?20000:60000)){eps.push('match_bbb');watch.ballAt=n}await Promise.allSettled(eps.map(ep=>routes['GET /api/cric']({}, {ep,id},'journal-monitor-'+id)))}finally{matchWatchBusy.delete(id)}}
setInterval(()=>{const now=Date.now();for(const [id,w]of matchWatch){if(w.until<now||matchJournal.view(id)?.ended){matchWatch.delete(id);continue}pollMatchJournal(id)}},20000).unref();


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
const sign = phone => { const body = b64({ p: phone, e: Date.now() + 3650 * 864e5, i: Date.now() }); return body + '.' + crypto.createHmac('sha256', SECRET).update(body).digest('base64url'); };
function readSession(tok) {
  const [body, sig] = String(tok || '').split('.');
  if (!body || !sig) return null;
  const ok = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (!safeEq(sig, ok)) return null;
  try {
    const o = JSON.parse(Buffer.from(body, 'base64url').toString()); if (!(o.e > Date.now())) return null;
    const u = typeof db !== 'undefined' && db && db.users && db.users[o.p];
    if (u && (u.closed || (u.revokeBefore && (o.i || 0) < u.revokeBefore))) return null;   // closed account, or signed out of all devices
    return o.p;
  } catch { return null; }
}
function limited(key, max, windowMs) {
  const now = Date.now(), arr = (sends.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) { sends.set(key, arr); return true; }
  arr.push(now); sends.set(key, arr); return false;
}
function promote(u, key) {   // ADMIN_PHONES / SCORER_PHONES (numbers or emails) apply to existing accounts too, not only at sign-up
  const k = key || (u && u.phone); if (!u || !k) return u;
  if (ADMINS.includes(k)) u.role = 'admin'; else if (SCORERS.includes(k) && u.role !== 'admin') u.role = 'scorer';
  return u;
}
function roleFor(phone, kind) {
  if (ADMINS.includes(phone) || Object.keys(db.users).length === 0) return 'admin';   // the very first user becomes admin
  if (kind === 'Scorer' && SCORERS.includes(phone)) return 'scorer';
  if (db.invites && db.invites[phone] === 'scorer') return 'scorer';   // invited by an admin from the app before the account existed
  return 'viewer';                                                                    // everyone else; promote via ADMIN_PHONES / SCORER_PHONES
}
function cleanProfile(p) {
  p = p || {};
  const nick = String(p.nick || '').replace(/\s+/g, ' ').trim(), kind = ['Player', 'Fan', 'Scorer', 'Organiser'].includes(p.kind) ? p.kind : 'Fan';
  if (!/^[^<>\p{C}]{3,20}$/u.test(nick)) return { error: 'Nickname must be 3-20 characters (letters, numbers, spaces and symbols are fine; < and > are not allowed)' };
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
const pub = u => { promote(u); return pubRaw(u); };
const pubRaw = u => ({ nick: u.nick, name: u.nick, email: u.email, age: u.age, loc: u.loc, kind: u.kind, role: u.role, phone: u.phone });

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
  if ((+(info && info.hitsLimit) || 0) > 5000) return (+E.LIVE_CACHE_SECONDS || 15) * 1000;   // unlimited plan: refresh every 15 s unless LIVE_CACHE_SECONDS says otherwise   // generous plan: refresh every LIVE_CACHE_SECONDS (default 60 s)
  const lim = +(info && info.hitsLimit) || 100, used = +(info && info.hitsToday) || 0, left = Math.max(1, lim - used - 8);
  const now = new Date(), end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1), secs = (end - now) / 1000;
  return Math.min(60 * 60e3, Math.max(5 * 60e3, secs / left * 1000 * 1.15));
}
// Share in-flight refreshes between the background engine and HTTP viewers.
let liveRefreshPromise = null;
async function liveMatches() {
  if (SM && !CRIC_KEY) return smLive();
  const base = await cdLive();
  return SM ? hybridLive(base) : base;
}
// Both providers together: CricketData gives every match and score; Sportmonks is used for the ball by ball of a match whenever it has deliveries for it.
const smBy = new Map(), smBbbC = new Map();   // CricketData match id -> Sportmonks fixture number; Sportmonks fixture number -> {t,n,b}
let hy = { t: 0, src: null, data: null };
const normT = s => String(s || '').toLowerCase().replace(/\b(womens?|w)\b/g, 'women').replace(/[^a-z]/g, '');
const pairKey = m => [m && m.teams && m.teams[0] && m.teams[0].name, m && m.teams && m.teams[1] && m.teams[1].name].map(normT).sort().join('|');
const dayOf = d => Date.parse(String(d || '').slice(0, 10) + 'T00:00:00Z');
const smHits = [];   // timestamps of Sportmonks ball-by-ball calls in the last hour, kept under the plan's hourly API limit
const SM_HOURLY = +E.SPORTMONKS_HOURLY_BUDGET || 700;
async function smBalls(num, ttl = 15e3) {
  const c = smBbbC.get(num);
  if (c && Date.now() - c.t < ttl) return c.b || [];
  const cut = Date.now() - 36e5; while (smHits.length && smHits[0] < cut) smHits.shift();
  if (smHits.length >= SM_HOURLY) return c ? c.b || [] : [];   // budget used up: keep what we have, call again later
  smHits.push(Date.now());
  try { const b = await SM.bbb(num); smBbbC.set(num, { t: Date.now(), n: b.length, b }); if (smBbbC.size > 300) smBbbC.clear(); return b; }
  catch { smBbbC.set(num, { t: Date.now(), n: 0, b: [] }); return []; }
}
async function hybridLive(base) {
  if (!base || !Array.isArray(base.matches)) return base;
  if (hy.data && hy.src === base && Date.now() - hy.t < 15e3) return hy.data;
  let sm = []; try { sm = ((await smLive()).matches) || []; } catch {}
  const idx = new Map(); sm.forEach(m => { const k = pairKey(m); if (!idx.has(k)) idx.set(k, []); idx.get(k).push(m); });
  // A fixture the main provider never lists (e.g. India's own matches) is added from the second provider automatically.
  const used = new Set(); const baseKeys = new Set(base.matches.map(m => pairKey(m)));
  const out = base.matches.map(m => {
    const c = (idx.get(pairKey(m)) || []).find(x => Math.abs(dayOf(x.date) - dayOf(m.date)) <= 864e5);
    if (!c) return m;
    smBy.set(m.id, String(c.id).replace(/^sm/, ''));
    return { ...m, smId: c.id };
  });
  for (const c of sm) { if (!c || !c.id || !(c.teams && c.teams.length >= 2) || c.ended && Date.now() - Date.parse(c.time || c.date || 0) > 3 * 864e5) continue; const k = pairKey(c); const near = base.matches.some(m => pairKey(m) === k && Math.abs(dayOf(m.date) - dayOf(c.date)) <= 864e5); if (!near && !used.has(c.id)) { used.add(c.id); out.push({ ...c, smId: c.id, extra: 'sportmonks' }); } }
  await Promise.all(out.filter(m => m.smId && m.started && !m.ended).slice(0, 12).map(async m => { const b = await smBalls(m.smId.slice(2), 90e3); if (b.length) { m.bbb = true; m.bbbSrc = 'sportmonks'; } }));
  hy = { t: Date.now(), src: base, data: { ...base, matches: out } };
  return hy.data;
}
async function cdLive() {
  if (liveRefreshPromise) return liveRefreshPromise;
  liveRefreshPromise = fetchLiveMatches();
  try { return await liveRefreshPromise; }
  finally { liveRefreshPromise = null; }
}
async function fetchLiveMatches() {
  if (!CRIC_KEY) throw Object.assign(new Error('CRIC_API_KEY is not set on the server'), { code: 503 });
  if (live.data && Date.now() - live.t < live.ttl) return live.data;
  try {
    const get = async ep => (await fetch(`${CRIC_BASE}/${ep}?apikey=${encodeURIComponent(CRIC_KEY)}&offset=0`)).json();
    const j = await get('currentMatches');
    if (j.status !== 'success') throw new Error(j.reason || 'Cricket API error');
    // Discover additional current-match pages; preserve primary results if
    // later pages fail. Page count is bounded to protect provider quotas.
    const currentRows = [...(Array.isArray(j.data) ? j.data : [])];
    const pages = Math.max(1, Math.min(4, Number(E.CRICKETDATA_SYNC_PAGES) || 2));
    const pageSize = 25;
    if (currentRows.length >= pageSize) {
      for (let page = 1; page < pages; page++) {
        try {
          const extra = await (await fetch(`${CRIC_BASE}/currentMatches?apikey=${encodeURIComponent(CRIC_KEY)}&offset=${page * pageSize}`, { signal: AbortSignal.timeout(10000) })).json();
          if (extra.status !== 'success' || !Array.isArray(extra.data) || !extra.data.length) break;
          const existing = new Set(currentRows.map(m => m && m.id));
          const unseen = extra.data.filter(m => m && m.id && !existing.has(m.id));
          if (!unseen.length) break;
          currentRows.push(...unseen);
          if (extra.data.length < pageSize) break;
        } catch (error) {
          console.warn('CricketData additional currentMatches page unavailable:', error.message);
          break;
        }
      }
    }
    if (Date.now() - sched.t > 3 * 3600e3) {
      try {
        // The schedule list is paged (25 per page). Reading only page 1 hid upcoming matches such as India fixtures, so read several pages.
        const sp = Math.max(1, Math.min(10, Number(E.CRICKETDATA_SCHEDULE_PAGES) || 6)), rows = [];
        for (let pg = 0; pg < sp; pg++) {
          const jx = await (await fetch(`${CRIC_BASE}/matches?apikey=${encodeURIComponent(CRIC_KEY)}&offset=${pg * 25}`, { signal: AbortSignal.timeout(10000) })).json();
          if (jx.status !== 'success' || !Array.isArray(jx.data) || !jx.data.length) { if (pg === 0) throw new Error(jx.reason || 'schedule unavailable'); break; }
          rows.push(...jx.data); if (jx.data.length < 25) break;
        }
        // The paged list can still miss big fixtures (India). Also read the fixture list of any current India series.
        try {
          const sj = await (await fetch(`${CRIC_BASE}/series?apikey=${encodeURIComponent(CRIC_KEY)}&offset=0&search=India`, { signal: AbortSignal.timeout(10000) })).json();
          const now = Date.now(), yr = new Date().getFullYear();
          const cand = (Array.isArray(sj.data) ? sj.data : []).filter(x => x && x.id && /india/i.test(x.name || '')).filter(x => { const e = Date.parse(String(x.endDate || x.enddate || '') + (/\d{4}/.test(String(x.endDate || x.enddate || '')) ? '' : ' ' + yr)); return !e || e > now - 2 * 864e5; }).slice(0, 4);
          for (const x of cand) {
            try {
              const si = await (await fetch(`${CRIC_BASE}/series_info?apikey=${encodeURIComponent(CRIC_KEY)}&id=${encodeURIComponent(x.id)}`, { signal: AbortSignal.timeout(10000) })).json();
              const ml = si && si.data && Array.isArray(si.data.matchList) ? si.data.matchList : [];
              rows.push(...ml.map(m => ({ ...m, series_id: m.series_id || x.id, seriesName: m.seriesName || x.name })));
            } catch (e2) {}
          }
        } catch (e1) {}
        sched = { t: Date.now(), rows };
      } catch (e) { sched.t = Date.now() - 2 * 3600e3; }
    }
    const seen = new Set(), rows = [...currentRows, ...sched.rows].filter(m => m && m.id && !seen.has(m.id) && seen.add(m.id));
    const matches = rows.map(m => ({
      id: m.id, name: m.name, type: m.matchType, seriesId: m.series_id || m.seriesId || '', seriesName: m.seriesName || m.series_name || '', status: m.status, venue: m.venue, date: m.date, time: m.dateTimeGMT || '',
      started: !!m.matchStarted, ended: !!m.matchEnded,
      teams: (m.teamInfo && m.teamInfo.length ? m.teamInfo : (m.teams || []).map(n => ({ name: n, shortname: '' })))
        .map(t => ({ name: t.name, short: shTeamCode(t.name, t.shortname), img: t.img || '' })),
      score: (m.score || []).map(s => ({ inning: s.inning, r: s.r, w: s.w, o: s.o })),
      bbb: typeof m.bbbEnabled === 'boolean' ? m.bbbEnabled : undefined, fantasy: typeof m.fantasyEnabled === 'boolean' ? m.fantasyEnabled : undefined
    }));
    const info = { hitsToday: j.info && j.info.hitsToday, hitsLimit: j.info && j.info.hitsLimit };
    live = { t: Date.now(), ttl: liveTtl(j.info), err: '', data: { ok: true, matches, info, refreshEverySec: Math.round(liveTtl(j.info) / 1000), updated: new Date().toISOString() } };
    for(const m of matches)if(m.started&&!m.ended||matchJournal.view(m.id)){if(!matchJournal.view(m.id))await restoreArchivedJournal(m.id);matchJournal.record(m.id,'currentMatches',{...m,matchStarted:m.started,matchEnded:m.ended,matchType:m.type},{source:'CricketData current matches'})}
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
// Automatic discovery continues without visitors or daily GitHub pushes.
// The provider TTL (including low-quota backoff) remains authoritative.
if (E.LIVE_AUTO_SYNC !== '0') {
  const tick = () => {
    if (!CRIC_KEY && !SM) return;
    if (liveRefreshPromise) return;
    const age = Date.now() - live.t;
    const due = SM ? 60000 : Math.max(1000, live.ttl || LIVE_TTL);
    if (live.t && age < due) return;
    liveMatches().catch(error => console.warn('Automatic live discovery:', error.message));
  };
  setTimeout(tick, 2000).unref();
  setInterval(tick, 1000).unref();
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
    const onScreen = SMS_PROVIDER === 'console' || (SCREEN_OTP && !ADMINS.includes(phone) && !SCORERS.includes(phone) && !['admin', 'scorer'].includes(db.users[phone]?.role) && Object.keys(db.users).length > 0);
    if (SCREEN_OTP && SMS_PROVIDER !== 'console' && onScreen) return [200, { ok: true, exists: false, screenOtp: true, devCode: code, devOtp: code }];
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
    if (u) promote(u, phone);
    return u ? [200, { ok: true, profile: pub(u) }] : [401, { ok: false, error: 'Not signed in' }];
  },
  'GET /api/live': async () => {
    try { return [200, await liveMatches()]; }
    catch (e) { return [e.code || 502, { ok: false, error: e.message }]; }
  },
  'GET /health': async () => [200, { ok: true, database: { configured: !!DATABASE_URL, connected: neonOk }, version: String(E.RENDER_GIT_COMMIT || '').slice(0, 7) || 'local', commit: E.RENDER_GIT_COMMIT || null, appSha256: crypto.createHash('sha256').update(fs.readFileSync(new URL('./app-index.html', import.meta.url))).digest('hex') }]
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
// ---- Live tracker: while people are looking at a running match, the server checks its scorecard every TRACK_SECONDS and keeps what the figures prove (see observer.mjs). Everyone sees the same saved record, not only the people who had the page open. ----
db.track = db.track || {};
const viewed = new Map();   // match id -> { t: last viewed, next: do not check before }
const TRACK_SECONDS = Math.max(+E.TRACK_MIN_SECONDS || 15, +E.TRACK_SECONDS || 15), TRACK_MAX = Math.max(1, +E.TRACK_MAX_MATCHES || 6), TRACK_DAILY = Math.max(0, E.TRACK_DAILY_CALLS == null || E.TRACK_DAILY_CALLS === '' ? 1000000 : +E.TRACK_DAILY_CALLS);
const trackStat = { per: {}, last: 0, day: '', calls: 0, paused: 0, note: 'waiting for a viewer on a live match' };
async function cricFresh(ep, id, maxAge) {   // same cache the match page uses; returns [result, realProviderCall]
  const k = ep + id, h = cricCache.get(k); if (h && Date.now() - h.t < maxAge) return [h.d, false];
  const r = await fetch(`${CRIC_BASE}/${ep}?apikey=${encodeURIComponent(CRIC_KEY)}&id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(10000) }), j = await r.json();
  if (j.status !== 'success') return [{ ok: false, error: j.reason || 'Cricket API error' }, true];
  let data = j.data; if (ep === 'match_scorecard') { try { data = await enrichScorecard(data, id); } catch {} }
  matchJournal.record(id,ep,data,{source:'CricketData tracker check'});const d = { ok: true, data }; cricCache.set(k, { t: Date.now(), d }); return [d, true];
}
const bbbFlag = id => { const m = live.data && Array.isArray(live.data.matches) && live.data.matches.find(x => x.id === id); return m && typeof m.bbb === 'boolean' ? m.bbb : null; };
const bbbWhy = id => bbbFlag(id) === false ? 'CricketData lists this match with ball-by-ball switched off (bbbEnabled=false), so the provider sends no deliveries for it. ' : '';
let trackBusy = false; const trackDone = new Set();
async function trackTick() {
  if (trackBusy || !CRIC_KEY) return; trackBusy = true;
  try {
    const now = Date.now(), day = istDate(); if (trackStat.day !== day) { trackStat.day = day; trackStat.calls = 0; }
    if (now < trackStat.paused) { trackStat.note = 'paused: provider limit reached'; return; }
    const ids = [...viewed].filter(([, v]) => now - v.t < 10 * 60e3 && now >= v.next).sort((a, b) => b[1].t - a[1].t).slice(0, TRACK_MAX).map(x => x[0]);
    // Live matches are followed even when nobody has the page open, so the record already exists when someone arrives.
    const AUTO = E.TRACK_AUTO_MATCHES == null || E.TRACK_AUTO_MATCHES === '' ? 6 : +E.TRACK_AUTO_MATCHES;
    if (AUTO > 0) { try { await liveMatches(); } catch { /* provider refused: keep what we have */ } }
    if (AUTO > 0 && live.data && Array.isArray(live.data.matches)) for (const m of live.data.matches.filter(m => m.started && !m.ended && !trackDone.has(m.id) && !ids.includes(m.id)).slice(0, AUTO)) { const w = viewed.get(m.id); if (!w || now >= w.next) ids.push(m.id); }
    for (const id of ids) {
      if (/^sm/i.test(id)) continue;   // Sportmonks matches have their own ball by ball
      let v = viewed.get(id); if (!v) { v = { t: 0, next: 0 }; viewed.set(id, v); }
      if (trackStat.calls >= TRACK_DAILY) { trackStat.note = `daily check budget used (${TRACK_DAILY}); set TRACK_DAILY_CALLS for more`; break; }
      let res, real; try { [res, real] = await cricFresh('match_scorecard', id, TRACK_SECONDS * 1000 - 3000); } catch { continue; }
      if (real) trackStat.calls++; trackStat.last = now;
      if (!res.ok) { if (/hit|limit|quota|exceed/i.test(res.error || '')) trackStat.paused = now + 30 * 60e3; trackStat.note = 'provider: ' + res.error; trackStat.per[id] = 'provider: ' + res.error; if (/not found/i.test(res.error || '')) { v.next = now + 15 * 60e3; trackDone.add(id); } continue; }
      const d = res.data, snap = snapshotOf(d);
      if (!snap) { v.next = now + 5 * 60e3; continue; }
      const T = db.track[id] || (db.track[id] = { first: now, t: now, rows: [], notes: [], prev: null });
      let df = diffSnapshots(T.prev, snap);
      // a score that goes backwards is often one stale provider reply: keep the higher score until the lower one is seen twice in a row
      if (df.correction) { const sig = snap.r + '/' + snap.w + '@' + snap.balls; if (T.backSig !== sig) { T.backSig = sig; T.t = now; continue; } }
      T.backSig = null;
      if (df.rows.length) { T.rows.push(...df.rows.map(r => ({ ...r, at: now }))); if (T.rows.length > 3000) T.rows.splice(0, T.rows.length - 3000); }
      if (df.note) { T.notes.push({ at: now, inning: snap.idx + 1, text: df.note.text, ...(df.note.bowl && df.note.bowl.length ? { bowl: df.note.bowl } : {}) }); if (T.notes.length > 300) T.notes.splice(0, T.notes.length - 300); }
      T.prev = snap; T.t = now;
      if (d && d.matchEnded) { viewed.delete(id); trackDone.add(id); }
      for (const k of Object.keys(db.track).sort((a, b) => db.track[b].t - db.track[a].t).slice(10)) delete db.track[k];   // keep the last 10 matches
      if (df.rows.length || df.note) saveDb();
      trackStat.note = 'tracking ' + ids.length + ' match(es)'; trackStat.per[id] = 'tracking this match, last check ok';
    }
  } catch (e) { trackStat.note = 'error: ' + String(e.message).slice(0, 120); }
  finally { trackBusy = false; }
}
if (E.TRACKER !== '0') setInterval(trackTick, TRACK_SECONDS * 1000);
const trackerBbb = id => { const T = db.track[id]; return T && (T.rows.length || T.notes.length) ? { ok: true, data: { bbb: T.rows, notes: T.notes.slice(-80), source: 'Scoring Heroes live tracker', tracked: true } } : null; };
async function enrichScorecard(sc, id) {
  if (!sc || !Array.isArray(sc.scorecard) || !sc.scorecard.length) return sc;
  const info = Array.isArray(sc.teams) && sc.teams.length >= 2 ? sc : await infoOf(id).catch(() => null), teams = (info && info.teams) || []; if (teams.length < 2) return sc;
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
  const r = await fetch(`${CRIC_BASE}/match_info?apikey=${encodeURIComponent(CRIC_KEY)}&id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(4000) }), j = await r.json();
  return j.status === 'success' ? j.data : null;
}
// Scoreboard display adapter: only accepts provider-supplied odds or independently computed probabilities.
// Missing data remains unavailable; never invent a market price or a win percentage.
// Universal rule for every sport: provider odds > valid win probability > blank.
// Namespaced keys prevent two sports with the same fixture ID from colliding.
// Match data captured from player-supplied screenshots: every JSON in imports/match-data is served automatically, so adding a file and pushing is enough.
routes['GET /api/match-data'] = async () => {
  const dir = path.join(process.cwd(), 'imports', 'match-data'); const out = {};
  try { for (const f of fs.readdirSync(dir)) if (/^\d+\.json$/.test(f)) { const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); out[d.meta && d.meta.match_id || f.replace('.json', '')] = d; } }
  catch { return [200, { ok: true, matches: {} }]; }
  return [200, { ok: true, matches: out }];
};
// The player's own match list (captured from screenshots the player supplied), served from imports/match-data.
routes['GET /api/player-matches'] = async (req, body) => {
  const id = String(body.id || '').trim();
  if (!/^\d+$/.test(id)) return [404, { ok: false, error: 'Not found' }];
  try { const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'imports', 'match-data', `player-${id}-matches.json`), 'utf8')); return [200, { ok: true, count: d.count, matches: d.matches }]; }
  catch { return [404, { ok: false, error: 'No match list for this player' }]; }
};
// Public, read-only legacy profile bridge. Captures are partial and never alter career totals.
routes['GET /api/legacy-player-profile'] = async (req, body) => {
  const id = String(body.id || '').trim();
  if (!['216859', '5295710'].includes(id)) return [404, { ok: false, error: 'Profile not found' }];
  const filename = id === '216859' ? 'cricheroes-thaman-216859.json' : 'cricheroes-hemanth-5295710.json';
  let capture;
  try { capture = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'imports', 'staging', filename), 'utf8')); }
  catch { return [503, { ok: false, error: 'Profile capture not available' }]; }
  const player = capture.player || {};
  // Keep each player's source records isolated; never merge another identity's matches.
  const linkedExternalProfile = null;
  const matchRecords = capture.records || [];
  const matches = [...new Map(matchRecords.flatMap(r => r.linked_records || [])
    .filter(r => r.kind === 'scorecard' && /^\d+$/.test(String(r.source_id || '')))
    .map(r => [String(r.source_id), { id: String(r.source_id), title: r.label, sourceUrl: r.url }])).values()];
  // Group captured scorecard references for browsing only; a linked match does not prove participation.
  const matchGroups = { tournaments: [], series: [], individualMatches: [], t20: [], otherFormats: [] };
  const tournamentMap = new Map();
  for (const match of matches) {
    const label = String(match.title || '');
    const firstLine = label.split(/\r?\n/)[0].trim();
    const isIndividual = /individual match/i.test(firstLine);
    const isSeries = /\bseries\b/i.test(firstLine);
    const isT20 = /\b20\s*(?:ov\.?|overs?)\b/i.test(label);
    const item = { ...match, competition: firstLine || null, participationVerified: false };
    if (isIndividual) matchGroups.individualMatches.push(item);
    else if (isSeries) matchGroups.series.push(item);
    else {
      const competition = firstLine || 'Unclassified tournament';
      if (!tournamentMap.has(competition)) tournamentMap.set(competition, []);
      tournamentMap.get(competition).push(item);
    }
    (isT20 ? matchGroups.t20 : matchGroups.otherFormats).push(item);
  }
  matchGroups.tournaments = [...tournamentMap].map(([name, entries]) => ({
    name, matches: entries, count: entries.length, participationVerified: false
  }));
  return [200, { ok: true, player: { name: player.name, sourceId: id, sport: 'cricket',
    source: 'CricHeroes', sourceUrl: player.source_url || 'https://cricheroes.com/player-profile/' + id,
    completeness: capture.completeness, identityVerified: capture.identity_verified === true },
    tabs: ['Profile', 'Matches', 'Stats', 'Awards', 'Teams'],
    playerLevel: 'local',
    statsLayout: {
      type: 'local-tournament',
      sections: ['Info', 'Batting', 'Bowling'],
      columns: ['Tournament', 'Series', 'Individual Matches', 'T20', 'Other Formats'],
      battingRows: ['Matches', 'Innings', 'Runs', 'Balls', 'Highest', 'Average', 'Strike Rate', 'Not Out', 'Fours', 'Sixes', '50s', '100s'],
      bowlingRows: ['Matches', 'Innings', 'Balls', 'Runs', 'Wickets', 'Best (inn)', 'Best (match)', 'Average', 'Economy', 'Strike Rate', '5W', '10W'],
      tournamentBreakdown: true,
      seriesBreakdown: true,
      individualMatchScorecards: true,
      overallCareerTotals: true,
      deduplicateCareerMatchesBy: ['source', 'matchId', 'playerId'],
      professionalCompetitions: 'Only show IPL, Ranji or other professional competitions when actual participation records exist',
      recordGroups: ['Tournaments', 'Series', 'Individual Matches', 'T20', 'Other Formats', 'Overall Career'],
      sourceSeparation: 'Outside records are never merged into verified Scoring Heroes totals',
      missingValue: null
    },
    matches, matchGroups, linkedExternalProfile, careerStats: null, note: 'Captured match links are browsing references only; player participation and totals are not independently verified' }];
};
// Market-implied win chance. Odds come from The Odds API (ODDS_API_KEY). Only the derived percentage ever leaves the server, never a price.
const ODDS_KEY = E.ODDS_API_KEY || '';
let oddsC = { t: 0, ev: [], left: null, err: '' };
async function refreshOdds() {
  if (!ODDS_KEY) return oddsC;
  const ttl = oddsC.left != null && oddsC.left < 25 ? 3600e3 : 5 * 60e3;
  if (Date.now() - oddsC.t < ttl) return oddsC;
  oddsC.t = Date.now();
  try {
    const sj = await (await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${encodeURIComponent(ODDS_KEY)}`, { signal: AbortSignal.timeout(10000) })).json();
    const keys = (Array.isArray(sj) ? sj : []).filter(x => x && /^cricket/.test(x.key) && x.active).map(x => x.key).slice(0, 6), ev = [];
    for (const k of keys) {
      const r = await fetch(`https://api.the-odds-api.com/v4/sports/${k}/odds/?regions=uk,eu&markets=h2h&oddsFormat=decimal&apiKey=${encodeURIComponent(ODDS_KEY)}`, { signal: AbortSignal.timeout(10000) });
      const left = Number(r.headers.get('x-requests-remaining')); if (Number.isFinite(left)) oddsC.left = left;
      const j = await r.json(); if (Array.isArray(j)) ev.push(...j);
    }
    oddsC.ev = ev; oddsC.err = '';
  } catch (e) { oddsC.err = e.message; }
  return oddsC;
}
function impliedProbs(e) {   // average of every bookmaker's margin-free 2-way probability
  const acc = {}; let n = 0;
  for (const b of e.bookmakers || []) {
    const h = (b.markets || []).find(m => m.key === 'h2h'); if (!h) continue;
    const o = (h.outcomes || []).filter(x => x && Number(x.price) > 1 && x.name !== 'Draw'); if (o.length !== 2) continue;
    const inv = o.map(x => 1 / Number(x.price)), tot = inv[0] + inv[1];
    o.forEach((x, i) => { acc[x.name] = (acc[x.name] || 0) + inv[i] / tot * 100; }); n++;
  }
  if (!n) return null;
  const out = {}; for (const k of Object.keys(acc)) out[k] = Math.round(acc[k] / n * 10) / 10; return { probs: out, books: n };
}
routes['GET /api/win-odds'] = async (req, body) => {
  const id = String(body.id || '').slice(0, 64);
  if (!ODDS_KEY) return [200, { ok: true, available: false, reason: 'no-key' }];
  const d = live.data || (await cdLive().catch(() => null)), m = d && (d.matches || []).find(x => String(x.id) === id);
  if (!m) return [200, { ok: true, available: false, reason: 'unknown-match' }];
  await refreshOdds();
  const key = pairKey(m), e = oddsC.ev.find(x => [normT(x.home_team), normT(x.away_team)].sort().join('|') === key && Math.abs(dayOf(x.commence_time) - dayOf(m.time || m.date)) <= 864e5);
  const ip = e && impliedProbs(e); if (!ip) return [200, { ok: true, available: false, reason: 'no-market' }];
  const probs = {}; for (const t of m.teams || []) { const hit = Object.keys(ip.probs).find(n => normT(n) === normT(t.name)); if (hit) { probs[t.name] = ip.probs[hit]; if (t.short) probs[t.short] = ip.probs[hit]; } }
  return Object.keys(probs).length < 2 ? [200, { ok: true, available: false, reason: 'team-names' }] : [200, { ok: true, available: true, probs, books: ip.books }];
};
routes['GET /api/scoreboard-market'] = async (req, body) => {
  const id = String(body.id || '').trim();
  const sport = String(body.sport || 'cricket').trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,64}$/i.test(id) || !/^[a-z][a-z0-9_-]{0,39}$/.test(sport))
    return [400, { ok: false, error: 'Bad sport or match ID' }];
  const store = db.shared?.scoreboardMarket;
  const entry = store?.[sport + ':' + id] || store?.[sport]?.[id] ||
    (sport === 'cricket' ? store?.[id] : null);
  if (!entry) return [200, { ok: true, sport, id, display: null }];
  const display = oddsOrWinningProbability({ odds: entry.odds, probabilities: entry.probabilities });
  return [200, { ok: true, sport, id, display: display?.mode === 'unavailable' ? null : display }];
};
routes['GET /api/cric'] = async (req, body, ip) => {
  const ep = String(body.ep || ''), id = String(body.id || '');
  if (!['match_scorecard', 'players_info', 'match_info', 'match_squad', 'match_bbb'].includes(ep) || !/^(sm)?[0-9a-z-]{1,40}$/i.test(id)) return [400, { ok: false, error: 'Bad request' }];
  if(ep!=='players_info'&&!matchJournal.view(id))await restoreArchivedJournal(id);
  if (SM && /^sm?\d+$/i.test(id)) {
    const k0 = 'sm' + ep + id, h0 = cricCache.get(k0);
    if (h0 && Date.now() - h0.t < (ep === 'players_info' ? 864e5 : 15e3)) return [200, h0.d];
    if (limited('cric:' + ip, 900, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
      const num = id.replace(/^sm/i, '');
    try {
      const data = ep === 'match_scorecard' ? await SM.scorecard(num) : ep === 'match_info' ? await SM.matchInfo(num) : ep === 'match_squad' ? await SM.squad(num) : ep === 'match_bbb' ? await SM.bbb(num) : await SM.player(num);
      matchJournal.record(id,ep,data,{source:'Sportmonks'});const d = { ok: true, data }; cricCache.set(k0, { t: Date.now(), d }); if (cricCache.size > 500) cricCache.clear(); return [200, d];
    } catch (e) { return [502, { ok: false, error: String(e.message || 'Sportmonks error').slice(0, 160) }]; }
  }
  if (SM && CRIC_KEY && ep === 'match_bbb' && smBy.has(id)) {   // Sportmonks has this match too: use its deliveries when it has any
    const b = await smBalls(smBy.get(id));
    if (b.length) { const d = { ok: true, data: { bbb: b, source: 'Sportmonks' } }; matchJournal.record(id, ep, d.data, { source: 'Sportmonks' }); return [200, d]; }
  }
  if (!CRIC_KEY) return [503, { ok: false, error: 'CRIC_API_KEY is not set on the server' }];
  const k = ep + id, hit = cricCache.get(k), ttl = ep === 'players_info' ? 864e5 : 15e3;
  if (['match_scorecard', 'match_info', 'match_bbb'].includes(ep)) { const v = viewed.get(id); viewed.set(id, { t: Date.now(), next: v ? v.next : 0 }); }
  if (hit && Date.now() - hit.t < ttl) return [200, hit.d];
  if (limited('cric:' + ip, 900, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
  if (ep === 'match_bbb') {   // a finished match: Cricsheet has the full ball by ball
    try { const rr = recentOf(await infoOf(id)); if (rr) { const bbb = buildBbb(rr.raw); if (bbb.length) { const d = { ok: true, data: { bbb, source: RECENT_SOURCE } };matchJournal.record(id,ep,d.data,{source:RECENT_SOURCE}); cricCache.set(k, { t: Date.now(), d }); return [200, d]; } } } catch {}
  }
  try {
    const r = await fetch(`${CRIC_BASE}/${ep}?apikey=${encodeURIComponent(CRIC_KEY)}&id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(10000) });
    const j = await r.json();
    if(j.status!=='success'){const fb=ep==='match_bbb'?trackerBbb(id):null;if(fb){fb.data.providerNote=bbbWhy(id)+'Provider reply: '+(j.reason||'no ball-by-ball')+' · SH tracker: '+(trackStat.per[id]||'this match is not being tracked yet')+', saved '+(db.track[id]?db.track[id].rows.length:0)+' balls, '+(db.track[id]?db.track[id].notes.length:0)+' notes';matchJournal.record(id,ep,fb.data,{source:'SH snapshot tracker'});return [200,fb]}matchJournal.record(id,ep,null,{error:j.reason||'Cricket API error'});return [502,{ok:false,error:(ep==='match_bbb'?bbbWhy(id):'')+(j.reason||'Cricket API error')+(ep==='match_bbb'?` · SH tracker: ${trackStat.per[id]||'this match is not being tracked yet'}${db.track[id]?`, saved ${db.track[id].rows.length} balls and ${db.track[id].notes.length} notes`:', nothing saved for this match yet'}`:'')}]}
    let data = j.data;
    if (ep === 'match_bbb' && !(Array.isArray(data) ? data.length : (data && Array.isArray(data.bbb) ? data.bbb.length : 0))) { const fb = trackerBbb(id); if(fb){fb.data.providerNote=bbbWhy(id)+'Provider reply: success, but 0 ball rows';matchJournal.record(id,ep,fb.data,{source:'SH snapshot tracker'});return [200,fb]} data = Array.isArray(data) ? data : { ...(data && typeof data === 'object' ? data : {}), bbb: [], providerNote: 'Provider reply: success, but 0 ball rows for this match · SH tracker: ' + (trackStat.per[id]||'this match is not being tracked yet') }; }
    try { if (ep === 'match_info') data = enrichInfo(data); else if (ep === 'match_squad') data = enrichSquad(data, await infoOf(id)); else if (ep === 'match_scorecard') data = await enrichScorecard(data, id); } catch {}
    matchJournal.record(id,ep,data,{source:'CricketData'});const d = { ok: true, data }; cricCache.set(k, { t: Date.now(), d }); if (cricCache.size > 500) cricCache.clear();
    return [200, d];
  } catch {matchJournal.record(id,ep,null,{error:'Cricket API unreachable'}); return [502, { ok: false, error: 'Cricket API unreachable' }]; }
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
// Paid viewing (R20/R21): a stream key can be tied to a UPI charge. The link is withheld by the server from anyone without a confirmed payment, so it cannot be read from the network response.
const streamBase = k => String(k).replace(/_s\d$/, '');
const streamEntitled = (s, base) => { const g = (db.streamGate || {})[base]; if (!g) return true; const c = (db.shared.pay || {})[g]; if (!c) return true; if (!s) return false; return s.u.role === 'admin' || c.owner === s.phone || (c.subs || []).some(x => x.by === s.phone && x.status === 'confirmed'); };
routes['GET /api/streams'] = async (req) => {
  const s = grUser(req), out = {}, locked = [];
  for (const [k, v] of Object.entries(db.streams || {})) { if (streamEntitled(s, streamBase(k))) out[k] = v; else if (!locked.includes(streamBase(k))) locked.push(streamBase(k)); }
  return [200, { ok: true, streams: out, gates: db.streamGate || {}, locked }];
};
routes['POST /api/streams/gate'] = async (req, body) => {
  const s = grUser(req); if (!s || !['admin', 'scorer'].includes(s.u.role)) return [403, { ok: false, error: 'Only admins and scorers can make a stream paid' }];
  const key = String(body.key || ''); if (!/^[mw][\w-]{1,80}$/.test(key) || /_s\d$/.test(key)) return [400, { ok: false, error: 'Bad match key' }];
  db.streamGate = db.streamGate || {};
  if (!body.charge) { delete db.streamGate[key]; saveDb(); return [200, { ok: true }]; }
  const c = (db.shared.pay || {})[String(body.charge)]; if (!c) return [404, { ok: false, error: 'Charge not found' }];
  if (c.owner !== s.phone) return [403, { ok: false, error: 'Use a charge you created' }];
  db.streamGate[key] = c.id; saveDb(); return [200, { ok: true }];
};
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
let curatedMatchContexts={};try{curatedMatchContexts=JSON.parse(fs.readFileSync(new URL('./data/match-context.json',import.meta.url),'utf8'))}catch{}
// Enrich known scorecard player IDs in the background. No name search or guessed portraits.
const journalPlayerProfiles=new Map(),journalProfilePending=new Set();
const profileName=n=>String(n||'').toLowerCase().replace(/[^a-z0-9]/g,'');
function hydrateJournalProfiles(j){const candidates=(j.sc?.scorecard||[]).flatMap(inn=>[...(inn.batting||[]).map(b=>b.batsman),...(inn.bowling||[]).map(b=>b.bowler)]).filter(p=>p?.id&&p?.name);let slots=Math.max(0,3-journalProfilePending.size);for(const p of candidates){if(!slots)break;const hit=journalPlayerProfiles.get(p.id);if(journalProfilePending.has(p.id)||hit&&Date.now()-hit.at<(hit.data?864e5:300000))continue;slots--;journalProfilePending.add(p.id);routes['GET /api/cric']({}, {ep:'players_info',id:p.id},'journal-player-metadata').then(([,result])=>{journalPlayerProfiles.set(p.id,{at:Date.now(),seedName:p.name,data:result.ok?result.data:null});if(journalPlayerProfiles.size>600)journalPlayerProfiles.delete(journalPlayerProfiles.keys().next().value)}).catch(()=>{}).finally(()=>journalProfilePending.delete(p.id))}}
function journalProfile(p){const hit=p.id?journalPlayerProfiles.get(p.id):[...journalPlayerProfiles.values()].find(x=>profileName(x.seedName)===profileName(p.name)||p.aliases?.some(n=>profileName(n)===profileName(x.seedName)));const d=hit?.data;if(!d)return p;return {...p,role:d.role||p.role,playerImg:d.playerImg||p.playerImg,bowlingStyle:d.bowlingStyle||p.bowlingStyle,battingStyle:d.battingStyle||p.battingStyle,profileSource:'CricketData player profile'}}
function matchContext(id,j){const curated=curatedMatchContexts[id]||{},squads=(j?.squads?.length?j.squads:curated.squads)||[],type=String(j?.type||'').toLowerCase(),before=String(j?.mi?.date||j?.sc?.date||'').slice(0,10),teams=(j?.mi?.teams||j?.sc?.teams||squads.map(t=>t.teamName)).slice(0,2);
 const enriched=squads.map(t=>({...t,players:(t.players||[]).map(p=>({...journalProfile(p),recent:recent.playerForm(p.name,t.teamName,type,before)}))}));return {...curated,squads:enriched,recentTeams:teams.map(team=>({team,matches:recent.teamRecent(team,type,before)})),formCoverage:'Up to last 10 completed matches in the available Cricsheet archive; exact name/team/format matches only.'}}
/* Community polls (opinion only, no money): one vote per signed-in user or guest device per poll. */
function pollVoter(req, body) {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, ''));
  if (phone && db.users[phone]) return 'u:' + phone;
  const g = String(body.guest || ''); return /^[\w-]{12,60}$/.test(g) ? 'g:' + g : '';
}
async function pollResolve(id) {   // fill db.pollRes[id] once the provider says the match is over and its figures prove an answer
  const M = (db.polls || {})[id]; if (!M || !live.data || !Array.isArray(live.data.matches)) return;
  const m = live.data.matches.find(x => x.id === id); if (!m || !m.ended) return;
  const R = (db.pollRes = db.pollRes || {})[id] || (db.pollRes[id] = {}), opts = {}; for (const [k, p] of Object.entries(M)) opts[k] = p.opts;
  let sc = null;
  if (!('century' in R) && M.century && CRIC_KEY && !limited('pollsc:' + id, 4, 36e5)) { try { const [r] = await cricFresh('match_scorecard', id, 600e3); if (r && r.ok && r.data && Array.isArray(r.data.scorecard)) sc = r.data.scorecard; } catch {} }
  const a = answersFrom(m, sc, opts); let ch = false;
  for (const [k, v] of Object.entries(a)) if (!(k in R) && M[k]) { R[k] = v; ch = true; }
  if (ch) { R.at = Date.now(); saveDb(); }
}
function pollView(match, voter) {
  const M = (db.polls || {})[match] || {}, out = {}, R = (db.pollRes || {})[match] || {};
  for (const [k, p] of Object.entries(M)) {
    const mine = voter ? p.votes[voter] || null : null, counts = {}; let total = 0;
    for (const o of p.opts) counts[o] = 0;
    for (const o of Object.values(p.votes)) if (o in counts) { counts[o]++; total++; }
    out[k] = { opts: p.opts, mine, total, counts: mine ? counts : null, ...(k in R ? { answer: R[k], points: mine && mine === R[k] ? POLL_POINTS : 0 } : {}) };   // results are shown only after you vote
  }
  return out;
}
routes['GET /api/polls'] = async (req, body) => {
  const id = String(body.match || ''); if (!/^[\w-]{1,60}$/.test(id)) return [400, { ok: false, error: 'Bad match id' }];
  try { await pollResolve(id); } catch {}
  return [200, { ok: true, polls: pollView(id, pollVoter(req, body)) }];
};
routes['GET /api/polls/leaderboard'] = async (req, body) => {
  for (const id of Object.keys(db.polls || {}).filter(i => !((db.pollRes || {})[i] || {}).at).slice(-3)) { try { await pollResolve(id); } catch {} }
  const b = pollBoard(db.polls, db.pollRes, db.users), v = pollVoter(req, body), me = v && b.all[v] ? b.all[v] : { pts: 0, ok: 0, n: 0 };
  return [200, { ok: true, top: b.top, me: { ...me, rank: v ? b.rank(v) : null }, points: POLL_POINTS, note: 'Only polls the final scorecard can prove are scored: winner, 200+ team total, century.' }];
};
routes['POST /api/polls/vote'] = async (req, body, ip) => {
  const id = String(body.match || ''), key = String(body.poll || ''), voter = pollVoter(req, body);
  if (!/^[\w-]{1,60}$/.test(id) || !/^[a-z0-9_]{1,30}$/.test(key)) return [400, { ok: false, error: 'Bad poll' }];
  if (!voter) return [400, { ok: false, error: 'Missing voter id' }];
  if (limited('pollvote:' + ip, 200, 36e5)) return [429, { ok: false, error: 'Too many votes from this network, try later' }];
  const opt = String(body.opt || '').trim().slice(0, 40); if (!opt) return [400, { ok: false, error: 'Pick an option' }];
  db.polls = db.polls || {};
  const M = db.polls[id] || (db.polls[id] = {});
  let p = M[key];
  if (!p) {   // the first vote fixes the option list (2-30 short options)
    const opts = [...new Set((Array.isArray(body.opts) ? body.opts : []).map(x => String(x).trim().slice(0, 40)).filter(Boolean))].slice(0, 30);
    if (opts.length < 2) return [400, { ok: false, error: 'A poll needs at least 2 options' }];
    if (Object.keys(db.polls).length > 400) delete db.polls[Object.keys(db.polls)[0]];
    p = M[key] = { opts, votes: {}, at: Date.now() };
  }
  if (!p.opts.includes(opt)) return [400, { ok: false, error: 'Not an option of this poll' }];
  if (p.votes[voter]) return [409, { ok: false, error: 'You already voted in this poll', polls: pollView(id, voter) }];
  p.votes[voter] = opt; saveDb();
  return [200, { ok: true, polls: pollView(id, voter) }];
};
routes['GET /api/match-journal']=async(req,body,ip)=>{const id=String(body.id||'');if(!/^(sm)?[0-9a-z-]{1,40}$/i.test(id))return [400,{ok:false,error:'Bad match id'}];if(limited('journal-read:'+ip,1800,36e5))return [429,{ok:false,error:'Too many journal reads'}];let j=matchJournal.view(id);if(!j){await restoreArchivedJournal(id);j=matchJournal.view(id)}if(!j)return [404,{ok:false,error:'Match history is not recorded yet. Open the match to start collection.'}];hydrateJournalProfiles(j);for(const inn of j.sc?.scorecard||[]){for(const b of inn.batting||[])b.batsman=journalProfile(b.batsman||{});for(const b of inn.bowling||[])b.bowler=journalProfile(b.bowler||{})}if(!j.ended){if(matchWatch.has(id)||matchWatch.size<8){const w=matchWatch.get(id)||{};w.until=Date.now()+30*60000;matchWatch.set(id,w);if(!w.tryAt||Date.now()-w.tryAt>19000){w.tryAt=Date.now();pollMatchJournal(id)}}}return [200,{ok:true,journal:j,context:matchContext(id,j),storage:{...journalStorage,retention:'Latest 12 matches in memory; saved matches replay from archive. Up to 6000 delivery records and 6000 updates per match',durability:neonOk?'Database and server file':'Server file; free-host redeploy can clear history'}}]};

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
routes['GET /api/history/h2h'] = async (req, body, ip) => {
  if (limited('hh:' + ip, 600, 36e5)) return [429, { ok: false, error: 'Too many requests' }];
  return [200, { ok: true, ...history.h2h(String(body.a || '').slice(0, 80), String(body.b || '').slice(0, 80), body.type ? String(body.type).slice(0, 8) : '', body.gender ? String(body.gender).slice(0, 8) : '') }];
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
  const emailKey = EMAIL_PROVIDER === 'resend' ? !!E.RESEND_API_KEY : EMAIL_PROVIDER === 'brevo' ? !!E.BREVO_API_KEY : EMAIL_PROVIDER === 'smtp' ? !!(E.SMTP_USER && E.SMTP_PASS) : false;
  const smsKey = SMS_PROVIDER === 'msg91' ? !!(E.MSG91_AUTHKEY && E.MSG91_TEMPLATE_ID) : SMS_PROVIDER === 'textbee' ? !!(E.TEXTBEE_API_KEY && E.TEXTBEE_DEVICE_ID) : false;
  const need = (p, ok, names) => p === 'console' ? 'Not switched on: set ' + names.join(' / ') : ok ? '' : 'Provider chosen but its key is missing';
  return {
    email: { provider: EMAIL_PROVIDER, ready: emailKey, from: EMAIL_PROVIDER === 'console' ? '' : EMAIL_FROM, problem: need(EMAIL_PROVIDER, emailKey, ['EMAIL_PROVIDER=brevo + BREVO_API_KEY + EMAIL_FROM (works on Render free)', 'EMAIL_PROVIDER=resend + RESEND_API_KEY (needs your own domain)', 'EMAIL_PROVIDER=smtp + SMTP_USER + SMTP_PASS (Render free blocks SMTP)']), last: svcLast.email },
    sms: { provider: SMS_PROVIDER, ready: smsKey, sent: db.smsSent || 0, cap: SMS_TOTAL_BUDGET || 0, problem: need(SMS_PROVIDER, smsKey, ['SMS_PROVIDER=textbee + TEXTBEE_API_KEY + TEXTBEE_DEVICE_ID', 'SMS_PROVIDER=msg91 + MSG91_AUTHKEY + MSG91_TEMPLATE_ID']), last: svcLast.sms },
    live: { ready: !!(CRIC_KEY || SM), provider: SM && CRIC_KEY ? 'cricketdata + sportmonks' : SM ? 'sportmonks' : 'cricketdata', problem: (CRIC_KEY || SM) ? '' : 'Set CRIC_API_KEY (CricketData) or SPORTMONKS_TOKEN (Sportmonks)' },
    ai: { ready: !!NEWS_AI_KEY, model: NEWS_AI_KEY ? NEWS_AI_MODEL : '', problem: NEWS_AI_KEY ? '' : 'Optional: set ANTHROPIC_API_KEY for AI-polished articles (articles are still written without it)' },
    history: { autoimport: E.HISTORY_AUTOIMPORT === '1' },
    recent: { enabled: E.RECENT_OPEN_DATA !== '0', ...recent.status() },
    tracker: { enabled: E.TRACKER !== '0', seconds: TRACK_SECONDS, maxMatches: TRACK_MAX, callsToday: trackStat.calls, dailyBudget: TRACK_DAILY, saved: Object.keys(db.track).length, note: trackStat.note }
  };
}
// Home carousel: one fixture per provider-identified series; no guessed series IDs.
routes['GET /api/home-series'] = async () => {
  const feed = await liveMatches(), now = Date.now();
  const priority = m => { if(m.started&&!m.ended&&!/\b(?:won by|beat|defeated|match ended|result)\b/i.test(m.status||''))return [0,0]; const when=Date.parse(m.time||m.date||'')||Infinity; if(!m.ended&&when>=now)return [1,when]; if(m.ended)return [2,-when]; return [3,when]; };
  const compare=(a,b)=>{const x=priority(a),y=priority(b);return x[0]-y[0]||x[1]-y[1]};
  const groups=new Map();
  for(const m of feed.matches||[]){const parts=String(m.name||'').split(',').map(x=>x.trim()).filter(Boolean);const tail=parts.length>=3?parts.slice(-2).join(' ').toLowerCase().replace(/\b(?:1st|2nd|3rd|[0-9]+th)\s+(?:t20i?|odi|test|match)\b/g,'').replace(/\s+/g,' ').trim():'';const key=m.seriesId?'series:'+m.seriesId:tail?'name:'+tail:'match:'+m.id;const prev=groups.get(key);if(!prev||compare(m,prev)<0)groups.set(key,m)}
  return [200,{ok:true,matches:[...groups.values()].sort(compare),totalSeries:groups.size,updated:feed.updated,stale:!!feed.stale}];
};

// ---- Who is watching what: anonymous viewer pings (match id + random device id), counted over a sliding 3-minute window. Used only to rank matches on the home list.
const viewMap = new Map();
const viewPrune = () => { const cut = Date.now() - 3 * 60e3; for (const [id, m] of viewMap) { for (const [v, t] of m) if (t < cut) m.delete(v); if (!m.size) viewMap.delete(id); } };
routes['POST /api/view'] = async (req, body, ip) => {
  const id = String(body.id || '').slice(0, 80), vid = String(body.vid || '').replace(/[^\w-]/g, '').slice(0, 40);
  if (!id || !vid || /^local-/.test(id)) return [400, { ok: false, error: 'id and vid are required' }];
  if (limited('view:' + vid, 8, 60e3) || limited('viewip:' + ip, 60, 60e3)) return [429, { ok: false, error: 'Too many pings' }];
  if (viewMap.size > 5000 && !viewMap.has(id)) viewPrune();
  if (viewMap.size > 5000 && !viewMap.has(id)) return [200, { ok: true }];
  (viewMap.get(id) || viewMap.set(id, new Map()).get(id)).set(vid, Date.now());
  return [200, { ok: true }];
};
routes['GET /api/viewers'] = async () => {
  viewPrune(); const v = {}; for (const [id, m] of viewMap) v[id] = m.size;
  return [200, { ok: true, windowSeconds: 180, v }];
};
routes['GET /api/geo'] = async (req) => {   // viewer's country from the edge header (Render/Cloudflare), so the home list can put their country's matches first without a third-party lookup
  const iso = String(req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || '').toUpperCase();
  return [200, { ok: true, iso: /^[A-Z]{2}$/.test(iso) && iso !== 'XX' && iso !== 'T1' ? iso : '' }];
};
// Match desk: when the data provider sends no batters/bowler, an admin or scorer can enter them for everyone. The app uses them only while the provider scorecard has none, so provider data takes over automatically.
routes['GET /api/desk'] = async (req, body) => {
  const id = String(body.id || '').slice(0, 64); if (!/^[\w-]{1,64}$/.test(id)) return [400, { ok: false, error: 'Bad id' }];
  const d = (db.shared.desk || {})[id]; return [200, { ok: true, item: d && Date.now() - d.t < 12 * 3600e3 ? d : null }];
};
routes['PUT /api/desk'] = async (req, body) => {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  promote(u, phone); if (!['admin', 'scorer'].includes(u.role)) return [403, { ok: false, error: 'Only an admin or scorer can set the batters and bowler' }];
  const id = String(body.id || '').slice(0, 64); if (!/^[\w-]{1,64}$/.test(id)) return [400, { ok: false, error: 'Bad id' }];
  const nm = v => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 40), nn = v => { const x = Math.floor(+v); return Number.isFinite(x) && x >= 0 && x < 1000 ? x : 0; };
  const bat = b => b && nm(b.n) ? { n: nm(b.n), r: nn(b.r), b: nn(b.b) } : null, bw = b => b && nm(b.n) ? { n: nm(b.n), o: String(b.o || '0').replace(/[^\d.]/g, '').slice(0, 5) || '0', m: nn(b.m), r: nn(b.r), w: nn(b.w) } : null;
  const item = { id, t: Date.now(), by: String(u.nick || u.name || 'Desk').slice(0, 30), inn: nn(body.inn), w: nn(body.w), runs: nn(body.runs), s: bat(body.s), n: bat(body.n), bw: bw(body.bw) };
  if (!item.s && !item.n && !item.bw) return [400, { ok: false, error: 'Enter at least one batter or the bowler' }];
  (db.shared.desk = db.shared.desk || {})[id] = item; saveDb(); return [200, { ok: true, item }];
};
// Ground registry: GPS-registered grounds. No two grounds within 200 m of each other; an owner can claim, rename and read the match records of their ground.
const GR_NEAR = 200;
const grKm = (a, b, c, d) => { const R = 6371000, r = x => x * Math.PI / 180, dl = r(c - a), dg = r(d - b), h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };   // metres
const grBag = () => (db.shared.grounds = db.shared.grounds || {});
const GR_PITCH = ['Turf', 'Matting', 'Cement', 'Astro turf', 'Mixed'];
const grPub = (g, d) => ({ id: g.id, name: g.name, city: g.city || '', pitch: g.pitch || '', fac: g.fac || '', lat: g.lat, lng: g.lng, owned: !!g.owner, owner: g.ownerName || '', by: g.byName || '', matches: (g.recs || []).length, photos: (g.photos || []).length, rating: grAvg(g), reviews: (g.revs || []).length, dist: d == null ? undefined : Math.round(d) });
const grAvg = g => { const r = g.revs || []; return r.length ? Math.round(r.reduce((a, x) => a + x.stars, 0) / r.length * 10) / 10 : 0; };
const grNm = v => String(v || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
const grUser = req => { const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone]; if (u) promote(u, phone); return u ? { phone, u } : null; };
const grLL = b => { const lat = +b.lat, lng = +b.lng; return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0) ? { lat: +lat.toFixed(6), lng: +lng.toFixed(6) } : null; };
routes['GET /api/grounds'] = async (req, body) => {
  const p = grLL(body), all = Object.values(grBag());
  if (!p) return [200, { ok: true, items: all.slice(-30).reverse().map(g => grPub(g)) }];
  const r = Math.min(Math.max(+body.r || 5000, 50), 50000);
  const items = all.map(g => [g, grKm(p.lat, p.lng, g.lat, g.lng)]).filter(x => x[1] <= r).sort((a, b) => a[1] - b[1]).slice(0, 30).map(x => grPub(x[0], x[1]));
  return [200, { ok: true, items, within: items.filter(x => x.dist <= GR_NEAR).length }];
};
routes['POST /api/grounds'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('gr:' + s.phone, 20, 36e5)) return [429, { ok: false, error: 'Too many requests, slow down' }];
  const name = grNm(body.name), p = grLL(body); if (name.length < 3) return [400, { ok: false, error: 'Enter the ground name (3+ letters)' }]; if (!p) return [400, { ok: false, error: 'Location is needed: allow GPS and try again' }];
  const clash = Object.values(grBag()).map(g => [g, grKm(p.lat, p.lng, g.lat, g.lng)]).filter(x => x[1] <= GR_NEAR).sort((a, b) => a[1] - b[1])[0];
  if (clash) return [409, { ok: false, error: 'A ground is already registered within 200 m: ' + clash[0].name, existing: grPub(clash[0], clash[1]) }];
  const id = 'g' + crypto.randomBytes(5).toString('hex'), g = { id, name, lat: p.lat, lng: p.lng, by: s.phone, byName: String(s.u.nick || s.u.name || '').slice(0, 30), t: Date.now(), owner: body.owner ? s.phone : '', ownerName: body.owner ? String(s.u.nick || s.u.name || '').slice(0, 30) : '', recs: [], city: grNm(body.city).slice(0, 40), pitch: GR_PITCH.includes(body.pitch) ? body.pitch : '', fac: grNm(body.fac).slice(0, 120) };
  grBag()[id] = g; saveDb(); return [200, { ok: true, item: grPub(g, 0) }];
};
routes['POST /api/grounds/claim'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const g = grBag()[String(body.id || '')]; if (!g) return [404, { ok: false, error: 'Ground not found' }];
  if (g.owner && g.owner !== s.phone && s.u.role !== 'admin') return [409, { ok: false, error: 'This ground already has an owner' }];
  g.owner = s.phone; g.ownerName = String(s.u.nick || s.u.name || '').slice(0, 30); saveDb(); return [200, { ok: true, item: grPub(g) }];
};
routes['PUT /api/grounds'] = async (req, body) => {   // owner (or admin) renames the ground
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const g = grBag()[String(body.id || '')]; if (!g) return [404, { ok: false, error: 'Ground not found' }];
  if (g.owner !== s.phone && s.u.role !== 'admin') return [403, { ok: false, error: 'Only the ground owner can change this' }];
  const name = grNm(body.name || g.name); if (name.length < 3) return [400, { ok: false, error: 'Enter the ground name (3+ letters)' }];
  if (Object.values(grBag()).some(o => o.id !== g.id && o.name.toLowerCase() === name.toLowerCase() && grKm(o.lat, o.lng, g.lat, g.lng) <= GR_NEAR)) return [409, { ok: false, error: 'Another ground with this name is within 200 m' }];
  g.name = name; if ('city' in body) g.city = grNm(body.city).slice(0, 40); if ('pitch' in body) g.pitch = GR_PITCH.includes(body.pitch) ? body.pitch : ''; if ('fac' in body) g.fac = grNm(body.fac).slice(0, 120);
  saveDb(); return [200, { ok: true, item: grPub(g) }];
};
routes['POST /api/grounds/record'] = async (req, body) => {   // a scorer's match played at this ground; the owner reads these
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const g = grBag()[String(body.id || '')]; if (!g) return [404, { ok: false, error: 'Ground not found' }];
  const r = body.rec || {}, mid = String(r.mid || '').replace(/[^\w-]/g, '').slice(0, 40); if (!mid) return [400, { ok: false, error: 'Bad match' }];
  const rec = { mid, a: grNm(r.a), b: grNm(r.b), overs: Math.max(0, Math.min(100, Math.floor(+r.overs) || 0)), date: String(r.date || '').slice(0, 10), status: ['live', 'done', 'setup', 'break'].includes(r.status) ? r.status : 'live', result: grNm(r.result).slice(0, 120), score: grNm(r.score).slice(0, 60), by: s.phone, t: Date.now() };
  g.recs = g.recs || []; const i = g.recs.findIndex(x => x.mid === mid); if (i >= 0) { if (g.recs[i].by !== s.phone && s.u.role !== 'admin') return [403, { ok: false, error: 'Not your match' }]; g.recs[i] = rec; } else { if (g.recs.length >= 2000) g.recs.shift(); g.recs.push(rec); }
  saveDb(); return [200, { ok: true }];
};
routes['GET /api/grounds/records'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const g = grBag()[String(body.id || '')]; if (!g) return [404, { ok: false, error: 'Ground not found' }];
  if (g.owner !== s.phone && s.u.role !== 'admin') return [403, { ok: false, error: 'Only the ground owner can read the records' }];
  return [200, { ok: true, name: g.name, items: (g.recs || []).slice().reverse().map(x => ({ mid: x.mid, a: x.a, b: x.b, overs: x.overs, date: x.date, status: x.status, result: x.result, score: x.score })) }];
};

// Ground photos (at least 2 are encouraged before a ground shows as 'complete') and ratings / reviews. One review per account; the owner cannot rate their own ground.
const GR_PH_MAX = 8, GR_PH_BYTES = 260000;
routes['POST /api/grounds/photo'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('grph:' + s.phone, 30, 36e5)) return [429, { ok: false, error: 'Too many uploads, slow down' }];
  const g = grBag()[String(body.id || '')]; if (!g) return [404, { ok: false, error: 'Ground not found' }];
  const img = String(body.img || ''); if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(img)) return [400, { ok: false, error: 'Send a JPEG, PNG or WebP photo' }];
  if (img.length > GR_PH_BYTES) return [413, { ok: false, error: 'Photo is too large, try a smaller one' }];
  g.photos = g.photos || []; if (g.photos.length >= GR_PH_MAX) return [409, { ok: false, error: 'This ground already has ' + GR_PH_MAX + ' photos' }];
  const id = 'ph' + crypto.randomBytes(4).toString('hex'); g.photos.push({ id, img, by: s.phone, byName: String(s.u.nick || s.u.name || '').slice(0, 30), t: Date.now() });
  saveDb(); return [200, { ok: true, id, photos: g.photos.length }];
};
routes['GET /api/grounds/detail'] = async (req, body) => {
  const g = grBag()[String(body.id || '')]; if (!g) return [404, { ok: false, error: 'Ground not found' }];
  const me = grUser(req);
  return [200, { ok: true, item: grPub(g), photos: (g.photos || []).map(x => ({ id: x.id, img: x.img, by: x.byName || '', mine: !!(me && me.phone === x.by) })), reviews: (g.revs || []).slice(-30).reverse().map(x => ({ stars: x.stars, text: x.text, by: x.byName, t: x.t, mine: !!(me && me.phone === x.by) })) }];
};
routes['POST /api/grounds/photo/delete'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const g = grBag()[String(body.id || '')]; if (!g) return [404, { ok: false, error: 'Ground not found' }];
  const i = (g.photos || []).findIndex(x => x.id === body.pid); if (i < 0) return [404, { ok: false, error: 'Photo not found' }];
  if (g.photos[i].by !== s.phone && g.owner !== s.phone && s.u.role !== 'admin') return [403, { ok: false, error: 'Only the uploader, ground owner or admin can remove it' }];
  g.photos.splice(i, 1); saveDb(); return [200, { ok: true }];
};
routes['POST /api/grounds/review'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('grrv:' + s.phone, 20, 36e5)) return [429, { ok: false, error: 'Too many requests, slow down' }];
  const g = grBag()[String(body.id || '')]; if (!g) return [404, { ok: false, error: 'Ground not found' }];
  if (g.owner === s.phone) return [403, { ok: false, error: 'You cannot rate your own ground' }];
  const stars = Math.round(+body.stars); if (!(stars >= 1 && stars <= 5)) return [400, { ok: false, error: 'Choose 1 to 5 stars' }];
  const text = String(body.text || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 300);
  g.revs = g.revs || []; const i = g.revs.findIndex(x => x.by === s.phone), r = { stars, text, by: s.phone, byName: String(s.u.nick || s.u.name || '').slice(0, 30), t: Date.now() };
  if (i >= 0) g.revs[i] = r; else g.revs.push(r);
  saveDb(); return [200, { ok: true, rating: grAvg(g), reviews: g.revs.length }];
};

// Tournament team approval: any signed-in team manager requests to join a published tournament; only the tournament owner (or admin) approves or rejects, with a reason on rejection.
const trBag = () => (db.shared.treq = db.shared.treq || {});
const trTour = id => { const x = (db.shared.tours || {})[String(id || '')]; return x || null; };
const trNm = (v, n) => String(v || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
routes['GET /api/tours/info'] = async (req, body) => {
  const x = trTour(body.tid); if (!x) return [404, { ok: false, error: 'Tournament not found. Ask the organiser to share it first.' }];
  const t = (x.data && x.data.t) || x.data || {};
  return [200, { ok: true, tour: { id: String(body.tid), name: trNm(t.name || x.name, 80), organizer: x.ownerName || '', overs: t.overs || '', city: trNm(t.city || t.venue, 40), teams: Array.isArray(t.teams) ? t.teams.length : 0, fee: /^py[0-9a-f]{10}$/.test(String(t.feeCharge || '')) ? t.feeCharge : '' } }];
};
routes['POST /api/tours/join'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('trj:' + s.phone, 20, 36e5)) return [429, { ok: false, error: 'Too many requests, slow down' }];
  const x = trTour(body.tid); if (!x) return [404, { ok: false, error: 'Tournament not found' }];
  const name = trNm(body.name, 30); if (name.length < 2) return [400, { ok: false, error: 'Enter the team name' }];
  const L = trBag()[String(body.tid)] = trBag()[String(body.tid)] || [];
  if (L.some(r => r.name.toLowerCase() === name.toLowerCase() && r.status !== 'rejected' && r.by !== s.phone)) return [409, { ok: false, error: 'A team with this name has already requested to join' }];
  const mine = L.find(r => r.by === s.phone && r.name.toLowerCase() === name.toLowerCase());
  if (mine && mine.status !== 'rejected') return [409, { ok: false, error: mine.status === 'approved' ? 'This team is already approved' : 'Your request is already waiting for approval' }];
  if (L.filter(r => r.status === 'pending').length >= 60) return [429, { ok: false, error: 'Too many pending requests for this tournament' }];
  const r = { id: 'tr' + crypto.randomBytes(4).toString('hex'), by: s.phone, byName: String(s.u.nick || s.u.name || '').slice(0, 30), name, short: trNm(body.short, 4).toUpperCase(), city: trNm(body.city, 40), note: trNm(body.note, 160), status: 'pending', reason: '', t: Date.now() };
  if (mine) Object.assign(mine, r, { id: mine.id }); else L.push(r);
  saveDb(); return [200, { ok: true, id: (mine || r).id }];
};
routes['GET /api/tours/requests'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const x = trTour(body.tid); if (!x) return [404, { ok: false, error: 'Tournament not found' }];
  const L = trBag()[String(body.tid)] || [], boss = x.owner === s.phone || s.u.role === 'admin';
  const pub = r => ({ id: r.id, name: r.name, short: r.short, city: r.city, note: r.note, by: r.byName, status: r.status, reason: r.reason, t: r.t });
  return [200, { ok: true, owner: boss, items: (boss ? L : L.filter(r => r.by === s.phone)).slice().reverse().map(pub) }];
};
routes['POST /api/tours/decide'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const x = trTour(body.tid); if (!x) return [404, { ok: false, error: 'Tournament not found' }];
  if (x.owner !== s.phone && s.u.role !== 'admin') return [403, { ok: false, error: 'Only the tournament organiser can approve or reject teams' }];
  const r = (trBag()[String(body.tid)] || []).find(q => q.id === body.rid); if (!r) return [404, { ok: false, error: 'Request not found' }];
  const st = body.status === 'approved' ? 'approved' : body.status === 'rejected' ? 'rejected' : ''; if (!st) return [400, { ok: false, error: 'Choose approve or reject' }];
  const reason = trNm(body.reason, 160); if (st === 'rejected' && reason.length < 3) return [400, { ok: false, error: 'Give a short reason for rejecting' }];
  r.status = st; r.reason = st === 'rejected' ? reason : ''; r.decidedBy = s.phone; r.decidedAt = Date.now(); saveDb();
  return [200, { ok: true, item: { id: r.id, name: r.name, short: r.short, city: r.city, status: r.status } }];
};

// Boards and leagues: any signed-in user can found a board (association, league or club group). The founder and added admins approve or reject affiliation requests from tournaments and teams, and can revoke them later. Every decision keeps who decided and when.
const bdBag = () => (db.shared.boards = db.shared.boards || {});
const bdLevels = ['league', 'district', 'state', 'national', 'school', 'club'];
const bdIsAdmin = (b, s) => b.owner === s.phone || (b.admins || []).includes(s.phone) || s.u.role === 'admin';
const bdPub = b => ({ id: b.id, name: b.name, city: b.city, level: b.level, owner: b.ownerName, admins: (b.admins || []).length + 1, members: (b.members || []).filter(m => m.status === 'approved').length });
routes['GET /api/boards'] = async (req, body) => {
  const q = trNm(body.q, 40).toLowerCase();
  return [200, { ok: true, items: Object.values(bdBag()).filter(b => !q || (b.name + ' ' + b.city).toLowerCase().includes(q)).slice(-100).reverse().map(bdPub) }];
};
routes['GET /api/boards/detail'] = async (req, body) => {
  const b = bdBag()[String(body.id || '')]; if (!b) return [404, { ok: false, error: 'Board not found' }];
  const s = grUser(req), boss = !!(s && bdIsAdmin(b, s)), mem = m => ({ id: m.id, kind: m.kind, name: m.name, ref: m.ref, by: m.byName, status: m.status, reason: m.reason, note: m.note, t: m.t });
  const L = b.members || [];
  return [200, { ok: true, board: bdPub(b), admin: boss, owner: !!(s && b.owner === s.phone), members: L.filter(m => m.status === 'approved').map(mem), pending: boss ? L.filter(m => m.status === 'pending').map(mem) : [], mine: s ? L.filter(m => m.by === s.phone && m.status !== 'approved').map(mem) : [], adminNames: boss ? (b.admins || []).map(ph => ({ phone: ph.slice(0, 3) + '*****' + ph.slice(-2), ph, name: String(((db.users || {})[ph] || {}).nick || '') })) : [] }];
};
routes['POST /api/boards/create'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('bdc:' + s.phone, 10, 36e5)) return [429, { ok: false, error: 'Too many requests, slow down' }];
  const name = trNm(body.name, 60); if (name.length < 3) return [400, { ok: false, error: 'Enter the board name' }];
  if (Object.values(bdBag()).filter(b => b.owner === s.phone).length >= 3) return [400, { ok: false, error: 'You can found up to 3 boards' }];
  if (Object.values(bdBag()).some(b => b.name.toLowerCase() === name.toLowerCase())) return [409, { ok: false, error: 'A board with this name already exists' }];
  const b = { id: 'bd' + crypto.randomBytes(4).toString('hex'), name, city: trNm(body.city, 40), level: bdLevels.includes(body.level) ? body.level : 'league', owner: s.phone, ownerName: String(s.u.nick || s.u.name || '').slice(0, 30), admins: [], members: [], t: Date.now() };
  bdBag()[b.id] = b; saveDb(); return [200, { ok: true, id: b.id }];
};
routes['POST /api/boards/admin'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const b = bdBag()[String(body.id || '')]; if (!b) return [404, { ok: false, error: 'Board not found' }];
  if (b.owner !== s.phone && s.u.role !== 'admin') return [403, { ok: false, error: 'Only the founder can change board admins' }];
  const ph = String(body.phone || '').replace(/[^\d+]/g, '');
  if (body.remove) { b.admins = (b.admins || []).filter(x => x !== ph); saveDb(); return [200, { ok: true }]; }
  if (!(db.users || {})[ph]) return [404, { ok: false, error: 'No Scoring Heroes account with this number' }];
  if (ph === b.owner || (b.admins || []).includes(ph)) return [409, { ok: false, error: 'Already an admin' }];
  if ((b.admins || []).length >= 10) return [400, { ok: false, error: 'Up to 10 admins' }];
  b.admins = (b.admins || []).concat(ph); saveDb(); return [200, { ok: true }];
};
routes['POST /api/boards/affiliate'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('bda:' + s.phone, 20, 36e5)) return [429, { ok: false, error: 'Too many requests, slow down' }];
  const b = bdBag()[String(body.id || '')]; if (!b) return [404, { ok: false, error: 'Board not found' }];
  const kind = body.kind === 'tour' ? 'tour' : 'team', name = trNm(body.name, 60); if (name.length < 2) return [400, { ok: false, error: 'Enter the ' + (kind === 'tour' ? 'tournament' : 'team') + ' name' }];
  const L = b.members = b.members || [], low = name.toLowerCase();
  const dup = L.find(m => m.kind === kind && m.name.toLowerCase() === low && m.status !== 'rejected' && m.status !== 'revoked');
  if (dup) return [409, { ok: false, error: dup.status === 'approved' ? 'Already affiliated' : 'A request for this name is already waiting' }];
  if (L.filter(m => m.status === 'pending').length >= 100) return [429, { ok: false, error: 'Too many pending requests' }];
  const m = { id: 'bm' + crypto.randomBytes(4).toString('hex'), kind, name, ref: trNm(body.ref, 40), note: trNm(body.note, 160), by: s.phone, byName: String(s.u.nick || s.u.name || '').slice(0, 30), status: 'pending', reason: '', t: Date.now() };
  L.push(m); saveDb(); return [200, { ok: true, id: m.id }];
};
routes['POST /api/boards/decide'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const b = bdBag()[String(body.id || '')]; if (!b) return [404, { ok: false, error: 'Board not found' }];
  if (!bdIsAdmin(b, s)) return [403, { ok: false, error: 'Only board admins can decide' }];
  const m = (b.members || []).find(x => x.id === body.rid); if (!m) return [404, { ok: false, error: 'Request not found' }];
  const st = ['approved', 'rejected', 'revoked'].includes(body.status) ? body.status : ''; if (!st) return [400, { ok: false, error: 'Choose approve, reject or revoke' }];
  if (st === 'approved' && m.status !== 'pending') return [400, { ok: false, error: 'Only waiting requests can be approved' }];
  if (st === 'revoked' && m.status !== 'approved') return [400, { ok: false, error: 'Only approved members can be revoked' }];
  const reason = trNm(body.reason, 160); if (st !== 'approved' && reason.length < 3) return [400, { ok: false, error: 'Give a short reason' }];
  m.status = st; m.reason = st === 'approved' ? '' : reason; m.decidedBy = s.phone; m.decidedAt = Date.now(); saveDb();
  return [200, { ok: true }];
};

// Number change, recovery and merge review. A signed-in user (with PIN) asks to use a new number. Nothing moves until an admin approves: approval adds the new number as an alias that signs in to the SAME account (all matches, tournaments and ownership stay put). If the new number already has its own account it is flagged as a merge: approval closes that second account (records are kept) and points its number at the first. Every decision is recorded.
const nrBag = () => (db.shared.numreq = db.shared.numreq || []);
const aliasBag = () => (db.shared.alias = db.shared.alias || {});
const nrPub = r => ({ id: r.id, kind: r.kind, newNumber: r.newKey.replace(/.(?=.{3}$)/g, '*'), nick: r.nick, reason: r.reason, status: r.status, why: r.why, t: r.t });
routes['POST /api/me/number-change'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('nrq:' + s.phone, 15, 864e5)) return [429, { ok: false, error: 'Too many requests today' }];
  if (s.u.ph && !safeEq(pinHash(body.pin || '', s.u.salt), s.u.ph)) return [200, { ok: false, error: 'Wrong PIN' }];
  const P = pk({ phone: body.phone, cc: body.cc }); if (P.isEmail || !validIntl(P)) return [400, { ok: false, error: BADNUM }];
  if (P.key === s.phone) return [400, { ok: false, error: 'This is already your number' }];
  if (aliasBag()[P.key]) return [409, { ok: false, error: 'This number is already linked to an account' }];
  const reason = trNm(body.reason, 160); if (reason.length < 3) return [400, { ok: false, error: 'Say why you are changing the number' }];
  if (nrBag().some(r => r.by === s.phone && r.status === 'pending')) return [409, { ok: false, error: 'You already have a request waiting' }];
  const r = { id: 'nr' + crypto.randomBytes(4).toString('hex'), by: s.phone, nick: String(s.u.nick || '').slice(0, 30), newKey: P.key, kind: db.users[P.key] ? 'merge' : 'change', reason, status: 'pending', t: Date.now() };
  nrBag().push(r); saveDb(); return [200, { ok: true, id: r.id, kind: r.kind }];
};
routes['GET /api/me/number-change'] = async (req) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  return [200, { ok: true, items: nrBag().filter(r => r.by === s.phone).slice(-10).reverse().map(nrPub) }];
};
routes['GET /api/admin/number-requests'] = async (req) => {
  const s = grUser(req); if (!s || s.u.role !== 'admin') return [403, { ok: false, error: 'Admins only' }];
  return [200, { ok: true, items: nrBag().filter(r => r.status === 'pending').map(r => ({ ...nrPub(r), merge: r.kind === 'merge', otherNick: r.kind === 'merge' && db.users[r.newKey] ? String(db.users[r.newKey].nick || '') : '' })) }];
};
routes['POST /api/admin/number-decide'] = async (req, body) => {
  const s = grUser(req); if (!s || s.u.role !== 'admin') return [403, { ok: false, error: 'Admins only' }];
  const r = nrBag().find(x => x.id === body.rid && x.status === 'pending'); if (!r) return [404, { ok: false, error: 'Request not found' }];
  const st = body.status === 'approved' ? 'approved' : body.status === 'rejected' ? 'rejected' : ''; if (!st) return [400, { ok: false, error: 'Choose approve or reject' }];
  const why = trNm(body.reason, 160); if (st === 'rejected' && why.length < 3) return [400, { ok: false, error: 'Give a short reason' }];
  if (st === 'approved') {
    const u = db.users[r.by]; if (!u) return [404, { ok: false, error: 'Account no longer exists' }];
    if (aliasBag()[r.newKey]) return [409, { ok: false, error: 'Number already linked' }];
    const o = db.users[r.newKey];
    if (o) { if (o.role === 'admin') return [400, { ok: false, error: 'An admin account cannot be merged' }]; o.closed = Date.now(); o.mergedInto = r.by; o.revokeBefore = Date.now(); }
    aliasBag()[r.newKey] = r.by; u.altNumbers = (u.altNumbers || []).concat(r.newKey).slice(-5);
  }
  r.status = st; r.why = st === 'rejected' ? why : ''; r.decidedBy = s.phone; r.decidedAt = Date.now(); saveDb();
  return [200, { ok: true }];
};

// Scorer lookup: a scorer or admin adds a player to a squad by phone number. The reply carries the minimum profile only (name, SH ID, kind, city), never the phone, email or age. Rate limited and every lookup is logged.
routes['POST /api/scorer/lookup'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (s.u.role !== 'admin' && s.u.role !== 'scorer') return [403, { ok: false, error: 'Only scorers and admins can look people up' }];
  if (limited('lk:' + s.phone, 30, 36e5)) return [429, { ok: false, error: 'Too many lookups this hour' }];
  const P = pk({ phone: body.phone, cc: body.cc }); if (!P.isEmail && !validIntl(P)) return [400, { ok: false, error: BADNUM }];
  const key = aliasBag()[P.key] || P.key, u = db.users[key];
  const log = db.shared.lookups = db.shared.lookups || []; log.push({ by: s.phone, t: Date.now(), hit: !!(u && !u.closed) }); if (log.length > 500) log.splice(0, log.length - 500); saveDb();
  if (!u || u.closed) return [200, { ok: true, found: false }];
  if (!u.shid) { let id; do { id = 'SH-' + crypto.randomBytes(5).toString('hex').slice(0, 8).toUpperCase(); } while (Object.values(db.users).some(x => x.shid === id)); u.shid = id; saveDb(); }
  return [200, { ok: true, found: true, profile: { shid: u.shid, name: String(u.nick || '').slice(0, 30), kind: u.kind || '', city: String((u.loc && (u.loc.city || u.loc)) || '').slice(0, 40) } }];
};

// Shared graphics package (R47): one versioned manifest and data contract that the web overlay, the Windows/Web Studio and the Broadcast Companion all read. Templates are listed with the rows they carry; clients render with their own engine from the JSON data (schema sh.graphic/1). Bump version on any template change; clients compare and offer the update.
const GFX_PKG = {
  schema: 'sh.graphic/1', version: '1.2.0', updated: '2026-10-31',
  changelog: [{ v: '1.2.0', note: 'Added news ticker and labelled advertisement.' }, { v: '1.1.0', note: 'Added bowler intro, team intro, live-score ticker and auction SOLD.' }, { v: '1.0.0', note: 'Batter intro, playing XI, fall of wickets, scorecard, points table, fixtures, leaders, QR, FOUR/SIX/WICKET/FIFTY/HUNDRED effects.' }],
  output: { width: 1920, height: 1080, background: 'transparent', safeMarginPct: 5 },
  positions: ['l', 'c', 'r'], sizes: ['s', 'm', 'l'],
  templates: [
    { id: 'intro', name: 'Batter intro', needs: ['match'] }, { id: 'bint', name: 'Bowler intro', needs: ['match'] },
    { id: 'tint', name: 'Team intro', needs: ['match'] }, { id: 'xi', name: 'Playing XI', needs: ['match'] },
    { id: 'fow', name: 'Fall of wickets', needs: ['match'] }, { id: 'card', name: 'Scorecard', needs: ['match'] },
    { id: 'points', name: 'Points table', needs: ['match', 'tournament'] }, { id: 'fix', name: 'Fixtures', needs: ['match', 'tournament'] },
    { id: 'lead', name: 'Leaders', needs: ['match'] }, { id: 'tick', name: 'Score ticker', needs: ['match'] },
    { id: 'sold', name: 'Auction SOLD', needs: ['auction'] }, { id: 'news', name: 'News ticker', needs: [] }, { id: 'ad', name: 'Advertisement (always labelled AD)', needs: [] }, { id: 'qr', name: 'QR link', needs: ['match'] }],
  effects: [{ id: 'four', text: 'FOUR', color: '#2f9e44' }, { id: 'six', text: 'SIX', color: '#e8590c' }, { id: 'wicket', text: 'WICKET', color: '#e03131' }, { id: 'fifty', text: 'FIFTY', color: '#1971c2' }, { id: 'hundred', text: 'HUNDRED', color: '#9c36b5' }],
  data: { description: 'Every graphic is delivered as {schema, version, template, matchId, title, rows:[{l,v}], at}. rows carry already formatted text; studios only lay it out.', example: { schema: 'sh.graphic/1', version: '1.2.0', template: 'fow', matchId: 'm1', title: 'Fall of wickets', rows: [{ l: '1. Player 1', v: '12-1 (2.3 ov)' }], at: 0 } }
};
routes['GET /api/graphics/package'] = async () => [200, { ok: true, package: GFX_PKG }];

// Guardian, parent, coach and teacher links to a player account. The guardian asks with the player's SH ID; the player account (or an admin) approves; either side can end the link later. A link carries no extra data access by itself: it records who is recognised as responsible. No phone numbers or emails are shown to the other side.
const glBag = () => (db.shared.glinks = db.shared.glinks || []);
const GL_REL = ['parent', 'guardian', 'coach', 'teacher'];
const glPub = (r, me) => ({ id: r.id, rel: r.rel, status: r.status, role: r.g === me ? 'guardian' : 'player', who: r.g === me ? r.childNick : r.gNick, shid: r.g === me ? r.shid : '', note: r.note, reason: r.reason, t: r.t });
routes['POST /api/links/request'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('gl:' + s.phone, 10, 36e5)) return [429, { ok: false, error: 'Too many requests, slow down' }];
  const shid = String(body.shid || '').trim().toUpperCase(), rel = GL_REL.includes(body.rel) ? body.rel : '';
  if (!/^SH-[A-Z0-9]{8}$/.test(shid)) return [400, { ok: false, error: 'Enter the SH ID, like SH-AB12CD34' }];
  if (!rel) return [400, { ok: false, error: 'Choose parent, guardian, coach or teacher' }];
  const e = Object.entries(db.users).find(([, u]) => u.shid === shid && !u.closed);
  if (!e) return [404, { ok: false, error: 'No player with this SH ID' }];
  const [cph, cu] = e; if (cph === s.phone) return [400, { ok: false, error: 'This is your own SH ID' }];
  const L = glBag(), dup = L.find(r => r.g === s.phone && r.child === cph && r.rel === rel && (r.status === 'pending' || r.status === 'approved'));
  if (dup) return [409, { ok: false, error: dup.status === 'approved' ? 'Already linked' : 'Your request is already waiting' }];
  const r = { id: 'gl' + crypto.randomBytes(4).toString('hex'), g: s.phone, gNick: String(s.u.nick || '').slice(0, 30), child: cph, childNick: String(cu.nick || '').slice(0, 30), shid, rel, note: trNm(body.note, 120), status: 'pending', reason: '', t: Date.now() };
  L.push(r); saveDb(); return [200, { ok: true, id: r.id }];
};
routes['GET /api/links'] = async (req) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  return [200, { ok: true, items: glBag().filter(r => r.g === s.phone || r.child === s.phone).slice(-60).reverse().map(r => glPub(r, s.phone)) }];
};
routes['POST /api/links/decide'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const r = glBag().find(x => x.id === body.id); if (!r) return [404, { ok: false, error: 'Link not found' }];
  const isChild = r.child === s.phone, isG = r.g === s.phone, adm = s.u.role === 'admin';
  if (!isChild && !isG && !adm) return [403, { ok: false, error: 'Not your link' }];
  const st = ['approved', 'rejected', 'revoked'].includes(body.status) ? body.status : ''; if (!st) return [400, { ok: false, error: 'Choose approve, reject or end' }];
  if (st === 'approved' || st === 'rejected') { if (!isChild && !adm) return [403, { ok: false, error: 'Only the player account can approve or reject' }]; if (r.status !== 'pending') return [400, { ok: false, error: 'Already decided' }]; }
  if (st === 'revoked' && r.status !== 'approved' && r.status !== 'pending') return [400, { ok: false, error: 'Nothing to end' }];
  r.status = st; r.reason = trNm(body.reason, 120); r.decidedBy = s.phone; r.decidedAt = Date.now(); saveDb(); return [200, { ok: true }];
};

// Direct UPI collection (no gateway, no money passes through this app). The organiser creates a charge with their own UPI ID; the payer pays from any UPI app and submits the 12-digit UTR; the organiser checks it against their bank and confirms or rejects. A UTR can be used once across all charges. Amounts are whole paise. Nothing is auto-confirmed: only the organiser's confirmation counts as paid.
const pyBag = () => (db.shared.pay = db.shared.pay || {});
const VPA = /^[A-Za-z0-9._-]{2,64}@[A-Za-z][A-Za-z0-9.-]{1,30}$/;
const pyPub = (c, me) => ({ id: c.id, title: c.title, amount: c.amount, payee: c.payeeName, upi: c.upi, ref: c.ref, kind: c.kind, open: c.open !== false, owner: !!(me && me === c.owner), mine: me ? (c.subs || []).filter(x => x.by === me).map(x => ({ id: x.id, utr: x.utr.replace(/.(?=.{4})/g, '*'), status: x.status, why: x.why, t: x.t })) : [], subs: me && me === c.owner ? (c.subs || []).map(x => ({ id: x.id, byName: x.byName, utr: x.utr, status: x.status, why: x.why, t: x.t, note: x.note })) : undefined, confirmed: (c.subs || []).filter(x => x.status === 'confirmed').length });
routes['POST /api/pay/charge'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('pyc:' + s.phone, 30, 36e5)) return [429, { ok: false, error: 'Too many requests, slow down' }];
  const title = trNm(body.title, 80), upi = String(body.upi || '').trim(), amount = Math.round(+body.amount);
  if (title.length < 3) return [400, { ok: false, error: 'Give the charge a title' }];
  if (!VPA.test(upi)) return [400, { ok: false, error: 'Enter a valid UPI ID, like name@bank' }];
  if (!(amount >= 100 && amount <= 5e7)) return [400, { ok: false, error: 'Amount must be between 1 and 500000 rupees' }];
  const c = { id: 'py' + crypto.randomBytes(5).toString('hex'), owner: s.phone, title, upi, amount, payeeName: trNm(body.payee || s.u.nick || s.u.name, 40), kind: trNm(body.kind, 20) || 'other', ref: trNm(body.ref, 40), open: true, subs: [], t: Date.now() };
  pyBag()[c.id] = c; saveDb(); return [200, { ok: true, id: c.id }];
};
routes['GET /api/pay/charge'] = async (req, body) => {
  const c = pyBag()[String(body.id || '')]; if (!c) return [404, { ok: false, error: 'Charge not found' }];
  const s = grUser(req); return [200, { ok: true, charge: pyPub(c, s && s.phone) }];
};
routes['GET /api/pay/mine'] = async (req) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  return [200, { ok: true, items: Object.values(pyBag()).filter(c => c.owner === s.phone).slice(-50).reverse().map(c => pyPub(c, s.phone)) }];
};
routes['POST /api/pay/submit'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('pys:' + s.phone, 20, 36e5)) return [429, { ok: false, error: 'Too many tries, slow down' }];
  const c = pyBag()[String(body.id || '')]; if (!c) return [404, { ok: false, error: 'Charge not found' }];
  if (c.open === false) return [400, { ok: false, error: 'This charge is closed' }];
  const utr = String(body.utr || '').replace(/\s/g, '');
  if (!/^\d{12}$/.test(utr)) return [400, { ok: false, error: 'The UTR is 12 digits. Find it in your UPI app under the payment details' }];
  if (Object.values(pyBag()).some(x => (x.subs || []).some(y => y.utr === utr && y.status !== 'rejected'))) return [409, { ok: false, error: 'This UTR was already submitted' }];
  if ((c.subs || []).some(x => x.by === s.phone && (x.status === 'confirmed' || x.status === 'submitted'))) return [409, { ok: false, error: 'You already paid or are waiting for confirmation' }];
  const x = { id: 'ps' + crypto.randomBytes(4).toString('hex'), by: s.phone, byName: String(s.u.nick || s.u.name || '').slice(0, 30), utr, note: trNm(body.note, 80), status: 'submitted', why: '', t: Date.now() };
  c.subs = (c.subs || []).concat(x); saveDb(); pushTo(c.owner, { title: 'Payment to confirm', body: (x.byName || 'Someone') + ' paid for ' + c.title, url: '/?pay=' + c.id }).catch(() => {}); return [200, { ok: true, id: x.id }];
};
routes['POST /api/pay/decide'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const c = pyBag()[String(body.id || '')]; if (!c) return [404, { ok: false, error: 'Charge not found' }];
  if (c.owner !== s.phone) return [403, { ok: false, error: 'Only the person collecting this payment can decide' }];
  const x = (c.subs || []).find(y => y.id === body.sid); if (!x) return [404, { ok: false, error: 'Payment not found' }];
  const st = body.status === 'confirmed' ? 'confirmed' : body.status === 'rejected' ? 'rejected' : ''; if (!st) return [400, { ok: false, error: 'Choose confirm or reject' }];
  if (x.status !== 'submitted') return [400, { ok: false, error: 'Already decided' }];
  const why = trNm(body.reason, 120); if (st === 'rejected' && why.length < 3) return [400, { ok: false, error: 'Say why you are rejecting it' }];
  x.status = st; x.why = st === 'rejected' ? why : ''; x.decidedAt = Date.now(); saveDb(); pushTo(x.by, { title: st === 'confirmed' ? 'Payment confirmed' : 'Payment rejected', body: c.title + (st === 'rejected' ? ': ' + why : ''), url: '/?pay=' + c.id }).catch(() => {}); return [200, { ok: true }];
};
routes['POST /api/pay/close'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const c = pyBag()[String(body.id || '')]; if (!c) return [404, { ok: false, error: 'Charge not found' }];
  if (c.owner !== s.phone) return [403, { ok: false, error: 'Only the person collecting this payment can do this' }];
  c.open = body.open === true; saveDb(); return [200, { ok: true }];
};

// Web Push (R26): browser notifications with a deep link. VAPID keys come from env or are generated once and kept in the database.
const vapid = () => { if (E.VAPID_PUBLIC && E.VAPID_PRIVATE) return { pub: E.VAPID_PUBLIC, priv: E.VAPID_PRIVATE }; const sh = db.shared; if (!sh.vapid) { sh.vapid = genVapid(); saveDb(); } return sh.vapid; };
const pushOk = ep => { try { const u = new URL(ep); return (u.protocol === 'https:' || (u.protocol === 'http:' && /^(127\.0\.0\.1|localhost)$/.test(u.hostname))) && ep.length < 600; } catch { return false; } };
async function pushTo(phone, msg) {
  const u = db.users[phone]; if (!u || !(u.push || []).length) return 0; let n = 0; const keep = [];
  for (const sub of u.push) { try { const r = await sendPush(sub, JSON.stringify({ title: String(msg.title || '').slice(0, 80), body: String(msg.body || '').slice(0, 160), url: String(msg.url || '/').slice(0, 200) }), vapid()); if (r.gone) continue; if (r.status < 300) n++; } catch { /* keep the subscription on a network error */ } keep.push(sub); }
  if (keep.length !== u.push.length) { u.push = keep; saveDb(); } return n;
}
routes['GET /api/push/key'] = async () => [200, { ok: true, key: vapid().pub }];
routes['POST /api/push/subscribe'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const b = body.sub || {}, ep = String(b.endpoint || ''), k = b.keys || {};
  if (!pushOk(ep) || !/^[\w-]{80,100}$/.test(String(k.p256dh || '')) || !/^[\w-]{20,30}$/.test(String(k.auth || ''))) return [400, { ok: false, error: 'This browser sent an invalid notification subscription' }];
  if (limited('pushs:' + s.phone, 30, 36e5)) return [429, { ok: false, error: 'Too many tries, slow down' }];
  const list = (s.u.push || []).filter(x => x.endpoint !== ep); list.push({ endpoint: ep, keys: { p256dh: k.p256dh, auth: k.auth }, t: Date.now() });
  s.u.push = list.slice(-5); saveDb(); return [200, { ok: true, devices: s.u.push.length }];
};
routes['POST /api/push/unsubscribe'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const ep = String(body.endpoint || ''); s.u.push = (s.u.push || []).filter(x => x.endpoint !== ep); saveDb(); return [200, { ok: true }];
};
routes['POST /api/push/test'] = async (req) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('pusht:' + s.phone, 5, 36e5)) return [429, { ok: false, error: 'Too many tests, try later' }];
  const n = await pushTo(s.phone, { title: 'Scoring Heroes', body: 'Notifications are on for this device.', url: '/' }); return [200, { ok: true, sent: n }];
};
// Sessions and account closure. Tokens carry their issue time; "sign out everywhere" invalidates every older token. Closing an account stops sign-in at once; matches, tournaments and other records stay (they are never deleted); signing in again within 30 days reopens it.
routes['POST /api/me/signout-all'] = async (req) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in again' }];
  s.u.revokeBefore = Date.now(); saveDb();
  return [200, { ok: true, token: sign(s.phone) }];
};
routes['POST /api/me/close'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in again' }];
  if (limited('close:' + s.phone, 5, 36e5)) return [429, { ok: false, error: 'Too many tries, wait a while' }];
  if (String(body.confirm || '') !== 'CLOSE') return [400, { ok: false, error: 'Type CLOSE to confirm' }];
  if (s.u.ph && !safeEq(pinHash(body.pin || '', s.u.salt), s.u.ph)) return [200, { ok: false, error: 'Wrong PIN' }];
  s.u.closed = Date.now(); saveDb();
  return [200, { ok: true, reopenDays: 30 }];
};

// Editorial articles: 8 types, one canonical article plus optional translations, drafts and published, every change to a published article is kept in a correction history.
const ED_TYPES = { result: 'Match report', preview: 'Match preview', player: 'Player spotlight', tournament: 'Tournament update', ground: 'Ground and venue', auction: 'Auction news', announce: 'Announcement', feature: 'Feature' };
const ED_LANGS = ['te', 'hi'];
const edBag = () => (db.shared.editorial = db.shared.editorial || {});
const edT = (v, n) => String(v == null ? '' : v).replace(/[<>]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, n);
const edBody = b => (Array.isArray(b) ? b : String(b || '').split(/\n+/)).map(x => edT(x, 1500)).filter(Boolean).slice(0, 12);
const edPub = (a, editor) => ({ id: a.id, type: a.type, typeName: ED_TYPES[a.type], h: a.h, sub: a.sub, body: a.body, tr: a.tr || {}, status: a.status, by: a.byName, t: a.t, updated: a.updated, history: (a.history || []).map(x => ({ t: x.t, note: x.note, by: x.byName, ...(editor ? { prev: x.prev } : {}) })) });
routes['GET /api/editorial'] = async (req, body) => {
  const s = grUser(req), ed = !!(s && ['admin', 'scorer'].includes(s.u.role));
  let L = Object.values(edBag());
  if (body.id) { const a = edBag()[String(body.id)]; if (!a || (a.status !== 'published' && !ed)) return [404, { ok: false, error: 'Article not found' }]; return [200, { ok: true, item: edPub(a, ed), types: ED_TYPES }]; }
  if (!(ed && body.all)) L = L.filter(a => a.status === 'published');
  return [200, { ok: true, types: ED_TYPES, editor: ed, items: L.sort((a, b) => b.updated - a.updated).slice(0, 60).map(a => edPub(a, false)) }];
};
routes['POST /api/editorial'] = async (req, body) => {
  const s = grUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (!['admin', 'scorer'].includes(s.u.role)) return [403, { ok: false, error: 'Only scorers and admins can write articles' }];
  if (limited('ed:' + s.phone, 60, 36e5)) return [429, { ok: false, error: 'Too many requests, slow down' }];
  if (!ED_TYPES[body.type]) return [400, { ok: false, error: 'Choose an article type' }];
  const h = edT(body.h, 160), sub = edT(body.sub, 300), bd = edBody(body.body);
  if (h.length < 5) return [400, { ok: false, error: 'Write a headline (5+ letters)' }]; if (!bd.length) return [400, { ok: false, error: 'Write the article text' }];
  const tr = {}; for (const l of ED_LANGS) { const t = body.tr && body.tr[l]; if (t && (t.h || t.body)) { const tb = edBody(t.body); if (edT(t.h, 160) && tb.length) tr[l] = { h: edT(t.h, 160), sub: edT(t.sub, 300), body: tb }; } }
  const status = body.publish ? 'published' : 'draft', now = Date.now();
  let a = body.id ? edBag()[String(body.id)] : null;
  if (body.id && !a) return [404, { ok: false, error: 'Article not found' }];
  if (a) {
    if (a.by !== s.phone && s.u.role !== 'admin') return [403, { ok: false, error: 'Only the author or an admin can change this article' }];
    const changed = a.h !== h || a.sub !== sub || JSON.stringify(a.body) !== JSON.stringify(bd) || JSON.stringify(a.tr || {}) !== JSON.stringify(tr);
    if (a.status === 'published' && changed) {
      const note = edT(body.note, 200); if (note.length < 3) return [400, { ok: false, error: 'This article is already published. Say what you corrected (3+ letters)' }];
      (a.history = a.history || []).push({ t: now, note, by: s.phone, byName: String(s.u.nick || s.u.name || '').slice(0, 30), prev: { h: a.h, sub: a.sub, body: a.body } });
    }
    Object.assign(a, { type: body.type, h, sub, body: bd, tr, status, updated: now }); if (status === 'published' && !a.t) a.t = now;
  } else {
    const id = 'ed' + crypto.randomBytes(5).toString('hex'); a = edBag()[id] = { id, type: body.type, h, sub, body: bd, tr, status, by: s.phone, byName: String(s.u.nick || s.u.name || '').slice(0, 30), t: status === 'published' ? now : 0, updated: now, history: [] };
  }
  saveDb(); return [200, { ok: true, item: edPub(a, true) }];
};
// ---------- Teams and players registry (like CricHeroes / CrickPro): unique team names, players found by name or mobile, no duplicate players, creator/admin rights, verification by a registered account with the same mobile ----------
const RG_ROLES = ['BAT', 'BOWL', 'AR', 'WK'], RG_BAT = ['Right-hand', 'Left-hand'], RG_BOWL = ['', 'Right-arm fast', 'Right-arm medium', 'Off spin', 'Left-arm fast', 'Left-arm spin', 'Leg spin'], RG_LEVELS = ['national', 'state', 'district', 'club', 'academy', 'corporate', 'school', 'college'], RG_MAX = 30;
const rgTeams = () => (db.shared.rgTeams = db.shared.rgTeams || {}), rgPlayers = () => (db.shared.rgPlayers = db.shared.rgPlayers || {});
const rgStr = (v, n) => String(v == null ? '' : v).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const rgKey = n => String(n || '').toLowerCase().replace(/[^a-z0-9ऀ-෿]/g, '');   // "Hyderabad  Hawks!" and "hyderabadhawks" are the same team
const rgDigits = v => String(v || '').replace(/\D/g, '');
const rgPhone = v => { const d = rgDigits(v); return d.length >= 7 && d.length <= 15 ? d.slice(-10) : ''; };   // compare on the last 10 digits
const rgMask = ph => ph ? '••••••' + ph.slice(-4) : '';
const rgLinked = p => !!p.acct || !!p.ph && Object.entries(db.users || {}).some(([k, u]) => rgPhone(u.e164 || k) === p.ph);   // verified = a registered account uses this mobile
const rgUser = req => { const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone]; if (u) promote(u, phone); return u ? { phone, u } : null; };
const rgCan = (t, s) => t.creator === s.phone || (t.admins || []).includes(s.phone) || s.u.role === 'admin';
const rgCode = p => 'SH' + String(p.id).slice(1, 9).toUpperCase();
const rgPubP = (p, extra) => ({ id: p.id, code: rgCode(p), name: p.name, role: p.role, bat: p.bat, bowl: p.bowl, jersey: p.jersey, verified: rgLinked(p), mobile: rgMask(p.ph), teams: Object.values(rgTeams()).filter(t => t.members.includes(p.id)).map(t => t.name).slice(0, 5), ...(extra || {}) });
const rgPubT = (t, full) => ({ id: t.id, name: t.name, short: t.short, city: t.city, level: t.level, country: t.country, state: t.state, color: t.color, preset: t.preset, logo: t.logo || null, captain: t.captain || '', n: t.members.length, ...(full ? { players: t.members.map(id => rgPlayers()[id]).filter(Boolean).map(p => rgPubP(p)) } : {}) });
const rgTeamFields = (t, b) => {
  if ('city' in b) t.city = rgStr(b.city, 40); if ('state' in b) t.state = rgStr(b.state, 40); if ('country' in b) t.country = rgStr(b.country, 40);
  if ('level' in b) t.level = RG_LEVELS.includes(b.level) ? b.level : 'club'; if ('short' in b) t.short = rgStr(b.short, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || t.short;
  if ('color' in b && /^#[0-9a-f]{6}$/i.test(b.color)) t.color = b.color; if ('preset' in b && Number.isInteger(+b.preset) && +b.preset >= 0 && +b.preset <= 5) t.preset = +b.preset;
  if ('logo' in b) t.logo = typeof b.logo === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(b.logo) && b.logo.length <= 90000 ? b.logo : null;
};
routes['GET /api/reg/teams'] = async (req, body) => {
  const q = rgKey(body.q); const all = Object.values(rgTeams());
  const items = (q ? all.filter(t => rgKey(t.name).includes(q) || (t.short || '').toLowerCase() === String(body.q || '').toLowerCase()) : all.slice(-20).reverse()).slice(0, 20).map(t => rgPubT(t));
  return [200, { ok: true, items }];
};
routes['GET /api/reg/team'] = async (req, body) => { const t = rgTeams()[String(body.id || '')]; return t ? [200, { ok: true, team: rgPubT(t, true) }] : [404, { ok: false, error: 'Team not found' }]; };
routes['POST /api/reg/teams'] = async (req, body) => {
  const s = rgUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('rgt:' + s.phone, 30, 36e5)) return [429, { ok: false, error: 'Too many requests, slow down' }];
  const name = rgStr(body.name, 30); if (name.length < 2) return [400, { ok: false, error: 'Enter the team name' }];
  const ex = Object.values(rgTeams()).find(t => rgKey(t.name) === rgKey(name));
  if (ex) return [409, { ok: false, error: 'A team named "' + ex.name + '" already exists. Team names are unique.', existing: rgPubT(ex), mine: rgCan(ex, s) }];
  const id = 't' + crypto.randomBytes(5).toString('hex'), t = { id, name, short: rgStr(body.short, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'TM', city: '', state: '', country: '', level: 'club', color: '#2563eb', preset: 0, logo: null, creator: s.phone, admins: [], captain: '', members: [], t: Date.now() };
  rgTeamFields(t, body); rgTeams()[id] = t; saveDb(); return [200, { ok: true, team: rgPubT(t, true) }];
};
routes['PUT /api/reg/teams'] = async (req, body) => {   // only the creator, a team admin or an app admin can change team details or the logo
  const s = rgUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const t = rgTeams()[String(body.id || '')]; if (!t) return [404, { ok: false, error: 'Team not found' }];
  if (!rgCan(t, s)) return [403, { ok: false, error: 'Only the team creator or an admin can change this team' }];
  if ('name' in body) { const n = rgStr(body.name, 30); if (n.length < 2) return [400, { ok: false, error: 'Enter the team name' }]; if (Object.values(rgTeams()).some(o => o.id !== t.id && rgKey(o.name) === rgKey(n))) return [409, { ok: false, error: 'That team name is taken' }]; t.name = n; }
  rgTeamFields(t, body); saveDb(); return [200, { ok: true, team: rgPubT(t, true) }];
};
routes['GET /api/reg/players'] = async (req, body) => {   // search by name, or exact mobile number; mobile numbers are never returned (only masked)
  const raw = rgStr(body.q, 40), ph = /^[\d\s+()-]{7,}$/.test(raw) ? rgPhone(raw) : '', k = rgKey(raw), idq = /^(sh[0-9a-f]{8}|p[0-9a-f]{10})$/i.test(raw.replace(/[\s-]/g, '')) ? raw.replace(/[\s-]/g, '').toLowerCase() : ''; if (!ph && !idq && k.length < 2) return [200, { ok: true, items: [] }];
  const items = Object.values(rgPlayers()).filter(p => idq ? (rgCode(p).toLowerCase() === idq || p.id === idq) : ph ? p.ph === ph : rgKey(p.name).includes(k)).slice(0, 20).map(p => rgPubP(p));   // search by ID, mobile number or name
  return [200, { ok: true, items }];
};
routes['GET /api/reg/player'] = async (req, body) => {   // public profile card (opened by the player's QR code)
  const q = String(body.id || '').replace(/[\s-]/g, '').toLowerCase(), p = Object.values(rgPlayers()).find(x => x.id === q || rgCode(x).toLowerCase() === q);
  return p ? [200, { ok: true, player: rgPubP(p) }] : [404, { ok: false, error: 'Player not found' }];
};
routes['GET /api/reg/me'] = async (req) => {   // my own player ID card (created once, linked to my account)
  const s = rgUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const ph = rgPhone(s.u.e164 || s.phone);
  let p = Object.values(rgPlayers()).find(x => x.acct === s.phone || (ph && x.ph === ph));
  if (!p) { const id = 'p' + crypto.randomBytes(5).toString('hex'); p = { id, name: rgStr(s.u.nick || s.u.name || 'Player', 40), ph, acct: s.phone, role: 'BAT', bat: 'Right-hand', bowl: '', jersey: 0, by: s.phone, t: Date.now() }; rgPlayers()[id] = p; saveDb(); }
  else if (!p.acct) { p.acct = s.phone; saveDb(); }
  return [200, { ok: true, player: rgPubP(p) }];
};
routes['POST /api/reg/players'] = async (req, body) => {   // create a player (or return the existing one for the same mobile) and optionally add to a team
  const s = rgUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  if (limited('rgp:' + s.phone, 120, 36e5)) return [429, { ok: false, error: 'Too many requests, slow down' }];
  const name = rgStr(body.name, 40); if (name.length < 2) return [400, { ok: false, error: 'Enter the player name' }];
  const ph = rgPhone(body.phone); if (body.phone && !ph) return [400, { ok: false, error: 'Enter a valid mobile number' }];
  let t = null; if (body.team) { t = rgTeams()[String(body.team)]; if (!t) return [404, { ok: false, error: 'Team not found' }]; if (!rgCan(t, s)) return [403, { ok: false, error: 'Only the team creator or an admin can add players' }]; if (t.members.length >= RG_MAX) return [409, { ok: false, error: 'A team can have at most ' + RG_MAX + ' players' }]; }
  let p = ph ? Object.values(rgPlayers()).find(x => x.ph === ph) : null, existing = !!p;
  if (!p) { const id = 'p' + crypto.randomBytes(5).toString('hex'); p = { id, name, ph, role: RG_ROLES.includes(body.role) ? body.role : 'BAT', bat: RG_BAT.includes(body.bat) ? body.bat : 'Right-hand', bowl: RG_BOWL.includes(body.bowl) ? body.bowl : '', jersey: Math.max(0, Math.min(999, Math.floor(+body.jersey) || 0)), by: s.phone, t: Date.now() }; rgPlayers()[id] = p; }
  if (t && !t.members.includes(p.id)) t.members.push(p.id);
  saveDb(); return [200, { ok: true, existing, player: rgPubP(p), team: t ? rgPubT(t, true) : undefined }];
};
routes['POST /api/reg/members'] = async (req, body) => {   // add / remove a player in a team, or set the captain
  const s = rgUser(req); if (!s) return [401, { ok: false, error: 'Please sign in first' }];
  const t = rgTeams()[String(body.team || '')], p = rgPlayers()[String(body.player || '')]; if (!t || !p) return [404, { ok: false, error: 'Team or player not found' }];
  if (!rgCan(t, s)) return [403, { ok: false, error: 'Only the team creator or an admin can change the squad' }];
  const act = String(body.act || 'add');
  if (act === 'add') { if (!t.members.includes(p.id)) { if (t.members.length >= RG_MAX) return [409, { ok: false, error: 'A team can have at most ' + RG_MAX + ' players' }]; t.members.push(p.id); } }
  else if (act === 'remove') { t.members = t.members.filter(x => x !== p.id); if (t.captain === p.id) t.captain = ''; }   // the player and his history stay
  else if (act === 'captain') { if (!t.members.includes(p.id)) return [409, { ok: false, error: 'Add the player to the team first' }]; t.captain = p.id; }
  else return [400, { ok: false, error: 'Bad action' }];
  saveDb(); return [200, { ok: true, team: rgPubT(t, true) }];
};
routes['GET /api/find-match'] = async (req) => {   // what does the provider actually list? e.g. /api/find-match?q=india
  const q = String(new URL(req.url, 'http://x').searchParams.get('q') || '').toLowerCase().slice(0, 40);
  let d = null; try { d = await cdLive(); } catch (e) { return [200, { ok: false, error: e.message }]; }
  const hit = (d.matches || []).filter(m => !q || (m.name + ' ' + (m.seriesName || '')).toLowerCase().includes(q)).slice(0, 40).map(m => ({ name: m.name, type: m.type, series: m.seriesName, date: m.time || m.date, started: m.started, ended: m.ended }));
  return [200, { ok: true, total: (d.matches || []).length, found: hit.length, hit }];
};
routes['GET /api/status'] = async () => { const x = svcStatus(); return [200, { ok: true, emailReady: x.email.ready, smsReady: x.sms.ready, liveReady: x.live.ready }]; };
const fbCache = new Map();
async function fbCached(key, ttl, fn) {
  const h = fbCache.get(key); if (h && Date.now() - h.t < ttl) return h.d;
  const d = await fn(); fbCache.set(key, { t: Date.now(), d }); if (fbCache.size > 300) fbCache.clear(); return d;
}
// Other sports (basketball, volleyball, handball, hockey, rugby, football) from Highlightly. The free plan is ~100 requests a day, so lists are cached and a daily budget is enforced.
let APP_PAGE = null;
function appPage() {
  if (APP_PAGE) return APP_PAGE;
  const html = Buffer.from(fs.readFileSync(new URL('./app-index.html', import.meta.url), 'utf8').replace('__SH_BUILD__', String(E.RENDER_GIT_COMMIT || '').slice(0, 7) || 'local').replace('</head>', '<style id="sh-main-live-reference">' + fs.readFileSync(new URL('./public/main-live-reference.css', import.meta.url), 'utf8') + '</style><script>' + fs.readFileSync(new URL('./public/match-market-display.js', import.meta.url), 'utf8') + '</script></head>'));
  return (APP_PAGE = { html, gz: zlib.gzipSync(html, { level: 9 }), br: zlib.brotliCompressSync(html, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 } }), etag: '"' + crypto.createHash('sha1').update(html).digest('hex').slice(0, 24) + '"' });
}
const hlCache = new Map(); let hlDay = { d: '', n: 0 }, tnDay = { d: '', n: 0 };
const HL_DAILY = +E.HIGHLIGHTLY_DAILY_BUDGET || 85, HL_TTL = (+E.HIGHLIGHTLY_CACHE_SECONDS || 600) * 1000;
routes['GET /api/sx/live'] = async (req, body, ip) => {
  const sport = String(body.sport || '');
  if (!(sport === 'tennis' ? TN : HL)) return [200, { ok: false, error: 'This sport feed is not connected yet' }];
  if (sport !== 'tennis' && !HL_SPORTS.includes(sport)) return [400, { ok: false, error: 'Unknown sport' }];
  if (limited('sxl:' + ip, 120, 6e4)) return [429, { ok: false, error: 'Too many requests, wait a moment' }];
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date || '')) ? body.date : new Date().toISOString().slice(0, 10), k = sport + date, hit = hlCache.get(k);
  if (hit && Date.now() - hit.t < HL_TTL) return [200, { ok: true, matches: hit.d, updated: new Date(hit.t).toISOString(), date }];
  const today = new Date().toISOString().slice(0, 10); if (hlDay.d !== today) hlDay = { d: today, n: 0 }; if (tnDay.d !== today) tnDay = { d: today, n: 0 };
  const dd = sport === 'tennis' ? tnDay : hlDay;
  if (dd.n >= HL_DAILY) return hit ? [200, { ok: true, matches: hit.d, stale: true, note: 'Free plan daily limit reached; refreshes tomorrow', updated: new Date(hit.t).toISOString(), date }] : [200, { ok: false, error: 'Free plan daily limit reached; try again tomorrow' }];
  dd.n++;
  try { const d = sport === 'tennis' ? await TN.list() : await HL.list(sport, date); hlCache.set(k, { t: Date.now(), d }); if (hlCache.size > 60) hlCache.clear(); return [200, { ok: true, matches: d, updated: new Date().toISOString(), date }]; }
  catch (e) { return hit ? [200, { ok: true, matches: hit.d, stale: true, updated: new Date(hit.t).toISOString(), date }] : [502, { ok: false, error: String(e.message || 'Sport feed error').slice(0, 160) }]; }
};
routes['GET /api/admin/sx-probe'] = async (req, body) => {   // admin only: shows the real shape the provider sends, so the app can be matched to it (no key is printed)
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  promote(u, phone); if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can see this' }];
  if (String(body.sport) === 'tennis') { if (!TN) return [200, { ok: false, error: 'Live Tennis key is not set' }]; try { return [200, { ok: true, sport: 'tennis', ...(await TN.raw()), usedToday: hlDay.n }]; } catch (e) { return [200, { ok: false, error: String(e.message || 'error').slice(0, 200) }]; } }
  if (String(body.sport) === 'cricket') {   // Highlightly Cricket API: shows the real list + one match detail so ball-by-ball/scorecard fields can be checked
    const key = E.HIGHLIGHTLY_KEY; if (!key) return [200, { ok: false, error: 'Highlightly key is not set' }];
    try {
      const get = async path => { const r = await fetch('https://cricket.highlightly.net' + path, { headers: { 'x-rapidapi-key': key }, signal: AbortSignal.timeout(12000) }); const t = await r.text(); return { status: r.status, text: t }; };
      const day = new Date().toISOString().slice(0, 10), L = await get('/matches?limit=8&date=' + day);
      let list = null; try { list = JSON.parse(L.text); } catch {}
      const arr = list && Array.isArray(list.data) ? list.data : [], pick = arr.find(m => m && m.state && /live|progress|innings/i.test(String(m.state.description || ''))) || arr[0];
      const D = pick && pick.id != null ? await get('/matches/' + pick.id) : null;
      return [200, { ok: L.status === 200, sport: 'cricket', listStatus: L.status, listCount: arr.length, listSample: L.text.slice(0, 900), pickedId: pick ? pick.id : null, detailStatus: D ? D.status : null, detail: D ? D.text.slice(0, 2400) : null }];
    } catch (e) { return [200, { ok: false, error: String(e.message || 'error').slice(0, 200) }]; }
  }
  if (!HL) return [200, { ok: false, error: 'Highlightly key is not set' }];
  if (body.kind && body.id) { try { hlDay.n++; const j = await HL.detail(String(body.sport), String(body.kind), String(body.id)); return [200, { ok: true, kind: body.kind, json: JSON.stringify(j).slice(0, 6000) }]; } catch (e) { return [200, { ok: false, error: String(e.message || 'error').slice(0, 200) }]; } }
  const sport = HL_SPORTS.includes(String(body.sport)) ? String(body.sport) : 'basketball';
  try { return [200, { ok: true, sport, ...(await HL.raw(sport, new Date().toISOString().slice(0, 10))), usedToday: hlDay.n }]; } catch (e) { return [200, { ok: false, error: String(e.message || 'error').slice(0, 200) }]; }
};
routes['GET /api/fb/live'] = async (req, body, ip) => {
  if (!FB) return [200, { ok: false, error: 'Football feed is not connected yet (admin: add the Sportmonks football token)' }];
  if (limited('fbl:' + ip, 120, 6e4)) return [429, { ok: false, error: 'Too many requests, wait a moment' }];
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date || '')) ? body.date : new Date().toISOString().slice(0, 10);
  try { const matches = await fbCached('l' + date, 15e3, () => FB.list(date)); return [200, { ok: true, matches, updated: new Date().toISOString(), date }]; }
  catch (e) { const stale = fbCache.get('l' + date); if (stale) return [200, { ok: true, matches: stale.d, stale: true, updated: new Date(stale.t).toISOString(), date }]; return [502, { ok: false, error: String(e.message || 'Football feed error').slice(0, 160) }]; }
};
routes['GET /api/fb/match'] = async (req, body, ip) => {
  if (!FB) return [200, { ok: false, error: 'Football feed is not connected yet' }];
  if (limited('fbm:' + ip, 120, 6e4)) return [429, { ok: false, error: 'Too many requests, wait a moment' }];
  const id = String(body.id || '').replace(/^fb/, ''); if (!/^\d{1,12}$/.test(id)) return [400, { ok: false, error: 'Bad match id' }];
  try { const m = await fbCached('m' + id, 12e3, () => FB.match(id)); return [200, { ok: true, match: m }]; }
  catch (e) { const stale = fbCache.get('m' + id); if (stale) return [200, { ok: true, match: stale.d, stale: true }]; return [502, { ok: false, error: String(e.message || 'Football feed error').slice(0, 160) }]; }
};
// Home page extras: sponsor banners (Ads), channel links and a real YouTube latest-videos feed. Admin sets them in the app; everyone can read them.
const homeCfg = () => (db.shared.homeCfg = db.shared.homeCfg || { ads: [], links: {}, yt: '', pins: [] });
const okLink = v => /^https:\/\/[^\s]{3,300}$/i.test(String(v || '')) ? String(v) : '';
routes['GET /api/home-config'] = async () => { const c = homeCfg(); return [200, { ok: true, ads: c.ads, links: c.links, pins: c.pins, youtube: !!c.yt }]; };
routes['POST /api/admin/home-config'] = async (req, body) => {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  promote(u, phone); if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can change the home page' }];
  const c = homeCfg(), act = String(body.act || '');
  if (act === 'addAd') {
    const img = String(body.img || ''), link = okLink(body.link); if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(img) || img.length > 350000) return [400, { ok: false, error: 'Add a banner image under 250 KB' }];
    if (c.ads.length >= 8) return [400, { ok: false, error: 'Up to 8 banners' }];
    c.ads.push({ id: crypto.randomUUID().slice(0, 8), img, link, title: String(body.title || '').slice(0, 60) });
  } else if (act === 'rmAd') c.ads = c.ads.filter(a => a.id !== String(body.id));
  else if (act === 'links') { const L = {}; for (const k of ['youtube', 'instagram', 'facebook', 'whatsapp', 'x', 'telegram']) { const v = okLink(body[k]); if (v) L[k] = v; } c.links = L; }
  else if (act === 'yt') {   // channel id (UC...), channel URL, or @handle URL
    const raw = String(body.yt || '').trim(); let id = (/(UC[\w-]{22})/.exec(raw) || [])[1] || '';
    if (!id && /^(https:\/\/(www\.)?youtube\.com\/)?@[\w.-]{2,60}\/?$/i.test(raw)) { try { const h = raw.replace(/^https:\/\/(www\.)?youtube\.com\//i, '').replace(/\/$/, ''), r = await fetch('https://www.youtube.com/' + h, { signal: AbortSignal.timeout(10000), headers: { 'accept-language': 'en' } }), t = await r.text(); id = (/"channelId":"(UC[\w-]{22})"/.exec(t) || /channel_id=(UC[\w-]{22})/.exec(t) || [])[1] || ''; } catch { /* handled below */ } }
    if (raw && !id) return [400, { ok: false, error: 'Could not find that YouTube channel. Paste the channel link or the id that starts with UC' }];
    c.yt = id; socCache.clear();
  } else if (act === 'addPin') { const link = okLink(body.link), title = String(body.title || '').trim().slice(0, 120); if (!link || !title) return [400, { ok: false, error: 'Add a title and an https link' }]; if (c.pins.length >= 10) return [400, { ok: false, error: 'Up to 10 pinned posts' }]; c.pins.unshift({ id: crypto.randomUUID().slice(0, 8), title, link, note: String(body.note || '').slice(0, 160) }); }
  else if (act === 'rmPin') c.pins = c.pins.filter(x => x.id !== String(body.id));
  else return [400, { ok: false, error: 'Unknown action' }];
  saveDb(); return [200, { ok: true, ads: c.ads, links: c.links, pins: c.pins, youtube: !!c.yt }];
};
const socCache = new Map();
routes['GET /api/social/feed'] = async (req, body, ip) => {
  const c = homeCfg(); if (!c.yt) return [200, { ok: true, items: [], youtube: false }];
  if (limited('soc:' + ip, 60, 6e4)) return [429, { ok: false, error: 'Too many requests, wait a moment' }];
  const hit = socCache.get(c.yt); if (hit && Date.now() - hit.t < 600000) return [200, { ok: true, items: hit.d, youtube: true }];
  try {
    const r = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + c.yt, { signal: AbortSignal.timeout(10000) }); if (!r.ok) throw new Error('YouTube feed ' + r.status);
    const x = await r.text(), items = [...x.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 8).map(m => { const e = m[1], g = re => (re.exec(e) || [])[1] || '', un = t => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"), id = g(/<yt:videoId>([\w-]{11})</);
      return { id, title: un(g(/<title>([\s\S]*?)<\/title>/)), link: 'https://www.youtube.com/watch?v=' + id, thumb: id ? 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' : '', published: g(/<published>([^<]+)</) }; }).filter(i => i.id);
    socCache.set(c.yt, { t: Date.now(), d: items }); return [200, { ok: true, items, youtube: true }];
  } catch (e) { return hit ? [200, { ok: true, items: hit.d, stale: true, youtube: true }] : [502, { ok: false, error: String(e.message || 'Feed error').slice(0, 120) }]; }
};
routes['GET /api/admin/users-count'] = async (req) => {   // admin only: how many people have registered
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  promote(u, phone);
  if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can see this' }];
  const all = Object.values(db.users), day = Date.now() - 864e5;
  viewPrune(); const watching = new Set(); for (const m of viewMap.values()) for (const v of m.keys()) watching.add(v);
  return [200, { ok: true, total: all.length, today: all.filter(x => (x.created || 0) > day).length, live: watching.size }];
};
routes['GET /api/admin/scorers'] = async (req) => {   // who can score matches: admins see and manage the Scorer list from the app
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  promote(u, phone);
  if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can see this' }];
  const list = Object.entries(db.users).filter(([k, x]) => ['admin', 'scorer'].includes(promote(x, k).role)).map(([k, x]) => ({ id: k.startsWith('e:') ? k.slice(2) : k, nick: x.nick || x.name || '', role: x.role, fixed: ADMINS.includes(k) || SCORERS.includes(k) }));
  return [200, { ok: true, scorers: list, invited: Object.entries(db.invites || {}).filter(([, v]) => v === 'scorer').map(([k]) => k.startsWith('e:') ? k.slice(2) : k) }];
};
routes['POST /api/admin/scorers'] = async (req, body) => {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  promote(u, phone);
  if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can change scorers' }];
  const raw = String(body.id || '').trim(); if (!raw) return [400, { ok: false, error: 'Enter an email or mobile number' }];
  const P = pk({ phone: raw, cc: body.cc }), key = P.key;
  if (!validIntl(P)) return [400, { ok: false, error: BADNUM }];
  const want = body.role === 'viewer' ? 'viewer' : 'scorer', t = db.users[key];
  db.invites = db.invites || {};
  if (t) {
    if (t.role === 'admin' || ADMINS.includes(key)) return [400, { ok: false, error: 'That account is an Admin already' }];
    if (want === 'viewer' && SCORERS.includes(key)) return [400, { ok: false, error: 'This scorer is fixed in the server settings (SCORER_PHONES)' }];
    t.role = want; delete db.invites[key]; saveDb();
    return [200, { ok: true, applied: true }];
  }
  if (want === 'scorer') db.invites[key] = 'scorer'; else delete db.invites[key];
  saveDb();
  return [200, { ok: true, applied: false, note: 'This person has no account yet. They become a Scorer when they register with this ' + (P.isEmail ? 'email.' : 'number.') }];
};
routes['GET /api/admin/provider-key'] = async (req) => {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can see this' }];
  return [200, { ok: true, sportmonks: !!SM, source: SM_TOKEN ? 'server environment' : db.providerKeys.sportmonks ? 'saved in app' : 'none', cricketdata: !!CRIC_KEY, highlightly: !!HL, football: !!FB, footballSource: FB_TOKEN ? 'server environment' : db.providerKeys.football ? 'saved in app' : 'none' }];
};
routes['POST /api/admin/provider-key'] = async (req, body) => {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can change data provider keys' }];
  if (limited('pk:' + phone, 10, 36e5)) return [429, { ok: false, error: 'Too many attempts' }];
  if (body.highlightly !== undefined || body.clearHighlightly) {
    if (body.clearHighlightly === true) { delete db.providerKeys.highlightly; if (!HL_KEY) HL = null; saveDb(); return [200, { ok: true, highlightly: !!HL }]; }
    const hk = String(body.highlightly || '').trim();
    if (!/^[A-Za-z0-9_\-]{16,200}$/.test(hk)) return [400, { ok: false, error: 'That does not look like a Highlightly key (letters and numbers, 16+ characters)' }];
    if (HL_KEY) return [409, { ok: false, error: 'A Highlightly key is already set in the server environment, which takes priority' }];
    db.providerKeys.highlightly = hk; HL = createHighlightly({ key: hk, base: E.HIGHLIGHTLY_BASE || undefined }); saveDb();
    return [200, { ok: true, highlightly: true }];
  }
  if (body.football !== undefined || body.clearFootball) {
    if (body.clearFootball === true) { delete db.providerKeys.football; if (!FB_TOKEN) FB = null; saveDb(); return [200, { ok: true, football: !!FB }]; }
    const ft = String(body.football || '').trim();
    if (!/^[A-Za-z0-9_\-]{16,200}$/.test(ft)) return [400, { ok: false, error: 'That does not look like a Sportmonks football token (letters and numbers, 16+ characters)' }];
    if (FB_TOKEN) return [409, { ok: false, error: 'A football token is already set in the server environment, which takes priority' }];
    db.providerKeys.football = ft; FB = createFootball({ token: ft, base: E.FOOTBALL_BASE || undefined }); saveDb();
    return [200, { ok: true, football: true }];
  }
  if (body.clear === true || body.clear === 1) { delete db.providerKeys.sportmonks; if (!SM_TOKEN) SM = null; saveDb(); return [200, { ok: true, sportmonks: !!SM }]; }
  const t = String(body.sportmonks || '').trim();
  if (!/^[A-Za-z0-9_\-]{16,200}$/.test(t)) return [400, { ok: false, error: 'That does not look like a Sportmonks token (letters and numbers, 16+ characters)' }];
  if (SM_TOKEN) return [409, { ok: false, error: 'A token is already set in the server environment, which takes priority' }];
  db.providerKeys.sportmonks = t; SM = createSportmonks({ token: t, base: E.SPORTMONKS_BASE || undefined }); saveDb();
  return [200, { ok: true, sportmonks: true }];
};
routes['POST /api/admin/probe'] = async (req, body) => {
  const phone = readSession((req.headers.authorization || '').replace(/^Bearer /, '')), u = phone && db.users[phone];
  if (!u) return [401, { ok: false, error: 'Please sign in again' }];
  if (u.role !== 'admin') return [403, { ok: false, error: 'Only an admin can see this' }];
  if (!SM) {   // CricketData: show exactly what the key is allowed to read (plan, hits, ball by ball) without printing the key
    if (!CRIC_KEY) return [200, { ok: false, error: 'Neither CRIC_API_KEY nor SPORTMONKS_TOKEN is set on the server' }];
    try {
      const L = (await liveMatches()).matches || [], m = L.find(x => x.id === body.id) || L.find(x => x.started && !x.ended) || L.find(x => x.started) || L[0];
      if (!m) return [200, { ok: false, error: 'CricketData returned no matches' }];
      const out = [`Provider: CricketData · match: ${m.name} (${m.id}) · started=${m.started} ended=${m.ended}`];
      for (const ep of ['match_bbb', 'match_scorecard']) {
        const j = await (await fetch(`${CRIC_BASE}/${ep}?apikey=${encodeURIComponent(CRIC_KEY)}&id=${encodeURIComponent(m.id)}`, { signal: AbortSignal.timeout(12000) })).json();
        const d = j.data, n = Array.isArray(d) ? d.length : d && Array.isArray(d.bbb) ? d.bbb.length : d && Array.isArray(d.scorecard) ? d.scorecard.length : 0;
        out.push('', `${ep}: status=${j.status}${j.reason ? ' · reason: ' + j.reason : ''}`, `hits today: ${j.info && j.info.hitsToday} of ${j.info && j.info.hitsLimit}`, `rows: ${n}${d && !Array.isArray(d) ? ' · fields: ' + Object.keys(d).slice(0, 12).join(', ') : ''}`);
        if (ep === 'match_bbb' && n) out.push('first row: ' + JSON.stringify((Array.isArray(d) ? d : d.bbb)[0]).slice(0, 400));
      }
      return [200, { ok: true, id: m.id, fixture: out.join('\n') }];
    } catch (e) { return [200, { ok: false, error: String(e.message).slice(0, 300) }]; }
  }
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
const newsC = {};   // per language cache
const NEWS_LANG = { en: { q: NEWS_QUERY, hl: 'en-IN', ceid: 'IN:en' }, hi: { q: 'क्रिकेट', hl: 'hi', ceid: 'IN:hi' }, te: { q: 'క్రికెట్', hl: 'te', ceid: 'IN:te' } };
const decode = x => String(x || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
routes['GET /api/news'] = async (req, body) => {
  const lang = NEWS_LANG[body && body.lang] ? body.lang : 'en', L = NEWS_LANG[lang], c = newsC[lang] || (newsC[lang] = { t: 0, data: null });
  if (c.data && Date.now() - c.t < 6e5) return [200, c.data];
  try {
    const r = await fetch(`${NEWS_BASE}?q=${encodeURIComponent(L.q)}&hl=${L.hl}&gl=IN&ceid=${L.ceid}`);
    const xml = await r.text();
    const items = xml.split('<item>').slice(1, 15).map(it => {
      const g = re => { const m = re.exec(it); return m ? decode(m[1]) : ''; };
      let title = g(/<title>([\s\S]*?)<\/title>/), source = g(/<source[^>]*>([\s\S]*?)<\/source>/);
      if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
      return { title, link: g(/<link>([\s\S]*?)<\/link>/), source, date: g(/<pubDate>([\s\S]*?)<\/pubDate>/) };
    }).filter(x => x.title);
    c.t = Date.now(); c.data = { ok: true, lang, items };
    return [200, c.data];
  } catch (e) { return c.data ? [200, c.data] : [502, { ok: false, error: 'News unavailable' }]; }
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
  if (EMAIL_PROVIDER === 'brevo') {   // HTTPS (port 443), so it works on Render free instances where SMTP ports are blocked. The sender address must be verified in Brevo (one email link).
    const m = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(EMAIL_FROM), sender = m ? { name: m[1].replace(/^"|"$/g, '') || 'SH Sports', email: m[2] } : { name: 'SH Sports', email: String(EMAIL_FROM).trim() };
    const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    const r = await fetch((E.BREVO_BASE || 'https://api.brevo.com') + '/v3/smtp/email', { method: 'POST', headers: { 'api-key': E.BREVO_API_KEY || '', 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: '<p>' + esc(text) + '</p>' }) });
    if (!r.ok) throw new Error('Brevo ' + r.status + ' ' + (await r.text()).slice(0, 200)); return;
  }
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
  if (u.closed) { if (Date.now() - u.closed > 30 * 864e5) return [400, { ok: false, error: 'This account was closed more than 30 days ago. Contact support to reopen it.' }]; delete u.closed; saveDb(); }
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
  if (db.users[phone] || aliasBag()[phone]) return [200, { ok: false, exists: true, error: P.isEmail ? 'This email is already registered. Please login.' : 'This number is already registered. Please login.' }];
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
  const k0 = pk(body).key, phone = aliasBag()[k0] || k0, u = db.users[phone];
  if (locked(phone)) return [429, { ok: false, error: 'Too many wrong PINs. Try again in 15 minutes.' }];
  if (!u) return [200, { ok: false, noAccount: true, error: 'No account for this number. Please register.' }];
  if (!u.ph) return [200, { ok: false, error: 'This account has no PIN yet. Ask the admin to reset it.' }];
  if (!safeEq(pinHash(body.pin || '', u.salt), u.ph)) { bad(phone); return [200, { ok: false, error: 'Wrong PIN' }]; }
  fails.delete(phone);
  if (u.closed) { if (Date.now() - u.closed > 30 * 864e5) return [200, { ok: false, error: 'This account was closed more than 30 days ago. Contact support to reopen it.' }]; delete u.closed; saveDb(); }
  return [200, { ok: true, profile: pub(u), token: sign(phone), reopened: true }];
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
const sseClients = new Set();
const sseSend = o => { const line = `data: ${JSON.stringify(o)}\n\n`; for (const r of sseClients) { try { r.write(line); } catch { sseClients.delete(r); } } };
setInterval(() => { for (const r of sseClients) { try { r.write(': ping\n\n'); } catch { sseClients.delete(r); } } }, 20000).unref();
http.createServer(async (req, res) => {
  const origin = req.headers.origin, path = new URL(req.url, 'http://x').pathname;
  const out = (code, obj) => {
    res.writeHead(code, { 'content-type': typeof obj === 'string' ? 'text/plain' : 'application/json', 'access-control-allow-origin': allow(origin), vary: 'origin', 'access-control-allow-methods': 'GET,PUT,POST,DELETE,OPTIONS', 'access-control-allow-headers': 'authorization, content-type' });
    res.end(code === 204 ? '' : typeof obj === 'string' ? obj : JSON.stringify(obj));
  };
  if (req.method === 'OPTIONS') return out(204);
  if (req.method === 'GET' && path === '/api/shared-stream') {   // live push: viewers hear about a saved match the moment the scorer's save lands
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no', 'access-control-allow-origin': allow(origin), vary: 'origin' });
    res.write('retry: 2000\n\n'); sseClients.add(res); req.on('close', () => sseClients.delete(res)); return;
  }
  const STATIC = { '/manifest.webmanifest': 'application/manifest+json', '/sw.js': 'application/javascript', '/icon-192.png': 'image/png', '/icon-512.png': 'image/png', '/icon-maskable.png': 'image/png', '/apple-touch-icon.png': 'image/png' };
  const em = /^\/emblems\/[a-z-]+\.webp$/.exec(path);
  const lg = /^\/logos\/[a-z0-9._-]+\.(webp|png|jpg|jpeg|svg|json)$/i.exec(path);
  if (req.method === 'GET' && lg) { try { const f = fs.readFileSync(new URL('./public' + path, import.meta.url)); const x = lg[1].toLowerCase(); res.writeHead(200, { 'content-type': x === 'json' ? 'application/json' : x === 'svg' ? 'image/svg+xml' : x === 'jpg' ? 'image/jpeg' : 'image/' + x, 'cache-control': x === 'json' ? 'no-cache' : 'public, max-age=86400', 'access-control-allow-origin': '*' }); return res.end(f); } catch { /* fall through */ } }
  if (req.method === 'GET' && em) { try { const f = fs.readFileSync(new URL('./public' + path, import.meta.url)); res.writeHead(200, { 'content-type': 'image/webp', 'cache-control': 'public, max-age=604800' }); return res.end(f); } catch { /* fall through */ } }
  if (req.method === 'GET' && STATIC[path]) {   // installable-app files (PWA)
    try { const f = fs.readFileSync(new URL('./public' + path, import.meta.url)); res.writeHead(200, { 'content-type': STATIC[path], 'cache-control': path === '/sw.js' ? 'no-cache' : 'public, max-age=86400' }); return res.end(f); } catch { /* fall through */ }
  }
  // Only explicitly configured, licensed HTTPS streams can be exposed to the player.
  // BROADCAST_FEEDS_JSON is a JSON array: [{matchId, name, url, territories:["IN"], priority:1}].
  // Territory must be enforced by the authorized video CDN; the server-side deployment territory is only an additional coarse filter. No user-selected country unlocks playback.
  if (req.method === 'GET' && path === '/api/broadcast-feeds') {
    let configured = [];
    try { configured = JSON.parse(E.BROADCAST_FEEDS_JSON || '[]'); } catch { return out(503, { ok: false, error: 'Broadcast configuration invalid' }); }
    if (!Array.isArray(configured)) return out(503, { ok: false, error: 'Broadcast configuration invalid' });
    const query = new URL(req.url, 'http://x').searchParams;
    const matchId = query.get('matchId') || '';
    if (!matchId || matchId.length > 128) return out(400, { ok: false, error: 'Valid matchId required' });
    const territory = String(E.BROADCAST_VIEWER_TERRITORY || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(territory)) return out(200, { ok: true, matchId, territory: null, feeds: [], reason: 'Viewer territory not verified' });
    const feeds = configured.filter(f => f && String(f.matchId) === matchId &&
      Array.isArray(f.territories) && f.territories.includes(territory) &&
      typeof f.url === 'string' && /^https:\/\/[^\s]+$/i.test(f.url) &&
      !/[?#].*(token|key|secret)=/i.test(f.url))
      .sort((a,b) => (Number(a.priority)||100)-(Number(b.priority)||100))
      .map(f => ({ id: String(f.id||f.name||'feed'), name: String(f.name||'Authorized feed'),
        url: f.url, type: f.type === 'mp4' ? 'video/mp4' : 'application/vnd.apple.mpegurl' }));
    return out(200, { ok: true, matchId, territory, feeds, reason: feeds.length ? null : 'No authorized stream configured for this match and territory' });
  }
  if (req.method === 'GET' && path === '/broadcast-demo') {
    try {
      const html = fs.readFileSync(new URL('./public/broadcast-router-demo.html', import.meta.url));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
      return res.end(html);
    } catch { return out(404, { ok: false, error: 'Broadcast demo unavailable' }); }
  }
  if (req.method === 'GET' && (path === '/install' || path === '/install.html')) {   // install guide: iPhone (Add to Home Screen) and Android (APK)
    try { const html = fs.readFileSync(new URL('./public/install.html', import.meta.url)); res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' }); return res.end(html); }
    catch { return out(404, { ok: false, error: 'Install page not available' }); }
  }
  if (req.method === 'GET' && path === '/live-studio') {
    try { const html = fs.readFileSync(new URL('./public/live-studio.html', import.meta.url)); res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); return res.end(html); }
    catch { return out(404, { ok: false, error: 'Live studio not installed' }); }
  }
  if (req.method === 'GET' && (path === '/' || path === '/index.html')) {   // serve the app itself, same address as the API
    try {   // the page is ~2.5 MB: build it once, compress it, and let browsers revalidate with an ETag (a 304 costs almost nothing). This is what keeps Render bandwidth low.
      const P = appPage(), inm = String(req.headers['if-none-match'] || ''), ae = String(req.headers['accept-encoding'] || '');
      const base = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', etag: P.etag, vary: 'accept-encoding', 'x-sh-commit': String(E.RENDER_GIT_COMMIT || 'local') };
      if (inm === P.etag) { res.writeHead(304, base); return res.end(); }
      if (/\bbr\b/.test(ae)) { res.writeHead(200, { ...base, 'content-encoding': 'br', 'content-length': P.br.length }); return res.end(P.br); }
      if (/\bgzip\b/.test(ae)) { res.writeHead(200, { ...base, 'content-encoding': 'gzip', 'content-length': P.gz.length }); return res.end(P.gz); }
      res.writeHead(200, base); return res.end(P.html);
    } catch { /* fall through to 404 */ }
  }
  if (path === '/api/academy' || path === '/api/academy/mine') {   // academy backup/sync for the owner; parents read only their own child's record by signed-in mobile number
    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), phone = readSession(tok), u = phone && db.users[phone];
    if (!u) return out(401, { ok: false, error: 'Please sign in again' });
    const bag = (db.academy = db.academy || {}), d10 = v => String(v || '').replace(/\D/g, '').slice(-10);
    if (path === '/api/academy/mine' && req.method === 'GET') {
      const me = d10(phone), items = [], mk = new Date().toISOString().slice(0, 7);
      if (me.length === 10) for (const [own, ac] of Object.entries(bag)) for (const st of (ac.students || [])) {
        if (d10(st.phone) !== me) continue;
        const b = (ac.batches || []).find(x => x.id === st.batch), c = (ac.coaches || []).find(x => x.id === st.coachId || x.name === st.coach), days = Object.keys(st.att || {}).sort(), paid = st.paid || {};
        items.push({ academy: String(ac.name || 'Academy').slice(0, 60), ownerPhone: own === phone ? '' : own.slice(0, 3) + '*****' + own.slice(-2), id: st.id, name: st.name, sport: st.sport || 'Cricket', level: st.level || '', batch: b ? { name: b.name, days: b.days || [], time: b.time || '' } : null, coach: (c && c.name) || st.coach || '', fee: +st.fee || 0, paid: Object.fromEntries(Object.keys(paid).sort().slice(-6).map(k => [k, typeof paid[k] === 'number' ? paid[k] : (paid[k] ? +st.fee || 0 : 0)])), thisMonth: mk, att: { n: days.length, p: days.filter(x => st.att[x]).length, last: days.slice(-14).map(x => [x, st.att[x] ? 1 : 0]) } });
      }
      return out(200, { ok: true, items });
    }
    if (path === '/api/academy' && req.method === 'GET') return out(200, { ok: true, academy: bag[phone] || null });
    if (path === '/api/academy' && req.method === 'PUT') {
      if (limited('ay:' + phone, 120, 36e5)) return out(429, { ok: false, error: 'Too many requests, slow down' });
      let raw = ''; for await (const c of req) { raw += c; if (raw.length > 400000) return out(413, { ok: false, error: 'Too large' }); }
      let b; try { b = JSON.parse(raw); } catch { return out(400, { ok: false, error: 'Bad body' }); }
      const a = b && b.academy; if (!a || typeof a !== 'object' || !Array.isArray(a.students)) return out(400, { ok: false, error: 'Bad academy data' });
      const str = (v, n) => String(v == null ? '' : v).slice(0, n), arr = (v, n) => (Array.isArray(v) ? v : []).slice(0, n);
      const clean = { name: str(a.name, 60), updated: Date.now(),
        students: arr(a.students, 2000).map(x => ({ id: str(x.id, 24), name: str(x.name, 60), sport: str(x.sport, 30), dob: str(x.dob, 10), batch: str(x.batch, 24), coach: str(x.coach, 60), coachId: str(x.coachId, 24), fee: Math.max(0, +x.fee || 0), level: str(x.level, 20), parent: str(x.parent, 60), phone: str(x.phone, 20), paid: x.paid && typeof x.paid === 'object' ? Object.fromEntries(Object.entries(x.paid).slice(-36).map(([k, v]) => [str(k, 7), typeof v === 'number' ? v : (v ? 1 : 0)])) : {}, att: x.att && typeof x.att === 'object' ? Object.fromEntries(Object.entries(x.att).slice(-400).map(([k, v]) => [str(k, 10), v ? 1 : 0])) : {} })),
        batches: arr(a.batches, 200).map(x => ({ id: str(x.id, 24), name: str(x.name, 60), days: arr(x.days, 7).map(d => str(d, 3)), time: str(x.time, 30) })),
        coaches: arr(a.coaches, 100).map(x => ({ id: str(x.id, 24), name: str(x.name, 60) })) };
      bag[phone] = clean; saveDb(); return out(200, { ok: true, students: clean.students.length });
    }
    return out(405, { ok: false, error: 'Method not allowed' });
  }
  if (path.startsWith('/api/gbook/')) {   // online ground booking: customers request, the ground's owner accepts. Prices and clashes are decided here, never by the client.
    const [, , , gid, bid] = path.split('/'), tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), phone = readSession(tok), u = phone && db.users[phone];
    const gr = (db.shared.grounds || {})[gid], g = gr && gr.data && gr.data.g;
    if (!g) return out(404, { ok: false, error: 'Ground not found' });
    const bag = (db.gb = db.gb || {}), L = (bag[gid] = bag[gid] || {}), isOwner = !!phone && (gr.owner === phone || (u && u.role === 'admin'));
    const mins = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '')); return m ? +m[1] * 60 + +m[2] : NaN; };
    const slotMin = [30, 60, 90, 120].includes(+g.slotMin) ? +g.slotMin : 60, rt = g.rates || {}, base = +rt.base || +g.rate || 0, peak = +rt.peak || base, wk = +rt.wkend || base, pf = +g.peakFrom || 17;
    const price = (date, s, d) => { const we = [0, 6].includes(new Date(date + 'T12:00:00Z').getUTCDay()); let tot = 0; for (let m = s; m < s + d; m += slotMin) tot += (we ? wk : (m / 60 >= pf ? peak : base)) * Math.min(slotMin, s + d - m) / 60; return Math.round(tot); };
    const clash = (date, s, e, skip) => Object.values(L).find(b => b.id !== skip && b.date === date && b.status !== 'cancelled' && s < b.start + b.dur && e > b.start);
    const pub = b => ({ id: b.id, date: b.date, start: b.start, dur: b.dur, status: b.status });
    const full = b => ({ id: b.id, date: b.date, start: b.start, dur: b.dur, status: b.status, who: b.who, phone: b.phone, note: b.note, amt: b.amt, paid: b.paid, created: b.created, mine: b.owner === phone });
    if (req.method === 'GET' && !bid) {
      const q = new URL(req.url, 'http://x').searchParams;
      if (q.get('busy')) return out(200, { ok: true, busy: Object.values(L).filter(b => b.status !== 'cancelled' && (!q.get('date') || b.date === q.get('date'))).map(pub) });
      if (!u) return out(401, { ok: false, error: 'Please sign in again' });
      return out(200, { ok: true, owner: isOwner, items: Object.values(L).filter(b => isOwner || b.owner === phone).sort((a, b) => b.created - a.created).slice(0, 300).map(full) });
    }
    if (!u) return out(401, { ok: false, error: 'Please sign in again' });
    if (limited('gb:' + phone, 60, 36e5)) return out(429, { ok: false, error: 'Too many requests, slow down' });
    let raw = ''; for await (const c of req) { raw += c; if (raw.length > 4000) return out(413, { ok: false, error: 'Too large' }); }
    let b = {}; if (raw) { try { b = JSON.parse(raw); } catch { return out(400, { ok: false, error: 'Bad body' }); } }
    if (req.method === 'POST' && !bid) {
      const date = String(b.date || ''), s = mins(b.start), d = Math.floor(+b.dur), today = new Date().toISOString().slice(0, 10), str = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) return out(400, { ok: false, error: 'Pick a valid future date' });
      if (!(s >= 0) || !(d >= slotMin) || d > 720 || d % slotMin) return out(400, { ok: false, error: 'Pick a valid start time and duration' });
      if (g.on === false) return out(409, { ok: false, error: 'This ground is not taking bookings' });
      if ((g.blackout || []).includes(date)) return out(409, { ok: false, error: 'Ground is closed on this date' });
      if (s < mins(g.open || '06:00') || s + d > mins(g.close || '22:00')) return out(409, { ok: false, error: 'Outside opening hours' });
      if (clash(date, s, s + d)) return out(409, { ok: false, error: 'That time is already booked' });
      const who = str(b.who, 60), ph = str(b.phone, 20); if (!who || !/^[+\d][\d\s-]{6,17}$/.test(ph)) return out(400, { ok: false, error: 'Enter your name and a valid mobile number' });
      const id = crypto.randomBytes(5).toString('hex'), now = Date.now(), status = isOwner ? 'confirmed' : 'requested';
      L[id] = { id, owner: phone, date, start: s, dur: d, who, phone: ph, note: str(b.note, 100), amt: price(date, s, d), paid: 0, status, created: now };
      saveDb(); return out(200, { ok: true, booking: full(L[id]) });
    }
    const cur = L[bid]; if (!cur) return out(404, { ok: false, error: 'Booking not found' });
    if (req.method === 'PUT') {
      const st = String(b.status || '');
      if (st === 'cancelled') { if (!isOwner && cur.owner !== phone) return out(403, { ok: false, error: 'Not allowed' }); cur.status = 'cancelled'; }
      else if (['confirmed', 'completed'].includes(st)) { if (!isOwner) return out(403, { ok: false, error: 'Only the ground owner can do this' }); if (cur.status === 'cancelled') return out(409, { ok: false, error: 'Booking was cancelled' }); if (st === 'confirmed' && clash(cur.date, cur.start, cur.start + cur.dur, cur.id)) return out(409, { ok: false, error: 'That time is already booked' }); cur.status = st; }
      else if (b.paid != null) { if (!isOwner) return out(403, { ok: false, error: 'Only the ground owner can record payments' }); const p = Math.floor(+b.paid); if (!(p >= 0) || p > cur.amt) return out(400, { ok: false, error: 'Amount is more than the total' }); cur.paid = p; }
      else return out(400, { ok: false, error: 'Nothing to change' });
      cur.updated = Date.now(); saveDb(); return out(200, { ok: true, booking: full(cur) });
    }
    return out(405, { ok: false, error: 'Method not allowed' });
  }
  if (path.startsWith('/api/shared/')) {   // shared public data: matches, tournaments, auctions (anyone reads, the owner writes)
    const [, , , col, id] = path.split('/'), COLS = ['matches', 'sports', 'tours', 'auc', 'grounds', 'market', 'teams', 'players'];
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
    if (req.method === 'DELETE') { delete bag[id]; saveDb(); sseSend({ col, id, gone: 1 }); return out(200, { ok: true }); }
    if (req.method !== 'PUT') return out(405, { ok: false, error: 'Method not allowed' });
    let raw = ''; for await (const c of req) { raw += c; if (raw.length > 400000) return out(413, { ok: false, error: 'Too large' }); }
    let b; try { b = JSON.parse(raw); } catch { return out(400, { ok: false, error: 'Bad body' }); }
    if (col === 'players') {   // public player card: the player's own account or an admin shares a small summary so a ?player= link opens on any phone; no phone, email or date of birth
      const c = b.data && b.data.c, str = (v, n) => v == null || (typeof v === 'string' && v.length <= n), num = v => v == null || (Number.isFinite(v) && v >= 0 && v < 1e6);
      if (!c || c.id !== id || typeof c.name !== 'string' || !c.name.trim() || !str(c.name, 60) || !str(c.role, 20) || !str(c.team, 60) || !str(c.city, 60) || !str(c.shid, 16) || !str(c.bat, 40) || !str(c.bowl, 40) || !num(c.m) || !num(c.r) || !num(c.w) || !num(c.hs) || !num(c.f50) || !num(c.f100)) return out(400, { ok: false, error: 'Invalid player card' });
      b.data = { c: { id, name: c.name.trim(), role: c.role || '', team: c.team || '', city: c.city || '', shid: c.shid || '', bat: c.bat || '', bowl: c.bowl || '', m: c.m || 0, r: c.r || 0, w: c.w || 0, hs: c.hs || 0, f50: c.f50 || 0, f100: c.f100 || 0, at: Date.now() } };
    }
    if (col === 'sports') {
      const m = b.data && b.data.m;
      if (!m || m.id !== id || !['football','kabaddi','bd','bd15','vb','vbb'].includes(m.sport) ||
          !Array.isArray(m.tn) || m.tn.length !== 2 || m.tn.some(n => typeof n !== 'string' || !n.trim() || n.length > 100) ||
          (m.ev != null && !Array.isArray(m.ev)) || (m.log != null && !Array.isArray(m.log))) {
        return out(400, { ok: false, error: 'Invalid sport match' });
      }
      delete m.rm; delete m._sh;
    }
    if (col === 'market') {   // marketplace listing: owner publishes, anyone reads; only an admin can mark a shop/brand listing verified
      const x = b.data && b.data.x, str = (v, n) => typeof v === 'string' && v.trim() && v.length <= n;
      if (!x || x.id !== id || !str(x.title, 120) || (x.desc != null && String(x.desc).length > 600) || (x.price != null && String(x.price).length > 14) ||
          (x.img != null && (typeof x.img !== 'string' || x.img.length > 300000)) || (x.phone != null && String(x.phone).length > 20) || (x.status != null && !['open', 'active', 'sold', 'removed'].includes(x.status))) {
        return out(400, { ok: false, error: 'Invalid listing' });
      }
      delete x.rm; delete x._sh; delete x._pv;
      const was = cur && cur.data && cur.data.x && cur.data.x.verified;
      if (u.role !== 'admin') { if (x.kind && !['used', 'rent', 'rfq'].includes(x.kind)) x.verified = was === true ? true : false; else delete x.verified; }
    }
    if (col === 'teams') {   // public team card: name, code, colour, level. No squad, no phone numbers.
      const t = b.data && b.data.t, str = (v, n) => typeof v === 'string' && v.trim() && v.length <= n;
      if (!t || t.id !== id || !str(t.name, 80) || !str(t.short, 6) || (t.color != null && !/^#[0-9a-f]{6}$/i.test(t.color))) return out(400, { ok: false, error: 'Invalid team' });
      b.data = { t: { id: t.id, name: t.name.trim(), short: t.short.trim(), color: t.color || '#2563eb', level: String(t.level || '').slice(0, 20), state: String(t.state || '').slice(0, 60), country: String(t.country || '').slice(0, 60) } };
    }
    if (limited('shw:' + phone, 600, 36e5)) return out(429, { ok: false, error: 'Too many saves, slow down' });
    bag[id] = { id, owner: cur ? cur.owner : phone, ownerName: u.nick || u.name || '', updated: Date.now(), data: b.data };
    saveDb(); sseSend({ col, id, updated: bag[id].updated }); return out(200, { ok: true, updated: bag[id].updated });
  }
  if (path.startsWith('/api/teamreq/')) {   // join requests: a signed-in person asks to join a published team; only the team owner (or an admin) reads and answers them
    const [, , , tid, rid] = path.split('/');
    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), phone = readSession(tok), u = phone && db.users[phone];
    if (!u) return out(401, { ok: false, error: 'Please sign in first' });
    if (!tid || !/^[\w-]{3,40}$/.test(tid)) return out(400, { ok: false, error: 'Bad team' });
    const tm = db.shared.teams && db.shared.teams[tid];
    if (!tm) return out(404, { ok: false, error: 'This team is not published yet' });
    const bag = (db.teamreq = db.teamreq || {}), list = (bag[tid] = bag[tid] || []), isOwn = tm.owner === phone || u.role === 'admin';
    if (req.method === 'GET') return out(200, isOwn ? { ok: true, owner: true, items: list.map(r => ({ id: r.id, name: r.name, phone: r.phone, msg: r.msg, at: r.at, status: r.status })) } : { ok: true, owner: false, mine: list.filter(r => r.by === phone).map(r => ({ id: r.id, status: r.status, at: r.at })) });
    let raw = ''; for await (const c of req) { raw += c; if (raw.length > 4000) return out(413, { ok: false, error: 'Too large' }); }
    let b; try { b = raw ? JSON.parse(raw) : {}; } catch { return out(400, { ok: false, error: 'Bad body' }); }
    if (limited('treq:' + phone, 30, 36e5)) return out(429, { ok: false, error: 'Too many requests, slow down' });
    if (req.method === 'POST' && !rid) {
      if (list.some(r => r.by === phone && r.status === 'pending')) return out(409, { ok: false, error: 'You already sent a request to this team' });
      const str = (v, n) => String(v == null ? '' : v).trim().slice(0, n), name = str(b.name || u.nick || u.name, 60);
      if (!name) return out(400, { ok: false, error: 'Name is required' });
      const r = { id: crypto.randomBytes(6).toString('hex'), by: phone, name, phone: str(b.phone, 20), msg: str(b.msg, 140), at: Date.now(), status: 'pending' };
      list.push(r); if (list.length > 300) list.shift(); saveDb(); return out(200, { ok: true, id: r.id });
    }
    if (req.method === 'PUT' && rid) {
      if (!isOwn) return out(403, { ok: false, error: 'Only the team owner can answer requests' });
      const r = list.find(x => x.id === rid); if (!r) return out(404, { ok: false, error: 'Request not found' });
      if (!['accepted', 'declined'].includes(b.status)) return out(400, { ok: false, error: 'Bad status' });
      r.status = b.status; r.answered = Date.now(); saveDb(); return out(200, { ok: true });
    }
    return out(405, { ok: false, error: 'Method not allowed' });
  }
  if (path === '/api/face' && req.method === 'GET') {   // player photos supplied by the data provider: downloaded once, kept on disk, served from here (provider hosts only)
    const ip0 = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (limited('face:' + ip0, 240, 6e4)) return out(429, { ok: false, error: 'Too many requests' });
    let u; try { u = new URL(new URL(req.url, 'http://x').searchParams.get('u') || ''); } catch { return out(400, { ok: false, error: 'Bad address' }); }
    const hostOk = new RegExp(E.FACE_HOSTS || '(^|\\.)(cricapi\\.com|cricketdata\\.org|sportmonks\\.com)$', 'i');
    if (!/^https?:$/.test(u.protocol) || !hostOk.test(u.hostname) || (u.protocol !== 'https:' && !E.FACE_HOSTS) || /placeholder|default|icon-?player|no.?[-_]?image|icon512|icon192|silhouette|blank/i.test(u.href)) return out(404, { ok: false, error: 'Not a provider photo' });
    const dir = path_.join(path_.dirname(DATA_FILE), 'faces'), key = crypto.createHash('sha1').update(u.href).digest('hex'), fp = path_.join(dir, key);
    const send = (buf, ct) => { res.writeHead(200, { 'content-type': ct, 'cache-control': 'public, max-age=2592000', 'access-control-allow-origin': '*' }); res.end(buf); };
    try { const ct = fs.readFileSync(fp + '.ct', 'utf8'); return send(fs.readFileSync(fp), ct); } catch { /* not cached yet */ }
    try {
      const r = await fetch(u.href, { signal: AbortSignal.timeout(8000), redirect: 'error' });
      const ct = String(r.headers.get('content-type') || '').split(';')[0].trim();
      if (!r.ok || !/^image\/(jpeg|png|webp|gif)$/.test(ct)) return out(404, { ok: false, error: 'No photo' });
      const buf = Buffer.from(await r.arrayBuffer()); if (buf.length < 500 || buf.length > 2e6) return out(404, { ok: false, error: 'No photo' });
      try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(fp, buf); fs.writeFileSync(fp + '.ct', ct); } catch { /* serve anyway */ }
      return send(buf, ct);
    } catch { return out(404, { ok: false, error: 'No photo' }); }
  }
  if (path.startsWith('/api/wbb/')) {   // ball by ball for a world match, entered live by SH scorers (admin or scorer accounts); anyone can read
    const mid = decodeURIComponent(path.split('/')[3] || '');
    if (!/^[\w-]{3,60}$/.test(mid)) return out(400, { ok: false, error: 'Bad match' });
    const bag = (db.wbb = db.wbb || {}), list = (bag[mid] = bag[mid] || []);
    if (req.method === 'GET') { if (!list.length) delete bag[mid]; return out(200, { ok: true, balls: list, n: list.length }); }
    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), phone = readSession(tok), u = phone && db.users[phone];
    if (!u) return out(401, { ok: false, error: 'Please sign in first' });
    promote(u, phone);
    if (!['admin', 'scorer'].includes(u.role)) return out(403, { ok: false, error: 'Only an Admin or Scorer account can score a world match' });
    if (limited('wbb:' + phone, 600, 36e5)) return out(429, { ok: false, error: 'Too many balls, slow down' });
    let raw = ''; for await (const c of req) { raw += c; if (raw.length > 4000) return out(413, { ok: false, error: 'Too large' }); }
    let b; try { b = raw ? JSON.parse(raw) : {}; } catch { return out(400, { ok: false, error: 'Bad body' }); }
    if (req.method === 'DELETE' || b.undo) { const last = list[list.length - 1]; if (!last) return out(404, { ok: false, error: 'No ball to undo' }); list.pop(); saveDb(); return out(200, { ok: true, balls: list, n: list.length }); }
    const x = (b.ball && typeof b.ball === 'object') ? b.ball : b, str = (v, n) => String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, n);
    const runs = Math.round(+x.runs), bat = Math.round(+(x.bat ?? x.runs)), over = Math.round(+x.over), ball = Math.round(+x.ball), kind = ['legal', 'wd', 'nb'].includes(x.kind) ? x.kind : 'legal';
    if (!isFinite(runs) || runs < 0 || runs > 12 || !isFinite(bat) || bat < 0 || bat > 7 || !isFinite(over) || over < 0 || over > 999 || !isFinite(ball) || ball < 1 || ball > 6) return out(400, { ok: false, error: 'Bad ball' });
    if (list.length >= 4000) return out(409, { ok: false, error: 'Too many balls for one match' });
    const rec = { n: list.length + 1, inning: str(x.inning, 80), over, ball, runs, bat, kind, wicket: !!x.wicket, out: str(x.out, 60), batsman: str(x.batsman, 60), ns: str(x.ns, 60), ex: ['b', 'lb'].includes(x.ex) ? x.ex : '', bowler: str(x.bowler, 60), at: Date.now(), by: u.name || phone.slice(-4) };
    if (x.ang && isFinite(+x.ang.a) && isFinite(+x.ang.d) && Math.abs(+x.ang.a) <= 7 && +x.ang.d >= 0 && +x.ang.d <= 1.1) rec.ang = { a: +(+x.ang.a).toFixed(3), d: +(+x.ang.d).toFixed(2) };
    if (['Drive','Cut','Pull','Sweep','Flick','Defence','Glance','Hook','Upper cut','Other'].includes(x.shot)) rec.shot = x.shot;
    list.push(rec); saveDb();
    return out(200, { ok: true, balls: list, n: list.length });
  }
  if (path.startsWith('/api/offers/')) {   // marketplace offers: a signed-in buyer offers on a published listing; only the seller (or an admin) reads all and answers
    const [, , , lid, oid] = path.split('/');
    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), phone = readSession(tok), u = phone && db.users[phone];
    if (!u) return out(401, { ok: false, error: 'Please sign in first' });
    if (!lid || !/^[\w-]{3,60}$/.test(lid)) return out(400, { ok: false, error: 'Bad listing' });
    const li = db.shared.market && db.shared.market[lid];
    if (!li) return out(404, { ok: false, error: 'This listing is not published yet' });
    const bag = (db.offers = db.offers || {}), list = (bag[lid] = bag[lid] || []), isOwn = li.owner === phone || u.role === 'admin';
    const view = (r, full) => ({ id: r.id, amt: r.amt, msg: r.msg, at: r.at, status: r.status, counter: r.counter, answered: r.answered, ...(full ? { by: r.name, phone: r.phone } : {}) });
    if (req.method === 'GET') return out(200, isOwn ? { ok: true, owner: true, items: list.map(r => view(r, true)) } : { ok: true, owner: false, mine: list.filter(r => r.by === phone).map(r => view(r, false)) });
    let raw = ''; for await (const c of req) { raw += c; if (raw.length > 4000) return out(413, { ok: false, error: 'Too large' }); }
    let b; try { b = raw ? JSON.parse(raw) : {}; } catch { return out(400, { ok: false, error: 'Bad body' }); }
    if (limited('offer:' + phone, 40, 36e5)) return out(429, { ok: false, error: 'Too many requests, slow down' });
    const str = (v, n) => String(v == null ? '' : v).trim().slice(0, n), num = v => String(v == null ? '' : v).replace(/[^\d.]/g, '').slice(0, 10);
    if (req.method === 'POST' && !oid) {
      if (li.owner === phone) return out(400, { ok: false, error: 'You cannot offer on your own listing' });
      if (list.filter(r => r.by === phone && r.status === 'pending').length >= 3) return out(409, { ok: false, error: 'You already have pending offers on this item' });
      const amt = num(b.amt); if (!amt || !(+amt > 0)) return out(400, { ok: false, error: 'Enter an amount' });
      const r = { id: crypto.randomBytes(6).toString('hex'), by: phone, name: str(b.name || u.nick || u.name, 60), phone: str(b.phone, 20), amt, msg: str(b.msg, 200), at: Date.now(), status: 'pending' };
      list.push(r); if (list.length > 200) list.shift(); saveDb(); return out(200, { ok: true, id: r.id });
    }
    if (req.method === 'PUT' && oid) {
      if (!isOwn) return out(403, { ok: false, error: 'Only the seller can answer offers' });
      const r = list.find(x => x.id === oid); if (!r) return out(404, { ok: false, error: 'Offer not found' });
      if (!['accepted', 'declined', 'countered'].includes(b.status)) return out(400, { ok: false, error: 'Bad status' });
      if (b.status === 'countered') { const c = num(b.counter); if (!c) return out(400, { ok: false, error: 'Enter your price' }); r.counter = c; }
      r.status = b.status; r.answered = Date.now(); saveDb(); return out(200, { ok: true });
    }
    return out(405, { ok: false, error: 'Method not allowed' });
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
    const socClean = s => { const o = {}; s = s && typeof s === 'object' ? s : {}; for (const k of ['ig', 'fb', 'x', 'yt', 'web']) { const v = String(s[k] == null ? '' : s[k]).trim().slice(0, 120); if (/^https:\/\/[^\s<>"']+$/i.test(v) || /^@?[\w.]{1,40}$/.test(v)) o[k] = v; } return o; };
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
      const form = { name: str(f.name, 60), dob: str(f.dob, 10), city: str(f.city, 60), role: str(f.role, 30), bat: str(f.bat, 30), bowl: str(f.bowl, 40), team: str(f.team, 60), link: str(f.link, 300), avail: str(f.avail, 120), prefCat: str(f.prefCat, 30), photo: str(f.photo, 200000), decl: !!f.decl, srcKind: str(f.srcKind, 30), srcNote: str(f.srcNote, 200), social: socClean(f.social), fgn: !!f.fgn };
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
  for await (const c of req) { raw += c; if (raw.length > (pth === '/api/paper' ? 300000 : pth === '/api/admin/home-config' ? 400000 : pth === '/api/grounds/photo' ? 330000 : pth === '/api/editorial' ? 120000 : 20000)) return out(413, { ok: false, error: 'Too large' }); }
  let body = {};
  try { body = raw ? (raw.trim().startsWith('{') ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw))) : {}; } catch { return out(400, { ok: false, error: 'Bad body' }); }
  if (req.method === 'GET') body = { ...Object.fromEntries(new URL(req.url, 'http://x').searchParams), ...body };
  else for (const [k, v] of new URL(req.url, 'http://x').searchParams) if (body[k] == null) body[k] = v;
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  try { const [code, obj] = await h(req, body, ip); out(code, obj); }
  catch (e) { console.error(e); out(500, { ok: false, error: 'Server error' }); }
}).listen(PORT, () => console.log(`Scoring Heroes API on :${PORT}  (SMS: ${SMS_PROVIDER}, live feed: ${SM ? 'sportmonks' : CRIC_KEY ? 'cricketdata' : 'off'})`));


