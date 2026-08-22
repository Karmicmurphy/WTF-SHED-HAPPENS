import './app-v4.js';

const V5_VERSION='0.5.0';
const CLIENT_KEY='wtf-shed-client-id';
const STATE_KEY='wtf-shed-happens-v4';
const TALK_KEY='wtf-shed-v5-talkback';

const $5=(s,r=document)=>r.querySelector(s);
const $$5=(s,r=document)=>[...r.querySelectorAll(s)];
let v5Health={capabilities:{}};
let mediaRecorder=null;
let mediaStream=null;
let mediaChunks=[];
let recordTimer=null;
let recordingTarget='';
let currentAudio=null;
let currentAudioUrl='';
let browserRecognition=null;
let talkBack=localStorage.getItem(TALK_KEY)!=='false';

function clientId(){
  let id=localStorage.getItem(CLIENT_KEY);
  if(!id){id=crypto.randomUUID();localStorage.setItem(CLIENT_KEY,id)}
  return id;
}

function currentProject(){
  try{
    const s=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
    if(!s?.projects?.length)return {};
    return s.projects.find(x=>x.id===s.activeProjectId)||s.projects[0]||{};
  }catch{return {}}
}

async function api5(path,options={}){
  const headers=new Headers(options.headers||{});
  headers.set('x-wtf-client',clientId());
  if(options.body && !(options.body instanceof FormData) && !headers.has('content-type'))headers.set('content-type','application/json');
  return fetch(path,{...options,headers});
}

function setVoiceStatus(text,mode=''){
  const el=$5('#voiceState');
  if(el){el.textContent=text;el.dataset.mode=mode}
  const fab=$5('#voiceFab');
  if(fab)fab.classList.toggle('recording',mode==='recording');
}

function esc5(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function browserSpeak(text){
  if(!('speechSynthesis'in window))return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(String(text).replace(/\s+/g,' ').slice(0,5000));
  u.rate=.96;u.pitch=1;
  speechSynthesis.speak(u);
}

function stopTalk(){
  try{currentAudio?.pause()}catch{}
  currentAudio=null;
  if(currentAudioUrl){URL.revokeObjectURL(currentAudioUrl);currentAudioUrl=''}
  if('speechSynthesis'in window)speechSynthesis.cancel();
  setVoiceStatus('VOICE READY');
}

async function speak5(text){
  const clean=String(text||'').replace(/\s+/g,' ').trim();
  if(!clean)return;
  stopTalk();
  setVoiceStatus('TALKING…','talking');
  if(v5Health.capabilities?.cloudTTS){
    try{
      const res=await api5('/api/tts',{method:'POST',body:JSON.stringify({text:clean.slice(0,3400)})});
      if(!res.ok)throw new Error('cloud tts unavailable');
      const blob=await res.blob();
      currentAudioUrl=URL.createObjectURL(blob);
      currentAudio=new Audio(currentAudioUrl);
      currentAudio.onended=()=>setVoiceStatus('VOICE READY');
      currentAudio.onerror=()=>{setVoiceStatus('VOICE READY');browserSpeak(clean)};
      await currentAudio.play();
      return;
    }catch{}
  }
  browserSpeak(clean);
  setTimeout(()=>setVoiceStatus('VOICE READY'),500);
}

function screenText(){
  const view=$5('#view');
  if(!view)return '';
  return view.innerText.replace(/\s+/g,' ').trim().slice(0,3400);
}

function readScreen5(){
  const text=screenText();
  if(text)speak5(text);
}

function findRoute(name){
  return $5(`.banner-nav [data-route="${name}"]`)||$5(`.dock [data-route="${name}"]`)||$5(`[data-route="${name}"]`);
}

function handleTranscript(text){
  const q=String(text||'').trim();
  if(!q)return;
  setVoiceStatus(`HEARD: ${q}`);
  const low=q.toLowerCase();
  if(/\b(stop talking|stop speaking|shut up|quiet)\b/.test(low)){stopTalk();return}
  if(/\b(read this|read screen|read it|talk back)\b/.test(low)){readScreen5();return}
  const routes=[
    [/\b(open )?(build|build mode)\b/,'build'],
    [/\b(open )?(plan|blueprint)\b/,'plan'],
    [/\b(open )?(my shit|materials|inventory)\b/,'stash'],
    [/\b(open )?(look|photo|camera)\b/,'look'],
    [/\b(open )?library\b/,'library']
  ];
  for(const [re,route]of routes){if(re.test(low)){findRoute(route)?.click();return}}
  if(/\b(home|my build)\b/.test(low)){$5('.banner-logo')?.click();return}
  openAssistant(q,true);
}

function browserSTT(targetId=''){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){alert('This browser cannot do browser speech recognition, and Cloudflare microphone recording was unavailable. You can still type.');return}
  try{browserRecognition?.abort()}catch{}
  browserRecognition=new SR();
  browserRecognition.lang='en-US';
  browserRecognition.interimResults=false;
  browserRecognition.continuous=false;
  setVoiceStatus('LISTENING…','recording');
  browserRecognition.onresult=e=>{
    const text=e.results?.[0]?.[0]?.transcript?.trim()||'';
    if(targetId&&$5('#'+targetId)){$5('#'+targetId).value=text;setVoiceStatus(`HEARD: ${text}`)}
    else handleTranscript(text);
  };
  browserRecognition.onerror=()=>setVoiceStatus('VOICE READY');
  browserRecognition.onend=()=>setTimeout(()=>{if($5('#voiceState')?.dataset.mode==='recording')setVoiceStatus('VOICE READY')},200);
  browserRecognition.start();
}

function stopMediaTracks(){
  try{mediaStream?.getTracks().forEach(t=>t.stop())}catch{}
  mediaStream=null;
  clearTimeout(recordTimer);recordTimer=null;
}

async function finishRecording(){
  if(!mediaRecorder||mediaRecorder.state==='inactive')return;
  mediaRecorder.stop();
}

async function sendAudio(blob,targetId=''){
  setVoiceStatus('TRANSCRIBING…','working');
  try{
    const fd=new FormData();
    fd.append('audio',new File([blob],'voice.webm',{type:blob.type||'audio/webm'}));
    const res=await api5('/api/stt',{method:'POST',body:fd});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.message||data.error||'STT failed');
    const text=String(data.text||'').trim();
    if(targetId&&$5('#'+targetId)){$5('#'+targetId).value=text;setVoiceStatus(`HEARD: ${text}`)}
    else handleTranscript(text);
  }catch{
    setVoiceStatus('CLOUD STT FAILED — TRYING BROWSER');
    browserSTT(targetId);
  }
}

async function startCloudMic(targetId=''){
  if(mediaRecorder&&mediaRecorder.state==='recording'){finishRecording();return}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){browserSTT(targetId);return}
  try{
    mediaStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    const preferred=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];
    const mime=preferred.find(x=>MediaRecorder.isTypeSupported?.(x))||'';
    mediaChunks=[];
    recordingTarget=targetId;
    mediaRecorder=new MediaRecorder(mediaStream,mime?{mimeType:mime}:undefined);
    mediaRecorder.ondataavailable=e=>{if(e.data?.size)mediaChunks.push(e.data)};
    mediaRecorder.onstop=async()=>{
      const blob=new Blob(mediaChunks,{type:mediaRecorder.mimeType||'audio/webm'});
      stopMediaTracks();mediaRecorder=null;mediaChunks=[];
      if(blob.size)await sendAudio(blob,recordingTarget);
      else setVoiceStatus('VOICE READY');
    };
    mediaRecorder.start();
    setVoiceStatus('LISTENING — TAP AGAIN TO STOP','recording');
    recordTimer=setTimeout(()=>finishRecording(),45000);
  }catch{
    stopMediaTracks();
    browserSTT(targetId);
  }
}

function ensureAssistant(){
  if($5('#aiDialogV5'))return;
  document.body.insertAdjacentHTML('beforeend',`<dialog id="aiDialogV5" class="v5-dialog"><form method="dialog" class="voice-desk steel-card"><button class="close" value="close" aria-label="Close">×</button><div class="voice-desk-head"><span class="voice-orb">WTF?</span><div><p class="eyebrow">ASK WTF</p><h3>Say it normal. I'll translate the carpenter shit.</h3></div></div><textarea id="aiQuestionV5" class="input" rows="4" placeholder="What the fuck is this? What do I do next? Can I use what I already have?"></textarea><div class="voice-grid"><button type="button" id="aiMicV5" class="secondary">🎙 TALK</button><button type="button" id="aiAskV5" class="primary">ASK WTF</button><button type="button" id="aiReadV5" class="secondary">🔊 READ ANSWER</button><button type="button" id="aiStopV5" class="secondary">■ STOP VOICE</button></div><div id="aiResultV5" class="ai-result-v5"></div><label class="talk-toggle"><input id="talkBackV5" type="checkbox" ${talkBack?'checked':''}> TALK BACK AFTER ANSWERS</label><p class="tiny muted">Cloudflare AI when available. Browser voice is the fallback. No provider key required.</p></form></dialog>`);
  $5('#aiMicV5').onclick=()=>startCloudMic('aiQuestionV5');
  $5('#aiAskV5').onclick=askAssistant;
  $5('#aiReadV5').onclick=()=>speak5($5('#aiResultV5')?.innerText||'');
  $5('#aiStopV5').onclick=stopTalk;
  $5('#talkBackV5').onchange=e=>{talkBack=e.target.checked;localStorage.setItem(TALK_KEY,String(talkBack))};
}

function openAssistant(seed='',auto=false){
  ensureAssistant();
  $5('#aiQuestionV5').value=seed||'';
  $5('#aiResultV5').innerHTML='';
  $5('#aiDialogV5').showModal();
  if(auto&&seed)askAssistant();
}

async function askAssistant(){
  const message=$5('#aiQuestionV5').value.trim();
  if(!message)return;
  const out=$5('#aiResultV5');
  out.innerHTML='<div class="ai-answer-v5"><b>WTF is thinking…</b></div>';
  try{
    const res=await api5('/api/assistant',{method:'POST',body:JSON.stringify({message,project:currentProject()})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.message||data.error||'AI failed');
    out.innerHTML=`<div class="ai-answer-v5">${esc5(data.response)}</div>`;
    if(talkBack)speak5(data.response);
  }catch(e){out.innerHTML=`<div class="notice">ASK WTF failed: ${esc5(e.message)}</div>`}
}

function ensureStackDialog(){
  if($5('#stackDialog'))return;
  document.body.insertAdjacentHTML('beforeend',`<dialog id="stackDialog" class="v5-dialog"><form method="dialog" class="steel-card stack-dialog"><button class="close" value="close" aria-label="Close">×</button><p class="eyebrow">CLOUDFLARE FREE-FIRST STACK</p><h3>What's actually alive?</h3><div id="stackList"></div><p class="tiny muted">Green means the live Worker reports the feature active. Gray means support is scaffolded or waiting for an account resource.</p></form></dialog>`);
}

function renderStack(){
  ensureStackDialog();
  const c=v5Health.capabilities||{};
  const items=[
    ['Workers + Static Assets',c.worker&&c.staticAssets],
    ['Durable Objects cloud backup',c.durableObjects],
    ['Workers AI / ASK WTF',c.workersAI],
    ['AI Gateway',c.aiGateway],
    ['Image / document understanding',c.imageUnderstanding],
    ['Cloudflare STT (Whisper)',c.cloudSTT],
    ['Cloudflare TTS (MeloTTS)',c.cloudTTS],
    ['Browser Run app research',c.browserRun],
    ['Analytics Engine',c.analyticsEngine],
    ['PWA / offline shell',c.pwa],
    ['D1 optional binding',c.optionalBindings?.d1],
    ['R2 optional binding',c.optionalBindings?.r2],
    ['KV optional binding',c.optionalBindings?.kv],
    ['Vectorize optional binding',c.optionalBindings?.vectorize],
    ['Queues optional binding',c.optionalBindings?.queues]
  ];
  $5('#stackList').innerHTML=items.map(([name,on])=>`<div class="stack-row"><span>${esc5(name)}</span><b class="${on?'stack-on':'stack-off'}">${on?'LIVE':'READY / NOT BOUND'}</b></div>`).join('');
  $5('#stackDialog').showModal();
}

async function loadV5Health(){
  try{
    const res=await api5('/api/health');
    v5Health=await res.json();
    if(v5Health.version)$5('#version').textContent=`v${v5Health.version}`;
    const chip=$5('#stackChip');
    if(chip){
      const c=v5Health.capabilities||{};
      const score=[c.durableObjects,c.workersAI,c.cloudSTT,c.cloudTTS,c.browserRun,c.analyticsEngine].filter(Boolean).length;
      chip.textContent=`CF ${score}/6 LIVE`;
      chip.classList.toggle('off',score<4);
    }
  }catch{}
}

function inferTarget(button){
  if(button.dataset.voiceTarget)return button.dataset.voiceTarget;
  const box=button.closest('.steel-card');
  const field=box?.querySelector('textarea[id],input[id][type="text"],input[id]:not([type])');
  return field?.id||'';
}

function installInterceptors(){
  document.addEventListener('click',e=>{
    const ai=e.target.closest?.('[data-ai-open]');
    if(ai){e.preventDefault();e.stopImmediatePropagation();openAssistant();return}
    const vb=e.target.closest?.('[data-voice],[data-voice-target]');
    if(vb){e.preventDefault();e.stopImmediatePropagation();startCloudMic(inferTarget(vb));return}
  },true);

  if($5('#bannerTalk'))$5('#bannerTalk').onclick=()=>startCloudMic();
  if($5('#bannerAI'))$5('#bannerAI').onclick=()=>openAssistant();
  if($5('#bannerRead'))$5('#bannerRead').onclick=readScreen5;
  if($5('#wtfButton'))$5('#wtfButton').onclick=()=>openAssistant("Explain what I'm looking at on this screen in stupid simple terms.",true);
  if($5('#voiceFab'))$5('#voiceFab').onclick=()=>startCloudMic();
  if($5('#stackButton'))$5('#stackButton').onclick=renderStack;
  if($5('#stackChip'))$5('#stackChip').onclick=renderStack;
}

$5('#version')&&($5('#version').textContent=`v${V5_VERSION}`);
installInterceptors();
loadV5Health();
setVoiceStatus('VOICE READY');
