// Users, subscriptions and owner. Kept in a local JSON file and, when DATABASE_URL is set,
// in Neon too - Render's free disk is wiped on every deploy/restart, the database is not.
import fs from 'node:fs';
import path from 'node:path';
export function store(file, remote = null, log = () => {}) {
  const data = { users: {}, subs: {}, owner: null };
  const merge = obj => { if (obj && typeof obj === 'object') for (const k of ['users', 'subs', 'owner', 'channel']) if (obj[k] !== undefined) data[k] = obj[k]; };
  try { merge(JSON.parse(fs.readFileSync(file, 'utf8'))); } catch {}
  const info = { remote: !!remote, loaded: false, lastSave: null, lastError: null };
  let timer = null, saving = Promise.resolve();
  const writeFile = () => {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file + '.tmp', JSON.stringify(data));
      fs.renameSync(file + '.tmp', file);
    } catch (e) { log('store write failed', e.message); }
  };
  const writeRemote = () => {
    if (!remote || !info.loaded) return saving;      // never overwrite the database before we have read it
    const snapshot = JSON.stringify(data);
    saving = saving.then(() => remote.set('state', snapshot)).then(() => { info.lastSave = Date.now(); info.lastError = null; }).catch(e => { info.lastError = e.message; log('neon save failed', e.message); });
    return saving;
  };
  const flush = () => { timer = null; writeFile(); return writeRemote(); };
  const save = () => { if (!timer) timer = setTimeout(flush, 1500); };
  // Load the saved state from Neon before the bot starts answering.
  // Database copy wins for the owner; users and followers from both copies are kept.
  const mergeRemote = obj => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.owner) data.owner = obj.owner;
    if (obj.channel) data.channel = obj.channel;
    data.users = { ...(obj.users || {}), ...data.users };
    data.subs = { ...(obj.subs || {}), ...data.subs };
  };
  let retry = null;
  async function load() {
    if (!remote || info.loaded) return;
    try {
      const v = await remote.get('state');
      if (v) mergeRemote(JSON.parse(v));
      info.loaded = true; info.lastError = null;
      if (retry) { clearInterval(retry); retry = null; }
      writeFile(); writeRemote();
    } catch (e) {
      info.lastError = e.message; log('neon load failed', e.message);
      if (!retry) { retry = setInterval(() => load(), 60000); retry.unref?.(); }   // keep trying in the background
    }
  }
  const stop = () => { if (retry) clearInterval(retry); retry = null; };
  return { data, save, flush, load, info, stop };
}
