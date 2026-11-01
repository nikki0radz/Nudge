const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function storage(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
(async()=>{const sessionStorage=storage(),localStorage=storage();let status=200,seen;const context={window:{},sessionStorage,localStorage,FormData,AbortSignal,Error,fetch:async(url,init)=>{seen={url,init};return Response.json(status===200?{connected:true}:{error:'Incorrect access code'},{status});}};vm.runInNewContext(fs.readFileSync(require.resolve('../ai-client.js'),'utf8'),context);const ai=context.window.NudgeAI;
 await assert.rejects(ai.call('/api/interpret',{}),/Connect AI/);assert.equal(ai.token(),'');
 status=401;await assert.rejects(ai.connect('fake-test-code',true),/Incorrect/);assert.equal(ai.token(),'');assert.equal(localStorage.getItem('nudge-access-code'),null);
 status=200;await ai.connect('fake-test-code',false);assert.equal(ai.token(),'fake-test-code');assert.equal(localStorage.getItem('nudge-access-code'),null);assert.equal(seen.init.headers.Authorization,'Bearer fake-test-code');assert(seen.url.endsWith('/api/connect'));
 await ai.connect('another-fake-code',true);assert.equal(localStorage.getItem('nudge-access-code'),'another-fake-code');ai.disconnect();assert.equal(ai.token(),'');
 console.log('Client access-code verification, failed-login handling, opt-in persistence and disconnect checks passed.');
})().catch(e=>{console.error(e);process.exit(1)});
