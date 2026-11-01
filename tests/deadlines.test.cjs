const assert=require('node:assert/strict');
const timing=require('../timing.js'),engine=require('../engine.js');
const now=Date.parse('2026-11-01T19:26:00Z'),cutoff=Date.parse('2026-11-02T13:00:00Z'),badNext=Date.parse('2026-11-02T17:44:00Z');
const settings={start:'09:00',end:'20:00'};
for(const clock of ['1p.m.','1 p.m.','1 p. m.','1pm','1 pm','13:00']){
 const text=`Please remind me at some point before ${clock} tomorrow to book a waxing appointment.`;
 assert.equal(timing.extractDeadline(text,now,'Europe/London'),cutoff);
 const parsed=engine.parseDate(text,settings,now);assert.equal(parsed.deadline,cutoff);assert(parsed.next<cutoff);assert(parsed.next>now);
 const repaired=engine.constrain({original:text,title:'Book waxing',next:badNext,timing:'automatic',deadline:null},settings,now,now);
 assert.equal(repaired.deadline,cutoff);assert.equal(repaired.next,Date.parse('2026-11-02T12:00:00Z'));
}
assert.equal(timing.extractDeadline('Remind me before tomorrow at 1 p.m. to book waxing.',now,'Europe/London'),cutoff);
assert.equal(timing.extractDeadline('Buy Monster before I see Ellie tomorrow',now,'Europe/London'),null);
assert.equal(timing.extractDeadline('Update diary app next week',now,'Europe/London'),null);
assert.equal(timing.extractDeadline('Before 9 a.m. tomorrow, call Mum',now,'Europe/London'),Date.parse('2026-11-02T09:00:00Z'));
assert.equal(timing.extractDeadline('Before 1pm tomorrow',Date.parse('2026-07-01T19:00:00Z'),'Europe/London'),Date.parse('2026-07-02T12:00:00Z'));
assert.equal(timing.extractDeadline('Before 1pm tomorrow',Date.parse('2026-10-24T19:00:00Z'),'Europe/London'),Date.parse('2026-10-25T13:00:00Z'));
assert.equal(timing.extractDeadline('Before 1pm tomorrow',Date.parse('2026-11-02T01:30:00Z'),'America/Los_Angeles'),Date.parse('2026-11-02T21:00:00Z'));
assert.equal(timing.extractDeadline('Tomorrow, remind me before 1pm to book waxing',now,'Europe/London'),cutoff);
assert.equal(timing.schedule(Date.parse('2026-11-02T08:00:00Z'),cutoff,settings,now,'Europe/London'),Date.parse('2026-11-02T08:00:00Z'));
const original='Please remind me at some point before 1p.m. tomorrow to book a waxing appointment.';
const task={title:'Book waxing',original,created:now,next:badNext,deadline:null};
assert(engine.repairDeadlines([task],settings,Date.parse('2026-11-02T08:00:00Z')));assert.equal(task.deadline,cutoff);assert(task.next<cutoff);assert(!engine.repairDeadlines([task],settings));
const snoozed=engine.constrain({...task,next:engine.choose('snoozed',settings,now)},settings,task.created,now);assert(snoozed.next<cutoff);
const quietConflict=timing.schedule(badNext,cutoff,{start:'14:00',end:'20:00'},now,'Europe/London');assert(quietConflict<cutoff);assert(quietConflict>now);
const imminent=now+30000;assert(timing.schedule(badNext,imminent,settings,now,'Europe/London')<imminent);
const passed=engine.constrain(task,settings,task.created,cutoff+3600000);assert.equal(passed.deadline,cutoff);assert.equal(passed.context,'The requested deadline has passed.');
console.log('Deadline extraction, dotted am/pm, before/by constraints, quiet hours, DST, timezone, snooze and saved-task repair passed.');
