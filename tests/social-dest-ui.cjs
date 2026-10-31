const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.fulfill({contentType:'application/json',body:'{"ok":false}'}));
await p.goto('file://'+process.cwd()+'/app-index.html');await p.waitForTimeout(400);
await p.evaluate(()=>{UI.stage='app';S.user={name:'QA',role:'admin',phone:'+910000000000'};S.prefs={...S.prefs,asked:1,welcomed:1,avDone:1,avSkip:1,country:'IN'};UI.view='social';render()});
assert.equal(await p.locator('.sdpanel .sdb.add').count(),2,'two Add tiles');
await p.click('.sdb.add >> nth=0');
let names=await p.locator('.sdgrid .sdb span:last-child').allInnerTexts();
assert.ok(names.includes('ShareChat')&&names.includes('YouTube')&&!names.includes('Weibo'),'India list: '+names);
await p.selectOption('select[data-c=sdCty]','CN');names=await p.locator('.sdgrid .sdb span:last-child').allInnerTexts();assert.ok(names.includes('Weibo')&&!names.includes('ShareChat'),'China list');
await p.selectOption('select[data-c=sdCty]','IN');await p.click('.sdgrid .sdb:has-text("YouTube")');
await p.fill('form[data-f=sdsave] input[name=label]','SH Cricket Live');await p.fill('form[data-f=sdsave] input[name=key]','abcd-1234');await p.click('form[data-f=sdsave] button');
assert.equal(await p.evaluate(()=>S.settings.dest.length),1);assert.ok(!(await p.evaluate(()=>JSON.stringify(S))).includes('abcd-1234'),'key not in S');
assert.equal(await p.locator('.sdpanel .sdb:has-text("SH Cricket Live")').count(),1);
assert.equal(await p.locator('.sdpanel .sdb.add').count(),2);
/* broadcast dashboard */
await p.evaluate(()=>{UI.view='stream';render()});
await p.click('.bdt button:has-text("Go live")');assert.match(await p.locator('.bdcard').innerText(),/rtmp:\/\/a\.rtmp\.youtube\.com/);
await p.click('.bdt button:has-text("Animations")');await p.click('button[data-a=bdAnim][data-v=slide]');assert.equal(await p.evaluate(()=>S.stream.anim),'slide');
await p.evaluate(()=>{S.stream.tick={lines:'Drinks break\nSponsor: Acme',live:true,msg:true,speed:'f'};UI.ovScene='ticker';render()});
assert.match(await p.locator('.ovprev').innerHTML(),/Drinks break/);
/* language search */
await p.evaluate(()=>{UI.view='settings';render()});
await p.fill('.lp input[data-c=lpQ]','swah');assert.equal(await p.locator('.lp .lpb:visible').count(),1);
await p.click('.lp .lpb:visible');assert.equal(await p.evaluate(()=>S.prefs.lang),'sw');
await p.fill('.lp input[data-c=lpQ]','日本');assert.equal(await p.locator('.lp .lpb:visible').count(),1);
assert.deepEqual(errs,[]);console.log('PASS social dest, dashboard, language search');await b.close()})().catch(e=>{console.error(e);process.exit(1)})
