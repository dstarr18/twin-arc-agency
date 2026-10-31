// Twin Arc Owner Mode persistence patch — host edits + event poster sizing
// Keeps the approved UI intact while making host manager saves persist to Supabase.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .event-card img,.event-poster,.event-card .event-photo{width:100%;aspect-ratio:1/1;object-fit:contain;object-position:center;background:rgba(0,0,0,.18)}
    .event-photo-preview{max-width:100%;height:auto;object-fit:contain}
  `;
  document.head.appendChild(style);

  if(typeof hostManager==='undefined'||!hostManager) return;

  hostManager.addEventListener('submit',async function(e){
    // Run before the older local-only submit handler.
    e.preventDefault();
    e.stopImmediatePropagation();

    const idxEl=document.getElementById('editIndex');
    const idx=idxEl.value;
    const editing=idx!=='';
    const old=editing?hosts[Number(idx)]:{};
    const saveBtn=hostManager.querySelector('button[type="submit"]');
    const originalText=saveBtn?.textContent||'Save Host';
    if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='Saving...';}

    try{
      if(!adminUnlocked){openAdmin();throw new Error('Owner sign-in required to save host changes.');}
      const token=await getOwnerAccessToken();
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
      const r=await fetch(url,{method,headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload)});
      if(!r.ok) throw new Error(`Host save failed (${r.status}): ${await r.text()}`);
      const rows=await r.json();
      const saved=Array.isArray(rows)?rows[0]:rows;
      if(saved?.id) record.id=saved.id; else if(old.id) record.id=old.id;

      if(editing) hosts[Number(idx)]=record; else hosts.push(record);
      saveHosts();renderHosts();hostManager.hidden=true;resetManager();
      // Re-read the cloud immediately so refresh/other devices show the same data.
      await loadHostsFromSupabase();
      console.info('[Twin Arc] Host saved to Supabase:',record.spark);
    }catch(err){
      console.error('[Twin Arc] Host cloud save failed',err);
      alert(err.message||'Could not save host changes. Please try again.');
    }finally{
      if(saveBtn){saveBtn.disabled=false;saveBtn.textContent=originalText;}
    }
  },true);
})();
