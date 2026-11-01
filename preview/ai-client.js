/* The OpenAI key lives only in Cloudflare. This client holds the user's app access code. */
window.NudgeAI=(()=>{
 const base='https://nudge-api.nikki0radz.workers.dev';
 const token=()=>{try{return sessionStorage.getItem('nudge-access-code')||localStorage.getItem('nudge-access-code')||'';}catch{return '';}};
 async function call(path,body,code=token()){
  if(!code)throw new Error('Connect AI in Settings with your private access code first.');
  const form=body instanceof FormData;let response;
  try{response=await fetch(base+path,{method:'POST',headers:{Authorization:'Bearer '+code,...(form?{}:{'Content-Type':'application/json'})},body:form?body:JSON.stringify(body||{}),signal:AbortSignal.timeout(75000)});}catch{throw new Error('Couldn’t reach Nudge’s AI. Your thought is kept; check your connection and retry.');}
  let data;try{data=await response.json();}catch{throw new Error('The backend is updating or unavailable. Please retry shortly.');}
  if(!response.ok)throw new Error(data.error||'The AI connection needs checking.');return data;
 }
 async function connect(code,remember){code=code.trim();if(!code)throw new Error('Enter your private access code.');await call('/api/connect',{},code);try{sessionStorage.setItem('nudge-access-code',code);if(remember)localStorage.setItem('nudge-access-code',code);else localStorage.removeItem('nudge-access-code');}catch{throw new Error('Browser storage is blocked, so your connection could not be saved.');}}
 function disconnect(){sessionStorage.removeItem('nudge-access-code');localStorage.removeItem('nudge-access-code');}
 async function audioStore(action,value){return new Promise((resolve,reject)=>{const req=indexedDB.open('nudge-recovery',1);req.onupgradeneeded=()=>req.result.createObjectStore('draft');req.onerror=()=>reject(new Error('Couldn’t save a recovery copy of your recording.'));req.onsuccess=()=>{const db=req.result,tx=db.transaction('draft',action==='get'?'readonly':'readwrite'),store=tx.objectStore('draft');let op=action==='get'?store.get('audio'):action==='put'?store.put(value,'audio'):store.delete('audio');let result;op.onsuccess=()=>result=op.result;tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(new Error('Recording recovery storage is unavailable.'));};};});}
 return {base,token,connect,disconnect,call,audioStore};
})();
