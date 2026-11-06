/* Dates stay on device. A suggested work slot is separate from the actual deadline. */
(function(root){
const day=86400000, minute=60000;
const timing=typeof module!=='undefined'&&module.exports?require('./timing.js'):root.NudgeTiming;
const patterns=[
 ['Study',/\b(tma|assignment|university|module|dissertation|exam)\b/i,60],
 ['Finance',/\b(expenses|invoice|tax|rent|mortgage|bill|payroll)\b/i,30],
 ['Personal',/\b(wax|waxing|bikini|beach|haircut)\b/i,15]
];
function info(t){
 const hit=patterns.find(p=>p[1].test(t.title||'')), category=t.planCategory||hit?.[0]||'Everyday';
 return {category,high:t.impact?t.impact==='high':['Study','Finance'].includes(category),
 minutes:Math.max(5,Math.min(240,Number(t.minutes)||hit?.[2]||20))};
}
function clock(ts,time){const date=new Date(ts),[h,m]=time.split(':').map(Number);date.setHours(h,m,0,0);return +date}
function slots(from,to,settings,events,length){
 const busy=events.filter(e=>e.start<to&&e.end>from).sort((a,b)=>a.start-b.start),result=[];
 const d=new Date(from);d.setHours(0,0,0,0);
 for(let i=0;i<16&&+d<to;i++,d.setDate(d.getDate()+1)){
  let cursor=Math.max(from,clock(d,settings.start||'09:00'));const end=Math.min(to,clock(d,settings.end||'20:00'));
  for(const e of busy){if(e.end<=cursor||e.start>=end)continue;if(e.start-cursor>=length)result.push({start:cursor,end:e.start});cursor=Math.max(cursor,e.end)}
  if(end-cursor>=length)result.push({start:cursor,end});
 }
 return result;
}
function plan(t,settings={},events=[],now=Date.now(),later=false){
 const {category,high,minutes}=info(t),cut=t.deadline||null,days=cut?(cut-now)/day:Infinity;
 const delayed=Math.min(5,t.snoozes||0),lead=high?7:3;
 const range=t.manualTiming?null:t.timingWindow||timing.windowFor(t.original,t.created||now);
 const effectiveStart=Math.max(now+minute,t.notBefore||0,range&&range.end>now?range.start:0);
 const late=!!cut&&cut<=now;
 const near=cut&&days>0&&days<=7;
 let earliest=effectiveStart;
 if(days>lead&&cut)earliest=Math.max(earliest,cut-(high?7:Math.max(5,Math.min(14,Math.ceil(days/4))))*day);
 else if(late)earliest=Math.max(earliest,now+(later?2*60:15)*minute);
 else if(!cut)earliest=Math.max(earliest,now+(t.backlog?7*day:later?(settings.pace==='gentle'?36:18)*60*minute:high?60*minute:4*60*minute));
 if(later&&cut&&days>0)earliest=Math.max(earliest,now+Math.min(high?60*minute:day,Math.max(minute,(cut-now)/4)));
 if(range&&range.end>now&&earliest>=range.end)earliest=Math.max(effectiveStart,range.end-minute);
 const until=Math.min(cut&&cut>now?cut:earliest+7*day,range&&range.end>now?range.end:Infinity);
 const fits=slots(earliest,Math.min(until,earliest+14*day),settings,events,minutes*minute);
 const first=fits[0];
 const seed=timing.hash((t.id||t.title)+new Date(earliest).toDateString()+Math.floor(earliest/3600000));
 const spread=first?Math.min(late?30*minute:3*60*minute,Math.max(0,first.end-first.start-minutes*minute)):0;
 let next=first?first.start+(seed%Math.max(1,Math.floor(spread/minute)))*minute:timing.inWindow(null,{start:earliest,end:earliest+2*day},settings,now,undefined,t.title);
 // A reminder is a prompt, not a full work session. Busy calendars must not hide overdue work for a week.
 if(late){const prompt=timing.inWindow(null,{start:earliest,end:earliest+day},settings,now,undefined,t.title);next=Math.min(next,prompt);}
 if(range&&range.end>now)next=timing.inWindow(next,range,settings,now,undefined,t.original||t.title);
 if(cut&&cut>now)next=Math.max(effectiveStart,Math.min(next,cut-1));
 const dayDelta=cut?Math.round((clock(cut,'12:00')-clock(now,'12:00'))/day):null;
 const scarce=near&&fits.length<=2;
 const urgent=!t.backlog&&(!t.notBefore||t.notBefore<=now)&&(late||(near&&(days<=1.5||high&&(days<=3||scarce)))||(!cut&&t.next<=now));
 const score=urgent?(high?100:0)+(late?45:28)+(scarce?12:0)+Math.min(9,delayed)+Math.min(14,Math.max(0,-days)):0;
 const label=late?(dayDelta<0?Math.abs(dayDelta)+'d overdue':'Overdue today'):dayDelta===0?'Due today':dayDelta===1?'Due tomorrow':dayDelta!==null?'Due in '+dayDelta+' days':t.backlog?'Backlog':'Next nudge '+new Date(t.next||next).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
 const conflicts=events.filter(e=>cut&&e.end>now&&e.start<cut);
 const slot=first?new Date(first.start).toLocaleString('en-GB',{weekday:'short',hour:'2-digit',minute:'2-digit'}):'';
 const reason=near&&conflicts.length?(first?'Try '+slot+' · '+minutes+' min clear before your deadline.':'No '+minutes+'-minute gap on your calendar before the deadline.'):'';
 return {next,score,urgent,label,reason,category,late,dayDelta};
}
const api={plan,info,slots};if(typeof module!=='undefined')module.exports=api;else root.NudgePlanner=api;
})(typeof window!=='undefined'?window:globalThis);
