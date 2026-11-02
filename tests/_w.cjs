const {chromium}=require('playwright');(async()=>{const b=await chromium.launch(),p=await b.newPage();console.log(await p.evaluate(()=>navigator.webdriver));await b.close()})()
