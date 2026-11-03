const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const engine=require('../engine.js');
const now=Date.parse('2026-11-03T10:00:00Z'),deadline=now-86400000,settings={start:'09:00',end:'20:00'};
const edited={title:'Book dentist',original:'Book dentist before 1pm tomorrow',created:now-4*86400000,deadline,next:now,manualTiming:true};
assert.equal(engine.constrain(edited,settings,edited.created,now).deadline,deadline);
(async()=>{
 let actions=[],lastSync,opened;const handlers={};
 const tasks=[{id:'overdue',title:'Book dentist',next:100,deadline},{id:'done',next:100},{id:'edited',next:900},{id:'sample',next:100,demo:true}];
 const context={state:{tasks,settings},document:{addEventListener(){},querySelector(){return null}},recording:false,processing:false,voiceStarting:false,openDetail:id=>opened=id,save(){},render(){},toast(){},window:{addEventListener:(name,fn)=>handlers[name]=fn,NudgeNative:{request(raw){const r=JSON.parse(raw);if(r.method==='resume')queueMicrotask(()=>context.window.NativeBridge.resolve(r.id,{actions,editTaskId:'edited'},null));else{lastSync=r.args;queueMicrotask(()=>context.window.NativeBridge.resolve(r.id,{},null));}}}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('native.js','utf8'),context);
 actions=[{id:'overdue',type:'reschedule',previousNext:100,next:200},{id:'done',type:'done'},{id:'edited',type:'reschedule',previousNext:100,next:200}];
 await handlers['nudge:resume']();assert.equal(tasks[0].next,200);assert.equal(tasks[1].done,true);assert.equal(tasks[2].next,900);assert.equal(opened,'edited');
 context.window.NativeBridge.scheduleReminders();assert.deepEqual(Array.from(lastSync.tasks,t=>t.id),['overdue','edited']);
 const src=fs.readFileSync('app.js','utf8'),fn=src.slice(src.indexOf('function checkNudges()'),src.indexOf('\n',src.indexOf('function checkNudges()')));
 let posted=0,saved=0;class Notification{static permission='granted';constructor(){posted++}}
 const task={...edited,next:0,notified:now-1000},browser={window:{Notification},Notification,state:{tasks:[task],settings},NudgeEngine:engine,save(){saved++},Date,navigate(){}};
 vm.createContext(browser);vm.runInContext(fn,browser);browser.checkNudges();assert.equal(posted,1);assert(task.next>Date.now());assert.equal(saved,1);browser.checkNudges();assert.equal(posted,1);
 browser.window.NativeBridge={available:()=>true};task.next=0;browser.checkNudges();assert.equal(posted,1);
 console.log('Native resume, manual edit priority, sticky-note edit link, done/demo exclusion, old notified recovery and native/web deduplication passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
