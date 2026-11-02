import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Exercise the generated browser bundle's real JS with DOM/GPU calls stubbed.
// This verifies state and adapter wiring; it does not claim GPU visual validation.
function harness(){
 const elements=new Map(),created=[];
 const gl=new Proxy({FRAMEBUFFER_COMPLETE:1,checkFramebufferStatus:()=>1,getShaderParameter:()=>true,getProgramParameter:()=>true,getParameter:()=> 'stub WebGL2'}, {get:(o,k)=>k in o?o[k]:/^[A-Z_0-9]+$/.test(k)?0:()=>({})});
 const el=()=>({style:{},children:[],textContent:'',value:'RIGHT',clientWidth:640,clientHeight:425,classList:{add(){}},append(x){this.children.push(x)},appendChild(x){this.children.push(x)},setAttribute(){},add(){},getContext:()=>gl});
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
 h.ctx.SHCricket.seek(9);assert.equal(h.ctx.SHCricket.getState().active.players.nonStriker,'p2');assert.equal(h.get('#score').textContent,'4 / 1');
 assert.equal(h.run("active.e.dismissedPlayer===active.e.players.nonStriker"),true);
 h.ctx.SHCricket.syncBaseline({runs:4,wickets:0,legalBalls:5},context);assert.equal(h.ctx.SHCricket.getState().active,null);assert.equal(h.ctx.SHCricket.getState().queued,0);assert.equal(h.get('#score').textContent,'4 / 0');
});
