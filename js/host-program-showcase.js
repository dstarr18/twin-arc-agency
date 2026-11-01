// Twin Arc Agency — editable Host Program showcase cards.
(function(){
  const API='https://uhcfsdsdlqcqadkhlzkg.supabase.co';
  const KEY='sb_publishable_1tdi3y-UoBBnHKFsW1MFcw_vyRBbdgA';
  const TABLE='host_program_showcase';
  const BUCKET='site-branding';
  const $=id=>document.getElementById(id);
  let rows=[];
  let editingId=null;
  const owner=()=>document.getElementById('adminModeBtn')?.classList.contains('is-unlocked')===true;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function installStyles(){
    if($('hostProgramShowcaseStyles'))return;
    const s=document.createElement('style');s.id='hostProgramShowcaseStyles';s.textContent=`
      .program-showcase{grid-column:1/-1;width:100%;margin-top:42px;padding-top:34px;border-top:1px solid rgba(158,110,255,.25)}
      .program-showcase-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:20px}
      .program-showcase-head h3{margin:4px 0 0;font-size:clamp(24px,3vw,38px)}
      .program-showcase-head p{margin:0;color:#b7b7cc;max-width:720px;line-height:1.6}
      .program-showcase-add{display:none;white-space:nowrap}
      body.site-owner-unlocked .program-showcase-add,body:has(#adminModeBtn.is-unlocked) .program-showcase-add{display:inline-flex}
      .program-showcase-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
      .program-showcase-card{position:relative;overflow:hidden;border:1px solid rgba(140,91,255,.48);border-radius:22px;background:linear-gradient(145deg,rgba(25,19,52,.96),rgba(9,9,22,.96));box-shadow:0 18px 44px rgba(0,0,0,.24)}
      .program-showcase-media{aspect-ratio:16/10;background:radial-gradient(circle at 50% 35%,rgba(112,64,255,.25),rgba(8,8,20,.96));display:grid;place-items:center;overflow:hidden}
      .program-showcase-media img{width:100%;height:100%;object-fit:cover;display:block}
      .program-showcase-placeholder{display:grid;place-items:center;text-align:center;gap:8px;padding:24px;color:#d8ccff}.program-showcase-placeholder strong{font-size:18px}.program-showcase-placeholder span{font-size:12px;color:#9d92b9}
      .program-showcase-copy{padding:18px 18px 20px}.program-showcase-copy h4{margin:0 0 8px;font-size:22px}.program-showcase-copy p{margin:0;color:#b9b7c8;line-height:1.55}
      .program-showcase-actions{display:none;gap:8px;margin-top:16px}.program-showcase-actions button{flex:1}
      body.site-owner-unlocked .program-showcase-actions,body:has(#adminModeBtn.is-unlocked) .program-showcase-actions{display:flex}
      .program-showcase-empty{grid-column:1/-1;padding:28px;border:1px dashed rgba(174,127,255,.35);border-radius:18px;text-align:center;color:#a9a4bb}
      .program-showcase-modal[hidden]{display:none!important}.program-showcase-modal{position:fixed;inset:0;z-index:210;display:grid;place-items:center;padding:18px}.program-showcase-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(8px)}
      .program-showcase-dialog{position:relative;z-index:1;width:min(620px,96vw);max-height:92vh;overflow:auto;border:1px solid rgba(177,108,255,.45);border-radius:22px;background:linear-gradient(145deg,#11102a,#090814);padding:28px}.program-showcase-close{position:absolute;right:14px;top:12px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:#ffffff0d;color:#fff;font-size:22px;cursor:pointer}
      .program-showcase-form{display:grid;gap:14px}.program-showcase-form input,.program-showcase-form textarea{width:100%;background:#07091d;border:1px solid #383c70;color:#fff;border-radius:10px;padding:12px}.program-showcase-form textarea{min-height:100px;resize:vertical}.program-showcase-preview{width:100%;max-height:260px;object-fit:contain;background:#ffffff08;border-radius:14px;margin-top:8px}.program-showcase-status{min-height:20px;color:#c793ff;font-size:13px}.program-showcase-form-actions{display:flex;gap:10px;flex-wrap:wrap}
      @media(max-width:760px){.program-showcase-head{align-items:flex-start;flex-direction:column}.program-showcase-grid{grid-template-columns:1fr}.program-showcase{margin-top:30px;padding-top:26px}}
    `;document.head.appendChild(s);
  }

  function inject(){
    const program=$('program');if(!program||$('hostProgramShowcase'))return false;
    const wrap=document.createElement('div');wrap.id='hostProgramShowcase';wrap.className='program-showcase';wrap.innerHTML=`
      <div class="program-showcase-head">
        <div><p class="eyebrow">HOST PROGRAM FEATURES</p><h3>Recognition & Rewards</h3><p>Showcase top hosts, exclusive rewards, milestones, and other special Host Program features.</p></div>
        <button class="btn btn-primary program-showcase-add" id="addProgramShowcaseBtn" type="button">+ Add Program Feature</button>
      </div>
      <div class="program-showcase-grid" id="programShowcaseGrid"></div>`;
    program.appendChild(wrap);
    $('addProgramShowcaseBtn').onclick=()=>openModal(null);
    return true;
  }

  function render(){
    const grid=$('programShowcaseGrid');if(!grid)return;
    if(!rows.length){grid.innerHTML='<div class="program-showcase-empty">No Host Program showcase cards yet.</div>';return;}
    grid.innerHTML=rows.map(r=>`<article class="program-showcase-card">
      <div class="program-showcase-media">${r.photo_url?`<img src="${esc(r.photo_url)}" alt="${esc(r.title)}">`:`<div class="program-showcase-placeholder"><strong>${esc(r.title)}</strong><span>Upload a photo from Owner Mode</span></div>`}</div>
      <div class="program-showcase-copy"><h4>${esc(r.title)}</h4><p>${esc(r.caption||'')}</p>
      <div class="program-showcase-actions"><button class="mini-btn" type="button" data-showcase-edit="${r.id}">Edit</button><button class="mini-btn" type="button" data-showcase-delete="${r.id}">Delete</button></div></div>
    </article>`).join('');
    grid.querySelectorAll('[data-showcase-edit]').forEach(b=>b.onclick=()=>openModal(Number(b.dataset.showcaseEdit)));
    grid.querySelectorAll('[data-showcase-delete]').forEach(b=>b.onclick=()=>removeCard(Number(b.dataset.showcaseDelete)));
  }

  async function loadRows(){
    try{
      const r=await fetch(`${API}/rest/v1/${TABLE}?select=*&order=sort_order.asc,id.asc`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
      if(!r.ok)throw new Error(await r.text());rows=await r.json();render();
    }catch(err){console.error('[Twin Arc] Host Program showcase load failed',err);const grid=$('programShowcaseGrid');if(grid)grid.innerHTML='<div class="program-showcase-empty">Could not load Host Program showcase.</div>';}
  }

  function buildModal(){
    if($('programShowcaseModal'))return;
    const m=document.createElement('div');m.id='programShowcaseModal';m.className='program-showcase-modal';m.hidden=true;m.innerHTML=`<div class="program-showcase-backdrop" data-ps-close></div><section class="program-showcase-dialog"><button class="program-showcase-close" type="button" data-ps-close>×</button><p class="eyebrow">OWNER HOST PROGRAM EDITOR</p><h2 id="programShowcaseModalTitle">Add Program Feature</h2><form id="programShowcaseForm" class="program-showcase-form"><label>Title<input id="programShowcaseTitle" maxlength="80" required></label><label>Caption / Description<textarea id="programShowcaseCaption" maxlength="500"></textarea></label><label>Photo<input id="programShowcasePhoto" type="file" accept="image/*"><img id="programShowcasePreview" class="program-showcase-preview" alt="Preview" hidden></label><p id="programShowcaseStatus" class="program-showcase-status"></p><div class="program-showcase-form-actions"><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-secondary" type="button" data-ps-close>Cancel</button></div></form></section>`;document.body.appendChild(m);
    m.querySelectorAll('[data-ps-close]').forEach(x=>x.onclick=closeModal);$('programShowcaseForm').onsubmit=saveCard;$('programShowcasePhoto').onchange=()=>{const f=$('programShowcasePhoto').files?.[0],img=$('programShowcasePreview');if(f){img.src=URL.createObjectURL(f);img.hidden=false;}};
  }

  function openModal(id){
    if(!owner())return;buildModal();editingId=id;const row=id?rows.find(x=>x.id===id):null;$('programShowcaseModalTitle').textContent=id?'Edit Program Feature':'Add Program Feature';$('programShowcaseTitle').value=row?.title||'';$('programShowcaseCaption').value=row?.caption||'';$('programShowcasePhoto').value='';const img=$('programShowcasePreview');if(row?.photo_url){img.src=row.photo_url;img.hidden=false;}else{img.hidden=true;img.removeAttribute('src');}$('programShowcaseStatus').textContent='';$('programShowcaseModal').hidden=false;document.body.style.overflow='hidden';
  }
  function closeModal(){if($('programShowcaseModal'))$('programShowcaseModal').hidden=true;document.body.style.overflow='';editingId=null;}

  async function uploadPhoto(file,token){
    if(!file)return null;if(file.size>8*1024*1024)throw new Error('Image must be under 8 MB.');const ext=(file.name.split('.').pop()||'png').replace(/[^a-z0-9]/gi,'').toLowerCase();const path=`host-program/showcase-${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const r=await fetch(`${API}/storage/v1/object/${BUCKET}/${path}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});if(!r.ok)throw new Error(await r.text());return `${API}/storage/v1/object/public/${BUCKET}/${path}`;
  }

  async function saveCard(e){
    e.preventDefault();if(!owner())return;const token=typeof getOwnerAccessToken==='function'?await getOwnerAccessToken():null;if(!token){$('programShowcaseStatus').textContent='Owner session expired.';return;}
    try{
      $('programShowcaseStatus').textContent='Saving…';const title=$('programShowcaseTitle').value.trim();const caption=$('programShowcaseCaption').value.trim();const file=$('programShowcasePhoto').files?.[0];let photoUrl=null;if(file)photoUrl=await uploadPhoto(file,token);
      if(editingId){const existing=rows.find(x=>x.id===editingId);const payload={title,caption,updated_at:new Date().toISOString()};if(photoUrl)payload.photo_url=photoUrl;const r=await fetch(`${API}/rest/v1/${TABLE}?id=eq.${editingId}`,{method:'PATCH',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());const updated=(await r.json())[0];rows=rows.map(x=>x.id===editingId?updated:x);
      }else{
        const max=rows.reduce((m,x)=>Math.max(m,Number(x.sort_order)||0),0);const payload={title,caption,photo_url:photoUrl,sort_order:max+10};const r=await fetch(`${API}/rest/v1/${TABLE}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());rows.push((await r.json())[0]);
      }
      rows.sort((a,b)=>(a.sort_order-b.sort_order)||(a.id-b.id));render();$('programShowcaseStatus').textContent='Saved.';setTimeout(closeModal,450);
    }catch(err){console.error(err);$('programShowcaseStatus').textContent=err.message||'Could not save.';}
  }

  async function removeCard(id){
    if(!owner()||!confirm('Delete this Host Program feature?'))return;const token=typeof getOwnerAccessToken==='function'?await getOwnerAccessToken():null;if(!token)return;
    try{const r=await fetch(`${API}/rest/v1/${TABLE}?id=eq.${id}`,{method:'DELETE',headers:{apikey:KEY,Authorization:`Bearer ${token}`,Prefer:'return=minimal'}});if(!r.ok)throw new Error(await r.text());rows=rows.filter(x=>x.id!==id);render();}catch(err){console.error(err);alert(err.message||'Could not delete.');}
  }

  function syncOwner(){document.body.classList.toggle('site-owner-unlocked',owner());if(!owner()&&$('programShowcaseModal')&&!$('programShowcaseModal').hidden)closeModal();}
  function watchOwner(){const b=$('adminModeBtn');if(!b)return;syncOwner();new MutationObserver(syncOwner).observe(b,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});}
  function init(){installStyles();if(!inject()){let n=0;const t=setInterval(()=>{n++;if(inject()||n>30){clearInterval(t);if($('hostProgramShowcase')){buildModal();watchOwner();loadRows();}}},200);return;}buildModal();watchOwner();loadRows();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();