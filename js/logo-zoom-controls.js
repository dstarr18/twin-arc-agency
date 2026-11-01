// Twin Arc Agency — owner logo zoom control with cloud persistence.
(function(){
  const API='https://uhcfsdsdlqcqadkhlzkg.supabase.co';
  const KEY='sb_publishable_1tdi3y-UoBBnHKFsW1MFcw_vyRBbdgA';
  let currentScale=1;

  const $=id=>document.getElementById(id);
  const clamp=n=>Math.min(1.8,Math.max(.45,Number(n)||1));

  function applyScale(scale){
    currentScale=clamp(scale);
    document.querySelectorAll('.brand img,.logo-wrap img,.agency-logo-side img,footer img').forEach(img=>{
      img.style.transform=`scale(${currentScale})`;
      img.style.transformOrigin='center center';
      img.style.transition='transform .18s ease';
    });
    const preview=$('siteLogoPreview');
    if(preview){
      preview.style.transform=`scale(${currentScale})`;
      preview.style.transformOrigin='center center';
    }
    if($('siteLogoZoom'))$('siteLogoZoom').value=String(currentScale);
    if($('siteLogoZoomValue'))$('siteLogoZoomValue').textContent=`${Math.round(currentScale*100)}%`;
  }

  async function loadScale(){
    try{
      const r=await fetch(`${API}/rest/v1/site_content?id=eq.1&select=logo_scale`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
      if(!r.ok)throw new Error(await r.text());
      const rows=await r.json();
      applyScale(rows[0]?.logo_scale ?? 1);
    }catch(err){console.error('[Twin Arc] logo scale load failed',err);applyScale(1);}
  }

  function injectStyles(){
    if($('logoZoomStyles'))return;
    const style=document.createElement('style');
    style.id='logoZoomStyles';
    style.textContent=`
      .site-logo-preview-shell{width:160px;height:118px;margin-top:10px;display:grid;place-items:center;overflow:hidden;border-radius:14px;background:linear-gradient(135deg,#18162a,#080812);border:1px solid rgba(255,255,255,.16)}
      .site-logo-preview-shell .site-logo-preview{width:120px;height:90px;margin:0;object-fit:contain;background:transparent;border-radius:0}
      .logo-zoom-row{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;margin-top:12px;max-width:520px}
      .logo-zoom-row input[type=range]{margin:0;padding:0;background:transparent;border:0;box-shadow:none}
      .logo-zoom-row button{width:34px;height:34px;border-radius:9px;border:1px solid rgba(174,128,255,.45);background:rgba(92,45,190,.18);color:#fff;font-size:20px;cursor:pointer}
      .logo-zoom-meta{display:flex;justify-content:space-between;align-items:center;gap:12px;max-width:520px;margin-top:6px;color:#aaa6bb;font-size:11px}
      .logo-zoom-meta strong{color:#d8b8ff}
    `;
    document.head.appendChild(style);
  }

  function enhanceEditor(){
    const file=$('siteLogoFile');
    const preview=$('siteLogoPreview');
    if(!file||!preview||$('siteLogoZoom'))return false;

    const shell=document.createElement('div');
    shell.className='site-logo-preview-shell';
    preview.parentNode.insertBefore(shell,preview);
    shell.appendChild(preview);

    const row=document.createElement('div');
    row.className='logo-zoom-row';
    row.innerHTML=`<button type="button" id="siteLogoZoomOut" aria-label="Zoom out">−</button><input id="siteLogoZoom" type="range" min="0.45" max="1.8" step="0.05" value="1" aria-label="Logo zoom"><button type="button" id="siteLogoZoomIn" aria-label="Zoom in">+</button>`;
    shell.insertAdjacentElement('afterend',row);

    const meta=document.createElement('div');
    meta.className='logo-zoom-meta';
    meta.innerHTML='<span>Zoom Out</span><strong id="siteLogoZoomValue">100%</strong><span>Zoom In</span>';
    row.insertAdjacentElement('afterend',meta);

    $('siteLogoZoom').addEventListener('input',e=>applyScale(e.target.value));
    $('siteLogoZoomOut').addEventListener('click',()=>applyScale(currentScale-.05));
    $('siteLogoZoomIn').addEventListener('click',()=>applyScale(currentScale+.05));

    file.addEventListener('change',()=>setTimeout(()=>applyScale(currentScale),0));

    const form=$('siteContentForm');
    form?.addEventListener('submit',async()=>{
      const token=typeof window.getOwnerAccessToken==='function'?await window.getOwnerAccessToken():null;
      if(!token)return;
      try{
        const r=await fetch(`${API}/rest/v1/site_content?id=eq.1`,{
          method:'PATCH',
          headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=minimal'},
          body:JSON.stringify({logo_scale:currentScale,updated_at:new Date().toISOString()})
        });
        if(!r.ok)throw new Error(await r.text());
      }catch(err){console.error('[Twin Arc] logo scale save failed',err);}
    },true);

    applyScale(currentScale);
    return true;
  }

  function boot(){
    injectStyles();
    loadScale();
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(enhanceEditor()||tries>80)clearInterval(timer);
    },100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
