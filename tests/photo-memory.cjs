// A real photo seen once for a player is reused where the provider sent none.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:412,height:880}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}};
await p.goto('file://'+require('path').resolve(__dirname,'../app-index.html'));await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const none=cbpImg('', 'Jordan Cox');const a=/data:image\/svg/.test(none);
 cbpImg('https://img.example.com/players/jordan-cox.jpg','Jordan Cox');
 const after=cbpImg('', 'Jordan Cox'),other=cbpImg('', 'Sam Curran');
 UI.wp={id:'1',name:'Sam Curran',data:{playerImg:'https://img.example.com/p/sc.jpg',name:'Samuel Curran'}};try{XV.wplayer()}catch(e){}
 return {a,reuse:/jordan-cox\.jpg/.test(after),otherHelmet:/data:image\/svg/.test(other),prof:/sc\.jpg/.test(cbpImg('','Sam Curran')),prof2:/sc\.jpg/.test(cbpImg('','Samuel Curran')),stored:!!localStorage.getItem('sh_phc')}});
ok(r.a&&r.reuse&&r.otherHelmet===true&&r.prof&&r.prof2&&r.stored,JSON.stringify(r));
ok(!errs.length,errs.join(';'));await b.close();if(!process.exitCode)console.log('PASS: photo memory');})();
