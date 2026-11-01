/* Local preview engine. Replace parse() with the future authenticated Worker adapter. */
(function(root){
const DAY=86400000;
const constraints=typeof module!=='undefined'&&module.exports?require('./timing.js'):root.NudgeTiming;
function hash(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;}
function windowTime(date,settings){const d=new Date(date);const [sh,sm]=(settings.start||'09:00').split(':').map(Number);const [eh,em]=(settings.end||'20:00').split(':').map(Number);const start=sh*60+sm,end=eh*60+em,now=d.getHours()*60+d.getMinutes();if(now<start)d.setHours(sh,sm,0,0);else if(now>=end){d.setDate(d.getDate()+1);d.setHours(sh,sm,0,0);}return d.getTime();}
function choose(text,settings={},now=Date.now()){const h=hash(text+now);return windowTime(now+(settings.pace==='gentle'?36:18)*3600000+(h%300)*60000,settings);}
function parseDate(text,settings={},now=Date.now()){
 const lower=text.toLowerCase();let d=new Date(now),explicit=false,deadline=false,matched='';
 const iso=lower.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);const relative=lower.match(/\bin\s+(\d+)\s+(minutes?|hours?|days?|weeks?)\b/);
 if(iso){d=new Date(+iso[1],+iso[2]-1,+iso[3],10);matched=iso[0];explicit=true;}
 else if(relative){const unit=relative[2];d=new Date(now+Number(relative[1])*(unit.startsWith('minute')?60000:unit.startsWith('hour')?3600000:unit.startsWith('week')?7*DAY:DAY));matched=relative[0];explicit=true;}
 else if(/\btomorrow\b/.test(lower)){d.setDate(d.getDate()+1);d.setHours(10,0,0,0);matched='tomorrow';explicit=true;}
 else if(/\bnext week\b/.test(lower)){d.setDate(d.getDate()+7);d.setHours(10,0,0,0);matched='next week';explicit=true;}
 else if(/\btonight\b/.test(lower)){d.setHours(19,0,0,0);matched='tonight';explicit=true;}
 else if(/\btoday\b/.test(lower)){d=new Date(now+2*3600000);matched='today';explicit=true;}
 else {const wd=lower.match(/\b(?:(next|this)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);if(wd){const target=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(wd[2]);let diff=(target-d.getDay()+7)%7;if(!diff)diff=7;d.setDate(d.getDate()+diff);d.setHours(10,0,0,0);matched=wd[0];explicit=true;}}
 const normalTime=lower.replace(/([ap])\s*\.\s*m\s*\.?/g,'$1m');
 const time=normalTime.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\bat\s+(\d{1,2}):(\d{2})\b/);
 if(time){let hour=+(time[1]||time[4]);let min=+(time[2]||time[5]||0);if(time[3])hour=hour%12+(time[3]==='pm'?12:0);if(hour<24&&min<60){d.setHours(hour,min,0,0);if(!explicit&&d.getTime()<=now)d.setDate(d.getDate()+1);explicit=true;}}
 deadline=explicit&&/\b(before|by)\b/.test(lower);const due=explicit?d.getTime():null;
 let next=explicit?(deadline?Math.max(now+60000,d.getTime()-DAY):d.getTime()):choose(text,settings,now);
 // Fixed spoken times are respected; automatically selected times use waking hours.
 if(!time)next=windowTime(next,settings);if(next<=now)next=now+60000;
 const cutoff=constraints.extractDeadline(text,now);if(cutoff!==null){return {next:constraints.schedule(next,cutoff,settings,now),deadline:cutoff,timing:'spoken',timePhrase:matched,context:cutoff<=now?'The requested deadline has passed.':null};}
 const unresolved=!explicit&&/\b(before|after|next time|when|on|at|in|every)\b|\d/.test(lower);
 return {next,deadline:deadline?due:null,timing:explicit?'spoken':unresolved?'context':'automatic',timePhrase:matched,context:unresolved?'Timing needs context · using a gentle check-in for now':null};
}
function parse(text,settings={},now=Date.now()){
 const groups=[['Shopping',/\b(buy|shop|shopping|pick up|groceries|order|monster)\b/i],['Apps & projects',/\b(app|website|github|code|diary|project|update)\b/i],['Home',/\b(clean|wash|laundry|house|tidy|repair|bin)\b/i],['Life admin',/\b(book|pay|renew|appointment|bill|call|email|cancel|bank)\b/i],['Wellbeing',/\b(therapy|exercise|pilates|walk|rest)\b/i]];
 const tags=groups.filter(g=>g[1].test(text)).map(g=>g[0]);const person=text.match(/\b(?:buy|give|tell|ask|call|text|see|meet|email)\s+([A-Z][a-z]+)\b/)||text.match(/\b(?:for|with)\s+([A-Z][a-z]+)\b/);if(person&&!['The','My','Some','Next','Before','Tuesday','Monday','Friday','Saturday','Sunday','Wednesday','Thursday'].includes(person[1]))tags.push(person[1]);if(!tags.length)tags.push('Everyday');
 let title=text.replace(/^(?:okay[, ]*|please\s+)?(?:please\s+)?(?:remind me(?:\s+to)?|remember to|i need to|don't let me forget to)\s*/i,'').trim();title=title.charAt(0).toUpperCase()+title.slice(1);return {title,original:text,tags,...parseDate(text,settings,now)};
}
function tokens(s){return s.toLowerCase().replace(/diary app/g,'diary').replace(/\b(?:remind|remember|please|me|to|the|my|a|an|do|work|on|next|week|before|this|update|finish|updating)\b/g,' ').match(/[a-z0-9]+/g)||[];}
function duplicate(a,b){const x=new Set(tokens(a)),y=new Set(tokens(b));if(!x.size||!y.size)return a.toLowerCase().trim()===b.toLowerCase().trim();const intersection=[...x].filter(t=>y.has(t)).length;return intersection/Math.max(x.size,y.size)>=.75;}
function constrain(task,settings={},reference=Date.now(),now=Date.now()){
 const inferred=constraints.extractDeadline(task.original||'',reference);
 const deadline=inferred!==null?inferred:Number.isFinite(task.deadline)?task.deadline:null;
 const candidate=Number.isFinite(task.next)?task.next:choose(task.title||'',settings,now);
 const next=constraints.schedule(candidate,deadline,settings,now);
 return {...task,next,deadline,...(deadline!==null?{timing:'spoken',context:deadline<=now?'The requested deadline has passed.':null}:{}),timingVersion:2};
}
function repairDeadlines(tasks,settings={},now=Date.now()){
 let changed=false;for(const task of tasks){if(task.done||task.timingVersion>=2)continue;
 const fixed=constrain(task,settings,Number.isFinite(task.created)?task.created:now,now);
 if(fixed.deadline!==task.deadline||fixed.next!==task.next)delete task.notified;
 Object.assign(task,fixed);changed=true;
 }return changed;
}
const api={parse,parseDate,choose,windowTime,duplicate,constrain,repairDeadlines};if(typeof module!=='undefined')module.exports=api;else root.NudgeEngine=api;
})(typeof window!=='undefined'?window:globalThis);

