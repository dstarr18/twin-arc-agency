// Twin Arc Agency — owner-editable Host Program section.
(function(){
  const API='https://uhcfsdsdlqcqadkhlzkg.supabase.co';
  const KEY='sb_publishable_1tdi3y-UoBBnHKFsW1MFcw_vyRBbdgA';
  const $=id=>document.getElementById(id);
  let row=null;

  const ownerUnlocked=()=>document.getElementById('adminModeBtn')?.classList.contains('is-unlocked')===true;

  function markNodes(){
    const section=$('program');
    if(!section)return;
    const copy=section.querySelector(':scope > .reveal');
    if(copy){
      const eyebrow=copy.querySelector('.eyebrow'); if(eyebrow)eyebrow.id='programEyebrowText';
      const h2=copy.querySelector('h2'); if(h2)h2.id='programTitleText';
      const p=copy.querySelector('p:not(.eyebrow)'); if(p)p.id='programCopyText';
      copy.querySelectorAll('.check-list li').forEach((li,i)=>li.id=`programBullet${i+1}Text`);
    }
    const panel=section.querySelector('.agency-founder-panel');
    if(panel){
      const founderImg=panel.querySelector('.agency-founder-side > img'); if(founderImg)founderImg.id='programFounderPhoto';
      const cap=panel.querySelector('.agency-founder-caption');
      if(cap){
        const h3=cap.querySelector('h3'); if(h3)h3.id='programFounderNameText';
        const owner=cap.querySelector('.owner-line'); if(owner)owner.id='programOwnerLineText';
        const agency=cap.querySelector('.agency-line'); if(agency)agency.id='programAgencyLineText';
        const tagline=cap.querySelector('.tagline-line'); if(tagline)tagline.id='programTaglineLineText';
      }
    }
    if(!$('editHostProgramBtn')){
      const b=document.createElement('button');
      b.type='button'; b.id='editHostProgramBtn'; b.className='host-program-edit-btn'; b.textContent='✎ Edit Host Program';
      b.addEventListener('click',openEditor); section.appendChild(b);
    }
  }

  function injectStyles(){
    if($('hostProgramEditorStyles'))return;
    const s=document.createElement('style'); s.id='hostProgramEditorStyles';
    s.textContent=`#program{position:relative}.host-program-edit-btn{display:none;position:absolute;right:clamp(18px,4vw,60px);top:22px;z-index:10;border:1px solid rgba(185,129,255,.55);background:rgba(12,8,28,.86);color:#fff;border-radius:999px;padding:9px 14px;font:700 10px Montserrat,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}body.site-owner-unlocked .host-program-edit-btn{display:inline-flex}.host-program-modal[hidden]{display:none!important}.host-program-modal{position:fixed;inset:0;z-index:170;display:grid;place-items:center;padding:18px}.host-program-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px)}.host-program-dialog{position:relative;z-index:1;width:min(900px,96vw);max-height:92vh;overflow:auto;border:1px solid rgba(177,108,255,.45);border-radius:22px;background:linear-gradient(145deg,#11102a,#090814);box-shadow:0 30px 100px rgba(0,0,0,.65);padding:clamp(22px,4vw,38px)}.host-program-close{position:absolute;right:16px;top:14px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:#ffffff0d;color:#fff;font-size:22px;cursor:pointer}.host-program-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.host-program-grid .full{grid-column:1/-1}.host-program-grid input,.host-program-grid textarea{width:100%;background:#07091d;border:1px solid #383c70;color:#fff;border-radius:10px;padding:12px}.host-program-grid textarea{resize:vertical;min-height:80px}.host-program-preview{width:180px;height:180px;object-fit:contain;border-radius:14px;background:#0b0b15;margin-top:8px;display:block}.host-program-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.host-program-status{min-height:20px;color:#c793ff;font-size:13px}@media(max-width:700px){.host-program-grid{grid-template-columns:1fr}.host-program-grid .full{grid-column:auto}.host-program-edit-btn{top:12px;right:12px}}`;
    document.head.appendChild(s);
  }

  function buildModal(){
    if($('hostProgramModal'))return;
    const m=document.createElement('div'); m.id='hostProgramModal'; m.className='host-program-modal'; m.hidden=true; m.setAttribute('aria-hidden','true');
    m.innerHTML=`<div class="host-program-backdrop" data-close-program></div><section class="host-program-dialog" role="dialog" aria-modal="true"><button class="host-program-close" type="button" data-close-program>×</button><p class="eyebrow">OWNER SITE EDITOR</p><h2>Edit Host Program</h2><p style="opacity:.75">Change the Host Program text and founder photo. Changes save to the cloud for everyone.</p><form id="hostProgramForm"><div class="host-program-grid"><label class="full">Founder Photo<input id="programPhotoFile" type="file" accept="image/*"><img id="programPhotoPreview" class="host-program-preview" alt="Program photo preview"></label><label class="full">Eyebrow<input id="editProgramEyebrow"></label><label class="full">Title<input id="editProgramTitle"></label><label class="full">Description<textarea id="editProgramCopy"></textarea></label><label>Bullet 1<input id="editProgramBullet1"></label><label>Bullet 2<input id="editProgramBullet2"></label><label>Bullet 3<input id="editProgramBullet3"></label><label>Bullet 4<input id="editProgramBullet4"></label><label>Founder Name<input id="editProgramFounderName"></label><label>Owner Line<input id="editProgramOwnerLine"></label><label>Agency Line<input id="editProgramAgencyLine"></label><label>Tagline<input id="editProgramTaglineLine"></label></div><p id="hostProgramStatus" class="host-program-status"></p><div class="host-program-actions"><button class="btn btn-primary" type="submit">Save Host Program</button><button class="btn btn-secondary" type="button" data-close-program>Cancel</button></div></form></section>`;
    document.body.appendChild(m);
    m.querySelectorAll('[data-close-program]').forEach(el=>el.addEventListener('click',closeEditor));
    $('programPhotoFile').addEventListener('change',()=>{const f=$('programPhotoFile').files?.[0];if(f)$('programPhotoPreview').src=URL.createObjectURL(f);});
    $('hostProgramForm').addEventListener('submit',save);
  }

  function apply(d){
    if(!d)return;
    const text=(id,v)=>{const el=$(id);if(el&&v!=null&&v!=='')el.textContent=v;};
    text('programEyebrowText',d.program_eyebrow); text('programTitleText',d.program_title); text('programCopyText',d.program_copy);
    for(let i=1;i<=4;i++)text(`programBullet${i}Text`,d[`program_bullet${i}`]);
    text('programFounderNameText',d.program_founder_name); text('programOwnerLineText',d.program_owner_line); text('programAgencyLineText',d.program_agency_line); text('programTaglineLineText',d.program_tagline_line);
    const img=$('programFounderPhoto'); if(img&&d.program_photo_url)img.src=d.program_photo_url;
  }

  async function load(){
    try{const r=await fetch(`${API}/rest/v1/site_content?id=eq.1&select=*`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});if(!r.ok)throw new Error(await r.text());const rows=await r.json();row=rows[0]||{};apply(row);}catch(e){console.error('[Twin Arc] Host Program content load failed',e);}
  }

  function fill(){
    const d=row||{}; const set=(id,v)=>{if($(id))$(id).value=v||'';};
    set('editProgramEyebrow',d.program_eyebrow); set('editProgramTitle',d.program_title); set('editProgramCopy',d.program_copy);
    for(let i=1;i<=4;i++)set(`editProgramBullet${i}`,d[`program_bullet${i}`]);
    set('editProgramFounderName',d.program_founder_name); set('editProgramOwnerLine',d.program_owner_line); set('editProgramAgencyLine',d.program_agency_line); set('editProgramTaglineLine',d.program_tagline_line);
    $('programPhotoFile').value=''; $('programPhotoPreview').src=d.program_photo_url||'images/daven-starr-founder.jpg';
  }

  function openEditor(){if(!ownerUnlocked())return;fill();$('hostProgramStatus').textContent='';const m=$('hostProgramModal');m.hidden=false;m.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
  function closeEditor(){const m=$('hostProgramModal');if(!m)return;m.hidden=true;m.setAttribute('aria-hidden','true');document.body.style.overflow='';}

  async function uploadPhoto(file,token){
    if(!file)return row?.program_photo_url||'images/daven-starr-founder.jpg';
    if(file.size>10*1024*1024)throw new Error('Photo is too large. Please use an image under 10 MB.');
    const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase()||'jpg';
    const path=`host-program-${Date.now()}.${ext}`;
    const r=await fetch(`${API}/storage/v1/object/site-branding/${encodeURIComponent(path)}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
    if(!r.ok)throw new Error(`Photo upload failed: ${await r.text()}`);
    return `${API}/storage/v1/object/public/site-branding/${encodeURIComponent(path)}`;
  }

  async function save(e){
    e.preventDefault(); const status=$('hostProgramStatus');
    if(!ownerUnlocked()){status.textContent='Owner sign-in required.';return;}
    const token=typeof getOwnerAccessToken==='function'?await getOwnerAccessToken():null;
    if(!token){status.textContent='Owner session expired. Please sign in again.';return;}
    try{
      status.textContent='Saving...';
      const photo=await uploadPhoto($('programPhotoFile').files?.[0],token);
      const payload={program_eyebrow:$('editProgramEyebrow').value.trim(),program_title:$('editProgramTitle').value.trim(),program_copy:$('editProgramCopy').value.trim(),program_bullet1:$('editProgramBullet1').value.trim(),program_bullet2:$('editProgramBullet2').value.trim(),program_bullet3:$('editProgramBullet3').value.trim(),program_bullet4:$('editProgramBullet4').value.trim(),program_photo_url:photo,program_founder_name:$('editProgramFounderName').value.trim(),program_owner_line:$('editProgramOwnerLine').value.trim(),program_agency_line:$('editProgramAgencyLine').value.trim(),program_tagline_line:$('editProgramTaglineLine').value.trim(),updated_at:new Date().toISOString()};
      const r=await fetch(`${API}/rest/v1/site_content?id=eq.1`,{method:'PATCH',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload)});
      if(!r.ok)throw new Error(await r.text());const rows=await r.json();row=rows[0]||{...row,...payload};apply(row);status.textContent='Host Program saved.';setTimeout(closeEditor,600);
    }catch(err){console.error('[Twin Arc] Host Program save failed',err);status.textContent=err.message||'Could not save Host Program.';}
  }

  function syncOwner(){document.body.classList.toggle('site-owner-unlocked',ownerUnlocked());if(!ownerUnlocked()&&$('hostProgramModal')&&!$('hostProgramModal').hidden)closeEditor();}
  function watchOwner(){const btn=$('adminModeBtn');if(!btn)return;syncOwner();new MutationObserver(syncOwner).observe(btn,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});}

  injectStyles(); markNodes(); buildModal(); watchOwner(); load();
})();