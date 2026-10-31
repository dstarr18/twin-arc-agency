// Twin Arc Events — Supabase cloud sync overlay
// Preserves the approved event-card UI while using Supabase as the shared source of truth.
(function(){
  const LOCAL_EVENT_KEY='twinArcEventsV9';
  const grid=document.getElementById('eventGrid');
  const form=document.getElementById('eventManager');
  if(!grid||!form)return;

  function headers(token){return {apikey:SUPABASE_KEY,Authorization:`Bearer ${token||SUPABASE_KEY}`,'Content-Type':'application/json'};}
  function fromRow(x){return {id:x.id,title:x.title||'',date:x.event_date||'',time:x.event_time||'',status:x.status||'Upcoming',description:x.description||'',photo:x.photo_url||''};}
  function toRow(ev,i){return {title:ev.title||'',event_date:ev.date||'',event_time:ev.time||'',status:ev.status||'Upcoming',description:ev.description||'',photo_url:ev.photo||'',sort_order:Number.isFinite(Number(i))?Number(i):0,updated_at:new Date().toISOString()};}

  async function fetchCloudEvents(){
    const r=await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,title,event_date,event_time,status,description,photo_url,sort_order&order=sort_order.asc,id.asc`,{headers:headers()});
    if(!r.ok)throw new Error(`Cloud events ${r.status}: ${await r.text()}`);
    return (await r.json()).map(fromRow);
  }

  function renderCloudEvents(){
    grid.innerHTML='';
    events.forEach((ev,i)=>{const card=document.createElement('article');card.className='event-card';const media=ev.photo?`<img class="event-poster" src="${ev.photo}" alt="${esc(ev.title)} event poster">`:`<div class="event-poster-placeholder">TWIN ARC EVENT</div>`;card.innerHTML=`${media}<div class="event-info"><span class="event-status">${esc(ev.status||'Upcoming')}</span><h3>${esc(ev.title)}</h3><p class="event-date">${esc([ev.date,ev.time].filter(Boolean).join(' • '))}</p><p class="event-description">${esc(ev.description||'')}</p><div class="event-actions"><button class="mini-btn" type="button" onclick="editEvent(${i})">Edit</button><button class="mini-btn danger" type="button" onclick="deleteEvent(${i})">Delete</button></div></div>`;grid.appendChild(card)});
    document.getElementById('eventCount').textContent=events.length;
    document.getElementById('eventEmpty').hidden=events.length>0;
    if(typeof setAdminVisibility==='function')setAdminVisibility();
  }

  async function loadCloudEvents(){
    try{
      const cloud=await fetchCloudEvents();
      // Never blank a browser that still has the safe local backup if the cloud is unexpectedly empty.
      if(!cloud.length){console.warn('[Twin Arc] Cloud events are empty; preserving current/local event display.');return false;}
      events=cloud;
      renderCloudEvents();
      console.info(`[Twin Arc] Loaded ${events.length} cloud events`);
      return true;
    }catch(err){console.error('[Twin Arc] Cloud events load failed; preserving current/local events.',err);return false;}
  }

  async function uploadPosterIfNeeded(photo,token,eventId){
    if(!photo||!photo.startsWith('data:image/'))return photo||'';
    const m=photo.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if(!m)throw new Error('Unsupported event poster format.');
    const mime=m[1],ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';
    const bytes=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));
    const path=`events/event-${eventId||'new'}-${Date.now()}.${ext}`;
    const r=await fetch(`${SUPABASE_URL}/storage/v1/object/event-posters/${path}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':mime,'x-upsert':'false'},body:bytes});
    if(!r.ok)throw new Error(`Poster upload failed (${r.status}): ${await r.text()}`);
    return `${SUPABASE_URL}/storage/v1/object/public/event-posters/${path}`;
  }

  window.deleteEvent=async function(i){
    const ev=events[i];if(!ev||!confirm(`Delete ${ev.title}?`))return;
    const token=await getOwnerAccessToken();if(!token){if(typeof openAdmin==='function')openAdmin();return;}
    if(!ev.id){alert('This event is not linked to the cloud yet. Nothing was deleted.');return;}
    const r=await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(ev.id)}`,{method:'DELETE',headers:headers(token)});
    if(!r.ok){console.error('[Twin Arc] Cloud event delete failed',await r.text());alert('Cloud delete failed. Please try again.');return;}
    await loadCloudEvents();
  };

  // Capture submit before the original local-storage handler so cloud is authoritative.
  form.addEventListener('submit',async function(e){
    e.preventDefault();e.stopImmediatePropagation();
    const token=await getOwnerAccessToken();if(!token){if(typeof openAdmin==='function')openAdmin();return;}
    const idx=document.getElementById('eventEditIndex').value;
    const old=idx!==''?events[Number(idx)]:{};
    try{
      const poster=await uploadPosterIfNeeded(eventPhotoPreview.src||'',token,old&&old.id);
      const ev={title:document.getElementById('eventTitle').value.trim(),date:document.getElementById('eventDate').value.trim(),time:document.getElementById('eventTime').value.trim(),status:document.getElementById('eventStatus').value,description:document.getElementById('eventDescription').value.trim(),photo:poster};
      const payload=toRow(ev,idx===''?events.length:Number(idx));
      let url=`${SUPABASE_URL}/rest/v1/events`,method='POST';
      if(old&&old.id){url+=`?id=eq.${encodeURIComponent(old.id)}`;method='PATCH';}
      const r=await fetch(url,{method,headers:{...headers(token),Prefer:'return=representation'},body:JSON.stringify(payload)});
      if(!r.ok)throw new Error(`Event save failed (${r.status}): ${await r.text()}`);
      eventManager.hidden=true;resetEventManager();await loadCloudEvents();
    }catch(err){console.error('[Twin Arc] Cloud event save failed',err);alert(err.message||'Event cloud save failed. Please try again.');}
  },true);

  // The five legacy events were migrated separately and verified. Keep localStorage untouched as a safety backup.
  loadCloudEvents();
})();
