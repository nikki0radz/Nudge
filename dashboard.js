let captureMode=0,overdueQueue=[];
const occasionArt={
 'plant-study':'plant|plants|fern','textbook':'module|university|tma|exam|assignment','wax-pot':'wax|waxing','parcel':'parcel|postage','cake-slice':'cake|birthday','expenses':'expenses|finance|invoice|tax','waste-bin':'waste|rubbish','dress-alteration':'alter|alteration|hem','sewing-kit':'sew|sewing','pool-party':'pool party','swimwear':'swim|swimming|bikini|pool','magic-show':'magic|magician','wash-basket':'laundry','gamepad':'gaming|video game','stage-mic':'concert|karaoke','theatre-masks':'theatre|theater','popcorn':'cinema|film','disco-night':'disco','game-dice':'board game','dance-shoes':'dance|dancing','climbing':'climbing','yoga-mat':'yoga|pilates','tent':'camping','train-ticket':'train','travel-case':'travel|suitcase','passport':'passport','hiking-boot':'hiking','cafe-cup':'coffee','cocktail-glass':'cocktail','dining':'restaurant','picnic-basket':'picnic','bowling-pin':'bowling','roller-skate':'skating','camera-trip':'photo','paint-palette':'painting','pottery':'pottery','gardening-trowel':'gardening'};
function pickArt(t){return Object.keys(occasionArt).find(k=>new RegExp('\\b(?:'+occasionArt[k]+')\\b','i').test(t.title))||(CALENDAR_STICKER_KEYS.includes(t.stickerKey)?t.stickerKey:'')}
function taskImage(t,k){return /^data:image\/png;base64,[a-zA-Z0-9+/=]+$/.test(t.customSticker||'')?t.customSticker:stickerAssetURL(k||'note-pencil')}
function calendarBusy(){return [...(state.events||[]),...(state.deviceEvents||[])]}
function taskPlan(t,later=false){return NudgePlanner.plan(t,state.settings,calendarBusy(),Date.now(),later)}
function rankTasks(tasks){return tasks.map(t=>({t,p:taskPlan(t)})).sort((a,b)=>b.p.score-a.p.score||a.t.next-b.t.next).map(x=>x.t)}
function prepareReminder(t,text){
 t.backlog=!!t.backlog||captureMode===2||/\b(?:in (?:my|the) backlog|someday)\b/i.test(text);
 if(!t.manualTiming&&!t.deadline&&/\b(?:before|by) christmas\b/i.test(t.original||text)){
  const ref=new Date(t.created||Date.now()),d=new Date(ref.getFullYear(),11,25);
  if(d<=ref)d.setFullYear(d.getFullYear()+1);t.deadline=+d;
 }
 const fixed=t.explicitAlert||(!t.deadline&&t.timing==='spoken'&&!t.backlog)||/\bremind me (?:at|in \d+ (?:minute|hour))/i.test(t.original||'');
 if(!t.manualTiming&&!fixed&&!t.occasion?.birthdaySignature&&t.occasion?.type!=='birthday')t.next=taskPlan(t).next;
 if(t.backlog)t.tags=[...new Set([...(t.tags||[]),'Backlog'])];
 return t;
}
function showOpeningOverdues(){
 if(detail.open||processing||recording||receiptActive||document.hidden)return;
 overdueQueue=rankTasks(state.tasks.filter(t=>!t.done&&!t.demo&&!(t.snoozedUntil>Date.now())&&t.deadline&&t.deadline<=Date.now())).map(t=>t.id);
 showNextOverdue();
}
function showNextOverdue(){
 const t=state.tasks.find(t=>t.id===overdueQueue[0]&&!t.done);
 if(!t){overdueQueue=[];return}
 const level=Math.min(4,Math.max(t.snoozes||0,Math.floor((Date.now()-t.deadline)/86400000)));
 const art=['olive-stern','olive-side-eye','olive-steam','olive-facepalm','olive-explode'][level];
 const line=['It’s still on my clipboard.','Hello from later.','My feathers are beginning to twitch.','I’ve started keeping minutes.','I have run out of feathers to ruffle.'][level];
 document.querySelector('#detail-content').innerHTML=oliveCard(t,art,taskPlan(t).label,line,`<button class="primary" data-action="one-hour">In 1 hour</button><button class="secondary" data-action="custom-nudge" data-id="${esc(t.id)}">Custom time</button>`);
 document.querySelector('.olive-card').insertAdjacentHTML('beforeend','<button class="olive-dismiss" data-action="dismiss-nudge">Dismiss · let Olive choose</button>');
 if(!detail.open)detail.showModal();
}
function customNudge(id){
 const t=state.tasks.find(t=>t.id===id&&!t.done);if(!t)return;
 const content=document.querySelector('#detail-content');content.innerHTML=`<h2>Pick a custom time</h2><p>${esc(t.title)}</p><form><label>Next nudge<input required type="datetime-local" value="${dateInput(Date.now()+3600000)}"></label><div class="dialog-actions"><button type="button" class="secondary" data-action="cancel-custom">Back</button><button class="primary">Set reminder</button></div></form>`;
 if(!detail.open)detail.showModal();content.querySelector('form').onsubmit=e=>{e.preventDefault();const input=content.querySelector('input'),next=Date.parse(input.value);if(!(next>Date.now())){input.setCustomValidity('Choose a future time.');input.reportValidity();input.setCustomValidity('');return}exactSnooze(t,next)};
}
function exactSnooze(t,next){if(!t)return;const old={...t};t.next=next;t.snoozes=(t.snoozes||0)+1;t.snoozedUntil=next;delete t.notified;if(!save()){Object.assign(t,old);return}detail.close();if(overdueQueue[0]===t.id)overdueQueue.shift();render();showNextOverdue()}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;
 switch(b.dataset.action){
 case 'capture-mode':if(!recording&&!processing&&!voiceStarting){captureMode=Number(b.dataset.mode);render()}break;
 case 'dismiss-nudge':{const id=overdueQueue.shift();detail.close();if(id)snooze(id);if(!detail.open)showNextOverdue();break}
 case 'one-hour':exactSnooze(state.tasks.find(t=>t.id===overdueQueue[0]),Date.now()+3600000);break;
 case 'custom-nudge':customNudge(b.dataset.id);break;
 case 'cancel-custom':if(overdueQueue.length)showNextOverdue();else detail.close();break;
 case 'make-sticker':{const t=state.tasks.find(t=>t.id===b.dataset.id);if(!t||b.disabled)return;b.disabled=true;b.textContent='Drawing sticker…';try{const data=await NudgeAI.call('/api/sticker',{title:t.title});const image=new Image();image.src='data:image/png;base64,'+data.png;await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=160;canvas.getContext('2d').drawImage(image,0,0,160,160);t.customSticker=canvas.toDataURL();if(!save()){delete t.customSticker;return}render();if(detail.open)detail.close();openDetail(t.id)}catch(err){toast(err.message)}finally{b.disabled=false;b.textContent='Generate a matching sticker'}break}
 }
});
document.addEventListener('cancel',e=>{if(e.target.id==='detail'&&overdueQueue.length){e.preventDefault();document.querySelector('[data-action=dismiss-nudge], [data-action=cancel-custom]')?.click()}},true);
function nativePlan(t){
 const times=[],events=calendarBusy();let cursor=Math.max(Date.now(),t.next);
 for(let i=0;i<4;i++){const cached=t.dismissPlan;const n=i===0&&cached?.key===dismissPlanKey(t)&&cached.next>cursor?cached.next:NudgePlanner.plan(t,state.settings,events,cursor,true).next;if(n<=cursor)break;times.push(n);cursor=n}
 return times;
}
function refreshPlan(){
 let changed=false;const events=calendarBusy(),now=Date.now();
 for(const t of state.tasks){
  if(t.done||t.demo||t.manualTiming||t.snoozedUntil>now)continue;
  const christmas=/\b(?:before|by) christmas\b/i.test(t.original||'');
  if(!t.planVersion){if(christmas)prepareReminder(t,t.original||'');t.planVersion=1;changed=true}
  if(t.deadline>now&&!t.explicitAlert&&NudgePlanner.info(t).high&&t.next>now){
   const slot=NudgePlanner.plan(t,state.settings,events,now);
   if(slot.reason&&Math.abs(slot.next-t.next)>30*60000){t.next=slot.next;changed=true}
  }
 }
 if(changed)save();
}
async function reconsider(t,now=Date.now()){
 const events=calendarBusy(),base=NudgePlanner.plan(t,state.settings,events,now,true);
 if(!NudgeAI.token()||t.backlog)return base;
 const horizon=t.deadline>now?Math.min(t.deadline,base.next+4*86400000):base.next+3*86400000;
 const duration=NudgePlanner.info(t).minutes*60000;
 const gaps=NudgePlanner.slots(base.next,horizon,state.settings,events,duration);
 const choices=[...new Set(gaps.flatMap(g=>[g.start,...(g.end-g.start>=duration+2*3600000?[g.start+2*3600000]:[])]))].slice(0,8);
 if(choices.length<2)return base;
 const completionHours=state.tasks.filter(x=>x.completedAt&&NudgePlanner.info(x).category===base.category).slice(-24).map(x=>new Date(x.completedAt).getHours());
 const result=await NudgeAI.call('/api/plan',{title:t.title,original:t.original,category:base.category,impact:NudgePlanner.info(t).high?'high':'ordinary',deadline:t.deadline,snoozes:t.snoozes,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,choices,completionHours,busy:events.filter(e=>e.end>now&&e.start<horizon).slice(0,60).map(e=>({start:e.start,end:e.end})),now});
 return choices.includes(result.next)?result:base;
}

function dismissPlanKey(t){
 const horizon=t.next+7*86400000;
 return JSON.stringify([t.title,t.next,t.deadline,t.snoozes,state.settings.start,state.settings.end,calendarBusy().filter(e=>e.end>t.next&&e.start<horizon).map(e=>[e.start,e.end])]);
}
const requestedPlans=new Map();
async function preparePhoneDismissals(){
 if(!NativeBridge.available()||!NudgeAI.token())return;
 const now=Date.now();
 for(const t of state.tasks.filter(t=>!t.done&&!t.demo&&!t.backlog&&t.next>now&&t.next<now+7*86400000)){
  const key=dismissPlanKey(t);
  if(t.dismissPlan?.key===key||requestedPlans.get(t.id)===key)continue;
  requestedPlans.set(t.id,key);
  try{
   const plan=await reconsider(t,t.next);
   if(state.tasks.includes(t)&&!t.done&&dismissPlanKey(t)===key&&plan.next>t.next){t.dismissPlan={key,next:plan.next};save()}
  }catch{/* The native alarm already holds a local calendar-aware plan. */}
 }
}
