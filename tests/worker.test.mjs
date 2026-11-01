import assert from 'node:assert/strict';
import worker from '../worker.mjs';
const env={APP_TOKEN:'test-only-private-code',OPENAI_API_KEY:'test-only-api-key'};
const originalFetch=globalThis.fetch;let calls=[];let upstream;
globalThis.fetch=async(url,init)=>{calls.push({url,init});return upstream?upstream(url,init):Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({tasks:[{title:'Buy Ellie Monster',original:'buy Ellie Monster',tags:['Shopping','Ellie'],timing:'context',next:null,deadline:null,context:'Before seeing Ellie',duplicateId:'existing-1'}]})}]}]});};
const run=(path,body,options={})=>worker.fetch(new Request('https://test.example'+path,{method:options.method||'POST',headers:{Origin:options.origin||'https://nikki0radz.github.io',Authorization:'Bearer '+(options.code??env.APP_TOKEN),'Content-Type':'application/json'},...(options.method==='GET'?{}:{body:JSON.stringify(body||{})})}),options.env||env);
try{
 const health=await run('/health',null,{method:'GET'});assert.equal(health.status,200);assert.equal((await health.json()).stage,'ai-v1');
 assert.equal((await run('/api/connect',{}, {code:'wrong'})).status,401);assert.equal(calls.length,0);
 assert.equal((await run('/api/connect',{}, {env:{OPENAI_API_KEY:'x'}})).status,503);
 assert.equal((await run('/api/connect',{}, {env:{APP_TOKEN:env.APP_TOKEN}})).status,503);
 assert.equal((await run('/api/connect',{}, {origin:'https://other.example'})).status,403);
 const connected=await run('/api/connect');assert.equal(connected.status,200);const connectedText=await connected.text();assert(!connectedText.includes(env.APP_TOKEN));assert(!connectedText.includes(env.OPENAI_API_KEY));assert.equal(calls.length,0);
 const result=await run('/api/interpret',{text:'buy Ellie Monster before seeing her',timezone:'Europe/London',existing:[{id:'existing-1',title:'Buy Monster for Ellie'}]});assert.equal(result.status,200);const tasks=(await result.json()).tasks;assert.deepEqual(tasks[0].tags,['Shopping','Ellie']);assert.equal(tasks[0].duplicateId,'existing-1');assert.equal(tasks[0].next,null);
 const request=JSON.parse(calls[0].init.body);assert.equal(request.store,false);assert.equal(request.text.format.strict,true);assert.equal(request.model,'gpt-4.1-mini');assert.equal(calls[0].init.headers.Authorization,'Bearer '+env.OPENAI_API_KEY);
 const before=calls.length;assert.equal((await run('/api/interpret',{text:'a'.repeat(4001)})).status,400);assert.equal((await run('/api/interpret',{text:'hello',timezone:'Wrong/Place'})).status,400);assert.equal(calls.length,before);
 assert.equal((await run('/api/interpret',{text:'a'.repeat(100001)})).status,413);
 upstream=()=>Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({tasks:[{title:'Call Ellie',original:'call Ellie tomorrow',tags:['Ellie'],timing:'spoken',next:new Date(Date.now()+86400000).toISOString(),deadline:null,context:null,duplicateId:'invented-id'}]})}]}]});
 const dateResult=await run('/api/interpret',{text:'call Ellie tomorrow'});assert.equal(dateResult.status,200);const task=(await dateResult.json()).tasks[0];assert(task.next>Date.now());assert.equal(task.duplicateId,null);
 upstream=()=>Response.json({output:[{content:[{type:'output_text',text:'not json'}]}]});assert.equal((await run('/api/interpret',{text:'hello'})).status,502);
 upstream=()=>new Response('invalid secret details',{status:401});const rejected=await run('/api/interpret',{text:'hello'});assert.equal(rejected.status,503);assert(!(await rejected.text()).includes('invalid secret'));
 upstream=()=>new Response('quota',{status:429});assert.equal((await run('/api/interpret',{text:'hello'})).status,429);
 upstream=()=>{throw Error('network')};assert.equal((await run('/api/interpret',{text:'hello'})).status,504);
 assert.equal((await run('/api/connect',null,{method:'GET'})).status,405);assert.equal((await run('/missing')).status,404);
 const form=new FormData();form.set('file',new Blob(['fake audio'],{type:'audio/webm'}),'thought.webm');upstream=(url,init)=>{assert(url.endsWith('audio/transcriptions'));assert.equal(init.body.get('model'),'gpt-transcribe');return Response.json({text:'Buy milk'});};
 const audio=await worker.fetch(new Request('https://test.example/api/transcribe',{method:'POST',headers:{Authorization:'Bearer '+env.APP_TOKEN},body:form}),env);assert.equal(audio.status,200);assert.equal((await audio.json()).text,'Buy milk');
 const preflight=await worker.fetch(new Request('https://test.example/api/interpret',{method:'OPTIONS',headers:{Origin:'https://nikki0radz.github.io'}}),env);assert.equal(preflight.status,204);assert(preflight.headers.get('Access-Control-Allow-Headers').includes('Authorization'));
 console.log('Worker auth, CORS, input limits, AI schema, dates, duplicates, errors, transcription and secret-isolation checks passed.');
}finally{globalThis.fetch=originalFetch;}
