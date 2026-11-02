import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {HybridPoseBuffer,parseCricketCaption,parseHybridVtt,hybridCaptionAt,retargetCricketPose} from '../scripts/original-cricket/hybrid.mjs';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function studio(){
 const els=new Map(),audioPlay=deferred(),frames=[],workers=[];let tick,now=0,speechStarts=0,stops=0;
 const element=()=>({textContent:'',value:'',checked:false,style:{},classList:{toggle(){},remove(){}},parentElement:{classList:{toggle(){},remove(){}}},append(){},addEventListener(type,cb){(this.listeners??={})[type]=cb;},removeAttribute(){},load(){},pause(){this.paused=true;},play(){this.paused=false;return Promise.resolve();},getContext:()=>({clearRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}}),readyState:2,currentTime:1,videoWidth:640,videoHeight:480,paused:false});
 const $=s=>{if(!els.has(s))els.set(s,element());return els.get(s);};$('#hybridRole').value='striker';$('#hybridOffset').value='0';
 let tracked=null,caption='';const sh={clearTracking(){tracked=null;},applyTrackedPose(id,p){tracked={id,p};return {accepted:true};},setSourceCaption(t){caption=t;return parseCricketCaption(t);},getRoles:()=>({striker:'p1',bowler:'b1'})};
 class Worker{constructor(){workers.push(this);}terminate(){}postMessage(m){frames.push(m);}}
 class Speech{start(){speechStarts++;}abort(){}}
 const media={getUserMedia:async()=>({getTracks:()=>[{stop(){stops++;}}]})};
 const ctx={$,console,HybridPoseBuffer,parseCricketCaption,parseHybridVtt,hybridCaptionAt,retargetCricketPose,HYBRID_TRACKER_WORKER:'',navigator:{mediaDevices:media},performance:{now:()=>now},location:{search:''},URLSearchParams,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Blob,Worker,SpeechRecognition:Speech,createImageBitmap:async()=>({close(){}}),document:{body:element(),createElement:tag=>tag==='audio'?{...element(),play:()=>audioPlay.promise}:element()},setTimeout:()=>0,clearTimeout(){},setInterval:f=>{tick=f;return 1;},clearInterval(){},addEventListener(){},SHCricket:sh};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../scripts/original-cricket/hybrid-studio.js',import.meta.url),'utf8'),ctx);
 return {$,ctx,audioPlay,frames,workers,tick:()=>tick(),advance:n=>now+=n,get tracked(){return tracked;},get caption(){return caption;},get speechStarts(){return speechStarts;},get stops(){return stops;},file:()=>$('#hybridFile').onchange({target:{files:[{}]}})};
}
test('stopping during pending microphone monitor playback cannot restart recognition',async()=>{const h=studio();h.$('#hybridMonitor').checked=true;const pending=h.$('#hybridMic').onclick();await new Promise(setImmediate);h.ctx.SHHybridStudio.stop();h.audioPlay.resolve();await pending;assert.equal(h.speechStarts,0);assert.equal(h.stops,1);});
test('pending captions cannot cross a source boundary or overwrite a newer caption file',async()=>{const h=studio();await h.file();const old=deferred(),pending=h.$('#hybridVtt').onchange({target:{files:[{size:100,text:()=>old.promise}]}});h.ctx.SHHybridStudio.stop();old.resolve('WEBVTT\n\n00:00.000 --> 00:02.000\nOLD');await pending;assert.equal(h.ctx.SHHybridStudio.getState().cues,0);
 await h.file();const first=deferred(),a=h.$('#hybridVtt').onchange({target:{files:[{size:100,text:()=>first.promise}]}});await h.$('#hybridVtt').onchange({target:{files:[{size:100,text:async()=> 'WEBVTT\n\n00:00.000 --> 00:02.000\nNEW'}]}});first.resolve('WEBVTT\n\n00:00.000 --> 00:02.000\nOLD');await a;h.tick();assert.equal(h.caption,'NEW');});
test('buffering source drops a pose even when its media clock is frozen and paused is false',async()=>{const h=studio();await h.file();await h.$('#hybridVideo').play();h.tick();await h.$('#hybridTrack').onclick();h.tick();const w=h.workers[0];w.onmessage({data:{type:'ready'}});await new Promise(setImmediate);const frame=h.frames.find(f=>f.type==='frame');assert.ok(frame);
 const world=Array.from({length:33},()=>({x:0,y:0,z:0,visibility:1}));for(const [i,p]of Object.entries({11:[.2,-.5,0],12:[-.2,-.5,0],13:[.5,-.5,0],14:[-.5,-.5,0],15:[.8,-.5,0],16:[-.8,-.5,0],23:[.1,0,0],24:[-.1,0,0]}))Object.assign(world[i],{x:p[0],y:p[1],z:p[2]});
 w.onmessage({data:{type:'pose',epoch:frame.epoch,time:1,world,landmarks:[]}});h.tick();assert.ok(h.tracked);h.advance(1000);h.tick();assert.equal(h.tracked,null);
});
