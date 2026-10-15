const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const h=fs.readFileSync(__dirname+'/../app-index.html','utf8');
for(const m of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
const a=h.indexOf('const CBP_AVATAR='),b=h.indexOf('\nfunction cbpSquads',a);
const sandbox={URL,SH_PH:/placeholder|default|icon512|icon192/,cbpBad:new Set(),location:{href:'https://example.test/'},esc:v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')};
vm.createContext(sandbox);vm.runInContext(h.slice(a,b)+';globalThis.img=cbpImg;',sandbox);
for(const u of ['',null,'https://h.cricapi.com/img/players/generic.png','https://example.test/logo.jpg','javascript:alert(1)','https://example.test/default-player.png']){
 const out=sandbox.img(u,'Test player');assert.match(out,/Scoring Heroes player avatar/);assert.match(out,/data:image\/svg\+xml/);
}
const real=sandbox.img('https://example.test/players/ravi.jpg','Ravi');assert.match(real,/src="https:\/\/example.test\/players\/ravi.jpg"/);assert.match(real,/this.onerror=null;this.src=CBP_AVATAR/);
const x=h.indexOf('function cbpInningsDetails'),y=h.indexOf('function cbpCard',x);vm.runInContext(h.slice(x,y)+';globalThis.details=cbpInningsDetails;',sandbox);
const supplied=sandbox.details({extras:{w:3,nb:0},fow:['1-23 (A, 3.2)']},{r:78,w:1,o:9.2});assert.match(supplied,/w: 3, nb: 0/);assert.match(supplied,/1-23/);assert.match(supplied,/78-1/);
assert.match(sandbox.details({},null),/Not supplied/);
assert.ok(!h.includes('dnb=team?(team.players'));
assert.ok(h.includes("wLoad('match_info',id)"));
console.log('PASS: all inline scripts compile; avatar rejects generic/logo URLs, preserves photo and handles errors; supplied extras/FOW/total render; squad not mistaken for XI; detailed info requested.');
