import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Exercise the generated browser bundle's real JS with DOM/GPU calls stubbed.
// This verifies state and adapter wiring; it does not claim GPU visual validation.
function harness(){
 const elements=new Map(),created=[];
 const gl=new Proxy({FRAMEBUFFER_COMPLETE:1,checkFramebufferStatus:()=>1,getShaderParameter:()=>true,getProgramParameter:()=>true,getParameter:()=> 'stub WebGL2'}, {get:(o,k)=>k in o?o[k]:/^[A-Z_0-9]+$/.test(k)?0:()=>({})});
 const el=()=>({style:{},children:[],textContent:'',value:'RIGHT',clientWidth:640,clientHeight:425,classList:{add(){}},append(x){this.children.push(x)},appendChild(x){this.children.push(x)},setAttribute(){},replaceChildren(){this.children=[]},add(){},getContext:()=>gl});
 const get=s=>{if(!elements.has(s))elements.set(s,el());return elements.get(s)};let callback;
 const ctx={console,URLSearchParams,AbortSignal,location:{search:'?mid=test-match'},devicePixelRatio:1,requestAnimationFrame:f=>{callback=f},setTimeout:()=>0,setInterval:()=>0,clearInterval(){},Option:function(t,v){this.text=t;this.value=v},EventSource:class{close(){}},fetch:async()=>({ok:false,status:404}),document:{querySelector:get,querySelectorAll:()=>[],createElement:()=>{const x=el();created.push(x);return x},body:el(),head:el()},addEventListener(){}};
 ctx.window=ctx;ctx.speechSynthesis={cancel(){}};vm.createContext(ctx);
 const html=fs.readFileSync(new URL('../public/original-virtual-live.html',import.meta.url),'utf8');vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
 return {ctx,get,created,run:s=>vm.runInContext(s,ctx),frame:ms=>callback(ms)};
}
test('combined bundle connects, updates idle roles, plays a real event and resyncs undo',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));
 const context={bpo:5,title:'Actual A vs B',roster:[{id:'p1',name:'First'},{id:'p2',name:'Second'},{id:'b1',name:'Bowler',team:'field'},{id:'f1',name:'Keeper',team:'field'}],fieldingXI:['b1','f1'],keeper:'f1',currentPlayers:null};
 h.ctx.SHCricket.syncBaseline({runs:4,wickets:0,legalBalls:5},context);assert.equal(h.get('#overs').textContent,'1.0 overs');assert.equal(h.ctx.SHCricket.getState().active,null);
 context.currentPlayers={striker:'p1',nonStriker:'p2',bowler:'b1'};h.ctx.SHLiveFeed.cursor.viewer.applyContext(context);assert.equal(h.get('#batterName').textContent,'First');assert.equal(h.created.find(e=>e.className==='feedMask').style.display,'none');
 h.ctx.SHCricket.pushBall({eventId:'test-match-b1',players:context.currentPlayers,batRuns:0,wicketType:'RUN_OUT',dismissedPlayer:'p2',commentary:'Second run out',score:{runs:4,wickets:1,legalBalls:6}});
 h.ctx.SHCricket.seek(.2);assert.equal(h.ctx.SHCricket.getState().camera.shot,'BOWLER CLOSE-UP');
 h.ctx.SHCricket.seek(1.5);assert.equal(h.ctx.SHCricket.getState().camera.shot,'BOWLING END');
 h.ctx.SHCricket.seek(2.6);assert.equal(h.ctx.SHCricket.getState().camera.shot,'BATTING CONTACT');
 h.ctx.SHCricket.setView('wide');h.ctx.SHCricket.seek(3.5);assert.equal(h.ctx.SHCricket.getState().camera.shot,'STADIUM');
 h.ctx.SHCricket.setView('auto');assert.equal(h.ctx.SHCricket.getState().camera.shot,'BALL FOLLOW');
 h.ctx.SHCricket.seek(9);assert.equal(h.ctx.SHCricket.getState().active.players.nonStriker,'p2');assert.equal(h.get('#score').textContent,'4 / 1');
 assert.equal(h.run("active.e.dismissedPlayer===active.e.players.nonStriker"),true);
 h.ctx.SHCricket.syncBaseline({runs:4,wickets:0,legalBalls:5},context);assert.equal(h.ctx.SHCricket.getState().active,null);assert.equal(h.ctx.SHCricket.getState().queued,0);assert.equal(h.get('#score').textContent,'4 / 0');
});

test('match intro and published XI cards cannot delay or duplicate a live ball',async()=>{
 const h=harness();await new Promise(r=>setImmediate(r));
 const context={matchId:'test-match',inning:1,bpo:6,title:'A vs B',roster:[{id:'p1',name:'Captain A',team:'bat'},{id:'p2',name:'Batter'},{id:'b1',name:'Captain B',team:'field',bowlingStyle:'Right arm fast'},{id:'f1',name:'Keeper',team:'field'}],fieldingXI:['b1','f1'],keeper:'f1',currentPlayers:{striker:'p1',nonStriker:'p2',bowler:'b1'},teams:[{id:'a',name:'A',xi:['p1','p2'],captain:'p1'},{id:'b',name:'B',xi:['b1','f1'],captain:'b1'}],toss:{winner:'b',decision:'bowl'}};
 h.ctx.SHCricket.syncBaseline({runs:0,wickets:0,legalBalls:0},context);assert.equal(h.ctx.SHCricket.getState().presentation,'intro');assert.equal(h.ctx.SHCricket.getState().camera.shot,'CAPTAINS');
 h.run('renderTime=5;draw()');assert.equal(h.ctx.SHCricket.getState().camera.shot,'TEAM WALKOUT');
 h.ctx.SHCricket.showBowlingXI();const panel=h.get('#lineupPanel'),cards=panel.children.at(-1).children;assert.equal(cards.length,2);assert.match(cards[0].className,/selected/);assert.equal(cards[0].children[0].textContent,'Captain B');
 h.ctx.SHCricket.pushBall({eventId:'intro-ball-1',players:context.currentPlayers,batRuns:4,boundary:'FOUR',shotRegion:'COVER',score:{runs:4,wickets:0,legalBalls:1}});assert.equal(h.ctx.SHCricket.getState().presentation,null);assert.equal(panel.style.display,'none');assert.equal(h.ctx.SHCricket.getState().active.eventId,'intro-ball-1');assert.equal(h.ctx.SHCricket.startPresentation().accepted,false);
 h.ctx.SHCricket.seek(6);assert.equal(h.get('#score').textContent,'4 / 0');
 h.ctx.SHCricket.syncBaseline({runs:0,wickets:0,legalBalls:0},context);assert.equal(h.ctx.SHCricket.getState().presentation,null);assert.equal(h.ctx.SHCricket.getState().active,null);
});
