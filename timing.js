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
const api={extractDeadline,schedule,localParts,zonedTime};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NudgeTiming=api;
})(typeof window!=='undefined'?window:globalThis);
