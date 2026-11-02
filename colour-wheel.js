(function(root){
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,Number(v)||0));
function toHex(h,s,v){h=((h%360)+360)%360;s=clamp(s);v=clamp(v);const c=v*s,x=c*(1-Math.abs(h/60%2-1)),m=v-c;const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('');}
function fromHex(hex){if(typeof hex!=='string'||!/^#[a-f0-9]{6}$/i.test(hex))hex='#92749c';const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;const h=!d?0:max===r?60*((g-b)/d%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4);return {h:(h+360)%360,s:max?d/max:0,v:max};}
function point(x,y,radius){return {h:(Math.atan2(x,-y)*180/Math.PI+360)%360,s:clamp(Math.hypot(x,y)/radius)};}
const api={toHex,fromHex,point,clamp};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NudgeColour=api;
})(typeof window!=='undefined'?window:globalThis);
