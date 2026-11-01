// Twin Arc Agency — editable Host Program lower-third logo.
(function(){
  const API='https://uhcfsdsdlqcqadkhlzkg.supabase.co';
  const KEY='sb_publishable_1tdi3y-UoBBnHKFsW1MFcw_vyRBbdgA';
  const owner=()=>document.getElementById('adminModeBtn')?.classList.contains('is-unlocked')===true;
  const logo=()=>document.querySelector('#program .agency-logo-side img');

  function installStyles(){
    if(document.getElementById('programCardLogoEditorStyles'))return;
    const s=document.createElement('style');
    s.id='programCardLogoEditorStyles';
    s.textContent=`
      .program-logo-edit-btn{display:none;position:static;z-index:15;margin:12px 0 0 auto;border:1px solid rgba(192,139,255,.58);background:rgba(10,7,25,.90);color:#fff;border-radius:999px;padding:8px 12px;font:700 9px Montserrat,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.28)}
      body.site-owner-unlocked .program-logo-edit-btn,body:has(#adminModeBtn.is-unlocked) .program-logo-edit-btn{display:flex}
      @media(max-width:700px){.program-logo-edit-btn{margin:10px auto 0;font-size:8px;padding:7px 10px}}
    `;
    document.head.appendChild(s);
  }

  async function loadLogo(){
    try{
      const r=await fetch(`${API}/rest/v1/site_content?id=eq.1&select=program_logo_url`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
      if(!r.ok)return;
      const row=(await r.json())[0];
      if(row?.program_logo_url&&logo())logo().src=row.program_logo_url;
    }catch(e){console.warn('[Twin Arc] Program logo load skipped',e);}
  }

  async function chooseLogo(){
    if(!owner())return;
    const input=document.createElement('input');
    input.type='file';input.accept='image/png,image/webp,image/jpeg,image/*';
    input.onchange=async()=>{
      const file=input.files?.[0];if(!file)return;
      if(file.size>8*1024*1024){alert('Logo image must be under 8 MB.');return;}
      const token=typeof getOwnerAccessToken==='function'?await getOwnerAccessToken():null;
      if(!token){alert('Owner session expired. Please sign in again.');return;}
      const btn=document.querySelector('.program-logo-edit-btn');
      try{
        if(btn){btn.disabled=true;btn.textContent='Uploading…';}
        const ext=(file.name.split('.').pop()||'png').replace(/[^a-z0-9]/gi,'').toLowerCase();
        const path=`program-card-logo-${Date.now()}.${ext}`;
        const up=await fetch(`${API}/storage/v1/object/site-branding/${encodeURIComponent(path)}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
        if(!up.ok)throw new Error(await up.text());
        const url=`${API}/storage/v1/object/public/site-branding/${encodeURIComponent(path)}`;
        const save=await fetch(`${API}/rest/v1/site_content?id=eq.1`,{method:'PATCH',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({program_logo_url:url,updated_at:new Date().toISOString()})});
        if(!save.ok)throw new Error(await save.text());
        if(logo())logo().src=url;
        if(btn)btn.textContent='✓ Logo Saved';
        setTimeout(()=>{if(btn)btn.textContent='✎ Edit Card Logo';},1000);
      }catch(err){console.error(err);alert('Could not save the card logo. Please try again.');if(btn)btn.textContent='✎ Edit Card Logo';}
      finally{if(btn)btn.disabled=false;}
    };
    input.click();
  }

  function addButton(){
    const panel=document.querySelector('#program .agency-founder-panel');
    if(!panel||document.querySelector('#program .program-logo-edit-btn'))return;
    const b=document.createElement('button');b.type='button';b.className='program-logo-edit-btn';b.textContent='✎ Edit Card Logo';b.onclick=chooseLogo;
    panel.insertAdjacentElement('afterend',b);
  }

  function syncOwner(){document.body.classList.toggle('site-owner-unlocked',owner());}
  function init(){installStyles();addButton();loadLogo();syncOwner();const admin=document.getElementById('adminModeBtn');if(admin)new MutationObserver(syncOwner).observe(admin,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
