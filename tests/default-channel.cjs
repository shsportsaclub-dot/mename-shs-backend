const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{UI.stage='app';S.user={id:'u1',name:'Org',role:'admin',kind:'Scorer',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1};
 S.players=Array.from({length:22},(_,i)=>({id:'p'+i,name:'P'+i,role:'BAT'}));S.teams=[{id:'a',name:'Home',short:'HOM',players:S.players.slice(0,11).map(p=>p.id)},{id:'b',name:'Away',short:'AWY',players:S.players.slice(11).map(p=>p.id)}];
 S.matches=[];const m=newMatch({a:'a',b:'b',overs:20,toss:'a',dec:'bat',xiA:S.teams[0].players,xiB:S.teams[1].players});startInnings(m,0,'p0','p1','p12');m.status='live';S.streams={};UI.streams={};S.settings.channelUrl='';delete S.settings.chanTouched;render();
 const k='m'+m.id,h=streamCard(k,true);const out={def:S.settings.channelUrl,iframe:/<iframe src="https:\/\/www\.youtube\.com\/embed\/live_stream\?channel=UCEZj3e0XMZJmOQ7VteUM7Vg&autoplay=1/.test(h),link:h.includes('youtube.com/@SHSPORTSCLUB')};
 /* a match with its own stream keeps it */
 S.streams[k]='https://www.youtube.com/live/abcdefghijk';UI.streams=S.streams;out.own=/embed\/abcdefghijk/.test(streamCard(k,true));
 /* admin can remove the default and it stays removed */
 delete S.streams[k];UI.streams={};const fd=new FormData();fd.set('url','');F.channel(fd);render();out.removed=[S.settings.channelUrl,/live_stream/.test(streamCard(k,true))];return out});
console.log(JSON.stringify(r));
assert.equal(r.def,'https://www.youtube.com/embed/live_stream?channel=UCEZj3e0XMZJmOQ7VteUM7Vg');assert.ok(r.iframe&&r.link&&r.own);assert.deepEqual(r.removed,['',false]);
assert.deepEqual(errs,[]);console.log('PASS default channel');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
