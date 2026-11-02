/* Apply before first paint; the setting is also included in app backups. */
(function(){
 const root=document.documentElement,system=window.matchMedia('(prefers-color-scheme: dark)');
 let mode='system';try{mode=localStorage.getItem('nudge.appearance')||'system';}catch{}
 function apply(value){mode=['light','dark','system'].includes(value)?value:'system';const dark=mode==='dark'||mode==='system'&&system.matches;root.dataset.theme=dark?'dark':'light';root.style.colorScheme=dark?'dark':'light';document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#262126':'#fffaf0');try{localStorage.setItem('nudge.appearance',mode);}catch{}if(window.NativeBridge?.available())NativeBridge.call('appearance',{dark}).catch(()=>{});return mode;}
 window.NudgeTheme={apply,get mode(){return mode;}};
 if(system.addEventListener)system.addEventListener('change',()=>{if(mode==='system')apply(mode);});else if(system.addListener)system.addListener(()=>{if(mode==='system')apply(mode);});
 apply(mode);
})();
