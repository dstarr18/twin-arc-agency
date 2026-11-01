// Twin Arc Agency — Host Program Top Hosts + Announcement showcase.
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
    const s=document.createElement('style');
    s.id='hostProgramShowcaseStyles';
    s.textContent=`
      .program-showcase{grid-column:1/-1;width:100%;margin-top:42px;padding-top:34px;border-top:1px solid rgba(158,110,255,.25)}
      .program-showcase-head{margin-bottom:20px}
      .program-showcase-head h3{margin:4px 0 0;font-size:clamp(24px,3vw,38px)}
      .program-showcase-head p{margin:6px 0 0;color:#b7b7cc;max-width:760px;line-height:1.6}
      .program-showcase-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;align-items:stretch}
      .program-top-card{position:relative;overflow:hidden;border:1px solid rgba(140,91,255,.48);border-radius:22px;background:linear-gradient(145deg,rgba(25,19,52,.96),rgba(9,9,22,.96));box-shadow:0 18px 44px rgba(0,0,0,.24);min-height:520px;display:flex;flex-direction:column}
      .program-top-media{flex:1;min-height:350px;background:radial-gradient(circle at 50% 35%,rgba(112,64,255,.26),rgba(8,8,20,.96));display:grid;place-items:center;overflow:hidden}
      .program-top-media img{width:100%;height:100%;object-fit:cover;display:block}
      .program-top-copy{padding:18px 18px 20px}
      .program-top-copy h4{margin:0 0 8px;font-size:24px}
      .program-top-copy p{margin:0;color:#b9b7c8;line-height:1.55}
      .program-placeholder{display:grid;place-items:center;text-align:center;gap:8px;padding:22px;color:#d8ccff}
      .program-placeholder strong{font-size:18px}.program-placeholder span{font-size:12px;color:#9d92b9}
      .program-card-actions{display:none;gap:8px;margin-top:16px}.program-card-actions button{flex:1}
      body.site-owner-unlocked .program-card-actions,body:has(#adminModeBtn.is-unlocked) .program-card-actions{display:flex}

      .program-announcements{border:1px solid rgba(140,91,255,.48);border-radius:22px;background:linear-gradient(145deg,rgba(25,19,52,.82),rgba(9,9,22,.95));padding:16px;box-shadow:0 18px 44px rgba(0,0,0,.24);min-height:520px;display:flex;flex-direction:column}
      .program-announcements-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
      .program-announcements-head h4{margin:0;font-size:24px}.program-announcements-head span{font-size:12px;color:#a89fc0;text-transform:uppercase;letter-spacing:.12em}
      .program-announcement-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr));gap:10px;flex:1}
      .program-announcement-card{position:relative;min-height:0;overflow:hidden;border:1px solid rgba(146,99,255,.38);border-radius:16px;background:radial-gradient(circle at 50% 30%,rgba(112,64,255,.20),rgba(8,8,20,.98));display:flex;flex-direction:column}
      .program-announcement-media{position:relative;flex:1;min-height:0;display:grid;place-items:center;overflow:hidden}
      .program-announcement-media img{width:100%;height:100%;object-fit:cover;display:block}
      .program-announcement-empty{display:grid;place-items:center;text-align:center;padding:12px;color:#d8ccff;gap:5px}.program-announcement-empty strong{font-size:13px}.program-announcement-empty span{font-size:10px;color:#958ba9}
      .program-announcement-label{padding:8px 10px 9px;background:rgba(5,5,14,.82);border-top:1px solid rgba(145,96,255,.20)}
      .program-announcement-label strong{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .program-announcement-label p{margin:3px 0 0;color:#a9a4b7;font-size:10px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .program-announcement-edit{display:none;position:absolute;right:7px;top:7px;z-index:2;padding:6px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(8,7,18,.88);color:#fff;font-size:10px;cursor:pointer}
      body.site-owner-unlocked .program-announcement-edit,body:has(#adminModeBtn.is-unlocked) .program-announcement-edit{display:inline-flex}

      .program-showcase-empty{grid-column:1/-1;padding:28px;border:1px dashed rgba(174,127,255,.35);border-radius:18px;text-align:center;color:#a9a4bb}
      .program-showcase-modal[hidden]{display:none!important}.program-showcase-modal{position:fixed;inset:0;z-index:210;display:grid;place-items:center;padding:18px}.program-showcase-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(8px)}
      .program-showcase-dialog{position:relative;z-index:1;width:min(620px,96vw);max-height:92vh;overflow:auto;border:1px solid rgba(177,108,255,.45);border-radius:22px;background:linear-gradient(145deg,#11102a,#090814);padding:28px}.program-showcase-close{position:absolute;right:14px;top:12px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:#ffffff0d;color:#fff;font-size:22px;cursor:pointer}
      .program-showcase-form{display:grid;gap:14px}.program-showcase-form input,.program-showcase-form textarea{width:100%;background:#07091d;border:1px solid #383c70;color:#fff;border-radius:10px;padding:12px}.program-showcase-form textarea{min-height:100px;resize:vertical}.program-showcase-preview{width:100%;max-height:260px;object-fit:contain;background:#ffffff08;border-radius:14px;margin-top:8px}.program-showcase-status{min-height:20px;color:#c793ff;font-size:13px}.program-showcase-form-actions{display:flex;gap:10px;flex-wrap:wrap}
      @media(max-width:860px){.program-showcase-layout{grid-template-columns:1fr}.program-top-card,.program-announcements{min-height:auto}.program-top-media{min-height:320px}.program-announcement-grid{grid-template-rows:repeat(3,150px)}}
      @media(max-width:560px){.program-announcement-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(3,132px);gap:8px}.program-announcements{padding:12px}.program-showcase{margin-top:30px;padding-top:26px}}
    `;
    document.head.appendChild(s);
  }

  function inject(){
    const program=$('program');
    if(!program||$('hostProgramShowcase'))return false;
    const wrap=document.createElement('div');
    wrap.id='hostProgramShowcase';
    wrap.className='program-showcase';
    wrap.innerHTML=`
      <div class="program-showcase-head">
        <p class="eyebrow">HOST PROGRAM FEATURES</p>
        <h3>Recognition & Announcements</h3>
        <p>Showcase standout hosts and keep important Host Program announcements visible in one place.</p>
      </div>
      <div class="program-showcase-layout" id="programShowcaseGrid"></div>`;
    program.appendChild(wrap);
    return true;
  }

  function topCard(row){
    if(!row)return '<div class="program-showcase-empty">Top Hosts card is not available.</div>';
    return `<article class="program-top-card">
      <div class="program-top-media">${row.photo_url?`<img src="${esc(row.photo_url)}" alt="${esc(row.title)}">`:`<div class="program-placeholder"><strong>Top Hosts</strong><span>Upload a photo from Owner Mode</span></div>`}</div>
      <div class="program-top-copy"><h4>${esc(row.title||'Top Hosts')}</h4><p>${esc(row.caption||'')}</p>
        <div class="program-card-actions"><button class="mini-btn" type="button" data-showcase-edit="${row.id}">Edit Top Hosts</button></div>
      </div>
    </article>`;
  }

  function announcementCard(row,index){
    if(!row)return `<article class="program-announcement-card"><div class="program-announcement-empty"><strong>Announcement ${index+1}</strong><span>Slot unavailable</span></div></article>`;
    return `<article class="program-announcement-card">
      <button class="program-announcement-edit" type="button" data-showcase-edit="${row.id}">Edit</button>
      <div class="program-announcement-media">${row.photo_url?`<img src="${esc(row.photo_url)}" alt="${esc(row.title)}">`:`<div class="program-announcement-empty"><strong>${esc(row.title||`Announcement ${index+1}`)}</strong><span>Upload photo</span></div>`}</div>
      <div class="program-announcement-label"><strong>${esc(row.title||`Announcement ${index+1}`)}</strong>${row.caption?`<p>${esc(row.caption)}</p>`:''}</div>
    </article>`;
  }

  function render(){
    const grid=$('programShowcaseGrid');
    if(!grid)return;
    const sorted=[...rows].sort((a,b)=>(Number(a.sort_order)||0)-(Number(b.sort_order)||0)||(a.id-b.id));
    const top=sorted.find(r=>Number(r.sort_order)===10)||sorted[0];
    const announcements=sorted.filter(r=>r.id!==top?.id).slice(0,6);
    while(announcements.length<6)announcements.push(null);
    grid.innerHTML=`${topCard(top)}<section class="program-announcements"><div class="program-announcements-head"><h4>Announcement</h4><span>6 slots</span></div><div class="program-announcement-grid">${announcements.map((r,i)=>announcementCard(r,i)).join('')}</div></section>`;
    grid.querySelectorAll('[data-showcase-edit]').forEach(b=>b.onclick=()=>openModal(Number(b.dataset.showcaseEdit)));
  }

  async function loadRows(){
    try{
      const r=await fetch(`${API}/rest/v1/${TABLE}?select=*&order=sort_order.asc,id.asc`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
      if(!r.ok)throw new Error(await r.text());
      rows=await r.json();
      render();
    }catch(err){
      console.error('[Twin Arc] Host Program showcase load failed',err);
      const grid=$('programShowcaseGrid');if(grid)grid.innerHTML='<div class="program-showcase-empty">Could not load Host Program showcase.</div>';
    }
  }

  function buildModal(){
    if($('programShowcaseModal'))return;
    const m=document.createElement('div');
    m.id='programShowcaseModal';m.className='program-showcase-modal';m.hidden=true;
    m.innerHTML=`<div class="program-showcase-backdrop" data-ps-close></div><section class="program-showcase-dialog"><button class="program-showcase-close" type="button" data-ps-close>×</button><p class="eyebrow">OWNER HOST PROGRAM EDITOR</p><h2 id="programShowcaseModalTitle">Edit Feature</h2><form id="programShowcaseForm" class="program-showcase-form"><label>Title<input id="programShowcaseTitle" maxlength="80" required></label><label>Caption / Description<textarea id="programShowcaseCaption" maxlength="500"></textarea></label><label>Photo<input id="programShowcasePhoto" type="file" accept="image/*"><img id="programShowcasePreview" class="program-showcase-preview" alt="Preview" hidden></label><p id="programShowcaseStatus" class="program-showcase-status"></p><div class="program-showcase-form-actions"><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-secondary" type="button" data-ps-close>Cancel</button></div></form></section>`;
    document.body.appendChild(m);
    m.querySelectorAll('[data-ps-close]').forEach(x=>x.onclick=closeModal);
    $('programShowcaseForm').onsubmit=saveCard;
    $('programShowcasePhoto').onchange=()=>{const f=$('programShowcasePhoto').files?.[0],img=$('programShowcasePreview');if(f){img.src=URL.createObjectURL(f);img.hidden=false;}};
  }

  function openModal(id){
    if(!owner())return;
    buildModal();editingId=id;
    const row=rows.find(x=>x.id===id);if(!row)return;
    $('programShowcaseModalTitle').textContent=Number(row.sort_order)===10?'Edit Top Hosts':'Edit Announcement';
    $('programShowcaseTitle').value=row.title||'';
    $('programShowcaseCaption').value=row.caption||'';
    $('programShowcasePhoto').value='';
    const img=$('programShowcasePreview');
    if(row.photo_url){img.src=row.photo_url;img.hidden=false;}else{img.hidden=true;img.removeAttribute('src');}
    $('programShowcaseStatus').textContent='';
    $('programShowcaseModal').hidden=false;
    document.body.style.overflow='hidden';
  }

  function closeModal(){if($('programShowcaseModal'))$('programShowcaseModal').hidden=true;document.body.style.overflow='';editingId=null;}

  async function uploadPhoto(file,token){
    if(!file)return null;
    if(file.size>8*1024*1024)throw new Error('Image must be under 8 MB.');
    const ext=(file.name.split('.').pop()||'png').replace(/[^a-z0-9]/gi,'').toLowerCase();
    const path=`host-program/showcase-${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const r=await fetch(`${API}/storage/v1/object/${BUCKET}/${path}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
    if(!r.ok)throw new Error(await r.text());
    return `${API}/storage/v1/object/public/${BUCKET}/${path}`;
  }

  async function saveCard(e){
    e.preventDefault();if(!owner()||!editingId)return;
    const token=typeof getOwnerAccessToken==='function'?await getOwnerAccessToken():null;
    if(!token){$('programShowcaseStatus').textContent='Owner session expired.';return;}
    try{
      $('programShowcaseStatus').textContent='Saving…';
      const title=$('programShowcaseTitle').value.trim();
      const caption=$('programShowcaseCaption').value.trim();
      const file=$('programShowcasePhoto').files?.[0];
      const payload={title,caption,updated_at:new Date().toISOString()};
      if(file)payload.photo_url=await uploadPhoto(file,token);
      const r=await fetch(`${API}/rest/v1/${TABLE}?id=eq.${editingId}`,{method:'PATCH',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload)});
      if(!r.ok)throw new Error(await r.text());
      const updated=(await r.json())[0];
      rows=rows.map(x=>x.id===editingId?updated:x);
      render();
      $('programShowcaseStatus').textContent='Saved.';
      setTimeout(closeModal,350);
    }catch(err){console.error(err);$('programShowcaseStatus').textContent=err.message||'Could not save.';}
  }

  function syncOwner(){document.body.classList.toggle('site-owner-unlocked',owner());if(!owner()&&$('programShowcaseModal')&&!$('programShowcaseModal').hidden)closeModal();}
  function watchOwner(){const b=$('adminModeBtn');if(!b)return;syncOwner();new MutationObserver(syncOwner).observe(b,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});}
  function init(){installStyles();if(!inject()){let n=0;const t=setInterval(()=>{n++;if(inject()||n>30){clearInterval(t);if($('hostProgramShowcase')){buildModal();watchOwner();loadRows();}}},200);return;}buildModal();watchOwner();loadRows();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();