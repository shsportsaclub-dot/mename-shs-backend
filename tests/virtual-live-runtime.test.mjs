import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Exercise the generated browser bundle's real JS with DOM/GPU calls stubbed.
// This verifies state and adapter wiring; it does not claim GPU visual validation.
function harness(){
 const elements=new Map(),created=[];
 const gl=new Proxy({FRAMEBUFFER_COMPLETE:1,checkFramebufferStatus:()=>1,getShaderParameter:()=>true,getProgramParameter:()=>true,getParameter:()=> 'stub WebGL2'}, {get:(o,k)=>k in o?o[k]:/^[A-Z_0-9]+$/.test(k)?0:()=>({})});
 const el=()=>({style:{},children:[],textContent:'',value:'RIGHT',clientWidth:640,clientHeight:425,classList:{add(){}},append(x){this.children.push(x)},appendChild(x){this.children.push(x)},setAttribute(){},addEventListener(){},replaceChildren(){this.children=[]},add(){},getContext:()=>gl});
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

test('original avatar rigs draw every action with finite instance transforms',()=>{
 const h=harness();
 for(const mode of ['idle','walk','run','bowl','shot','catch','field','out'])for(const t of [0,.3,.7,1.6,2,3])for(const hand of ['RIGHT','LEFT']){
  h.run(`for(const m of Object.values(meshes))m.list=[];posePlayer(registry.get('hema'),[0,0,0],.7,${JSON.stringify(mode)},${t},${JSON.stringify(hand)},true);`);
  assert.equal(h.run('Object.values(meshes).every(m=>m.list.every(Number.isFinite))'),true,mode+' '+t);
 }
 assert.ok(h.run("meshes.head0.count>1000&&meshes.jersey.count>1000"));
});

test('source body pose changes the mapped rig without changing score; baseline and invalid pose release it',()=>{
 const h=harness();const p=Array.from({length:33},()=>({x:0,y:0,z:0,visibility:1}));for(const [i,xyz]of Object.entries({11:[.2,-.5,0],12:[-.2,-.5,0],13:[.5,-.5,0],14:[-.5,-.5,0],15:[.8,-.5,0],16:[-.8,-.5,0],23:[.1,0,0],24:[-.1,0,0],25:[.1,.4,0],26:[-.1,.4,0],27:[.1,.8,0],28:[-.1,.8,0]}))Object.assign(p[i],{x:xyz[0],y:xyz[1],z:xyz[2]});
 h.ctx.SHCricket.registerPlayer({id:'hema',height:1.85});const before=JSON.stringify(h.ctx.SHCricket.getState().score);assert.equal(h.ctx.SHCricket.applyTrackedPose('hema',p).accepted,true);assert.equal(h.ctx.SHCricket.getState().tracking.playerId,'hema');
 h.run("for(const m of Object.values(meshes))m.list=[];posePlayer(registry.get('hema'),[0,0,0],0,'idle',0,'RIGHT',false)");
 const observed=h.run('meshes.sphere.list.some((_,i,a)=>i%21===0&&Math.abs(a[i+12]-.865)<1e-5&&Math.abs(a[i+13]-1.43)<.005)');assert.equal(observed,true);
 h.ctx.SHCricket.setSourceCaption('FOUR! Hemanth through cover');assert.equal(h.get('#sourceCaptionText').textContent,'FOUR! Hemanth through cover');assert.equal(JSON.stringify(h.ctx.SHCricket.getState().score),before);assert.equal(h.ctx.SHCricket.getState().active,null);h.ctx.SHCricket.setView('auto');assert.equal(h.ctx.SHCricket.getState().camera.shot,'BATTER READY');h.ctx.SHCricket.setSourceCaption('');assert.notEqual(h.get('#commentary').textContent,'FOUR! Hemanth through cover');
 assert.equal(h.ctx.SHCricket.applyTrackedPose('hema',[]).accepted,false);assert.equal(h.ctx.SHCricket.getState().tracking,null);
 h.ctx.SHCricket.applyTrackedPose('hema',p);h.ctx.SHCricket.syncBaseline({runs:1,wickets:0,legalBalls:1},{bpo:6,roster:[],fieldingXI:[],currentPlayers:{striker:'hema',nonStriker:'runner',bowler:'ravi'},title:'test'});assert.equal(h.ctx.SHCricket.getState().tracking,null);
});

test('coordinated contact uses the rendered bat pose and recovery does not discard the follow-through',()=>{
 const h=harness();h.ctx.SHCricket.setManual(true);h.ctx.SHCricket.registerPlayer({id:'hema',height:1.85});
 const render=h.run("posePlayer(registry.get('hema'),[-10.06,0,0],Math.PI/2,'shot',.35,'RIGHT',true).batContact");const trajectory=h.run("batImpactPoint(registry.get('hema'),'RIGHT')");assert.ok(Math.hypot(...render.map((x,i)=>x-trajectory[i]))<1e-8);
 h.ctx.SHCricket.pushBall({eventId:'motion-1',players:{striker:'hema',nonStriker:'runner',bowler:'ravi'},batRuns:1});h.ctx.SHCricket.seek(3.25);assert.equal(h.ctx.SHCricket.getState().behavior.batterPhase,'FOLLOW-THROUGH');h.ctx.SHCricket.seek(3.8);assert.equal(h.ctx.SHCricket.getState().behavior.batterPhase,'RECOVERY');
});
test('unmatched generic poses cannot replace a confirmed cricket delivery and captions stay labelled separately',()=>{
 const h=harness();h.get('#commentary').textContent='Confirmed match commentary';h.ctx.SHCricket.setSourceCaption('Through cover — FOUR!');assert.equal(h.get('#commentary').textContent,'Confirmed match commentary');assert.equal(h.get('#sourceCaptionText').textContent,'Through cover — FOUR!');
 h.ctx.SHCricket.pushBall({eventId:'protect-motion',players:{striker:'hema',nonStriker:'runner',bowler:'ravi'},batRuns:0});assert.equal(h.ctx.SHCricket.applyTrackedPose('hema',[]).reason,'UNALIGNED_DELIVERY');h.ctx.SHCricket.seek(3);assert.notEqual(h.get('#commentary').textContent,'Through cover — FOUR!');
});
test('six-stage study reuses one delivery and cannot replace a connected scorer',()=>{const h=harness();for(let i=0;i<6;i++){assert.equal(h.ctx.SHCricket.previewBehavior(i).accepted,true);assert.equal(h.ctx.SHCricket.getState().study.index,i);assert.equal(h.ctx.SHCricket.getState().active.eventId,'behavior-study');}assert.equal(h.ctx.SHCricket.previewBehavior(10).accepted,false);h.ctx.SHCricket.applyContext({bpo:6,roster:[],fieldingXI:[],title:'Connected',currentPlayers:{striker:'hema',nonStriker:'runner',bowler:'ravi'}});assert.equal(h.ctx.SHCricket.previewBehavior(0).accepted,false);});

test('idle batters never inherit a delivery shot and reset clears source captions',()=>{const h=harness();const a=h.run("posePlayer(registry.get('hema'),[0,0,0],0,'idle',0,'RIGHT',true)");const b=h.run("posePlayer(registry.get('hema'),[0,0,0],0,'idle',2.7,'RIGHT',true)");assert.deepEqual(b.batContact,a.batContact);h.ctx.SHCricket.setSourceCaption('old caption');h.ctx.SHCricket.reset();assert.equal(h.get('#sourceCaptionBox').style.display,'none');});
test('bowler root stops during plant and running begins at actual striker stance',()=>{const h=harness();h.ctx.SHCricket.pushBall({eventId:'root-test',players:{striker:'hema',nonStriker:'runner',bowler:'ravi'},batRuns:1});h.run("var captured=[];var actualPosePlayer=posePlayer;posePlayer=function(p,pos,...args){captured.push({id:p.id,pos:pos.slice()});return actualPosePlayer(p,pos,...args)}");const root=(time,id)=>{h.run('captured=[]');h.ctx.SHCricket.seek(time);return h.run('captured').find(p=>p.id===id).pos;};assert.deepEqual(root(1.82,'ravi'),root(2,'ravi'));const a=root(4.15-1e-6,'hema'),b=root(4.15+1e-6,'hema');assert.ok(Math.hypot(...a.map((v,i)=>v-b[i]))<.001);});

test('unchanged idle geometry is reused rather than remeshed each frame',()=>{const h=harness();h.run("var remeshes=0;var deformOriginal=deformCricketTorso;deformCricketTorso=function(...a){remeshes++;return deformOriginal(...a)};posePlayer(registry.get('hema'),[0,0,0],0,'idle',0,'RIGHT',true);remeshes=0;posePlayer(registry.get('hema'),[1,0,0],.2,'idle',3,'RIGHT',true)");assert.equal(h.run('remeshes'),0);});
