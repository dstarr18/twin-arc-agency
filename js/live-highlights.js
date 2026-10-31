// Twin Arc Host Live Highlights — read-only for visitors, owner-managed uploads.
(function(){
  const BUCKET='host-live-highlights';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let highlights=[];

  function selectedHost(){return (typeof currentPerfHost!=='undefined'&&currentPerfHost>=0&&window.hosts)?hosts[currentPerfHost]:null;}
  function isOwner(){return !!window.adminUnlocked;}
  async function token(){return typeof getOwnerAccessToken==='function'?await getOwnerAccessToken():null;}

  function inject(){
    if($('liveHighlightsSection'))return;
    const anchor=document.querySelector('.monthly-kpis'); if(!anchor)return;
    const section=document.createElement('section'); section.id='liveHighlightsSection'; section.className='live-highlights';
    section.innerHTML=`<div class="live-highlights-head"><div><p class="eyebrow">LIVE MOMENTS</p><h3>Live Highlights 🎬</h3><p class="live-highlights-copy">Screen recordings of gift drops, PK wins, special moments, and Spark Live events.</p></div><button id="addHighlightBtn" class="btn btn-primary" type="button">+ Upload Highlight</button></div><div id="highlightGrid" class="highlight-grid"></div><p id="highlightEmpty" class="highlight-empty">No live highlights uploaded for this host yet.</p><form id="highlightForm" class="highlight-form" hidden><div class="editor-title-row"><div><p class="eyebrow">ADD LIVE MOMENT</p><h3>Upload Video Highlight</h3></div><button id="closeHighlightForm" class="mini-btn" type="button">Close</button></div><div class="manager-grid"><label>Title<input id="highlightTitle" required placeholder="e.g. Big Gift Drop"></label><label>Date<input id="highlightDate" type="date"></label><label class="full">Caption<textarea id="highlightCaption" rows="2" placeholder="Optional short description"></textarea></label><label class="full">Screen Recording / Video<input id="highlightVideo" type="file" accept="video/mp4,video/quicktime,video/webm,video/*" required></label></div><p id="highlightMessage" class="perf-message"></p><div class="manager-actions"><button class="btn btn-primary" type="submit">Upload Video</button><button class="btn btn-secondary" id="cancelHighlight" type="button">Cancel</button></div></form>`;
    anchor.insertAdjacentElement('afterend',section);
    const style=document.createElement('style'); style.textContent=`.live-highlights{margin-top:24px;padding-top:22px;border-top:1px solid rgba(255,255,255,.12)}.live-highlights-head{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:14px}.live-highlights-head h3{margin:3px 0}.live-highlights-copy{margin:0;opacity:.72}.highlight-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.highlight-card{overflow:hidden;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.045)}.highlight-card video{display:block;width:100%;aspect-ratio:9/16;max-height:420px;background:#08060d;object-fit:contain}.highlight-info{padding:12px}.highlight-info h4{margin:0 0 5px}.highlight-info p{margin:4px 0;opacity:.76;font-size:.9rem}.highlight-actions{padding:0 12px 12px}.highlight-empty{opacity:.65}.highlight-form{margin-top:18px;padding:18px;border:1px solid rgba(255,255,255,.12);border-radius:16px}.live-highlights #addHighlightBtn,.highlight-actions{display:none}body:has(#adminModeBtn.is-unlocked) .live-highlights #addHighlightBtn,body:has(#adminModeBtn.is-unlocked) .highlight-actions{display:block}@media(max-width:640px){.live-highlights-head{align-items:flex-start;flex-direction:column}.highlight-grid{grid-template-columns:1fr}.highlight-card video{max-height:520px}}`;
    document.head.appendChild(style);
    $('addHighlightBtn').onclick=()=>{if(!isOwner()){if(typeof openAdmin==='function')openAdmin();return;}$('highlightForm').hidden=false;};
    $('closeHighlightForm').onclick=$('cancelHighlight').onclick=()=>{$('highlightForm').hidden=true;};
    $('highlightForm').addEventListener('submit',upload);
  }

  async function loadHighlights(){
    inject(); const h=selectedHost(); if(!h?.id){highlights=[];render();return;}
    try{const r=await fetch(`${SUPABASE_URL}/rest/v1/host_live_highlights?host_id=eq.${encodeURIComponent(h.id)}&select=*&order=highlight_date.desc,created_at.desc`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});if(!r.ok)throw new Error(await r.text());highlights=await r.json();}catch(e){console.error('[Twin Arc] Highlights load failed',e);highlights=[];}
    render();
  }
  function render(){
    if(!$('highlightGrid'))return; const h=selectedHost(); $('liveHighlightsSection').style.display=h?'block':'none'; if(!h)return;
    $('highlightEmpty').hidden=highlights.length>0;
    $('highlightGrid').innerHTML=highlights.map(x=>`<article class="highlight-card"><video controls playsinline preload="metadata" src="${esc(x.video_url)}"></video><div class="highlight-info"><h4>${esc(x.title)}</h4>${x.highlight_date?`<p>${esc(x.highlight_date)}</p>`:''}${x.caption?`<p>${esc(x.caption)}</p>`:''}</div><div class="highlight-actions"><button class="mini-btn delete-highlight" data-id="${x.id}" data-path="${esc(x.video_path)}" type="button">Delete</button></div></article>`).join('');
    document.querySelectorAll('.delete-highlight').forEach(b=>b.onclick=()=>remove(b.dataset.id,b.dataset.path));
  }
  async function upload(e){
    e.preventDefault(); const h=selectedHost(); if(!h?.id||!isOwner())return; const file=$('highlightVideo').files[0]; if(!file)return;
    const access=await token(); if(!access){if(typeof openAdmin==='function')openAdmin();return;}
    const msg=$('highlightMessage'); msg.textContent='Uploading video…';
    try{
      const ext=(file.name.split('.').pop()||'mp4').replace(/[^a-z0-9]/gi,'').toLowerCase()||'mp4';
      const path=`${h.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const up=await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${access}`,'Content-Type':file.type||'video/mp4','x-upsert':'false'},body:file});
      if(!up.ok)throw new Error(`Video upload failed: ${await up.text()}`);
      const url=`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
      const payload={host_id:h.id,title:$('highlightTitle').value.trim(),highlight_date:$('highlightDate').value||null,caption:$('highlightCaption').value.trim(),video_path:path,video_url:url};
      const save=await fetch(`${SUPABASE_URL}/rest/v1/host_live_highlights`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${access}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload)});
      if(!save.ok){await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${access}`}});throw new Error(`Record save failed: ${await save.text()}`);}
      $('highlightForm').reset(); $('highlightForm').hidden=true; msg.textContent=''; await loadHighlights();
    }catch(err){console.error(err);msg.textContent='Upload failed. Please try again.';}
  }
  async function remove(id,path){
    if(!isOwner()||!confirm('Delete this live highlight?'))return; const access=await token(); if(!access)return;
    try{const r=await fetch(`${SUPABASE_URL}/rest/v1/host_live_highlights?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${access}`,Prefer:'return=minimal'}});if(!r.ok)throw new Error(await r.text());if(path)await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${access}`}});await loadHighlights();}catch(e){console.error(e);alert('Could not delete this highlight.');}
  }

  const wait=setInterval(()=>{if(typeof loadPerformanceForCurrentHost==='function'){clearInterval(wait);inject();const original=loadPerformanceForCurrentHost;window.loadPerformanceForCurrentHost=async function(...args){const out=await original.apply(this,args);await loadHighlights();return out;};}},100);
})();