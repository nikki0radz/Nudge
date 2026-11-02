const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const rules=require('../calendar-rules.js');
const preferences=require('../calendar-preferences.js');
const collection=require('../assets/stickers/approved-collection.json');
test('all fifty approved stickers exist and are accepted by each picker and AI schema',()=>{
 assert.equal(collection.length,50);assert.equal(new Set(collection.map(x=>x.key)).size,50);
 const ui=fs.readFileSync('calendar.js','utf8').match(/const CALENDAR_STICKER_KEYS=(\[[^;]+\]);/)[1];
 const api=fs.readFileSync('calendar-tidy-api.mjs','utf8').match(/const stickers=(\[[^;]+\]);/)[1];
 assert.deepEqual(JSON.parse(ui.replaceAll("'",'"')),rules.stickers);
 assert.deepEqual(JSON.parse(api.replaceAll("'",'"')),['',...rules.stickers]);
 for(const [i,{number,key,name}] of collection.entries()){
  assert.equal(number,i+1);assert(name);assert(rules.stickers.includes(key));
  assert.equal(fs.readFileSync('assets/stickers/'+key+'.png').subarray(0,8).toString('hex'),'89504e470d0a1a0a',key);
 }
});
test('every approved sticker survives label and rule persistence',()=>{
 const state={calendarLabels:collection.map(({key},i)=>({id:'custom-sticker-'+i,name:'Label '+i,colour:'#92749c',sticker:key,updatedAt:1})),calendarRules:collection.map(({key},i)=>({mode:'title',pattern:'Occasion '+i,category:'custom-sticker-'+i,sticker:key,updatedAt:1}))};
 const records=new Map(),storage={getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v)};
 assert(preferences.persist(state,storage));const restored={};preferences.restore(restored,storage);
 for(const [i,{key}] of collection.entries()){
  assert.equal(restored.calendarLabels.find(x=>x.id==='custom-sticker-'+i).sticker,key);
  assert.equal(rules.matchingRule({title:'Occasion '+i},restored.calendarRules).sticker,key);
 }
 assert.equal(rules.cleanLabel({id:'custom-original',name:'Original',colour:'#92749c',sticker:'therapy',updatedAt:1}).sticker,'therapy');
});
