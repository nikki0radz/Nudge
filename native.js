window.NativeBridge=(()=>{
 const pending=new Map();let count=0;
 const available=()=>typeof window.NudgeNative?.request==='function';
 function call(method,args={}){if(!available())return Promise.reject(Error('This feature is available in the Android app.'));return new Promise((resolve,reject)=>{const id='n'+(++count);pending.set(id,{resolve,reject});window.NudgeNative.request(JSON.stringify({id,method,args}));});}
 function resolve(id,data,error){const p=pending.get(id);if(!p)return;pending.delete(id);if(error)p.reject(Error(error));else p.resolve(data);}
 async function syncCalendars(){try{const data=await call('selectCalendars');state.deviceEvents=data.events;state.calendarLinked=true;save();render();toast('Phone calendars refreshed. Synced Google events are included.');}catch(e){toast(e.message);}}
 async function checkUpdates(){const status=document.querySelector('#native-status');if(status)status.textContent='Checking for updates…';try{const data=await call('checkUpdates');if(data.available){if(status)status.innerHTML='Version '+esc(data.version)+' is ready. <button class="primary" id="download-update">Download update</button>';document.querySelector('#download-update')?.addEventListener('click',()=>call('openUpdate',{url:data.url}));if(!status)toast('An app update is available in Settings.');}else if(status)status.textContent='You’re up to date · '+data.current;}catch(e){if(status)status.textContent=e.message;}}
 function scheduleReminders(){if(!available()||!state?.tasks)return;call('scheduleReminders',{tasks:state.tasks.filter(t=>!t.done).map(t=>({id:t.id,title:t.title,next:t.next,deadline:t.deadline})),settings:state.settings}).catch(()=>{});}
 async function notifications(){try{await call('notificationPermission');scheduleReminders();toast('Phone reminders enabled.');}catch(e){toast(e.message);}}
 async function consume(){try{const data=await call('resume');for(const action of data.actions||[]){const t=state.tasks.find(t=>t.id===action.id);if(!t)continue;if(action.type==='done')t.done=true;else if(action.type==='snooze'){t.next=action.next;delete t.notified;}}if(data.events)state.deviceEvents=data.events;save();render();}catch{}}
 async function init(){if(!available())return;await consume();scheduleReminders();checkUpdates();}
 function exportBackup(){return call('exportBackup',{json:JSON.stringify({version:2,...state},null,2)}).catch(e=>toast(e.message));}
 window.addEventListener('nudge:resume',consume);return {available,call,resolve,syncCalendars,checkUpdates,scheduleReminders,notifications,init,exportBackup};
})();
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.action;if(a?.startsWith('backup-'))NudgeBackups.action(a);if(a==='app-updates')NativeBridge.checkUpdates();});
