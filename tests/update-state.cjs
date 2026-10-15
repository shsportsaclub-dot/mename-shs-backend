const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const h=fs.readFileSync(__dirname+'/../app-index.html','utf8');
for(const m of h.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi))new vm.Script(m[1]);
const a=h.indexOf('function cbpCard(W)'),b=h.indexOf('XV.wmatch=',a),ctx={};
vm.createContext(ctx);vm.runInContext(h.slice(a,b),ctx);
const result=ctx.cbpCard({m:{started:false,ended:false},err:'ERR Scorecard UUID not found'});
assert(result.includes('Match not started'));assert(!result.includes('UUID'));
console.log('PASS: scripts compile; upcoming match does not leak raw scorecard error');
