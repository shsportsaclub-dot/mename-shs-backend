// Tiny JSON store for users, subscriptions and owner. Writes are debounced and atomic.
import fs from 'node:fs';
import path from 'node:path';
export function store(file) {
  let data = { users: {}, subs: {}, owner: null };
  try { data = { ...data, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch {}
  let timer = null;
  const flush = () => {
    timer = null;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file + '.tmp', JSON.stringify(data));
      fs.renameSync(file + '.tmp', file);
    } catch (e) { console.error('store write failed', e.message); }
  };
  const save = () => { if (!timer) timer = setTimeout(flush, 300); };
  return { data, save, flush };
}
