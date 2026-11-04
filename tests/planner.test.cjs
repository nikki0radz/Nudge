const test=require('node:test'),assert=require('node:assert/strict'),{plan}=require('../planner.js'),{listLikes}=require('../intent.js');
const now=+new Date(2026,10,4,9),day=86400000,h=3600000;
const assignment={title:'Submit TMA',deadline:now+day,next:now,snoozes:2};
test('a near academic deadline outranks overdue beauty, distant Christmas stays quiet',()=>{
 assert(plan(assignment,{},[],now).score>plan({title:'Book a wax',next:now,deadline:now-3*day},{},[],now).score);
 const p=plan({title:'Book waste collection',deadline:+new Date(2026,11,25),next:now},{},[],now,true);
 assert(!p.urgent);assert(p.next>now+30*day&&p.next<+new Date(2026,11,25));
});
test('a clear block before shifts is selected in waking hours; backlog stays off dashboard',()=>{
 const busy=[{start:now,end:now+11*h},{start:now+2*day,end:now+3*day}];
 const p=plan({...assignment,deadline:now+3*day},{},busy,now);assert(p.next>=now+day&&p.next<now+2*day);assert(p.reason.includes('clear'));
 const backlog=plan({title:'Clean bedroom',next:now,backlog:true},{},[],now,true);assert(!backlog.urgent);assert(backlog.next>=now+7*day);
});
test('split explicitly listed games for exactly one named saved person',()=>{
 const people=[{name:'Owen',id:'o',entries:[]}],text='Add Portal 2 and Slay the Spire to things Owen likes';
 assert.deepEqual(listLikes(text,people).entries.map(e=>e.value),['Portal 2','Slay the Spire']);assert.equal(listLikes(text,[...people,...people]),null);
});
