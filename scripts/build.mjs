import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

// Plain JavaScript: validate server source and bundled browser code rather
// than introduce transpilation or change the files served in production.
const sources = fs.readdirSync('.').filter(f => /\.(mjs|cjs|js)$/.test(f));
for (const file of sources) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${file}: ${r.stderr}`);
}
const html = fs.readFileSync('app-index.html', 'utf8');
let scripts = 0;
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=|\btype\s*=\s*["'](?:module|application\/ld\+json)/i.test(m[1])) continue;
  new vm.Script(m[2], { filename: `app-index.html:inline-${++scripts}` });
}
JSON.parse(fs.readFileSync('public/manifest.webmanifest', 'utf8'));
for (const f of ['public/sw.js', 'public/icon-192.png', 'public/icon-512.png']) fs.accessSync(f);
console.log(`Build PASS: ${sources.length} server modules, ${scripts} browser scripts, PWA manifest and assets`);

// Reject empty or wrongly encoded deployed identity images.
for (const file of fs.readdirSync('public/emblems').filter(f => f.endsWith('.webp'))) {
 const data=fs.readFileSync('public/emblems/'+file);
 if(data.length<128 || data.toString('ascii',0,4)!=='RIFF' || data.toString('ascii',8,12)!=='WEBP')throw new Error('Invalid identity asset: '+file);
}
