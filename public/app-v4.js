const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const VERSION='0.4.0';
const KEY='wtf-shed-happens-v4', CLIENT_KEY='wtf-shed-client-id';

const TYPES={
  shed:{label:'Shed',stages:['Site','Foundation','Floor','Walls','Roof','Door','Exterior']},
  cabin:{label:'Cabin / Tiny House',stages:['Idea','Site','Foundation','Floor','Walls','Roof','Doors & Windows','Exterior','Insulation','Interior','Plumbing','Electrical']},
  house:{label:'House',stages:['Idea','Site','Foundation','Floor','Walls','Roof','Doors & Windows','Exterior','Insulation','Plumbing','Electrical','Interior']},
  workshop:{label:'Workshop',stages:['Idea','Site','Foundation','Floor','Walls','Roof','Doors & Windows','Exterior','Electrical','Interior']},
  garage:{label:'Garage',stages:['Idea','Site','Foundation','Floor','Walls','Roof','Doors & Windows','Exterior','Electrical']},
  deck:{label:'Deck',stages:['Idea','Site','Footings','Beams','Joists','Decking','Rails / Steps']},
  coop:{label:'Chicken Coop',stages:['Idea','Site','Foundation','Floor','Walls','Roof','Door','Run / Exterior']},
  other:{label:'Other',stages:['Idea','Site','Foundation','Floor','Walls','Roof','Exterior']}
};

const blankState=()=>({
  route:'home',
  activeProjectId:null,
  projects:[],
  talkBack:true,
  cloudSync:true,
  updatedAt:new Date().toISOString()
});

const starter24=()=>({
  id:crypto.randomUUID(),
  name:'My 24 × 16 Shed',
  type:'shed',
  length:24,width:16,wallHeight:10,
  priority:'use-what-i-have',
  stage:'Floor',
  floor:{joistSpacing:24,runnerCount:3,status:'planning'},
  inventory:[
    {id:crypto.randomUUID(),name:"2×12 × 20'",qty:3,source:'HAVE',condition:'CHECK',note:'Existing long runner stock'},
    {id:crypto.randomUUID(),name:"2×6 × 16'",qty:0,source:'COUNT IT',condition:'UNKNOWN',note:'Potential floor joists'},
    {id:crypto.randomUUID(),name:'Cinder blocks',qty:0,source:'COUNT IT',condition:'CHECK',note:'Foundation/support inventory'}
  ],
  notes:[],research:[],completedSteps:[]
});

const customProject=(type='shed',length=8,width=10,height=8,priority='cheapest',name='')=>({
  id:crypto.randomUUID(),
  name:name||`My ${length} × ${width} ${TYPES[type]?.label||'Build'}`,
  type,length,width,wallHeight:height,priority,
  stage:(TYPES[type]?.stages||TYPES.other.stages)[0],
  floor:{joistSpacing:24,runnerCount:3,status:'planning'},
  inventory:[],notes:[],research:[],completedSteps:[]
});

function migrate(){
  try{
    const v4=JSON.parse(localStorage.getItem(KEY)||'null');
    if(v4?.projects) return v4;
    const v3=JSON.parse(localStorage.getItem('wtf-shed-happens-v3')||'null');
    if(v3?.projects) return {...blankState(),...v3,updatedAt:new Date().toISOString()};
    const v2=JSON.parse(localStorage.getItem('wtf-shed-happens-v2')||'null');
    if(v2?.project){
      const x=customProject('shed',Number(v2.project.length)||24,Number(v2.project.width)||16,Number(v2.project.wallHeight)||10,'use-what-i-have',v2.project.name||'My Build');
      x.floor={...x.floor,...(v2.floor||{})};x.inventory=v2.inventory||[];x.notes=v2.notes||[];x.completedSteps=v2.completedSteps||[];
      return {...blankState(),projects:[x],activeProjectId:x.id};
    }
  }catch{}
  return blankState();
}

let state=migrate(), health={capabilities:{}}, cloudTimer=null, lastVision=null, recognition=null;
const clientId=(()=>{
  let id=localStorage.getItem(CLIENT_KEY);
  if(!id){id=crypto.randomUUID();localStorage.setItem(CLIENT_KEY,id)}
  return id;
})();

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const p=()=>state.projects.find(x=>x.id===state.activeProjectId)||state.projects[0]||null;
const type=x=>TYPES[x?.type]||TYPES.other;
const stages=x=>type(x).stages;
const floorMath=x=>{
  const spacing=Number(x?.floor?.joistSpacing)||24;
  const bays=Math.ceil((Number(x?.length)||0)*12/spacing);
  return {spacing,lines:bays+1,interior:Math.max(0,bays-1),unsupported:(Number(x?.width)||0)/Math.max(1,(Number(x?.floor?.runnerCount)||3)-1)};
};

function persist({cloud=true}={}){
  state.updatedAt=new Date().toISOString();
  localStorage.setItem(KEY,JSON.stringify(state));
  if(cloud&&state.cloudSync&&health.capabilities?.durableObjects){
    clearTimeout(cloudTimer);
    cloudTimer=setTimeout(cloudSave,900);
  }
}

async function api(path,options={}){
  const headers=new Headers(options.headers||{});
  headers.set('x-wtf-client',clientId);
  if(options.body && !(options.body instanceof FormData) && !headers.has('content-type')) headers.set('content-type','application/json');
  const res=await fetch(path,{...options,headers});
  let data={};
  try{data=await res.json()}catch{}
  if(!res.ok) throw new Error(data.message||data.error||`HTTP ${res.status}`);
  return data;
}

async function getHealth(){
  try{
    health=await api('/api/health');
    $('#version') && ($('#version').textContent=`v${health.version||VERSION}`);
    renderCloudBadge();
  }catch{}
}

async function cloudSave(){
  try{await api('/api/cloud/save',{method:'POST',body:JSON.stringify({snapshot:state})});renderCloudBadge(true)}
  catch{renderCloudBadge(false)}
}

async function cloudLoad(){
  if(!state.cloudSync) return;
  try{
    const r=await api('/api/cloud/load');
    const remote=r.snapshot;
    if(remote?.projects && String(remote.updatedAt||'')>String(state.updatedAt||'')){
      state=remote;
      localStorage.setItem(KEY,JSON.stringify(state));
      route(state.route||'home',{save:false});
    }
    renderCloudBadge(true);
  }catch{renderCloudBadge(false)}
}

function renderCloudBadge(ok){
  const el=$('#cloudBadge'); if(!el) return;
  const on=ok!==false && health.capabilities?.durableObjects && state.cloudSync;
  el.textContent=on?'CLOUD ON':'LOCAL';
  el.classList.toggle('off',!on);
}

function shell(html){$('#view').innerHTML=html;bind();renderCloudBadge()}
function head(k,t,s=''){return `<section class="hero"><p class="eyebrow">${k}</p><h2>${t}</h2>${s?`<p class="muted">${s}</p>`:''}</section>`}
function quote(){return '<span class="quote-inline">Complication is the enemy. Simple is the solution.</span>'}
function priorityLabel(v){return String(v||'').replaceAll('-',' ').toUpperCase()}
function noteMini(x){const a=[...(x.notes||[])].slice(-3).reverse();return a.length?a.map(n=>`<div class="info-line"><span>${esc(n.text)}</span><small class="muted">${new Date(n.created).toLocaleString()}</small></div>`).join(''):'<p class="muted">No field notes yet.</p>'}

function onboarding(){
  shell(`<section class="onboard">
    <div class="onboard-callout">
      <p class="eyebrow">WTF STUPID SIMPLE</p>
      <h2>Start with <span>24 × 16.</span><br>What's your fucking idea?</h2>
      <p class="muted">Pick the quick starter or tell the app what the hell you're building. Your build stays yours on this device and in your anonymous Cloudflare backup.</p>
    </div>
    <div class="grid two">
      <button class="action-card" id="start24"><span class="icon">📐</span><div><strong>START WITH 24 × 16</strong><small>Use the shed starter, then change anything you want.</small></div></button>
      <button class="action-card" data-route="setup"><span class="icon">💡</span><div><strong>WHAT'S YOUR FUCKING IDEA?</strong><small>Shed, cabin, house, shop, deck, coop, or whatever.</small></div></button>
    </div>
    <section class="steel-card">
      <p class="eyebrow">STUPID SIMPLE RULE</p>
      <p>Show me. Name it. Tell me what to do. Let me check it. Then give me the next thing.</p>
      <div class="small-actions"><button class="secondary" data-ai-open>ASK WTF</button><button class="secondary" data-voice>🎙 TALK</button></div>
    </section>
  </section>`);
}

function home(){
  const x=p(); if(!x) return onboarding();
  const m=floorMath(x);
  shell(`${head('MY BUILD',esc(x.name),quote())}
    <section class="steel-card">
      <div class="status-row"><div><p class="eyebrow">PROJECT</p><h3>${esc(type(x).label)} • ${x.length}' × ${x.width}'</h3></div><div class="small-actions"><button class="secondary" data-route="projects">CHANGE BUILD</button><button class="secondary" data-edit="${x.id}">EDIT</button></div></div>
      <div class="stage-row">${stages(x).map(s=>`<button class="pill ${s===x.stage?'active':''}" data-stage="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    </section>
    <div class="grid two" style="margin-top:14px">
      <button class="action-card" data-route="build"><span class="icon">🔨</span><div><strong>WHAT DO I DO NEXT?</strong><small>One physical job at a time.</small></div></button>
      ${stages(x).includes('Floor')?`<button class="action-card" data-route="plan"><span class="icon">📐</span><div><strong>SHOW ME THE PLAN</strong><small>Diagram, labels, measurements.</small></div></button>`:''}
      <button class="action-card" data-route="stash"><span class="icon">🪵</span><div><strong>MY SHIT</strong><small>What you have, find, barter, or buy.</small></div></button>
      <button class="action-card" data-route="look"><span class="icon">📷</span><div><strong>LOOK AT THIS</strong><small>Take a photo. Let AI describe what it can actually see.</small></div></button>
      <button class="action-card" data-ai-open><span class="icon">🧠</span><div><strong>ASK WTF</strong><small>Cloudflare AI with this build as context.</small></div></button>
      <button class="action-card" data-route="research"><span class="icon">🌐</span><div><strong>RESEARCH A PAGE</strong><small>Browse a building page inside the app and strip out the useful shit.</small></div></button>
    </div>
    <section class="steel-card" style="margin-top:14px">
      <p class="eyebrow">PROJECT SNAPSHOT</p>
      <div class="info-line"><b>Type</b><span>${esc(type(x).label)}</span></div>
      <div class="info-line"><b>Footprint</b><span>${x.length}' × ${x.width}'</span></div>
      <div class="info-line"><b>Wall height</b><span>${x.wallHeight||'—'}'</span></div>
      <div class="info-line"><b>Priority</b><span>${esc(priorityLabel(x.priority))}</span></div>
      ${stages(x).includes('Floor')?`<div class="info-line"><b>Joist planning</b><span>${m.spacing}" O.C. • ${x.floor.runnerCount} runners</span></div>`:''}
    </section>
    <section class="steel-card" style="margin-top:14px"><p class="eyebrow">FIELD NOTES</p>${noteMini(x)}<div class="small-actions"><button class="secondary" data-route="notes">OPEN NOTES</button></div></section>`);
}

function projects(){
  shell(`${head('MY BUILDS','Pick your shit.','Each project keeps its own measurements, materials, research, notes and progress.')}
    <div class="projects-list">${state.projects.map(x=>`<section class="steel-card project-card ${x.id===state.activeProjectId?'selected':''}">
      <p class="eyebrow">${esc(type(x).label)}</p><h3>${esc(x.name)}</h3><p class="muted">${x.length}' × ${x.width}' • ${esc(x.stage)}</p>
      <div class="small-actions"><button class="${x.id===state.activeProjectId?'secondary':'primary'}" data-select="${x.id}">${x.id===state.activeProjectId?'CURRENT':'OPEN'}</button><button class="secondary" data-edit="${x.id}">EDIT</button>${state.projects.length>1?`<button class="danger" data-delete="${x.id}">DELETE</button>`:''}</div>
    </section>`).join('')}</div>
    <button class="action-card" data-route="setup" style="margin-top:14px"><span class="icon">＋</span><div><strong>WHAT'S YOUR FUCKING IDEA?</strong><small>Start another build.</small></div></button>`);
}

function setup(id=null){
  const old=id?state.projects.find(x=>x.id===id):null;
  const v=old||{name:'',type:'shed',length:8,width:10,wallHeight:8,priority:'cheapest'};
  shell(`${head(old?'EDIT BUILD':'NEW BUILD',old?'Change the idea.':"What's your fucking idea?",'Give me the basics. The app will shape itself around the job.')}
    <section class="steel-card">
      <input id="editingId" type="hidden" value="${esc(old?.id||'')}">
      <label>WHAT ARE YOU BUILDING?</label>
      <select id="projectType" class="input">${Object.entries(TYPES).map(([k,y])=>`<option value="${k}" ${v.type===k?'selected':''}>${esc(y.label)}</option>`).join('')}</select>
      <div class="dimension-grid">
        <div><label>LENGTH (FEET)</label><input id="projectLength" class="input" type="number" min="1" step=".5" value="${v.length}"></div>
        <div><label>WIDTH (FEET)</label><input id="projectWidth" class="input" type="number" min="1" step=".5" value="${v.width}"></div>
        <div><label>WALL HEIGHT (FEET)</label><input id="projectHeight" class="input" type="number" min="1" step=".5" value="${v.wallHeight||8}"></div>
      </div>
      <label>WHAT MATTERS MOST?</label>
      <select id="projectPriority" class="input">
        <option value="cheapest" ${v.priority==='cheapest'?'selected':''}>CHEAP AS FUCK</option>
        <option value="easiest" ${v.priority==='easiest'?'selected':''}>EASIEST</option>
        <option value="use-what-i-have" ${v.priority==='use-what-i-have'?'selected':''}>USE WHAT I HAVE</option>
        <option value="fewest-cuts" ${v.priority==='fewest-cuts'?'selected':''}>FEWEST CUTS</option>
        <option value="stronger" ${v.priority==='stronger'?'selected':''}>STRONGER</option>
        <option value="help-me-pick" ${v.priority==='help-me-pick'?'selected':''}>I DON'T KNOW — HELP ME PICK</option>
      </select>
      <label>NAME IT</label><input id="projectName" class="input" value="${esc(v.name)}" placeholder="Leave blank and I'll name it">
      <div class="small-actions"><button id="saveProject" class="primary">${old?'SAVE CHANGES':'BUILD MY PLAN'}</button><button class="secondary" data-route="${old?'home':'projects'}">CANCEL</button></div>
    </section>`);
}

function build(){
  const x=p(); if(!x)return onboarding();
  const floor=[
    ['Confirm the footprint',`Mark the ${x.length} ft × ${x.width} ft footprint. Check the diagonals before calling it square.`],
    ['Confirm the support idea','Decide what is touching the ground and what supports the floor. Do not cut lumber just because a picture looks right.'],
    ['Count what you actually have','Put real quantities into MY SHIT. Used, free and barter material all count.'],
    ['Lock one floor method','Pick one method. Keep the other hundred ways in the Library.'],
    ['Build one visible step','Do the step, check it, add a photo/note, then move on.']
  ];
  const generic=[
    [`Look at ${x.stage}`,`Before doing anything, figure out what must already exist before ${x.stage} starts.`],
    ['Count what you have','Check materials, tools and dimensions before buying or cutting.'],
    ['Pick one method','One recommendation first. Alternatives stay out of the way until you ask for them.'],
    ['Do one visible step','Finish one physical action and check what changed.']
  ];
  const steps=x.stage==='Floor'?floor:generic;
  shell(`${head('BUILD MODE',`${esc(x.name)} — ${esc(x.stage)}`,'One visible thing at a time.')}
    <div class="stage-row">${stages(x).map(s=>`<button class="pill ${s===x.stage?'active':''}" data-stage="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    <div class="steps" style="margin-top:14px">${steps.map((z,i)=>{const k=`${x.stage}:${i}`,done=(x.completedSteps||[]).includes(k);return `<section class="steel-card step-card ${done?'done':''}"><div class="step-num">${done?'✓':i+1}</div><div><h3>${esc(z[0])}</h3><p>${esc(z[1])}</p><div class="small-actions"><button class="${done?'secondary':'primary'}" data-step="${esc(k)}">${done?'MARK NOT DONE':'DONE'}</button>${x.stage==='Floor'&&i===1?'<button class="secondary" data-route="plan">SHOW PLAN</button>':''}</div></div></section>`}).join('')}</div>`);
}

function blueprint(){
  const x=p(),m=floorMath(x),L=135,T=140,W=930,H=520,lines=Array.from({length:Math.max(2,m.lines)},(_,i)=>L+W*i/Math.max(1,m.lines-1)),rc=Math.max(2,Number(x.floor.runnerCount)||3),rows=Array.from({length:rc},(_,i)=>T+44+(H-88)*i/Math.max(1,rc-1));
  return `<svg class="blueprint" viewBox="0 0 1200 820" role="img" aria-label="${x.length} by ${x.width} floor planning diagram">
    <rect width="1200" height="820" fill="#07131f"/>
    <g stroke="#18314b" stroke-width="1" opacity=".75">${Array.from({length:30},(_,i)=>`<path d="M0 ${i*30}H1200M${i*40} 0V820"/>`).join('')}</g>
    <g font-family="Arial, sans-serif"><text x="55" y="62" fill="#fff" font-size="38" font-weight="800">YOUR FLOOR — ${x.length}' × ${x.width}'</text><text x="55" y="99" fill="#9fb6c9" font-size="18">${m.spacing}&quot; O.C. planning • ${rc} support lines</text>
      <rect x="${L}" y="${T}" width="${W}" height="${H}" fill="none" stroke="#f7f3e8" stroke-width="16"/>
      <g stroke="#b982ff" stroke-width="16">${rows.map(y=>`<line x1="${L}" y1="${y}" x2="${L+W}" y2="${y}"/>`).join('')}</g>
      <g stroke="#58bfff" stroke-width="8">${lines.map(xx=>`<line x1="${xx}" y1="${T}" x2="${xx}" y2="${T+H}"/>`).join('')}</g>
      <text x="600" y="750" fill="#fff" font-size="16" text-anchor="middle">PLANNING DIAGRAM — NOT STRUCTURAL APPROVAL.</text>
    </g></svg>`;
}

const PARTS={
  runner:['RUNNER / BEAM','Long support under the joists.','It carries floor load down to supports. Builders may also call it a beam or girder.'],
  center:['CENTER BEAM','The support line near the middle.','It reduces the unsupported distance the joists have to travel.'],
  joist:['FLOOR JOIST','Repeating boards the floor sheets sit on.','Joist size and spacing depend on span, species/grade, loads and the exact method.'],
  rim:['RIM JOIST','Outside board closing the floor frame.','It keeps joist ends aligned and closes the platform edge.'],
  pier:['BLOCK / PIER','Support between structure and ground.','Type and spacing depend on soil, foundation layout and loads.'],
  oc:['O.C. — ON CENTER','Center-to-center spacing.','24 inches O.C. means center of one joist to center of the next.'],
  span:['SPAN','Distance between supports.','A 16-foot board crossing a center support can have shorter unsupported spans than its full length.']
};

function plan(){
  const x=p(); if(!x)return onboarding();
  const m=floorMath(x);
  shell(`${head('YOUR PLAN','Floor.','Change the planning settings and the picture follows.')}
    <section class="steel-card"><div class="diagram-wrap"><span class="badge">DIAGRAM</span>${blueprint()}</div>
      <div class="legend">${Object.entries({runner:'RUNNER / BEAM',center:'CENTER BEAM',joist:'FLOOR JOIST',rim:'RIM',pier:'BLOCK / PIER',oc:'O.C.',span:'SPAN'}).map(([k,v])=>`<button data-part="${k}" data-kind="${k==='joist'?'joist':k.includes('runner')||k==='center'?'beam':''}">${v}</button>`).join('')}</div>
    </section>
    <section class="steel-card" style="margin-top:14px"><p class="eyebrow">FLOOR SETTINGS</p>
      <label>JOIST SPACING</label><select id="spacing" class="input"><option value="24" ${m.spacing===24?'selected':''}>24 in O.C. — fewer boards</option><option value="16" ${m.spacing===16?'selected':''}>16 in O.C. — more boards</option></select>
      <label>LONG SUPPORT LINES / RUNNERS</label><select id="runnerCount" class="input">${[2,3,4,5].map(n=>`<option value="${n}" ${Number(x.floor.runnerCount)===n?'selected':''}>${n}</option>`).join('')}</select>
      <div class="info-line"><b>Interior joist estimate</b><span>${m.interior}</span></div><div class="info-line"><b>Joist lines incl. ends</b><span>${m.lines}</span></div>
      <p class="muted tiny">This is layout math, not proof that a specific board is adequate.</p>
    </section>
    <section id="partCard" class="steel-card" style="margin-top:14px"><p class="eyebrow">WTF LEGEND</p><h3>Tap a label.</h3><p class="muted">Name it first. Explain it second.</p></section>`);
}

function stash(){
  const x=p(); if(!x)return onboarding();
  shell(`${head('MY SHIT','Use what you have.','Free, found, bartered, Marketplace or brand new. Tell the truth about condition.')}
    <div class="inventory">${(x.inventory||[]).map(it=>`<section class="steel-card item"><div><h3>${esc(it.name)}</h3><p class="muted">${esc(it.note||'')}</p><div class="chips"><span class="pill">${esc(it.source||'HAVE')}</span><span class="pill">${esc(it.condition||'UNKNOWN')}</span></div></div><div><div class="qty">${Number(it.qty)||0}</div><button class="secondary" data-item-edit="${it.id}">EDIT</button></div></section>`).join('')||'<p class="muted">Nothing in the pile yet.</p>'}</div>
    <section class="steel-card" style="margin-top:14px"><p class="eyebrow">ADD SOMETHING</p><label>WHAT IS IT?</label><input id="newName" class="input" placeholder="2×8 × 12', window, toilet, roofing..."><label>HOW MANY?</label><input id="newQty" class="input" type="number" min="0" value="1"><label>WHERE DID IT COME FROM?</label><select id="newSource" class="input"><option>HAVE</option><option>FREE</option><option>MARKETPLACE</option><option>BARTER</option><option>BOUGHT</option><option>FOUND</option></select><label>CONDITION / NOTE</label><input id="newNote" class="input" placeholder="Bow, rot, wet, clean, unknown species..."><button id="addItem" class="primary" style="margin-top:12px">ADD TO MY SHIT</button></section>`);
}

function look(){
  const x=p(); if(!x)return onboarding();
  shell(`${head('LOOK AT THIS','Show the app the thing.','Cloudflare AI can describe an image or document, then answer your question without pretending it can see what it cannot.')}
    <section class="steel-card">
      <label>TAKE OR PICK A PHOTO / FILE</label><input id="visionFile" class="input" type="file" accept="image/*,.pdf" capture="environment">
      <div id="visionPreview" style="margin-top:12px"></div>
      <label>WHAT THE FUCK DO YOU WANT TO KNOW?</label><textarea id="visionQuestion" class="input" rows="4" placeholder="What is this board? What am I looking at? Is there anything obviously wrong?"></textarea>
      <div class="small-actions"><button id="analyzeVision" class="primary">LOOK AT IT</button><button class="secondary" data-voice>🎙 SAY THE QUESTION</button></div>
      <div id="visionResult" style="margin-top:12px"></div>
    </section>
    <section class="steel-card" style="margin-top:14px"><p class="eyebrow">PHOTO RULE</p><p>The AI can describe visible things. It cannot prove hidden rot, structural capacity, lumber grade, soil bearing, or anything outside the picture.</p></section>`);
}

function library(){
  const cards=[
    ['CHEAP AS FUCK','$','Use closer supports or stuff you already have. Usually more labor or leveling.'],
    ['EASIEST','$$','Fewer weird joints and fewer decisions. Usually more new material.'],
    ['USE WHAT I HAVE','$?','Design around the actual pile instead of pretending you own perfect stock lumber.'],
    ['FEWEST CUTS','$$','Prefer stock lengths and simple rectangles.'],
    ['STRONGER','$$$','More support, tighter spacing or larger members where it actually helps.'],
    ['NERD SHIT','📚','Span tables, species/grade, manufacturer docs, technical terms and source material.']
  ];
  shell(`${head('LIBRARY','Other ways exist.','Your current build stays simple. The alternatives wait here until you ask.')}
    <div class="grid two">${cards.map(c=>`<section class="steel-card"><div class="status-row"><h3>${c[0]}</h3><b>${c[1]}</b></div><p class="muted">${c[2]}</p></section>`).join('')}</div>
    <section class="steel-card" style="margin-top:14px"><p class="eyebrow">WEB CONTENT</p><h3>Found a useful page?</h3><p class="muted">Open it through the app. Cloudflare Browser Run turns it into readable content and AI pulls out the building information.</p><button class="primary" data-route="research">RESEARCH A PAGE</button></section>`);
}

function research(){
  const x=p(); if(!x)return onboarding();
  const saved=[...(x.research||[])].reverse();
  shell(`${head('APP CONTENT RESEARCH','Browse only what helps the build.','Paste a public webpage. The app extracts readable content; it is not a general-purpose browser.')}
    <section class="steel-card"><label>WEB PAGE URL</label><input id="researchUrl" class="input" placeholder="https://manufacturer.com/..."><label>WHAT DO YOU WANT FROM IT? (OPTIONAL)</label><textarea id="researchQuestion" class="input" rows="3" placeholder="What is the minimum roof pitch? What fasteners do they require?"></textarea><div class="small-actions"><button id="researchGo" class="primary">READ THIS PAGE</button><button class="secondary" data-voice>🎙 TALK</button></div><div id="researchResult" style="margin-top:12px"></div></section>
    <section class="steel-card" style="margin-top:14px"><p class="eyebrow">SAVED TO THIS BUILD</p><div class="research-list">${saved.map(r=>`<div class="info-line"><div><b>${esc(r.title||r.url)}</b><div class="research-source">${esc(r.url)}</div></div><small class="muted">${new Date(r.created).toLocaleDateString()}</small></div>`).join('')||'<p class="muted">Nothing saved yet.</p>'}</div></section>`);
}

function notes(){
  const x=p(); if(!x)return onboarding();
  shell(`${head('FIELD NOTES','Talk or type it.','Notes stay with this build.')}
    <section class="steel-card"><label>NOTE</label><textarea id="noteText" class="input" rows="4" placeholder="Center runner is bowed. Need three more blocks..."></textarea><div class="small-actions"><button id="saveNote" class="primary">SAVE NOTE</button><button class="secondary" data-voice-target="noteText">🎙 TALK</button></div></section>
    <div class="notes-list" style="margin-top:14px">${[...(x.notes||[])].reverse().map(n=>`<section class="steel-card"><p>${esc(n.text)}</p><small class="muted">${new Date(n.created).toLocaleString()}</small></section>`).join('')||'<p class="muted">No notes yet.</p>'}</div>`);
}

function route(name,{save=true}={}){
  state.route=name;
  if(save)persist();
  $$('.banner-nav [data-route],.dock [data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===name));
  ({home,projects,setup,build,plan,stash,look,library,research,notes}[name]||home)();
  scrollTo({top:0,behavior:'instant'});
}

function saveProject(){
  const id=$('#editingId')?.value||'';
  const t=$('#projectType').value,l=Number($('#projectLength').value),w=Number($('#projectWidth').value),h=Number($('#projectHeight').value),priority=$('#projectPriority').value,name=$('#projectName').value.trim();
  if(!l||!w||!h)return alert('Length, width, and height need real numbers.');
  if(id){
    const x=state.projects.find(y=>y.id===id); if(!x)return;
    Object.assign(x,{type:t,length:l,width:w,wallHeight:h,priority,name:name||`My ${l} × ${w} ${TYPES[t]?.label||'Build'}`});
    if(!stages(x).includes(x.stage))x.stage=stages(x)[0];
    state.activeProjectId=x.id;
  }else{
    const x=customProject(t,l,w,h,priority,name);state.projects.push(x);state.activeProjectId=x.id;
  }
  persist();route('home');
}

function bind(){
  $$('[data-route]').forEach(b=>b.onclick=()=>route(b.dataset.route));
  $$('[data-edit]').forEach(b=>b.onclick=()=>setup(b.dataset.edit));
  $$('[data-select]').forEach(b=>b.onclick=()=>{state.activeProjectId=b.dataset.select;persist();route('home')});
  $$('[data-delete]').forEach(b=>b.onclick=()=>{if(confirm('Delete this build from this device/cloud backup?')){state.projects=state.projects.filter(x=>x.id!==b.dataset.delete);state.activeProjectId=state.projects[0]?.id||null;persist();route(state.projects.length?'projects':'home')}});
  $$('[data-stage]').forEach(b=>b.onclick=()=>{const x=p();x.stage=b.dataset.stage;x.completedSteps=[];persist();route(state.route)});
  $$('[data-step]').forEach(b=>b.onclick=()=>{const x=p(),k=b.dataset.step,a=x.completedSteps||[];x.completedSteps=a.includes(k)?a.filter(v=>v!==k):[...a,k];persist();route('build')});
  $$('[data-part]').forEach(b=>b.onclick=()=>{const z=PARTS[b.dataset.part];$('#partCard').innerHTML=`<p class="eyebrow">WTF LEGEND</p><h3>${z[0]}</h3><p><b>${z[1]}</b></p><p class="muted">${z[2]}</p>`});
  $$('[data-ai-open]').forEach(b=>b.onclick=()=>openAI());
  $$('[data-voice]').forEach(b=>b.onclick=()=>startVoice());
  $$('[data-voice-target]').forEach(b=>b.onclick=()=>startVoice(b.dataset.voiceTarget));

  $('#start24') && ($('#start24').onclick=()=>{const x=starter24();state.projects.push(x);state.activeProjectId=x.id;persist();route('home')});
  $('#saveProject') && ($('#saveProject').onclick=saveProject);
  $('#spacing') && ($('#spacing').onchange=e=>{p().floor.joistSpacing=Number(e.target.value);persist();route('plan')});
  $('#runnerCount') && ($('#runnerCount').onchange=e=>{p().floor.runnerCount=Number(e.target.value);persist();route('plan')});
  $('#addItem') && ($('#addItem').onclick=()=>{const x=p(),name=$('#newName').value.trim();if(!name)return;x.inventory.push({id:crypto.randomUUID(),name,qty:Number($('#newQty').value)||0,source:$('#newSource').value,condition:'CHECK',note:$('#newNote').value.trim()});persist();route('stash')});
  $$('[data-item-edit]').forEach(b=>b.onclick=()=>{const it=p().inventory.find(x=>x.id===b.dataset.itemEdit);const q=prompt(`How many ${it.name}?`,it.qty);if(q!==null&&!Number.isNaN(Number(q))){it.qty=Number(q);persist();route('stash')}});

  $('#visionFile') && ($('#visionFile').onchange=e=>{const f=e.target.files?.[0];if(f?.type.startsWith('image/')){$('#visionPreview').innerHTML=`<div class="photo-preview"><img src="${URL.createObjectURL(f)}" alt="Your selected photo"><span class="badge">YOUR PHOTO</span></div>`}else if(f){$('#visionPreview').innerHTML=`<p class="muted">${esc(f.name)} • ${(f.size/1024/1024).toFixed(1)} MB</p>`}});
  $('#analyzeVision') && ($('#analyzeVision').onclick=analyzeVision);
  $('#researchGo') && ($('#researchGo').onclick=runResearch);
  $('#saveNote') && ($('#saveNote').onclick=()=>{const t=$('#noteText').value.trim();if(!t)return;p().notes.push({id:crypto.randomUUID(),text:t,created:new Date().toISOString()});persist();route('notes')});
}

async function analyzeVision(){
  const file=$('#visionFile').files?.[0],question=$('#visionQuestion').value.trim(),out=$('#visionResult');
  if(!file)return alert('Pick a photo or file first.');
  out.innerHTML='<div class="ai-answer">Looking at it…</div>';
  const fd=new FormData();fd.append('file',file);fd.append('question',question);
  try{
    const r=await api('/api/vision',{method:'POST',body:fd});
    lastVision=r;
    out.innerHTML=`<div class="ai-answer">${esc(r.answer||r.description)}</div><div class="small-actions"><button id="saveVisionNote" class="secondary">SAVE AS NOTE</button><button id="speakVision" class="secondary">🔊 READ IT</button></div>`;
    $('#saveVisionNote').onclick=()=>{p().notes.push({id:crypto.randomUUID(),text:`PHOTO: ${r.answer||r.description}`,created:new Date().toISOString()});persist();alert('Saved to this build.')};
    $('#speakVision').onclick=()=>speak(r.answer||r.description);
    if(state.talkBack)speak(r.answer||r.description);
  }catch(e){out.innerHTML=`<div class="notice">Could not analyze it: ${esc(e.message)}</div>`}
}

async function runResearch(){
  const url=$('#researchUrl').value.trim(),question=$('#researchQuestion').value.trim(),out=$('#researchResult');
  if(!url)return;
  out.innerHTML='<div class="research-output">Reading the page…</div>';
  try{
    const r=await api('/api/research',{method:'POST',body:JSON.stringify({url,question})});
    const text=r.summary||r.markdown;
    out.innerHTML=`<div class="research-output">${esc(text)}</div><div class="small-actions"><button id="saveResearch" class="secondary">SAVE TO THIS BUILD</button><button id="speakResearch" class="secondary">🔊 READ SUMMARY</button></div>`;
    $('#saveResearch').onclick=()=>{p().research.push({id:crypto.randomUUID(),url:r.url,title:question||r.url,summary:text,created:new Date().toISOString()});persist();alert('Saved to this build.')};
    $('#speakResearch').onclick=()=>speak(text);
  }catch(e){out.innerHTML=`<div class="notice">Research failed: ${esc(e.message)}</div>`}
}

function ensureAIDialog(){
  if($('#aiDialog'))return;
  document.body.insertAdjacentHTML('beforeend',`<dialog id="aiDialog"><form method="dialog" class="steel-card modal"><button class="close" value="close" aria-label="Close">×</button><p class="eyebrow">ASK WTF</p><h3>Say it normal.</h3><textarea id="aiQuestion" class="input" rows="4" placeholder="What the fuck is a rim joist? Can I use what I already have?"></textarea><div class="small-actions"><button type="button" id="aiMic" class="secondary">🎙 TALK</button><button type="button" id="aiAsk" class="primary">ASK</button><button type="button" id="aiRead" class="secondary">🔊 READ SCREEN</button></div><div id="aiResult" style="margin-top:12px"></div><label style="display:flex;gap:8px;align-items:center"><input id="talkBack" type="checkbox" ${state.talkBack?'checked':''}> TALK BACK AFTER ANSWERS</label></form></dialog>`);
  $('#aiMic').onclick=()=>startVoice('aiQuestion');
  $('#aiAsk').onclick=askAI;
  $('#aiRead').onclick=readScreen;
  $('#talkBack').onchange=e=>{state.talkBack=e.target.checked;persist()};
}

function openAI(seed=''){
  ensureAIDialog();$('#aiQuestion').value=seed||'';$('#aiResult').innerHTML='';$('#aiDialog').showModal();if(seed)askAI();
}

async function askAI(){
  const message=$('#aiQuestion').value.trim(),out=$('#aiResult');if(!message)return;
  out.innerHTML='<div class="ai-answer">Thinking…</div>';
  try{
    const r=await api('/api/assistant',{method:'POST',body:JSON.stringify({message,project:p()||{}})});
    out.innerHTML=`<div class="ai-answer">${esc(r.response)}</div>`;
    if(state.talkBack)speak(r.response);
  }catch(e){out.innerHTML=`<div class="notice">AI failed: ${esc(e.message)}</div>`}
}

function speak(text){
  if(!('speechSynthesis' in window))return alert('This browser does not support talk-back speech.');
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(String(text).replace(/\s+/g,' ').slice(0,5000));u.rate=.95;u.pitch=1;speechSynthesis.speak(u);
}

function stopSpeaking(){if('speechSynthesis'in window)speechSynthesis.cancel()}

function readScreen(){
  const t=$('#view')?.innerText||'';speak(t.slice(0,3500));
}

function startVoice(targetId=''){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return alert('Speech recognition is not available in this browser. You can still type and use talk-back.');
  if(recognition)try{recognition.abort()}catch{}
  recognition=new SR();recognition.lang='en-US';recognition.interimResults=false;recognition.continuous=false;
  setVoiceState('LISTENING…');
  recognition.onresult=e=>{const text=e.results[0][0].transcript.trim();setVoiceState(`HEARD: ${text}`);if(targetId&&$('#'+targetId)){$('#'+targetId).value=text}else handleVoice(text)};
  recognition.onerror=()=>setVoiceState('VOICE OFF');
  recognition.onend=()=>setTimeout(()=>setVoiceState('VOICE READY'),500);
  recognition.start();
}

function handleVoice(text){
  const q=text.toLowerCase();
  if(/\b(stop talking|shut up|stop speaking)\b/.test(q))return stopSpeaking();
  if(/\b(read this|read screen|read it)\b/.test(q))return readScreen();
  const map=[[/\b(home|my build)\b/,'home'],[/\b(build mode|build)\b/,'build'],[/\b(plan|blueprint)\b/,'plan'],[/\b(my shit|materials)\b/,'stash'],[/\b(look at this|photo)\b/,'look'],[/\b(library)\b/,'library'],[/\b(research|web page)\b/,'research'],[/\b(notes)\b/,'notes'],[/\b(new build|new project|new idea)\b/,'setup']];
  for(const [re,r] of map)if(re.test(q))return route(r);
  openAI(text);
}

function setVoiceState(text){$('#voiceState')&&($('#voiceState').textContent=text)}

function globalBind(){
  $$('.banner-nav [data-route],.dock [data-route]').forEach(b=>b.onclick=()=>route(b.dataset.route));
  $('#bannerTalk') && ($('#bannerTalk').onclick=()=>startVoice());
  $('#bannerAI') && ($('#bannerAI').onclick=()=>openAI());
  $('#bannerRead') && ($('#bannerRead').onclick=readScreen);
  $('#wtfButton') && ($('#wtfButton').onclick=()=>openAI("Explain what I'm looking at on this screen in stupid simple terms."));
  $('.banner-logo') && ($('.banner-logo').onclick=()=>route('home'));
}

globalBind();
getHealth().then(cloudLoad);
route(state.route||'home',{save:false});