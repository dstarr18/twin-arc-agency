// Twin Arc Owner Mode persistence patch — stable repeated host saves + event poster sizing
// Keeps the approved UI intact while making host manager saves persist to Supabase.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .event-card img,.event-poster,.event-card .event-photo{width:100%;aspect-ratio:1/1;object-fit:contain;object-position:center;background:rgba(0,0,0,.18)}
    .event-photo-preview{max-width:100%;height:auto;object-fit:contain}
  `;
  document.head.appendChild(style);

  if(typeof hostManager==='undefined'||!hostManager) return;

  const withTimeout=(promise,ms,message)=>Promise.race([
    promise,
    new Promise((_,reject)=>setTimeout(()=>reject(new Error(message||'Request timed out. Please try again.')),ms))
  ]);

  function restoreSaveButton(btn,text){
    if(!btn)return;
    btn.disabled=false;
    btn.removeAttribute('disabled');
    btn.textContent=text||'Save Host';
  }

  // Host photos can be large data URLs. Supabase is the source of truth, so a
  // browser localStorage quota failure must never block or undo a cloud save.
  function safeLocalHostCache(){
    try{
      const compact=hosts.map(h=>({...h,photo:(typeof h.photo==='string'&&h.photo.startsWith('data:'))?'':h.photo}));
      localStorage.setItem('twinArcHosts',JSON.stringify(compact));
    }catch(err){
      console.warn('[Twin Arc] Local host cache skipped; Supabase remains authoritative.',err);
      try{localStorage.removeItem('twinArcHosts');}catch(_){ }
    }
  }

  // Replace the legacy cache writer so cloud-loaded photos cannot overflow
  // localStorage after several edits/uploads.
  try{saveHosts=safeLocalHostCache;}catch(_){ }

  const managerObserver=new MutationObserver(()=>{
    if(!hostManager.hidden){
      const btn=hostManager.querySelector('button[type="submit"]');
      if(btn&&btn.dataset.saving!=='1') restoreSaveButton(btn,'Save Host');
    }
  });
  managerObserver.observe(hostManager,{attributes:true,attributeFilter:['hidden']});

  hostManager.addEventListener('submit',async function(e){
    e.preventDefault();
    e.stopImmediatePropagation();

    const idxEl=document.getElementById('editIndex');
    const idx=idxEl.value;
    const editing=idx!=='';
    const old=editing?hosts[Number(idx)]:{};
    const saveBtn=hostManager.querySelector('button[type="submit"]');
    if(saveBtn?.dataset.saving==='1') return;
    const originalText='Save Host';
    if(saveBtn){saveBtn.dataset.saving='1';saveBtn.disabled=true;saveBtn.textContent='Saving...';}

    try{
      if(!adminUnlocked){openAdmin();throw new Error('Owner sign-in required to save host changes.');}
      const token=await withTimeout(getOwnerAccessToken(),10000,'Owner session check timed out. Please sign in again.');
      if(!token){openAdmin();throw new Error('Owner session expired. Please sign in again.');}

      const record={
        stage:document.getElementById('hostStage').value.trim(),
        spark:document.getElementById('hostSpark').value.trim(),
        platform:document.getElementById('hostPlatform').value.trim(),
        country:document.getElementById('hostCountry').value.trim(),
        category:document.getElementById('hostCategory').value.trim(),
        status:document.getElementById('hostStatus').value,
        bio:document.getElementById('hostBio').value.trim(),
        social:document.getElementById('hostSocial').value.trim(),
        photo:(photoPreview.src&&photoPreview.src!==location.href)?photoPreview.src:(old.photo||'')
      };
      if(!record.stage||!record.spark) throw new Error('Stage Name and Spark ID are required.');

      const payload={
        stage_name:record.stage,
        spark_id:record.spark,
        platform:record.platform||'Spark Live',
        country:record.country||'',
        category:record.category||'Host',
        status:record.status||'Active',
        bio:record.bio||'',
        social_link:record.social||'',
        photo_url:record.photo||''
      };

      let url=`${SUPABASE_URL}/rest/v1/hosts`;
      let method='POST';
      if(editing&&old.id){url+=`?id=eq.${encodeURIComponent(old.id)}`;method='PATCH';}

      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),15000);
      let r;
      try{
        r=await fetch(url,{method,headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload),signal:controller.signal});
      }catch(err){
        if(err?.name==='AbortError') throw new Error('Host save timed out. Please try Save Host again.');
        throw err;
      }finally{clearTimeout(timer);}

      if(!r.ok) throw new Error(`Host save failed (${r.status}): ${await r.text()}`);
      const rows=await r.json();
      const saved=Array.isArray(rows)?rows[0]:rows;
      if(saved?.id) record.id=saved.id; else if(old.id) record.id=old.id;

      if(editing) hosts[Number(idx)]=record; else hosts.push(record);
      safeLocalHostCache();
      renderHosts();

      if(saveBtn){saveBtn.dataset.saving='0';restoreSaveButton(saveBtn,originalText);}
      hostManager.hidden=true;
      resetManager();

      Promise.race([
        loadHostsFromSupabase(),
        new Promise(resolve=>setTimeout(resolve,10000))
      ]).catch(err=>console.warn('[Twin Arc] Background host refresh failed',err));
      console.info('[Twin Arc] Host saved to Supabase:',record.spark);
    }catch(err){
      console.error('[Twin Arc] Host cloud save failed',err);
      alert(err.message||'Could not save host changes. Please try again.');
    }finally{
      if(saveBtn){saveBtn.dataset.saving='0';restoreSaveButton(saveBtn,originalText);}
    }
  },true);
})();
