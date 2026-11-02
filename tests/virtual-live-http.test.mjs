import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {scorerSnapshot,FeedCursor} from '../virtual-live-feed.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
test('existing authenticated scorer save drives the public original viewer without a new write endpoint',{timeout:20000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sh-virtual-')),secret='virtual-test-secret',phone='test-owner',port=18984,base='http://127.0.0.1:'+port;
 fs.writeFileSync(path.join(dir,'db.json'),JSON.stringify({users:{[phone]:{name:'Test',role:'admin'}},shared:{}}));
 const env={...process.env,PORT:String(port),SESSION_SECRET:secret,DATA_FILE:path.join(dir,'db.json'),TRACKER:'0',TRACK_AUTO_MATCHES:'0',PAPER_AGENT:'0',RECENT_OPEN_DATA:'0',HISTORY_AUTOIMPORT:'0',HISTORY_DIR:path.join(dir,'history'),CRIC_API_KEY:'',SPORTMONKS_TOKEN:'',DATABASE_URL:''};
 const root=new URL('../',import.meta.url).pathname,child=spawn(process.execPath,[root+'server.js'],{cwd:dir,env,stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
 try{
  let ready=false;for(let i=0;i<150;i++){if(child.exitCode!==null)throw Error(logs);try{if((await fetch(base+'/health')).ok){ready=true;break;}}catch{}await pause(50);}assert.ok(ready,logs);
  const page=await fetch(base+'/virtual-live?mid=test-match');assert.equal(page.status,200);const html=await page.text();assert.match(html,/class LiveFeedConnection/);assert.match(html,/originalAssets:true/);assert.doesNotMatch(html,/<script[^>]+src=/i);
  const old=await fetch(base+'/?scene=ccast&mid=test-match',{redirect:'manual'});assert.equal(old.status,302);assert.equal(old.headers.get('location'),'/virtual-live?mid=test-match&embed=1');
  const data={m:{id:'test-match',a:'A',b:'B',cur:0,xi:{A:['p1','p2'],B:['b1','f1']},innings:[{bat:'A',bowl:'B',ev:[],cur:{s:'p1',n:'p2',bl:'b1'}}]},players:{p1:{name:'One'},p2:{name:'Two'},b1:{name:'Bowler'},f1:{name:'Keeper',role:'WK'}},teams:{A:{name:'A'},B:{name:'B'}}};
  const body=Buffer.from(JSON.stringify({p:phone,e:Date.now()+60000})).toString('base64url'),token=body+'.'+crypto.createHmac('sha256',secret).update(body).digest('base64url');
  const save=async(auth=true)=>fetch(base+'/api/shared/matches/test-match',{method:'PUT',headers:{'content-type':'application/json',...(auth?{authorization:'Bearer '+token}:{})},body:JSON.stringify({data})});
  assert.equal((await save(false)).status,401);assert.equal((await save()).status,200);
  const read=async()=>{const j=await(await fetch(base+'/api/shared/matches/test-match')).json();return scorerSnapshot(j.item.data,'test-match');};
  const v={balls:[],applyContext(){},syncBaseline(s){this.score=s},pushBall(e){this.balls.push(e)},showStatus(){}};const cursor=new FeedCursor('test-match',v);assert.equal(cursor.ingest(await read()).mode,'baseline');
  data.m.innings[0].ev.push({r:4,x:'',w:'',bt:'p1',bl:'b1',pre:{s:'p1',n:'p2',bl:'b1'},ang:{a:-Math.PI/4,d:1}});assert.equal((await save()).status,200);assert.equal(cursor.ingest(await read()).mode,'append');assert.equal(v.balls[0].players.striker,'p1');assert.equal(v.balls[0].score.runs,4);assert.equal(v.balls[0].shotRegion,'COVER');
  data.m.innings[0].ev=[];await save();assert.equal(cursor.ingest(await read()).mode,'resync');assert.equal(v.score.runs,0);
 }finally{if(child.exitCode===null){child.kill();await once(child,'exit');}fs.rmSync(dir,{recursive:true,force:true});}
});
