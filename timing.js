/* Deadline constraints are checked independently of model interpretation. */
(function(root){
const DAY=86400000;
function localParts(value,zone){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));
 return Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
}
function zonedTime(parts,zone){
 const target=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour||0,parts.minute||0,parts.second||0);let candidate=target;
 for(let i=0;i<4;i++){const p=localParts(candidate,zone);const shown=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);const delta=target-shown;if(!delta)return candidate;candidate+=delta;}return candidate;
}
function calendarDay(p,days){const d=new Date(Date.UTC(p.year,p.month-1,p.day+days));return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate()};}
function zoneName(zone){return zone||Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/London';}
function extractDeadline(text,reference=Date.now(),zone){
 zone=zoneName(zone);if(typeof text!=='string'||!Number.isFinite(reference))return null;
 let value=text.toLowerCase().replace(/([ap])\s*\.\s*m\s*\.?/g,'$1m');
 const marker=/\b(?:before|by|no later than)\s+/.exec(value);if(!marker)return null;
 const clause=value.slice(marker.index+marker[0].length);
 // A person/event condition is not a clock deadline ("before I see Ellie").
 if(!/^(?:(?:about|around|roughly)\s+)?(?:\d|tomorrow\b|today\b|tonight\b|noon\b|midnight\b|(?:next|this)\s+|(?:sun|mon|tues|wednes|thurs|fri|satur)day\b)/.test(clause))return null;
 const current=localParts(reference,zone);let day={year:current.year,month:current.month,day:current.day},hasDate=false;
 const iso=value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
 if(iso){day={year:+iso[1],month:+iso[2],day:+iso[3]};hasDate=true;}
 else if(/\btomorrow\b/.test(value)){day=calendarDay(current,1);hasDate=true;}
 else if(/\btoday\b|\btonight\b/.test(value))hasDate=true;
 else {const match=value.match(/\b(?:(next|this)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);if(match){const weekday=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(match[2]);const today=new Date(Date.UTC(current.year,current.month-1,current.day)).getUTCDay();let diff=(weekday-today+7)%7;if(!diff&&match[1]==='next')diff=7;day=calendarDay(current,diff);hasDate=true;}}
 let hour,minute=0;
 const clock=clause.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(\d{1,2}):(\d{2})\b/);
 if(clock){hour=Number(clock[1]||clock[4]);minute=Number(clock[2]||clock[5]||0);if(clock[3]){if(hour<1||hour>12)return null;hour=hour%12+(clock[3]==='pm'?12:0);}if(hour>23||minute>59)return null;}
 else if(/\bnoon\b/.test(clause))hour=12;
 else if(/\bmidnight\b/.test(clause))hour=0;
 else if(hasDate)hour=0;
 else return null;
 // Leave dates outside this deterministic grammar to the AI, rather than guessing today.
 if(!hasDate&&/\b(?:week|month|year|january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(clause))return null;
 const result=zonedTime({...day,hour,minute},zone),check=localParts(result,zone);
 if(check.year!==day.year||check.month!==day.month||check.day!==day.day||check.hour!==hour||check.minute!==minute)return null;
 return result;
}
function schedule(candidate,deadline,settings={},now=Date.now(),zone){
 if(!Number.isFinite(deadline))return candidate;
 if(deadline<=now)return Math.max(Number.isFinite(candidate)?candidate:0,now+60000);
 if(Number.isFinite(candidate)&&candidate>now&&candidate<deadline)return candidate;
 zone=zoneName(zone);const earliest=now+Math.max(1,Math.min(60000,(deadline-now)/4));const latest=deadline-1;
 const preferred=Number.isFinite(candidate)&&candidate>=earliest&&candidate<deadline?candidate:deadline-Math.min(3600000,(deadline-now)/2);
 const start=(settings.start||'09:00').split(':').map(Number),end=(settings.end||'20:00').split(':').map(Number);
 // Look for an allowed waking interval before the hard deadline, never rolling past it.
 const base=localParts(preferred,zone);let best=null,bestDistance=Infinity;
 const first=localParts(now,zone),last=localParts(deadline,zone);
 const days=[calendarDay(base,0),calendarDay(base,-1),calendarDay(base,1),calendarDay(first,0),calendarDay(first,1),calendarDay(last,-1),calendarDay(last,0)];
 for(const day of days){
  const lo=Math.max(earliest,zonedTime({...day,hour:start[0],minute:start[1]},zone)),hi=Math.min(latest,zonedTime({...day,hour:end[0],minute:end[1]},zone)-1);
  if(lo>hi)continue;const option=Math.max(lo,Math.min(hi,preferred)),distance=Math.abs(option-preferred);if(distance<bestDistance){best=option;bestDistance=distance;}
 }
 // An explicit imminent deadline takes priority if quiet hours leave no valid interval.
 return Math.min(latest,Math.round(best===null?Math.max(earliest,Math.min(latest,preferred)):best));
}
// Calendar ranges are anchored to capture time, never to the day an old task is opened.
function windowFor(text,reference=Date.now(),zone){
 zone=zoneName(zone);const value=String(text||'').toLowerCase(),p=localParts(reference,zone);
 const at=(day)=>zonedTime({...day,hour:0,minute:0,second:0},zone);
 // Do not let an event mentioned later in a sentence override a separate alert request.
 if(/\b(?:tomorrow|today|in \d+ (?:minutes?|hours?|days?|weeks?)|20\d\d-\d\d-\d\d)\b/.test(value))return null;
 if(/\bnext week\b/.test(value)&&! /\b(?:before|after|by)\s+next week\b/.test(value)){
  const weekday=new Date(Date.UTC(p.year,p.month-1,p.day)).getUTCDay();
  const monday=calendarDay(p,7-((weekday+6)%7));
  return {start:at(monday),end:at(calendarDay(monday,7)),kind:'next-week'};
 }
 if(/\b(?:around|at|over|for|before|by)\s+(?:this\s+|next\s+)?christmas\b/.test(value)){
  // A separate explicit date/relative alert takes precedence over the occasion.
  if(/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)\b|\bremind me at\s+(?:\d|noon|midnight)/.test(value))return null;
  const yearMatch=value.match(/\bchristmas\s+(20\d{2})\b/);
  const year=yearMatch?+yearMatch[1]:p.year+(p.month===12&&p.day>25?1:0);
  const booking=/\b(?:book|arrange|order|reserve)\b/.test(value);
  const before=/\b(?:before|by)\s+(?:this\s+|next\s+)?christmas\b/.test(value);
  return {start:at({year,month:12,day:booking||before?11:18}),end:at(before||booking?{year,month:12,day:25}:{year:year+1,month:1,day:1}),kind:'christmas',...(before?{deadline:at({year,month:12,day:25})}:{})};
 }
 return null;
}
function hash(value){let h=0;for(const c of String(value))h=(h*31+c.charCodeAt(0))>>>0;return h;}
function inWindow(candidate,window,settings={},now=Date.now(),zone,text=''){
 zone=zoneName(zone);const lower=Math.max(now+60000,window.start),upper=window.end;
 if(lower>=upper)return candidate; // An elapsed request becomes an ordinary unfinished task.
 const [sh,sm]=(settings.start||'09:00').split(':').map(Number),[eh,em]=(settings.end||'20:00').split(':').map(Number);
 const value=String(text).toLowerCase().replace(/([ap])\s*\.\s*m\s*\.?/g,'$1m');
 const clock=value.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\bat\s+(\d{1,2}):(\d{2})\b/);
 const explicitHour=clock?(clock[3]?+clock[1]%12+(clock[3]==='pm'?12:0):+clock[4]):null;
 const explicitMinute=clock?+(clock[2]||clock[5]||0):0;
 const exact=!!window.kind&&clock&&explicitHour<24&&explicitMinute<60;
 const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
 const namedDay=window.kind?weekdays.findIndex(d=>new RegExp('\\b'+d+'\\b').test(value)):-1;
 const business=!!window.kind&&namedDay<0&&/\b(?:book|call|phone|arrange)\b/i.test(text);
 if(Number.isFinite(candidate)&&candidate>=lower&&candidate<upper){
  const p=localParts(candidate,zone),m=p.hour*60+p.minute,wd=new Date(Date.UTC(p.year,p.month-1,p.day)).getUTCDay();
  if((exact?m===explicitHour*60+explicitMinute:m>=sh*60+sm&&m<eh*60+em)&&(namedDay<0||wd===namedDay)&&(!business||(wd!==0&&wd!==6)))return candidate;
 }
 const first=localParts(lower,zone);
 for(let i=0;i<32;i++){
  const day=calendarDay(first,i),wd=new Date(Date.UTC(day.year,day.month-1,day.day)).getUTCDay();
  if(namedDay>=0&&wd!==namedDay||business&&(wd===0||wd===6))continue;
  if(exact){const value=zonedTime({...day,hour:explicitHour,minute:explicitMinute},zone);if(value>=lower&&value<upper)return value;continue;}
  const lo=Math.max(lower,zonedTime({...day,hour:sh,minute:sm},zone)),hi=Math.min(upper,zonedTime({...day,hour:eh,minute:em},zone));
  if(lo>=hi)continue;
  const spread=Math.min(3*3600000,hi-lo-1);
  return lo+Math.floor(hash(text+day.year+'-'+day.month+'-'+day.day)%(Math.max(1,Math.floor(spread/60000))))*60000;
 }
 return lower; // Narrow windows can legitimately have no weekday/waking-hour intersection.
}
const api={extractDeadline,schedule,localParts,zonedTime,windowFor,inWindow,hash};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NudgeTiming=api;
})(typeof window!=='undefined'?window:globalThis);
