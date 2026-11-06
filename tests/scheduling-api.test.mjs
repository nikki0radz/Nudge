import test from 'node:test';import assert from 'node:assert/strict';import worker from '../worker.mjs';
const originalFetch=globalThis.fetch,originalNow=Date.now;
const now=Date.parse('2026-11-06T23:00:00Z');
test('both AI routes validate wrong Sundays and missed Christmas ranges after model output',async()=>{
 Date.now=()=>now;
 try{
  for(const path of ['/api/interpret','/api/assistant'])for(const [text,start,end] of [
   ['Could you remind me at some point next week to book a dentist appointment?','2026-11-09T00:00:00Z','2026-11-16T00:00:00Z'],
   ['Arrange waste collection service for Ellie around Christmas','2026-12-11T00:00:00Z','2026-12-25T00:00:00Z']])for(const type of ['spoken','automatic']){
   const task={title:text,original:text,tags:['Life admin'],timing:type,next:type==='spoken'?'2026-11-08T09:00:00Z':null,deadline:null,context:null,duplicateId:null,notBefore:null};
   globalThis.fetch=async()=>Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({tasks:[task],peopleUpdates:[],events:[],answer:'',matchedTaskIds:[],matchedEntryIds:[]})}]}]});
   const res=await worker.fetch(new Request('https://example.com'+path,{method:'POST',headers:{Authorization:'Bearer test-code','Content-Type':'application/json'},body:JSON.stringify({text,timezone:'Europe/London'})}),{APP_TOKEN:'test-code',OPENAI_API_KEY:'test-key'});
   assert.equal(res.status,200);const t=(await res.json()).tasks[0];assert(t.next>=Date.parse(start)&&t.next<Date.parse(end));assert.equal(t.deadline,null);assert(t.timingWindow);
  }
 }finally{globalThis.fetch=originalFetch;Date.now=originalNow;}
});
