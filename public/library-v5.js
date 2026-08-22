const $L=(s,r=document)=>r.querySelector(s);

function escL(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function isLibraryScreen(){
  const eyebrow=$L('#view .hero .eyebrow');
  return eyebrow?.textContent?.trim().toUpperCase()==='LIBRARY';
}

function injectLibrarySearch(){
  if(!isLibraryScreen()||$L('#librarySearchPanel'))return;
  const view=$L('#view');
  if(!view)return;
  const panel=document.createElement('section');
  panel.id='librarySearchPanel';
  panel.className='steel-card library-search-v5';
  panel.innerHTML=`
    <p class="eyebrow">WTF REFERENCE SEARCH</p>
    <h3>Search the useful shit we've already researched.</h3>
    <p class="muted">Manufacturer pages and build references that pass the app-content filter can be cached, stored, and indexed by Cloudflare. Your private project notes are not part of this shared search.</p>
    <div class="library-search-row">
      <input id="libraryQuery" class="input" placeholder="minimum metal roof pitch, joist spacing, subfloor...">
      <button id="librarySearchGo" class="primary" type="button">SEARCH</button>
    </div>
    <div id="librarySearchResult"></div>`;
  view.insertBefore(panel,view.children[1]||null);
  $L('#librarySearchGo').onclick=runLibrarySearch;
  $L('#libraryQuery').addEventListener('keydown',e=>{if(e.key==='Enter')runLibrarySearch()});
}

async function runLibrarySearch(){
  const q=$L('#libraryQuery')?.value.trim();
  const out=$L('#librarySearchResult');
  if(!q||!out)return;
  out.innerHTML='<div class="library-search-state">Searching the WTF library…</div>';
  try{
    const res=await fetch('/api/library/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:q})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data.ok===false)throw new Error(data.error||`HTTP ${res.status}`);
    const rows=Array.isArray(data.results)?data.results:[];
    if(!rows.length){out.innerHTML=`<div class="library-search-state"><b>No useful match yet.</b><br><span class="muted">Research a manufacturer/build page first, then it can become part of the reference library.</span></div>`;return}
    out.innerHTML=`<p class="tiny muted">SEARCH ENGINE: ${escL(String(data.engine||'unknown').toUpperCase())}</p><div class="library-results">${rows.map(row=>{
      const title=row.title||row.source?.title||row.source?.filename||row.id||'Reference';
      const text=row.summary||row.text||row.content||'';
      const url=row.url||row.source?.url||row.source?.source||'';
      const score=row.score==null?'':`<span class="search-score">${Number(row.score).toFixed(3)}</span>`;
      return `<article class="library-result"><div class="status-row"><b>${escL(title)}</b>${score}</div>${text?`<p>${escL(text)}</p>`:''}${url?`<small class="research-source">${escL(url)}</small>`:''}</article>`
    }).join('')}</div>`;
  }catch(e){out.innerHTML=`<div class="notice">Library search failed: ${escL(e.message)}</div>`}
}

const view=$L('#view');
if(view){
  new MutationObserver(()=>queueMicrotask(injectLibrarySearch)).observe(view,{childList:true,subtree:false});
  injectLibrarySearch();
}
