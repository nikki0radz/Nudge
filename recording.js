let mediaRecorder=null,mediaStream=null,voiceStarting=false,audioLimitTimer=null,pendingAudio=null;
async function restoreAudio(){try{pendingAudio=await NudgeAI.audioStore('get');if(pendingAudio&&page==='home')enhanceHome();}catch{}}
function voiceUI(active){const button=document.querySelector('#record');if(!button)return;button.classList.toggle('recording',active);button.innerHTML=ico(active?'stop':'mic');button.setAttribute('aria-label',active?'Stop and save voice reminder':'Start voice reminder');document.querySelector('#record-label').textContent=active?'Recording · tap to save':'Tap to tell me';document.querySelector('#wave').classList.toggle('live',active);}
async function toggleAIVoice(){
 if(voiceStarting||processing)return;
 if(recording){if(mediaRecorder?.state==='recording'){mediaRecorder.stop();voiceUI(false);document.querySelector('#record-label').textContent='Keeping your recording…';}return;}
 if(pendingAudio){toast('There’s a recording waiting below. Retry or download it first.');return;}
 if(!NudgeAI.token()){navigate('settings');toast('Enter your private access code once to connect voice and AI.');return;}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('This browser can’t record audio here. You can type or use your keyboard’s microphone.');document.querySelector('#composer').hidden=false;return;}
 voiceStarting=true;
 try{
  mediaStream=await navigator.mediaDevices.getUserMedia({audio:true});const chunks=[];
  const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  mediaRecorder=new MediaRecorder(mediaStream,mime?{mimeType:mime}:{});
  mediaRecorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  mediaRecorder.onerror=()=>{toast('Recording was interrupted. Trying to keep any audio captured.');if(mediaRecorder.state==='recording')mediaRecorder.stop();};
  mediaRecorder.onstop=async()=>{clearTimeout(audioLimitTimer);mediaStream?.getTracks().forEach(t=>t.stop());recording=false;voiceStarting=false;const blob=new Blob(chunks,{type:mediaRecorder.mimeType||mime||'audio/webm'});if(!blob.size){render();toast('No audio was captured. Please try again.');return;}pendingAudio={blob,name:blob.type.includes('mp4')?'thought.mp4':'thought.webm'};try{await NudgeAI.audioStore('put',pendingAudio);}catch{toast('Your recording is kept in this tab only. Download it below before closing.');}await processAudio();};
  mediaRecorder.start(1000);recording=true;voiceStarting=false;voiceUI(true);audioLimitTimer=setTimeout(()=>{if(mediaRecorder.state==='recording'){mediaRecorder.stop();toast('Five-minute recording saved.');}},300000);
 }catch{mediaStream?.getTracks().forEach(t=>t.stop());voiceStarting=false;recording=false;toast('Microphone access is unavailable. Allow it in browser settings, or type your thought.');}
}
async function processAudio(){if(!pendingAudio||processing)return;processing=true;renderBusy('Turning your voice into a thought…');try{const form=new FormData();form.set('file',pendingAudio.blob,pendingAudio.name);const result=await NudgeAI.call('/api/transcribe',form);setDraft(result.text);try{await NudgeAI.audioStore('delete');}catch{}pendingAudio=null;processing=false;await capture(result.text);}catch(error){processing=false;render();toast(error.message);}}
function downloadAudio(){if(!pendingAudio)return;const url=URL.createObjectURL(pendingAudio.blob),a=document.createElement('a');a.href=url;a.download='nudge-'+pendingAudio.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
window.addEventListener('beforeunload',e=>{if(recording||processing){e.preventDefault();e.returnValue='';}});
restoreAudio();
