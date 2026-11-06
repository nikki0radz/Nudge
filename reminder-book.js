/* Assemble action folders from saved AI labels and the current calendar. */
function reminderFolders(tasks, people, events, now=Date.now()) {
  const folders=[];
  const dayIndex=value=>{const d=new Date(value);return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000};
  const shopping=t=>[...(t.tags||[]),...(t.places||[]),t.planCategory].some(x=>/^(shopping|groceries|ingredients)$/i.test(x)) ||
    /\b(buy|groceries|shopping list|ingredients for|from the (?:shops?|supermarket)|need .+ for (?:my|the|a) cake)\b/i.test(t.title);
  const shop=tasks.filter(shopping);
  if(shop.length)folders.push({id:'shops',title:'At the shops',art:'shopping',tasks:shop,score:20});
  for(const p of people){
    const names=[p.name,...(p.aliases||[])].filter(Boolean).map(n=>n.toLowerCase());
    const mentions=text=>names.some(name=>(' '+String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ')+' ').includes(' '+name.replace(/[^\p{L}\p{N}]+/gu,' ').trim()+' '));
    const linked=tasks.filter(t=>t.peopleIds?.includes(p.id)||mentions(t.title));
    if(!linked.length)continue;
    const visit=events.filter(e=>e.start>=now&&(mentions(e.title)||e.peopleNames?.some(n=>names.includes(String(n).toLowerCase())))&&!(/\b(birthday|anniversary)\b/i.test(e.title)&&! /\b(party|visit|dinner|meet)\b/i.test(e.title))).sort((a,b)=>a.start-b.start)[0];
    const days=visit?dayIndex(visit.start)-dayIndex(now):Infinity;
    const prep=linked.some(shopping),soon=days<=(prep?7:2);
    const when=days===0?'today':days===1?'tomorrow':visit?new Date(visit.start).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}):'';
    folders.push({id:'person-'+p.id,title:soon?p.name+' · '+when:'For '+p.name,detail:soon?(prep?'Pick up before you go':'Before you go'):'People',art:'friends-hug',tasks:linked,score:soon?100-days:5});
  }
  const labels=new Map();
  for(const t of tasks){const label=t.backlog?'Backlog':t.planCategory||taskPlan(t).category;
    if(label&&!(shopping(t)&&/^(shopping|groceries)$/i.test(label))){if(!labels.has(label))labels.set(label,[]);labels.get(label).push(t)}}
  for(const [title,items] of labels)folders.push({id:'label-'+title,title,art:pickArt(items[0])||'note-pencil',tasks:items,score:items.some(t=>t.deadline&&t.deadline<now+86400000&&!(t.snoozedUntil>now)&&NudgePlanner.info(t).high)?120:items.some(t=>taskPlan(t).urgent)?35:1});
  return folders.sort((a,b)=>b.score-a.score);
}
function library(){
  const done=listMode==='done',tasks=rankTasks(state.tasks.filter(t=>!t.demo&&!!t.done===done));
  const groups=done?[]:reminderFolders(tasks,state.people||[],calendarBusy());
  const selected=groups.find(g=>g.id===filter||g.title===filter);
  const shown=selected?selected.tasks:tasks;
  main.innerHTML=`<div class="eyebrow">Olive’s field notes</div><div class="section-head reminder-title"><h1>Your reminders</h1><button class="icon-button" data-action="calendar-open" aria-label="Open calendar">${calendarStickerMarkup()}</button></div>
    ${groups.length?`<section class="context-folders" aria-label="Reminder folders">${groups.map((g,i)=>`<button class="context-folder ${i===0?'featured':''}" aria-pressed="${selected===g}" data-filter="${esc(selected===g?'All':g.id)}"><img src="${stickerAssetURL(g.art)}" alt=""><span><small>${esc(g.detail||'On your list')} · ${g.tasks.length}</small><strong>${esc(g.title)}</strong></span></button>`).join('')}</section>`:''}
    <div class="section-head"><h2>${selected?esc(selected.title):shown.length+(done?' completed':' to remember')}</h2>${selected?'<button data-filter="All">Show all</button>':''}<button data-action="toggle-done">${done?'View active':'View completed'}</button></div>
    <div id="results">${shown.map(card).join('')||'<p class="empty">Nothing here just yet.</p>'}</div>`;
}
function dateCard(key,label,value){
  const d=value?new Date(value):null, time=d?.toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true});
  const hour=d?(d.getHours()%12)*30+d.getMinutes()/2:0,minute=d?d.getMinutes()*6:0;
  return `<details class="date-card"><summary><small>${label}</small><strong>${d?esc(d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})):'Add date'}</strong>${d?`<span class="clock-time"><i class="mini-clock" style="--hr:${hour}deg;--min:${minute}deg"></i>${time}</span>`:''}</summary><label>${label}<input id="edit-${key}" type="datetime-local" value="${d?dateInput(+d):''}"></label></details>`;
}
function weekStrip(next){
  const today=new Date(),days=Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()+i);return d});
  return days.map((d,i)=>`<button type="button" data-day="${dateInput(+d).slice(0,10)}" aria-label="Set next nudge to ${d.toDateString()}" aria-pressed="${d.toDateString()===new Date(next).toDateString()}"><small>${i?d.toLocaleDateString('en-GB',{weekday:'narrow'}):'Today'}</small><b>${d.getDate()}</b></button>`).join('');
}
function openDetail(id){
  const t=state.tasks.find(x=>x.id===id);if(!t)return;
  const content=document.querySelector('#detail-content'),people=state.people||[];
  const personField=`<fieldset class="linked-people" id="edit-task-person"><legend>Linked people</legend><div class="people-choices">${people.map(p=>`<label><input type="checkbox" value="${esc(p.id)}" ${t.peopleIds?.includes(p.id)?'checked':''}><span>${esc(p.name)}</span></label>`).join('')}</div></fieldset>`;
  content.innerHTML=`<section class="task-editor"><button class="close" data-action="close" aria-label="Close">×</button><div class="eyebrow">Reminder card</div><label class="editable-title"><img src="${esc(taskImage(t,pickArt(t)))}" alt=""><textarea id="edit-title" rows="2" maxlength="4000" aria-label="Reminder title">${esc(t.title)}</textarea></label>
  <div class="week-strip" aria-label="Choose next nudge day">${weekStrip(t.next)}</div><div class="date-pair">${dateCard('next','Next nudge',t.next)}${dateCard('deadline','Deadline',t.deadline)}</div>
  ${t.peopleIds?.length?personField:''}
  <details class="editor-more"><summary>More details</summary><label class="editor-field">Categories<input id="edit-tags" value="${esc(t.tags.join(', '))}"></label>${!t.peopleIds?.length&&people.length?personField:''}<p class="original">${esc(t.original||'')}</p><button class="secondary danger" data-action="delete" data-id="${esc(id)}">Delete reminder</button>${!pickArt(t)&&!t.customSticker?`<button class="secondary" data-action="make-sticker" data-id="${esc(id)}">Draw a sticker</button>`:''}</details>
  <p class="tiny" id="task-edit-error" role="status"></p><div class="note-actions"><button class="secondary" data-action="complete" data-id="${esc(id)}">${t.done?'Restore':'Mark as done'}</button><button class="primary" data-action="save-title" data-id="${esc(id)}">Save changes</button></div>${t.done?'':`<button class="text-toggle" data-action="snooze" data-id="${esc(id)}">Let Olive pick a later time</button>`}</section>`;
  for(const [key,label] of [['next','Next nudge'],['deadline','Deadline']]){
    const box=content.querySelector('#edit-'+key).closest('details');
    box.oninput=()=>{const val=box.querySelector('input').value;const temp=document.createElement('div');temp.innerHTML=dateCard(key,label,Date.parse(val));box.querySelector('summary').innerHTML=temp.querySelector('summary').innerHTML;if(key==='next')content.querySelector('.week-strip').innerHTML=weekStrip(Date.parse(val))};
  }
  content.querySelector('.week-strip').onclick=e=>{const b=e.target.closest('button');if(!b)return;const input=content.querySelector('#edit-next');input.value=b.dataset.day+'T'+(input.value.split('T')[1]||'09:00');input.dispatchEvent(new Event('input',{bubbles:true}))};
  if(!detail.open)detail.showModal();
}
function oliveCard(t,art,kicker,line,buttons,extra=''){
  return `<section class="olive-card"><small class="eyebrow">${esc(kicker)}</small><h2>${esc(t.title)}</h2><div class="olive-aside"><img src="${stickerAssetURL(art)}" alt="Olive"><p>${esc(line)}</p></div>${extra}<div class="note-actions">${buttons}</div></section>`;
}
function confirmCompletion(t){
  const host=document.querySelector('#detail-content'),editor=host.firstElementChild;
  editor.hidden=true;
  host.insertAdjacentHTML('beforeend',oliveCard(t,'olive-side-eye','Olive requires evidence','Shall I put my very official tick on this?', '<button class="secondary" id="keep-editing">Still working on it</button><button class="primary" id="really-done">Yes, it’s done</button>'));
  host.querySelector('#keep-editing').onclick=()=>{host.lastElementChild.remove();editor.hidden=false};
  host.querySelector('#really-done').onclick=e=>{if(!t.done){detail.close();completeWithOwl(t,e.currentTarget)}};
}
async function celebrate(t){
  if(detail.open)return;
  const dramatic=t.snoozes>=2||(t.deadline&&Date.now()-t.deadline>=86400000);
  const host=document.querySelector('#detail-content');
  host.innerHTML=oliveCard(t,dramatic?'olive-panic':'olive-cheer','Officially done ✓',dramatic?'Quick, someone catch me. You actually did it!':'Look at you! That deserves a tiny victory dance.','<button class="primary" data-action="close">Thanks, Olive</button>','<p class="reward-copy"></p>');
  const copy=host.querySelector('.reward-copy');copy.textContent=/expenses/i.test(t.title)?'Expenses sorted. Future you has one less pile of receipts to face.':'One less thing to carry around in your head.';
  detail.showModal();
  if(NudgeAI.token())try{const result=await NudgeAI.call('/api/celebrate',{title:t.title,snoozes:t.snoozes||0,daysLate:t.deadline?Math.max(0,Math.floor((Date.now()-t.deadline)/86400000)):0});if(copy.isConnected&&result.message)copy.textContent=result.message}catch{}
}
