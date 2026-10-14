import fs from 'node:fs';
const originalFetch=globalThis.fetch;
globalThis.fetch=async (url,options)=>{
 if(String(url)==='https://api.textbee.dev/api/v1/gateway/send-sms'){
  const body=JSON.parse(options.body);
  fs.appendFileSync(process.env.MOCK_SMS_FILE,JSON.stringify(body)+'\n');
  await new Promise(r=>setTimeout(r,30));
  return new Response(JSON.stringify({data:{success:true,smsBatchId:'batch-'+body.recipients[0]}}),{status:200,headers:{'content-type':'application/json'}});
 }
 return originalFetch(url,options);
};
