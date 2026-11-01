const assert=require('node:assert/strict');const e=require('../engine.js');const now=new Date(2026,10,1,12).getTime();const settings={start:'09:00',end:'20:00'};
const shopping=e.parse('Remind me to buy Ellie some Monster before I next see her',settings,now);assert(shopping.tags.includes('Shopping'));assert(shopping.tags.includes('Ellie'));assert.equal(shopping.timing,'context');assert(shopping.next>now);
const nextWeek=e.parse('Remind me to update my diary app next week',settings,now);assert.equal(new Date(nextWeek.next).getDate(),8);assert.equal(nextWeek.timing,'spoken');
const deadline=e.parse('Remind me to renew my card before next Tuesday',settings,now);assert.equal(new Date(deadline.deadline).getDay(),2);assert(deadline.next<deadline.deadline);assert(deadline.next>now);
const fixed=e.parse('Call Mum tomorrow at 8pm',settings,now);assert.equal(new Date(fixed.next).getHours(),20);
const minutes=e.parse('Call Mum in 10 minutes',settings,now);assert.equal(minutes.next,now+600000);
assert(e.duplicate('Update my diary app next week','Do my diary app'));assert(!e.duplicate('Buy Ellie Monster','Buy milk'));
for(let i=0;i<100;i++){const t=e.choose('Task '+i,settings,now);assert(t>now);assert(new Date(t).getHours()>=9);assert(new Date(t).getHours()<20);}
assert.equal(new Date(e.windowTime(new Date(2026,10,1,23).getTime(),settings)).getHours(),9);console.log('Scheduling, context, tagging and duplicate checks passed.');
