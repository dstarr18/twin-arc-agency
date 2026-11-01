// Twin Arc Agency — owner-editable Home/About content and branding.
(function(){
  const API='https://uhcfsdsdlqcqadkhlzkg.supabase.co';
  const KEY='sb_publishable_1tdi3y-UoBBnHKFsW1MFcw_vyRBbdgA';
  const DEFAULT_LOGO='images/twin-arc-logo-v7.png';
  let siteContent=null;

  const esc=(s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const $=(id)=>document.getElementById(id);
  const ownerUnlocked=()=>document.getElementById('adminModeBtn')?.classList.contains('is-unlocked')===true;

  function injectStyles(){
    if(document.getElementById('siteContentEditorStyles'))return;
    const style=document.createElement('style');
    style.id='siteContentEditorStyles';
    style.textContent=`
      .brand{gap:11px}
      .brand-copy{display:flex;flex-direction:column;justify-content:center;line-height:1.02;text-transform:uppercase}
      .brand-copy .brand-main{font-family:Orbitron,sans-serif;font-size:15px;font-weight:800;letter-spacing:.09em;white-space:nowrap}
      .brand-copy .brand-sub{font-family:Montserrat,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:.31em;margin-top:5px;color:#d8b8ff;white-space:nowrap}
      .site-owner-edit{display:none;position:absolute;z-index:8;top:94px;right:clamp(18px,4vw,60px);border:1px solid rgba(185,129,255,.55);background:rgba(12,8,28,.82);backdrop-filter:blur(12px);color:#fff;border-radius:999px;padding:9px 14px;font:700 10px Montserrat,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.26)}
      #about{position:relative}.site-owner-edit.about-edit{top:24px}
      body.site-owner-unlocked .site-owner-edit{display:inline-flex;align-items:center;gap:7px}
      .site-content-modal[hidden]{display:none!important}.site-content-modal{position:fixed;inset:0;z-index:160;display:grid;place-items:center;padding:18px}.site-content-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px)}
      .site-content-dialog{position:relative;z-index:1;width:min(880px,96vw);max-height:92vh;overflow:auto;border:1px solid rgba(177,108,255,.45);border-radius:22px;background:linear-gradient(145deg,#11102a,#090814);box-shadow:0 30px 100px rgba(0,0,0,.65);padding:clamp(22px,4vw,38px)}
      .site-content-dialog h2{font-family:Orbitron,sans-serif;margin:4px 0 8px}.site-content-dialog .editor-help{color:#aaa6bb;margin:0 0 22px}.site-content-close{position:absolute;right:16px;top:14px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:#ffffff0d;color:#fff;font-size:22px;cursor:pointer}
      .site-content-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.site-content-grid .full{grid-column:1/-1}.site-content-grid label{margin:0;color:#d9dcf2}.site-content-grid input,.site-content-grid textarea{background:#07091d;border:1px solid #383c70;color:#fff;border-radius:10px;padding:12px}.site-content-grid textarea{resize:vertical;min-height:82px}.site-content-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.site-content-status{min-height:20px;margin:10px 0 0;color:#c793ff;font-size:13px}.site-logo-preview{width:120px;height:90px;object-fit:contain;background:#fff;border-radius:12px;margin-top:10px;display:block}
      @media(max-width:700px){.brand img{width:52px;height:44px}.brand-copy .brand-main{font-size:13px}.brand-copy .brand-sub{font-size:9px}.site-owner-edit{top:82px;right:12px}.site-owner-edit.about-edit{top:12px}.site-content-grid{grid-template-columns:1fr}.site-content-grid .full{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function buildBrand(){
    const brand=document.querySelector('.brand');
    if(!brand)return;
    let copy=brand.querySelector('.brand-copy');
    if(!copy){
      const old=brand.querySelector('span');
      if(old)old.remove();
      copy=document.createElement('span');copy.className='brand-copy';
      copy.innerHTML='<span class="brand-main">TWIN ARC</span><span class="brand-sub">AGENCY</span>';
      brand.appendChild(copy);
    }
  }

  function markEditableNodes(){
    const hero=document.getElementById('home');
    if(hero){
      const content=hero.querySelector('.hero-content');
      if(content){
        const eyebrow=content.querySelector(':scope > .eyebrow'); if(eyebrow)eyebrow.id='siteHeroEyebrow';
        const h1=content.querySelector('h1'); if(h1)h1.id='siteHeroTitle';
        const copy=content.querySelector('.hero-copy'); if(copy)copy.id='siteHeroCopy';
      }
      if(!document.getElementById('editHomeContentBtn')){
        const b=document.createElement('button');b.type='button';b.id='editHomeContentBtn';b.className='site-owner-edit';b.textContent='✎ Edit Home + Logo';b.addEventListener('click',()=>openEditor('home'));hero.appendChild(b);
      }
    }
    const about=document.getElementById('about');
    if(about){
      const heading=about.querySelector('.section-heading');
      if(heading){const ps=heading.querySelectorAll('p');if(ps[0])ps[0].id='siteAboutEyebrow';const h2=heading.querySelector('h2');if(h2)h2.id='siteAboutTitle';if(ps[1])ps[1].id='siteAboutCopy';}
      const cards=about.querySelectorAll('.glass-card');
      cards.forEach((card,i)=>{const h3=card.querySelector('h3'),p=card.querySelector('p');if(h3)h3.id=`siteAboutCard${i+1}Title`;if(p)p.id=`siteAboutCard${i+1}Copy`;});
      if(!document.getElementById('editAboutContentBtn')){const b=document.createElement('button');b.type='button';b.id='editAboutContentBtn';b.className='site-owner-edit about-edit';b.textContent='✎ Edit About';b.addEventListener('click',()=>openEditor('about'));about.appendChild(b);}
    }
  }

  function applyLogo(url){
    const src=url||DEFAULT_LOGO;
    document.querySelectorAll('.brand img,.logo-wrap img,.agency-logo-side img,footer img').forEach(img=>{img.src=src;});
    document.documentElement.style.setProperty('--site-brand-logo',`url("${String(src).replace(/"/g,'\\"')}")`);
    const preview=$('siteLogoPreview');if(preview)preview.src=src;
  }

  function applyContent(d){
    if(!d)return;
    const text=(id,value)=>{const el=$(id);if(el&&value!=null)el.textContent=value;};
    text('siteHeroEyebrow',d.hero_eyebrow);
    const h1=$('siteHeroTitle');if(h1)h1.innerHTML=`${esc(d.hero_title_line1)}<br><span>${esc(d.hero_title_line2)}</span>`;
    text('siteHeroCopy',d.hero_copy);
    text('siteAboutEyebrow',d.about_eyebrow);text('siteAboutTitle',d.about_title);text('siteAboutCopy',d.about_copy);
    for(let i=1;i<=3;i++){text(`siteAboutCard${i}Title`,d[`about_card${i}_title`]);text(`siteAboutCard${i}Copy`,d[`about_card${i}_copy`]);}
    applyLogo(d.logo_url);
  }

  async function loadContent(){
    try{
      const r=await fetch(`${API}/rest/v1/site_content?id=eq.1&select=*`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
      if(!r.ok)throw new Error(await r.text());
      const rows=await r.json();siteContent=rows[0]||null;applyContent(siteContent);
    }catch(err){console.error('[Twin Arc] site content load failed',err);}
  }

  function buildModal(){
    if($('siteContentModal'))return;
    const modal=document.createElement('div');modal.id='siteContentModal';modal.className='site-content-modal';modal.hidden=true;modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`<div class="site-content-backdrop" data-close-site-content></div><section class="site-content-dialog" role="dialog" aria-modal="true" aria-labelledby="siteContentTitle"><button class="site-content-close" type="button" data-close-site-content aria-label="Close">×</button><p class="eyebrow">OWNER SITE EDITOR</p><h2 id="siteContentTitle">Edit Twin Arc Website</h2><p class="editor-help">Update the Home, About, and agency logo. Changes save to the cloud and appear for everyone.</p><form id="siteContentForm"><div class="site-content-grid"><label class="full">Agency Logo<input id="siteLogoFile" type="file" accept="image/*"><img id="siteLogoPreview" class="site-logo-preview" alt="Agency logo preview"></label><label class="full">Home Eyebrow<input id="editHeroEyebrow"></label><label>Home Title — Line 1<input id="editHeroTitle1"></label><label>Home Title — Line 2<input id="editHeroTitle2"></label><label class="full">Home Description<textarea id="editHeroCopy"></textarea></label><label class="full">About Eyebrow<input id="editAboutEyebrow"></label><label class="full">About Title<input id="editAboutTitle"></label><label class="full">About Description<textarea id="editAboutCopy"></textarea></label><label>Card 1 Title<input id="editAboutCard1Title"></label><label>Card 1 Description<textarea id="editAboutCard1Copy"></textarea></label><label>Card 2 Title<input id="editAboutCard2Title"></label><label>Card 2 Description<textarea id="editAboutCard2Copy"></textarea></label><label>Card 3 Title<input id="editAboutCard3Title"></label><label>Card 3 Description<textarea id="editAboutCard3Copy"></textarea></label></div><p class="site-content-status" id="siteContentStatus" aria-live="polite"></p><div class="site-content-actions"><button class="btn btn-primary" type="submit">Save Website Changes</button><button class="btn btn-secondary" type="button" data-close-site-content>Cancel</button></div></form></section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-close-site-content]').forEach(el=>el.addEventListener('click',closeEditor));
    $('siteLogoFile').addEventListener('change',()=>{const f=$('siteLogoFile').files?.[0];if(!f)return;const u=URL.createObjectURL(f);$('siteLogoPreview').src=u;});
    $('siteContentForm').addEventListener('submit',saveContent);
  }

  function fillEditor(){
    const d=siteContent||{};
    const set=(id,v)=>{if($(id))$(id).value=v||'';};
    set('editHeroEyebrow',d.hero_eyebrow);set('editHeroTitle1',d.hero_title_line1);set('editHeroTitle2',d.hero_title_line2);set('editHeroCopy',d.hero_copy);
    set('editAboutEyebrow',d.about_eyebrow);set('editAboutTitle',d.about_title);set('editAboutCopy',d.about_copy);
    for(let i=1;i<=3;i++){set(`editAboutCard${i}Title`,d[`about_card${i}_title`]);set(`editAboutCard${i}Copy`,d[`about_card${i}_copy`]);}
    $('siteLogoFile').value='';applyLogo(d.logo_url);
  }

  function openEditor(section){
    if(!ownerUnlocked())return;
    buildModal();fillEditor();
    $('siteContentTitle').textContent=section==='about'?'Edit About Section':'Edit Home, About & Logo';
    $('siteContentStatus').textContent='';
    const m=$('siteContentModal');m.hidden=false;m.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  }
  function closeEditor(){const m=$('siteContentModal');if(!m)return;m.hidden=true;m.setAttribute('aria-hidden','true');document.body.style.overflow='';}

  async function uploadLogo(file,token){
    if(!file)return siteContent?.logo_url||null;
    if(file.size>8*1024*1024)throw new Error('Logo file is too large. Please use an image under 8 MB.');
    const ext=(file.name.split('.').pop()||'png').replace(/[^a-zA-Z0-9]/g,'').toLowerCase()||'png';
    const path=`agency-logo-${Date.now()}.${ext}`;
    const r=await fetch(`${API}/storage/v1/object/site-branding/${encodeURIComponent(path)}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
    if(!r.ok)throw new Error(`Logo upload failed: ${await r.text()}`);
    return `${API}/storage/v1/object/public/site-branding/${encodeURIComponent(path)}`;
  }

  async function saveContent(e){
    e.preventDefault();
    const status=$('siteContentStatus');
    if(!ownerUnlocked()){status.textContent='Owner sign-in required.';return;}
    const token=typeof getOwnerAccessToken==='function'?await getOwnerAccessToken():null;
    if(!token){status.textContent='Owner session expired. Please sign in again.';return;}
    try{
      status.textContent='Saving...';
      const logo_url=await uploadLogo($('siteLogoFile').files?.[0],token);
      const payload={
        hero_eyebrow:$('editHeroEyebrow').value.trim(),hero_title_line1:$('editHeroTitle1').value.trim(),hero_title_line2:$('editHeroTitle2').value.trim(),hero_copy:$('editHeroCopy').value.trim(),
        about_eyebrow:$('editAboutEyebrow').value.trim(),about_title:$('editAboutTitle').value.trim(),about_copy:$('editAboutCopy').value.trim(),
        about_card1_title:$('editAboutCard1Title').value.trim(),about_card1_copy:$('editAboutCard1Copy').value.trim(),about_card2_title:$('editAboutCard2Title').value.trim(),about_card2_copy:$('editAboutCard2Copy').value.trim(),about_card3_title:$('editAboutCard3Title').value.trim(),about_card3_copy:$('editAboutCard3Copy').value.trim(),
        logo_url,updated_at:new Date().toISOString()
      };
      const r=await fetch(`${API}/rest/v1/site_content?id=eq.1`,{method:'PATCH',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload)});
      if(!r.ok)throw new Error(await r.text());const rows=await r.json();siteContent=rows[0]||{...siteContent,...payload};applyContent(siteContent);status.textContent='Website changes saved.';setTimeout(closeEditor,650);
    }catch(err){console.error('[Twin Arc] site content save failed',err);status.textContent=err.message||'Could not save changes.';}
  }

  function syncOwner(){const unlocked=ownerUnlocked();document.body.classList.toggle('site-owner-unlocked',unlocked);if(!unlocked&&$('siteContentModal')&&!$('siteContentModal').hidden)closeEditor();}
  function watchOwner(){const btn=$('adminModeBtn');if(!btn)return;syncOwner();new MutationObserver(syncOwner).observe(btn,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});}

  injectStyles();buildBrand();markEditableNodes();buildModal();watchOwner();loadContent();
})();
