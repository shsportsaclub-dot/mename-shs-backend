// Two different teams of one country (e.g. Bangladesh vs Bangladesh A) must not share the same short code.
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(),errs=[],p=await b.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(500);
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exitCode=1}};
const r=await p.evaluate(()=>[shTeamCode('Bangladesh A','BAN'),shTeamCode('Bangladesh','BAN'),shTeamCode('India Women',''),shTeamCode('South Africa','SA'),shTeamCode('Pakistan U19','')]);
ok(r.join()==='BAN A,BAN,IND W,SA,PAK U19',r.join());ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: team code');})();
