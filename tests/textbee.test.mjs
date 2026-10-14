import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(process.env.TEST_SERVER_FILE || new URL('../server.js', import.meta.url), 'utf8');
const begin = source.indexOf('async function sendSms(');
const end = source.indexOf('\nfunction complete(', begin);
const factory = new Function('E', 'SMS_PROVIDER', 'COUNTRY', 'fetch', 'AbortSignal', source.slice(begin, end) + '\nreturn sendSms;');
const config = { TEXTBEE_API_KEY: 'test-private-key', TEXTBEE_DEVICE_ID: 'test-device' };
const call = (env, fetcher) => factory(env, 'textbee', '91', fetcher, AbortSignal)('9988402403', '123456', 'unused-link', '91');

test('TextBee uses HTTPS, explicit device, E.164, six-digit OTP, and queued status', async () => {
 const result = await call(config, async (url, options) => {
   assert.equal(url, 'https://api.textbee.dev/api/v1/gateway/send-sms');
   assert.equal(options.headers['x-api-key'], config.TEXTBEE_API_KEY);
   const body = JSON.parse(options.body);
   assert.deepEqual(body.recipients, ['+919988402403']);
   assert.equal(body.deviceId, 'test-device');
   assert.match(body.message, /OTP is 123456/);
   assert.ok(!body.message.includes('test-private-key'));
   return {ok:true,status:200,json:async()=>({data:{success:true,smsBatchId:'batch-1'}})};
 });
 assert.deepEqual(result,{deliveryStatus:'queued',smsBatchId:'batch-1',provider:'textbee'});
});
test('Missing key/device never calls provider', async () => {
 for (const env of [{}, {TEXTBEE_API_KEY:'key'}]) {
   await assert.rejects(call(env, async()=>{throw new Error('must not call');}), e=>e.statusCode===503);
 }
});
test('Quota is reported without automatic resend', async () => {
 let calls=0;
 await assert.rejects(call(config,async()=>{calls++;return {ok:false,status:429,json:async()=>({})};}),e=>e.statusCode===429);
 assert.equal(calls,1);
});
test('Invalid key/offline/rejected requests do not report success',async()=>{
 for(const status of [400,401,404,500]) await assert.rejects(call(config,async()=>({ok:false,status,json:async()=>({})})),e=>e.statusCode===502);
});
test('Malformed success without batch acknowledgement is rejected',async()=>{
 for(const data of [{}, {data:{success:false}}, {data:{success:true}}]) await assert.rejects(call(config,async()=>({ok:true,status:200,json:async()=>data})),e=>e.statusCode===502);
});
test('Network errors do not expose credentials',async()=>{
 await assert.rejects(call(config,async()=>{throw new Error('private upstream error');}),e=>e.statusCode===502&&!e.message.includes('private'));
});
test('Optional SIM selection is validated',async()=>{
 await call({...config,TEXTBEE_SIM_SUBSCRIPTION_ID:'2'},async(url,o)=>{assert.equal(JSON.parse(o.body).simSubscriptionId,2);return {ok:true,status:200,json:async()=>({data:{success:true,smsBatchId:'b'}})};});
 await assert.rejects(call({...config,TEXTBEE_SIM_SUBSCRIPTION_ID:'invalid'},async()=>{throw new Error('must not call');}),e=>e.statusCode===503);
});
