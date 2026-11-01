/* Narrow, deterministic safeguards for casual gift ideas. Questions never mutate. */
(function(root){
const key=s=>String(s||'').trim().toLowerCase().replace(/[.!]+$/,'');
function giftIntent(text,people=[]){if(typeof text!=='string'||/[?？]\s*$/.test(text)||/^(?:what|would|could|do|does|is|can|which|show|tell|give)\b/i.test(text.trim()))return null;
 let cleaned=text.trim();for(let i=0;i<4;i++)cleaned=cleaned.replace(/^(?:oh[, ]*|yeah[, ]*|okay[, ]*|i\s+(?:think|reckon|bet)\s+(?:that\s+)?|maybe\s+)/i,'').trim();
 const match=cleaned.match(/^([\p{L}][\p{L}\p{M} '\-]{0,100}?)\s+(?:(?:would|might|may)\s+(?:really\s+)?(?:like|love|enjoy|want)|(?:might\s+)?appreciate)\s+(.+?)[.!]*$/iu);if(!match||/\b(?:but|and remind|also remind|because)\b/i.test(match[2]))return null;
 const name=match[1].trim(),value=match[2].trim().replace(/[.!]+$/,'');if(!value||name.split(/\s+/).length>4)return null;
 const matches=people.filter(p=>key(p.name)===key(name)||(p.aliases||[]).some(a=>key(a)===key(name)));if(matches.length>1)return null;const person=matches[0];
 return {personId:person?.id||null,name:person?.name||name,birthdayDay:null,birthdayMonth:null,birthdayYear:null,setPhoto:false,imageIndexes:[],entries:[{id:null,type:'gift',title:'',value,url:null,imageIndexes:[]}]};
}
function ensureGiftUpdate(text,people,updates){const gift=giftIntent(text,people);if(!gift)return updates;const out=structuredClone(updates);const person=out.find(u=>key(u.name)===key(gift.name)||gift.personId&&u.personId===gift.personId);if(!person)return [...out,gift];const entry=person.entries.find(e=>key(e.value).replace(/^a[n]?\s+/,'')===key(gift.entries[0].value).replace(/^a[n]?\s+/,''));if(entry)entry.type='gift';else person.entries.push(gift.entries[0]);return out;}
const api={giftIntent,ensureGiftUpdate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NudgeIntent=api;
})(typeof window!=='undefined'?window:globalThis);
