const __np=async(b,o)=>{const p=await b.newPage(o);await p.addInitScript(()=>{window.__legacyLive=1});return p};
const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const html=fs.readFileSync('app-index.html');const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html');res.end(html)});await new Promise(r=>server.listen(18958,'127.0.0.1',r));let browser;
 const ball=(inning,ball,runs)=>({inning,over:0,ball,runs,total_runs:runs,wicket:ball===2,commentary:`Fixture Bowler to Fixture Batter ${inning}, ${runs} runs${ball===2?', wicket':''}`});
 const bbb=[...Array.from({length:6},(_,i)=>ball(1,i+1,[4,1,0,0,2,3][i])),...Array.from({length:6},(_,i)=>ball(2,i+1,[1,0,0,4,0,1][i]))];
 const score=[{inning:'Australia Women Inning 1',r:10,w:1,o:1},{inning:'Bangladesh Women Inning 1',r:6,w:1,o:1}];
 const sc={score,matchEnded:false,status:'Synthetic live data fixture',scorecard:score.map(s=>({inning:s.inning,totals:{R:s.r,W:s.w,O:s.o},batting:[{batsman:{name:'Fixture Batter'},r:s.r,b:6,'4s':1,'6s':0}],bowling:[],partnerships:[{batsmen:['Fixture Batter A','Fixture Batter B'],runs:s.r,balls:6}]}))};
 const mi={score,matchStarted:true,matchEnded:false,bbbEnabled:false,status:'Synthetic live data fixture',venue:'Fixture Ground'};
 try{browser=await chromium.launch({headless:true});fs.mkdirSync('runtime-evidence',{recursive:true});const results=[],errors=[];
 for(const width of [320,412]){const p=await __np(browser,{viewport:{width,height:920}});p.on('pageerror',e=>errors.push(e.message));let details=0;
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin==='http://127.0.0.1:18958'&&u.pathname==='/')return r.continue();if(/\/cric$/.test(u.pathname)){details++;const ep=u.searchParams.get('ep');return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,data:ep==='match_bbb'?{bbb,source:'Synthetic fallback fixture'}:ep==='match_info'?mi:sc})})}return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,matches:[],items:[],data:[],version:'fixture'})})});
 await p.goto('http://127.0.0.1:18958/');await p.evaluate(({bbb,sc,mi,score})=>{UI.stage='app';UI.view='wmatch';S.user={nick:'Flow Test',name:'Flow Test',role:'viewer',kind:'Fan'};S.prefs={...S.prefs,asked:1,welcomed:1};UI.wm={tab:'cm',m:{id:'fixture',name:'Australia Women v Bangladesh Women',type:'odi',started:true,ended:false,status:'Synthetic fixture — not a live match',venue:'Fixture Ground',teams:[{name:'Australia Women',short:'AUSW'},{name:'Bangladesh Women',short:'BANW'}],score},mi,sc,bb:{bbb,source:'Synthetic fallback fixture'},bbErr:'old provider failure',sq:[],vs:{n:0}};render()},{bbb,sc,mi,score});
 assert.ok((await p.locator('main').innerText()).includes('Fixture Bowler to Fixture Batter'));assert.ok(!(await p.locator('main').innerText()).includes('Commentary unavailable'));
 await p.screenshot({path:`runtime-evidence/commentary-${width}.png`,fullPage:true});
 await p.evaluate(()=>{UI.wm.tab='gr';render()});assert.equal(await p.locator('svg[aria-label^="Cumulative recorded runs"]').count(),1);assert.ok(!(await p.locator('main').innerText()).toLowerCase().includes('partnership timeline'));
 assert.equal(await p.locator('svg[aria-label^="Cumulative recorded runs"] polyline').count(),2);assert.equal(await p.locator('svg[aria-label^="Cumulative recorded runs"] circle').count(),2);
 await p.screenshot({path:`runtime-evidence/graphs-${width}.png`,fullPage:true});
 await p.evaluate(()=>{UI.wm.tab='sc';render()});assert.ok((await p.locator('main').innerText()).toLowerCase().includes('partnerships'));assert.ok((await p.locator('main').innerText()).includes('Fixture Batter A'));
 const before=details;await p.evaluate(async()=>{UI.wm.tab='live';await shRefreshWorldDetails(UI.wm,true)});assert.equal(details-before,3);assert.ok((await p.locator('main').innerText()).toLowerCase().includes('ball-by-ball'));assert.ok((await p.locator('main').innerText()).includes('Fixture Bowler'));assert.equal(await p.locator('.sh-pulse-delivery').count(),12);
 const overflow=await p.locator('.lc-t,.sh-chart-row,.sh-over-row').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5||e.scrollWidth>e.clientWidth+1}).map(e=>e.className));assert.deepEqual(overflow,[]);
 await p.screenshot({path:`runtime-evidence/live-${width}.png`,fullPage:true});results.push({width,validFallbackShownDespiteFalseHint:true,inningsLines:2,wicketMarkers:2,partnershipsInScorecard:true,liveRefreshRequests:3,overflow});await p.close();
 }assert.deepEqual(errors,[]);fs.writeFileSync('runtime-evidence/delivery-flow.json',JSON.stringify({scope:'Actual renderer with synthetic fallback records and stub provider; no real match, OTP or provider calls',results,errors},null,2));console.log('PASS: fallback commentary, two innings/wicket graphs, partnerships in scorecard, live refresh, mobile containment');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});

