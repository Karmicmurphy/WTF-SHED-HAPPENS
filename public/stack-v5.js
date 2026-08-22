const $S=s=>document.querySelector(s);
let healthS={capabilities:{}};

function escS(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

async function loadStackHealth(){
  try{
    const res=await fetch('/api/stack',{headers:{'x-wtf-client':localStorage.getItem('wtf-shed-client-id')||''}});
    healthS=await res.json();
    updateChip();
  }catch{}
}

function serviceRows(){
  const c=healthS.capabilities||{},s=c.storage||{},o=c.optionalBindings||{};
  return [
    ['Workers + Static Assets',c.worker&&c.staticAssets,'app + API'],
    ['Durable Objects',c.durableObjects,'private per-browser project backup'],
    ['Workers AI',c.workersAI,'ASK WTF + vision'],
    ['AI Gateway',c.aiGateway,'AI cache / observability'],
    ['Cloudflare STT',c.cloudSTT,'Whisper speech to text'],
    ['Cloudflare TTS',c.cloudTTS,'MeloTTS talk back'],
    ['Browser Run',c.browserRun,'project-only web research'],
    ['KV',s.kv||o.kv,'research cache'],
    ['D1',s.d1||o.d1,'structured reference library'],
    ['R2',s.r2||o.r2,'research document storage'],
    ['Queues',s.queues||o.queues,'background indexing'],
    ['AI Search',s.aiSearch||o.aiSearch,'semantic WTF reference search'],
    ['Analytics Engine',c.analyticsEngine,'lightweight usage events'],
    ['PWA / Offline Shell',c.pwa,'field-use app shell']
  ];
}

function updateChip(){
  const rows=serviceRows(),live=rows.filter(x=>x[1]).length;
  const chip=$S('#stackChip');
  if(chip){chip.textContent=`CF ${live}/${rows.length} LIVE`;chip.classList.toggle('off',live<8)}
}

function showStack(){
  let d=$S('#stackDialogPlus');
  if(!d){
    d=document.createElement('dialog');
    d.id='stackDialogPlus';d.className='v5-dialog';
    document.body.appendChild(d);
  }
  const rows=serviceRows();
  d.innerHTML=`<form method="dialog" class="steel-card stack-dialog"><button class="close" value="close" aria-label="Close">×</button><p class="eyebrow">CLOUDFLARE FREE-FIRST STACK</p><h3>What's actually alive right now?</h3><div>${rows.map(([name,on,why])=>`<div class="stack-row"><span><b>${escS(name)}</b><small>${escS(why)}</small></span><strong class="${on?'stack-on':'stack-off'}">${on?'LIVE':'NOT BOUND'}</strong></div>`).join('')}</div><p class="tiny muted">This screen comes from the live Worker. It does not claim a service is active just because code exists for it.</p><div class="small-actions"><button type="button" class="secondary" id="stackRefresh">REFRESH</button><button class="primary" value="close">DONE</button></div></form>`;
  d.showModal();
  $S('#stackRefresh').onclick=async()=>{await loadStackHealth();showStack()};
}

function install(){
  const button=$S('#stackButton'),chip=$S('#stackChip');
  if(button)button.onclick=showStack;
  if(chip)chip.onclick=showStack;
  loadStackHealth();
}

install();
