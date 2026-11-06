const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const timing=require('../timing.js'),engine=require('../engine.js'),planner=require('../planner.js');
const settings={start:'09:00',end:'20:00'},now=Date.parse('2026-11-06T23:00:00Z'),day=86400000;
const at=s=>Date.parse(s);
test('next week is a capture-anchored Monday–Sunday range, including Sunday and DST',()=>{
 for(const [capture,start,end] of [
  ['2026-11-06T23:00:00Z','2026-11-09T00:00:00Z','2026-11-16T00:00:00Z'],
  ['2026-11-08T23:00:00Z','2026-11-09T00:00:00Z','2026-11-16T00:00:00Z'],
  ['2026-11-09T10:00:00Z','2026-11-16T00:00:00Z','2026-11-23T00:00:00Z'],
  ['2026-10-23T10:00:00Z','2026-10-26T00:00:00Z','2026-11-02T00:00:00Z'],
  ['2026-03-27T10:00:00Z','2026-03-29T23:00:00Z','2026-04-05T23:00:00Z']]){
  const w=timing.windowFor('Book dentist at some point next week',at(capture),'Europe/London');
  assert.equal(w.start,at(start));assert.equal(w.end,at(end));
 }
 const text='Could you remind me at some point next week to book a dentist appointment?';
 const t=engine.constrain({title:'Book dentist',original:text,next:at('2026-11-08T09:00:00Z'),created:now},settings,now,now);
 assert(t.next>=at('2026-11-09T09:00:00Z')&&t.next<at('2026-11-14T00:00:00Z'));
 const after=engine.constrain(t,settings,now,now+day);assert.equal(after.next,t.next);
 assert.equal(timing.windowFor('Remind me tomorrow to prepare for next week',now),null);
 assert.doesNotThrow(()=>engine.parseDate('Remind me before next week to finish the app',settings,now));
 const sunday=engine.parseDate('Remind me next week on Sunday at 8pm to book dentist',settings,now);
 assert.equal(sunday.next,at('2026-11-15T20:00:00Z'));
});
test('Christmas arranging stays in December without inventing a deadline; explicit alert wins',()=>{
 const text='Arrange waste collection service for Ellie around Christmas';
 const t=engine.constrain({title:text,original:text,next:at('2026-11-08T09:00:00Z')},settings,now,now);
 assert(t.next>=at('2026-12-11T00:00:00Z')&&t.next<at('2026-12-25T00:00:00Z'));assert.equal(t.deadline,null);
 assert(planner.plan(t,settings,[],now).next>=at('2026-12-11T00:00:00Z'));
 assert.equal(timing.windowFor('Remind me tomorrow to arrange waste collection for Christmas',now,'Europe/London'),null);
 const before=engine.constrain({title:'Buy gifts',original:'Buy gifts before Christmas'},settings,now,now);
 assert.equal(before.deadline,at('2026-12-25T00:00:00Z'));assert(before.next<before.deadline);
 assert.equal(timing.windowFor('Buy gifts for Christmas',at('2026-12-29T10:00:00Z'),'Europe/London').start,at('2027-12-18T00:00:00Z'));
});
test('overdue work has bounded follow-ups, even after many snoozes or a packed calendar',()=>{
 for(const title of ['Do the first Open University task','Book a waxing appointment']){
  const t={title,deadline:now-2*day,next:now,snoozes:99};
  for(const busy of [[],[{start:now,end:now+7*day}]]){
   const p=planner.plan(t,settings,busy,now,true);assert(p.next>now&&p.next<now+day);assert(p.urgent);assert(new Date(p.next).getHours()>=9&&new Date(p.next).getHours()<20);
  }
 }
});
test('unfinished flexible tasks keep returning for 60 deliveries without growing gaps',()=>{
 for(const pace of ['balanced','gentle']){
  let cursor=at('2026-11-06T10:00:00Z');const times=new Set();
  for(let i=0;i<60;i++){
   const p=planner.plan({title:'Work on this reminder app',snoozes:i,next:cursor},{...settings,pace},[],cursor,true);
   assert(p.next>cursor&&p.next-cursor<3*day);const d=new Date(p.next);assert(d.getHours()>=9&&d.getHours()<20);times.add(d.getHours()+':'+d.getMinutes());cursor=p.next;
  }
  assert(times.size>10);
 }
 const moments=new Set(Array.from({length:20},(_,i)=>planner.plan({title:'Project '+i},settings,[],now).next));assert(moments.size>10);
});
test('migration repairs saved automatic schedules once and preserves manual dates and snoozes',()=>{
 const tasks=[
  {id:'overdue',title:'Book waxing',deadline:now-2*day,next:now+9*day,created:now-4*day,planVersion:1},
  {id:'week',title:'Book dentist',original:'Book dentist next week',next:now+day,created:now,planVersion:1},
  {id:'christmas',title:'Arrange collection',original:'Arrange collection around Christmas',next:now+day,created:now,planVersion:1},
  {id:'manual',title:'My choice',manualTiming:true,deadline:now-day,next:now+9*day},
  {id:'custom',title:'Custom snooze',deadline:now-day,next:now+9*day,snoozedUntil:now+9*day},
  {id:'done',done:true,next:now+9*day}
 ];
 const sandbox={state:{tasks,settings},Date:class extends Date{static now(){return now}},NudgeTiming:timing,NudgeEngine:engine,NudgePlanner:planner,document:{addEventListener(){}},calendarBusy:()=>[],save(){},Map,console};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync('dashboard.js','utf8'),sandbox);vm.runInContext('refreshPlan()',sandbox);
 assert(tasks[0].next<now+day);assert(tasks[1].next>=at('2026-11-09T00:00:00Z'));assert(tasks[2].next>=at('2026-12-11T00:00:00Z'));
 for(const t of tasks.slice(3))assert.equal(t.next,now+9*day);
 const snapshot=JSON.stringify(tasks);vm.runInContext('refreshPlan()',sandbox);assert.equal(JSON.stringify(tasks),snapshot);
});
