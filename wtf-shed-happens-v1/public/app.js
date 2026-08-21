const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

const DEFAULT_STATE = {
  route: "home",
  project: {
    name: "My 24 × 16 Shed",
    stage: "Floor",
    dimensions: "24' × 16'",
    deck: "24' × 8'",
    roof: "Single slope — concept 10' to 9'6\""
  },
  inventory: [
    { id:"2x12-20", name:"2×12 × 20'", qty:3, status:"HAVE", note:"Existing long runner stock" },
    { id:"2x6-16", name:"2×6 × 16'", qty:0, status:"COUNT IT", note:"Potential floor joists" },
    { id:"blocks", name:"Cinder blocks", qty:0, status:"COUNT IT", note:"Foundation/support inventory" }
  ],
  notes: []
};

let state = JSON.parse(localStorage.getItem("wtf-shed-happens") || "null") || DEFAULT_STATE;
const save = () => localStorage.setItem("wtf-shed-happens", JSON.stringify(state));

const wtfs = {
  home:["What is this screen?","This is your job board. It shows the project you're actually building and gives you the shortest path to the next thing you need to do."],
  build:["What am I doing here?","Build Mode gives you one physical action at a time. No textbook. Do the thing, check it, mark it done, move on."],
  plan:["What the fuck is a joist?","The repeating boards crossing the frame are FLOOR JOISTS. The bigger support lines underneath are RUNNERS / BEAMS. The outside box is the RIM."],
  stash:["What is My Shit?","It's your real material pile: lumber you own, stuff you find, free Marketplace junk, barter material, and anything else you might build with."],
  look:["What does Look do?","Use your phone camera or upload a photo. V1 stores the picture locally and gives you a checklist for what to identify or measure. AI recognition comes later."],
  library:["Why is this separate?","Your Build shows only the method you picked. The Library holds alternate ways to do things so twenty valid options don't bury the one you're actually using."]
};

function shell(html){ $("#view").innerHTML = html; bind(); }

function home(){
  shell(`
  <section class="hero">
    <p class="eyebrow">MY BUILD</p>
    <h1>${state.project.name}</h1>
    <p class="quote">Complication is the enemy. Simple is the solution.</p>
  </section>

  <section class="steel-card" style="margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:end">
      <div><p class="eyebrow">RIGHT NOW</p><h2>FLOOR — IN PROGRESS</h2></div>
      <span class="level"><i class="dot warn"></i> V1 TEST BUILD</span>
    </div>
    <div class="stage-row">
      <span class="pill active">FLOOR</span><span class="pill">WALLS</span><span class="pill">ROOF</span><span class="pill">DECK</span><span class="pill">INSIDE</span>
    </div>
    <div class="progress" style="margin-top:12px"><i></i></div>
  </section>

  <div class="grid two">
    <button class="action-card" data-route="build"><span class="icon">🔨</span><div><strong>WHAT DO I DO NEXT?</strong><small>One physical step. That's it.</small></div></button>
    <button class="action-card" data-route="plan"><span class="icon">📐</span><div><strong>SHOW ME THE FLOOR</strong><small>Blueprint + labels + plain English.</small></div></button>
    <button class="action-card" data-route="stash"><span class="icon">🪵</span><div><strong>MY SHIT</strong><small>What you have, need, found, or bought.</small></div></button>
    <button class="action-card" data-route="look"><span class="icon">📷</span><div><strong>LOOK AT THIS</strong><small>Photo first. Questions second.</small></div></button>
  </div>

  <section style="margin-top:18px">
    <p class="eyebrow">REAL SITE PHOTOS</p>
    <div class="photo-strip">
      ${["site-front.jpg","site-side.jpg","site-field.jpg"].map((x,i)=>`<div class="photo"><img src="/assets/project/${x}" alt="Actual project site photo ${i+1}"><span class="badge real">REAL PHOTO</span></div>`).join("")}
    </div>
  </section>
  `);
}

function build(){
  shell(`
  <section class="hero"><p class="eyebrow">BUILD MODE</p><h1>One thing at a time.</h1><p class="muted">Current stage: Floor</p></section>
  <section class="steel-card">
    <div class="step"><div class="step-num">1</div><div>
      <p class="eyebrow">NEXT PHYSICAL JOB</p>
      <h2>Establish the three support lines.</h2>
      <p>You're building a 24' × 16' rectangle. The working concept uses a support line near each outside edge and one down the center.</p>
      <div class="notice"><b>DON'T CUT YET.</b> First verify the exact runner layout, support spacing, lumber lengths, and splice locations you are actually going to use.</div>
      <img class="blueprint" src="/assets/diagrams/floor-blueprint.svg" alt="24 by 16 floor concept blueprint" style="margin-top:14px">
      <div class="small-actions">
        <button class="primary" data-route="plan">SHOW ME THE PLAN</button>
        <button class="secondary" data-wtf="plan">WTF ARE THESE BOARDS?</button>
      </div>
    </div></div>
  </section>
  <section class="steel-card" style="margin-top:14px">
    <p class="eyebrow">CHECK BEFORE NEXT</p>
    <div class="info-line"><b>Footprint</b><span>24' × 16'</span></div>
    <div class="info-line"><b>Support lines</b><span>3-runner concept</span></div>
    <div class="info-line"><b>Joist direction</b><span>Across the 16' width</span></div>
    <div class="info-line"><b>Status</b><span class="muted">Layout not locked yet</span></div>
  </section>`);
}

function plan(){
  shell(`
  <section class="hero"><p class="eyebrow">YOUR PLAN</p><h1>Floor.</h1><p class="muted">Tap the legend to learn the names. V1 diagram is a concept/layout view, not a stamped structural plan.</p></section>
  <section class="steel-card">
    <div style="position:relative">
      <img class="blueprint" src="/assets/diagrams/floor-blueprint.svg" alt="Floor framing diagram">
      <span class="badge diagram">DIAGRAM</span>
    </div>
    <div class="legend">
      <button data-part="beam" data-kind="beam">RUNNER / BEAM</button>
      <button data-part="center" data-kind="beam">CENTER BEAM</button>
      <button data-part="joist" data-kind="joist">FLOOR JOIST</button>
      <button data-part="rim">RIM</button>
      <button data-part="pier">BLOCK / PIER</button>
      <button data-part="oc">O.C.</button>
      <button data-part="span">SPAN</button>
    </div>
  </section>
  <section id="partCard" class="steel-card" style="margin-top:14px">
    <p class="eyebrow">WTF LEGEND</p>
    <h2>Tap a label above.</h2>
    <p class="muted">We'll tell you what it is, what it does, and why it's there.</p>
  </section>
  `);
}

const parts = {
  beam:["RUNNER / BEAM","The big support line under the floor framing.","It carries the joists and transfers weight down to the blocks/piers. Some builders may call this a beam or girder. In this app, RUNNER / BEAM means the long support underneath."],
  center:["CENTER BEAM","The support line running down the middle.","Its job is to catch the floor joists halfway across so they don't have one huge unsupported trip across the full width."],
  joist:["FLOOR JOIST","The repeating boards your floor sits on.","Joists cross the supporting beams. Subfloor goes on top of them. Their spacing and allowable span depend on size, species/grade, and load."],
  rim:["RIM","The board that closes the outside edge of the floor frame.","It keeps the joist ends lined up and forms the outside box."],
  pier:["BLOCK / PIER","The thing touching the ground and holding the frame up.","Its job is to carry a support point into the ground. The exact type and spacing depends on the foundation method and soil/site."],
  oc:["O.C. — ON CENTER","A spacing measurement.","24 inches O.C. means 24 inches from the center of one joist to the center of the next — not 24 inches of empty space."],
  span:["SPAN","How far a board travels without support underneath.","A center beam can turn one long joist run into two shorter unsupported spans even if the joist itself is one continuous board."]
};

function stash(){
  shell(`
  <section class="hero"><p class="eyebrow">MY SHIT</p><h1>Use what you've got.</h1><p class="muted">Free, bought, bartered, reclaimed — it all counts. The app just needs the truth about what it is and its condition.</p></section>
  <section class="inventory">
    ${state.inventory.map(x=>`
      <div class="item">
        <div><b>${x.name}</b><div class="muted">${x.note}</div><span class="pill">${x.status}</span></div>
        <div><div class="qty">${x.qty}</div><button class="secondary" data-edit="${x.id}">EDIT</button></div>
      </div>`).join("")}
  </section>
  <section class="steel-card" style="margin-top:14px">
    <p class="eyebrow">ADD SOMETHING</p>
    <label>WHAT IS IT?</label><input id="newName" class="input" placeholder="Example: 2×8 × 12'">
    <label>HOW MANY?</label><input id="newQty" class="input" inputmode="numeric" type="number" value="1" min="0">
    <label>NOTE</label><input id="newNote" class="input" placeholder="Marketplace, used, bowed, free, etc.">
    <button id="addItem" class="primary" style="margin-top:12px">ADD TO MY SHIT</button>
  </section>`);
}

function look(){
  shell(`
  <section class="hero"><p class="eyebrow">LOOK AT THIS</p><h1>Show me the thing.</h1><p class="muted">V1 keeps this simple: take/upload a photo, then record what you need to identify or measure.</p></section>
  <section class="steel-card">
    <label>TAKE OR PICK A PHOTO</label>
    <input id="photoInput" class="input" type="file" accept="image/*" capture="environment">
    <div id="preview" style="margin-top:12px"></div>
    <label>WHAT THE FUCK DO YOU NEED TO KNOW?</label>
    <textarea id="photoNote" class="input" rows="4" placeholder="Example: What size board is this? Is this rot? Can I use this for blocking?"></textarea>
    <button id="savePhotoNote" class="primary" style="margin-top:12px">SAVE NOTE</button>
    <p class="muted" style="font-size:12px">Photo recognition/AI is intentionally not pretending to work in V1. This screen is ready for that integration later.</p>
  </section>
  <section class="steel-card" style="margin-top:14px">
    <p class="eyebrow">BEFORE YOU ASK AI</p>
    <div class="info-line"><b>Measure length</b><span>Feet + inches</span></div>
    <div class="info-line"><b>Measure width</b><span>Actual width</span></div>
    <div class="info-line"><b>Measure thickness</b><span>Actual thickness</span></div>
    <div class="info-line"><b>Check condition</b><span>Rot / cracks / bow / nails</span></div>
  </section>`);
}

function library(){
  const cards = [
    ["CHEAP AS FUCK","Save money by using closer supports or materials you already own. The tradeoff is usually more leveling, more pieces, or more labor."],
    ["EASIEST","Fewer weird joints and fewer decisions. It may cost more lumber."],
    ["USE WHAT I HAVE","Start with your actual inventory and design around it instead of pretending every board came from a new-material shopping list."],
    ["FEWEST CUTS","Prefer stock lengths and layouts that reduce measuring/cutting. Sometimes costs more material."],
    ["STRONGER","Increase stiffness or capacity with bigger members, tighter spacing, better connections, or more support — only where it actually helps."],
    ["NERD SHIT","Span tables, species/grade assumptions, connection details, manufacturer docs, terminology and deeper references live here — not on the default screen."]
  ];
  shell(`
  <section class="hero"><p class="eyebrow">LIBRARY</p><h1>Other ways exist.</h1><p class="muted">Your Build stays simple. Alternatives live here so they don't bury the method you're actually using.</p></section>
  <div class="grid two">
    ${cards.map(([a,b])=>`<section class="steel-card"><h3>${a}</h3><p class="muted">${b}</p><button class="secondary" disabled>COMING AFTER FLOOR V1</button></section>`).join("")}
  </div>`);
}

function route(name){
  state.route = name; save();
  $$(".dock button").forEach(b=>b.classList.toggle("active", b.dataset.route===name));
  ({home,build,plan,stash,look,library}[name]||home)();
  window.scrollTo({top:0,behavior:"instant"});
}

function bind(){
  $$("[data-route]").forEach(b=>b.onclick=()=>route(b.dataset.route));
  $$("[data-wtf]").forEach(b=>b.onclick=()=>openWtf(b.dataset.wtf));
  $$("[data-part]").forEach(b=>b.onclick=()=>{
    const [title,plain,more]=parts[b.dataset.part];
    $("#partCard").innerHTML=`<p class="eyebrow">WTF LEGEND</p><h2>${title}</h2><p><b>${plain}</b></p><p class="muted">${more}</p><div class="small-actions"><button class="secondary" data-wtf="plan">WTF?</button></div>`;
    bind();
  });

  const add=$("#addItem");
  if(add) add.onclick=()=>{
    const name=$("#newName").value.trim(), qty=Number($("#newQty").value||0), note=$("#newNote").value.trim();
    if(!name) return;
    state.inventory.push({id:crypto.randomUUID(),name,qty,status:"HAVE",note:note||"Added by you"});
    save(); stash();
  };

  $$("[data-edit]").forEach(b=>b.onclick=()=>{
    const item=state.inventory.find(x=>x.id===b.dataset.edit);
    const qty=prompt(`How many ${item.name} do you have?`,item.qty);
    if(qty!==null && !Number.isNaN(Number(qty))){ item.qty=Number(qty); item.status="HAVE"; save(); stash(); }
  });

  const photo=$("#photoInput");
  if(photo) photo.onchange=()=>{
    const file=photo.files?.[0]; if(!file) return;
    const url=URL.createObjectURL(file);
    $("#preview").innerHTML=`<div class="photo" style="aspect-ratio:4/3"><img src="${url}" alt="Selected upload preview"><span class="badge real">YOUR PHOTO</span></div>`;
  };

  const saveNote=$("#savePhotoNote");
  if(saveNote) saveNote.onclick=()=>{
    const text=$("#photoNote").value.trim(); if(!text) return;
    state.notes.push({id:crypto.randomUUID(),type:"photo-question",text,created:new Date().toISOString()});
    save(); $("#photoNote").value=""; alert("Saved to this device.");
  };
}

function openWtf(context=state.route){
  const [title,body]=wtfs[context]||wtfs.home;
  $("#wtfTitle").textContent=title; $("#wtfBody").textContent=body;
  $("#wtfDialog").showModal();
}

$("#wtfButton").onclick=()=>openWtf();
$$(".dock button").forEach(b=>b.onclick=()=>route(b.dataset.route));
$(".brand").onclick=()=>route("home");

if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
route(state.route || "home");
