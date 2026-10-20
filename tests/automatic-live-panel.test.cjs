const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('app-index.html','utf8');
const pulse=require('../pulse-model.cjs').createSHPulseModel();
const start=html.indexOf('function cx3Panel(W)'),end=html.indexOf('shCreaseCard=function(W)',start);
const ctx={esc:v=>String(v??'').replaceAll('<','&lt;'),shInningName:s=>String(s).replace(/ Inning.*/,''),lcNorm:s=>String(s||'').toLowerCase(),shAvailableBalls:W=>W.bb?.bbb||[],shPulseData:W=>pulse.deliveries(W.bb),shTeamMark:()=>'',lcBalls:(o,b)=>{const [n,p=0]=String(o).split('.');return +n*b+ +p}};
vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
const make=()=>({m:{id:'any-fixture',started:true,type:'t20',overs:20,teams:[{name:'Sydney Sixers Women',short:'SYS-W'},{name:'Melbourne Stars Women',short:'MLS-W'}],score:[{inning:'Sydney Sixers Women Inning 1',r:155,w:6,o:20},{inning:'Melbourne Stars Women Inning 2',r:151,w:3,o:19.1}]},sc:{scorecard:[]},bb:{bbb:[{inning:1,over:19,ball:6,runs:6},{inning:2,over:19,ball:1,runs:4}]}});
const panel=W=>ctx.cx3Panel(W);
test('any fixture renders score and 5 from 5 without requiring detailed scorecard',()=>{const h=panel(make());assert.match(h,/151-3/);assert.match(h,/need 5 runs in 5 balls/);assert.match(h,/7.88/);assert.match(h,/6.00/);assert.match(h,/cx3big f/);assert.match(h,/Target: <b>156/)});
test('revised target and reduced innings override original total and format default',()=>{const W=make();W.m.target=154;W.m.ov=19.5;const h=panel(W);assert.match(h,/Target: <b>154/);assert.match(h,/need 3 runs in 2 balls/)});
test('new innings does not replay last ball from first innings',()=>{const W=make();W.bb.bbb=W.bb.bbb.slice(0,1);const h=panel(W);assert.doesNotMatch(h,/class="cx3big|class="cx3o"/);assert.match(h,/151-3/)});
test('Tests never invent a 20-over limit or a second-innings chase',()=>{const W=make();W.m.type='test';W.m.overs=900;assert.doesNotMatch(panel(W),/Projected:|Target:|RRR:|need .*balls/)});
test('missing totals remain unknown rather than becoming zero',()=>{const h=panel({m:{},sc:{scorecard:[]}});assert.match(h,/—-—/);assert.doesNotMatch(h,/Projected:|0-0/)});
test('partial feed is not presented as a full partnership',()=>{assert.doesNotMatch(panel(make()),/P'ship:/)});
test('wide and no-ball are explicit and do not consume legal-ball placeholders',()=>{const W=make();W.bb.bbb.push({inning:2,over:19,ball:2,runs:1,wide:true},{inning:2,over:19,ball:2,runs:1,noball:true});const h=panel(W);assert.match(h,/1wd/);assert.match(h,/1nb/);assert.equal((h.match(/class="cx3b e"/g)||[]).length,5)});
test('completed result replaces chase equation and suppresses big ball',()=>{const W=make();W.m.ended=true;W.m.status='MLS-W won by 7 wickets';const h=panel(W);assert.match(h,/MLS-W won by 7 wickets/);assert.doesNotMatch(h,/need 5 runs|class="cx3big/)});
test('live panel precedes match summary in external and local match views',()=>{assert.match(html,/if\(tab==='live'\)body=shPulsePanel\(W\)\+sum/);assert.match(html,/live:\(\)=>shPulsePanel\(W\)\+shWorldSummary\(W\)/)});

test('canonical scorecard team wins over malformed comma-joined provider score label',()=>{const W=make();W.m.score[1].inning='Sydney Sixers Women,Melbourne Stars Women Inning 1';W.sc.scorecard=[{}, {inning:'Melbourne Stars Women Inning 1'}];assert.match(panel(W),/<b>MLS-W<\/b>/);assert.doesNotMatch(panel(W),/Sydney Sixers Women,Melbourne Stars Women/)});
