/* Dates stay on device. A suggested work slot is separate from the actual deadline. */
(function(root){
const day=86400000, minute=60000;
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
 const effectiveStart=Math.max(now+minute,t.notBefore||0);
 const near=cut&&days>0&&days<=7;
 let earliest=effectiveStart;
 if(days>lead&&cut)earliest=Math.max(earliest,cut-(high?7:Math.max(5,Math.min(14,Math.ceil(days/4))))*day);
 else if(!cut||days<=0)earliest=Math.max(earliest,now+(t.backlog?(7+delayed*2)*day:later?(high?2*60:24*60*(1+delayed))*minute:high?60*minute:2*day));
 if(later&&cut&&days>0)earliest=Math.max(earliest,now+Math.min(high?60*minute:day,Math.max(minute,(cut-now)/4)));
 const until=cut&&cut>now?cut:earliest+7*day;
 const fits=slots(earliest,Math.min(until,earliest+14*day),settings,events,minutes*minute);
 const first=fits[0];let next=first?.start||Math.max(effectiveStart,clock(earliest,settings.start||'09:00'),earliest);
 if(cut&&cut>now)next=Math.max(effectiveStart,Math.min(next,cut-1));
 const dayDelta=cut?Math.round((clock(cut,'12:00')-clock(now,'12:00'))/day):null;
 const late=!!cut&&cut<=now,scarce=near&&fits.length<=2;
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
