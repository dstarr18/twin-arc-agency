// Twin Arc Agency — separate owner controls for Header Logo and Home/Main Logo.
(function(){
  const API='https://uhcfsdsdlqcqadkhlzkg.supabase.co';
  const KEY='sb_publishable_1tdi3y-UoBBnHKFsW1MFcw_vyRBbdgA';
  const CACHE_KEY='twinArcHeaderLogoState';
  let state={header_logo_url:null,header_logo_scale:1,hero_logo_url:null,hero_logo_scale:1};
  let headerPreviewUrl=null, heroPreviewUrl=null;

  const $=id=>document.getElementById(id);
  const clamp=n=>Math.min(1.8,Math.max(.45,Number(n)||1));
  const ownerUnlocked=()=>document.getElementById('adminModeBtn')?.classList.contains('is-unlocked')===true;

  function cacheHeaderState(){
    try{localStorage.setItem(CACHE_KEY,JSON.stringify({url:state.header_logo_url||null,scale:clamp(state.header_logo_scale)}));}catch(_){ }
  }

  function applyLogo(selector,url,scale){
    if(!url)return;
    document.querySelectorAll(selector).forEach(img=>{
      img.src=url;
      img.style.setProperty('transform',`scale(${clamp(scale)})`);
      img.style.setProperty('transform-origin','center center');
      img.style.setProperty('transition','none','important');
    });
  }

  function applyState(){
    applyLogo('.brand img',state.header_logo_url,state.header_logo_scale);
    cacheHeaderState();
    // Keep the Home hero on the original local image already present in index.html.
    updatePreview('header');
    updatePreview('hero');
  }

  async function loadState(){
    try{
      const r=await fetch(`${API}/rest/v1/site_content?id=eq.1&select=header_logo_url,header_logo_scale,hero_logo_url,hero_logo_scale,logo_url,logo_scale`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
      if(!r.ok)throw new Error(await r.text());
      const row=(await r.json())[0]||{};
      state={
        header_logo_url:row.header_logo_url||row.logo_url||null,
        header_logo_scale:clamp(row.header_logo_scale??row.logo_scale??1),
        hero_logo_url:row.hero_logo_url||row.logo_url||null,
        hero_logo_scale:clamp(row.hero_logo_scale??row.logo_scale??1)
      };
      applyState();
    }catch(err){console.error('[Twin Arc] separate logo settings load failed',err);}
  }

  function injectStyles(){
    if($('dualLogoStyles'))return;
    const style=document.createElement('style');
    style.id='dualLogoStyles';
    style.textContent=`
      .dual-logo-grid{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:2px 0 8px}
      .dual-logo-card{border:1px solid rgba(173,126,255,.35);border-radius:16px;padding:16px;background:rgba(10,9,28,.55)}
      .dual-logo-card h3{font:700 13px Montserrat,Arial,sans-serif;margin:0 0 4px;color:#fff}
      .dual-logo-card p{margin:0 0 12px;color:#aaa6bb;font-size:11px;line-height:1.45}
      .dual-logo-card input[type=file]{width:100%;margin:0 0 10px}
      .dual-logo-preview-shell{width:100%;height:150px;display:grid;place-items:center;overflow:hidden;border-radius:12px;background:linear-gradient(135deg,#18162a,#080812);border:1px solid rgba(255,255,255,.13)}
      .dual-logo-preview-shell img{max-width:72%;max-height:72%;object-fit:contain;transform-origin:center center;transition:none}
      .dual-logo-zoom{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin-top:10px}
      .dual-logo-zoom input[type=range]{margin:0;padding:0;background:transparent;border:0;box-shadow:none}
      .dual-logo-zoom button{width:34px;height:34px;border-radius:9px;border:1px solid rgba(174,128,255,.45);background:rgba(92,45,190,.18);color:#fff;font-size:20px;cursor:pointer}
      .dual-logo-value{text-align:center;color:#d8b8ff;font-size:11px;font-weight:700;margin-top:5px}
      @media(max-width:700px){.dual-logo-grid{grid-template-columns:1fr}.dual-logo-preview-shell{height:135px}}
    `;
    document.head.appendChild(style);
  }

  function card(kind,title,help){
    return `<section class="dual-logo-card" data-logo-kind="${kind}"><h3>${title}</h3><p>${help}</p><input id="${kind}LogoFile" type="file" accept="image/*"><div class="dual-logo-preview-shell"><img id="${kind}LogoPreview" alt="${title} preview"></div><div class="dual-logo-zoom"><button type="button" id="${kind}LogoZoomOut" aria-label="Zoom out ${title}">−</button><input id="${kind}LogoZoom" type="range" min="0.45" max="1.8" step="0.05" value="1" aria-label="${title} zoom"><button type="button" id="${kind}LogoZoomIn" aria-label="Zoom in ${title}">+</button></div><div class="dual-logo-value"><span id="${kind}LogoZoomValue">100%</span></div></section>`;
  }

  function updatePreview(kind){
    const img=$(`${kind}LogoPreview`);
    const scale=clamp(state[`${kind==='hero'?'hero':'header'}_logo_scale`]);
    const url=kind==='header'?(headerPreviewUrl||state.header_logo_url):(heroPreviewUrl||state.hero_logo_url);
    if(img&&url){img.src=url;img.style.transform=`scale(${scale})`;}
    const range=$(`${kind}LogoZoom`);if(range)range.value=String(scale);
    const val=$(`${kind}LogoZoomValue`);if(val)val.textContent=`${Math.round(scale*100)}%`;
  }

  function setScale(kind,value){
    const key=kind==='header'?'header_logo_scale':'hero_logo_scale';
    state[key]=clamp(value);
    updatePreview(kind);
    if(kind==='header')applyLogo('.brand img',state.header_logo_url,state.header_logo_scale);
  }

  function bindKind(kind){
    const file=$(`${kind}LogoFile`);
    const range=$(`${kind}LogoZoom`);
    file?.addEventListener('change',()=>{
      const f=file.files?.[0];if(!f)return;
      const u=URL.createObjectURL(f);
      if(kind==='header'){if(headerPreviewUrl)URL.revokeObjectURL(headerPreviewUrl);headerPreviewUrl=u;}else{if(heroPreviewUrl)URL.revokeObjectURL(heroPreviewUrl);heroPreviewUrl=u;}
      updatePreview(kind);
    });
    range?.addEventListener('input',e=>setScale(kind,e.target.value));
    $(`${kind}LogoZoomOut`)?.addEventListener('click',()=>setScale(kind,Number(range.value)-.05));
    $(`${kind}LogoZoomIn`)?.addEventListener('click',()=>setScale(kind,Number(range.value)+.05));
  }

  function enhanceEditor(){
    const original=$('siteLogoFile');
    const grid=document.querySelector('#siteContentForm .site-content-grid');
    if(!original||!grid||$('dualLogoGrid'))return false;
    const originalLabel=original.closest('label');
    if(originalLabel)originalLabel.style.display='none';
    const wrap=document.createElement('div');
    wrap.id='dualLogoGrid';wrap.className='dual-logo-grid';
    wrap.innerHTML=card('header','Header Logo','Small logo beside TWIN ARC / AGENCY in the top navigation.')+card('hero','Home/Main Logo','Large logo shown at the top of the Home section.');
    grid.insertBefore(wrap,grid.firstChild);
    bindKind('header');bindKind('hero');updatePreview('header');updatePreview('hero');
    $('siteContentForm').addEventListener('submit',saveSeparateLogos,true);
    return true;
  }

  async function upload(file,token,prefix){
    if(!file)return null;
    if(file.size>8*1024*1024)throw new Error(`${prefix} logo is too large. Please use an image under 8 MB.`);
    const ext=(file.name.split('.').pop()||'png').replace(/[^a-zA-Z0-9]/g,'').toLowerCase()||'png';
    const path=`${prefix}-logo-${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const r=await fetch(`${API}/storage/v1/object/site-branding/${encodeURIComponent(path)}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
    if(!r.ok)throw new Error(`${prefix} logo upload failed: ${await r.text()}`);
    return `${API}/storage/v1/object/public/site-branding/${encodeURIComponent(path)}`;
  }

  async function saveSeparateLogos(){
    if(!ownerUnlocked())return;
    const token=typeof window.getOwnerAccessToken==='function'?await window.getOwnerAccessToken():null;
    if(!token)return;
    const status=$('siteContentStatus');
    try{
      const hFile=$('headerLogoFile')?.files?.[0];
      const heroFile=$('heroLogoFile')?.files?.[0];
      const [headerUploaded,heroUploaded]=await Promise.all([upload(hFile,token,'header'),upload(heroFile,token,'home')]);
      if(headerUploaded)state.header_logo_url=headerUploaded;
      if(heroUploaded)state.hero_logo_url=heroUploaded;
      const payload={header_logo_url:state.header_logo_url,header_logo_scale:state.header_logo_scale,hero_logo_url:state.hero_logo_url,hero_logo_scale:state.hero_logo_scale,updated_at:new Date().toISOString()};
      const r=await fetch(`${API}/rest/v1/site_content?id=eq.1`,{method:'PATCH',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)});
      if(!r.ok)throw new Error(await r.text());
      applyState();
    }catch(err){console.error('[Twin Arc] separate logo save failed',err);if(status)status.textContent=err.message||'Could not save separate logos.';}
  }

  function boot(){
    injectStyles();loadState();
    let tries=0;const timer=setInterval(()=>{tries++;if(enhanceEditor()||tries>100)clearInterval(timer);},100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
