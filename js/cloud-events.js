// Twin Arc Events — Supabase cloud sync overlay
// Keeps the existing event UI/design while making event data shared across devices.
(function(){
  const LOCAL_EVENT_KEY='twinArcEventsV9';
  const grid=document.getElementById('eventGrid');
  const form=document.getElementById('eventManager');
  if(!grid||!form)return;

  function headers(token){return {apikey:SUPABASE_KEY,Authorization:`Bearer ${token||SUPABASE_KEY}`,'Content-Type':'application/json'};}
  function fromRow(x){return {id:x.id,title:x.title||'',date:x.event_date||'',time:x.event_time||'',status:x.status||'Upcoming',description:x.description||'',photo:x.photo_url||''};}
  function toRow(ev,i){return {title:ev.title||'',event_date:ev.date||'',event_time:ev.time||'',status:ev.status||'Upcoming',description:ev.description||'',photo_url:ev.photo||'',sort_order:i||0,updated_at:new Date().toISOString()};}

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
    try{events=await fetchCloudEvents();renderCloudEvents();console.info(`[Twin Arc] Loaded ${events.length} cloud events`);}catch(err){console.error('[Twin Arc] Cloud events load failed',err);}
  }

  async function migrateLocalEventsIfNeeded(){
    let local=[];try{local=JSON.parse(localStorage.getItem(LOCAL_EVENT_KEY)||'[]')||[];}catch(_){return false;}
    if(!local.length)return false;
    let cloud;try{cloud=await fetchCloudEvents();}catch(_){return false;}
    if(cloud.length){localStorage.removeItem(LOCAL_EVENT_KEY);events=cloud;renderCloudEvents();return true;}
    const token=await getOwnerAccessToken();if(!token)return false;
    const payload=local.map((ev,i)=>toRow(ev,i));
    const r=await fetch(`${SUPABASE_URL}/rest/v1/events`,{method:'POST',headers:{...headers(token),Prefer:'return=representation'},body:JSON.stringify(payload)});
    if(!r.ok){console.error('[Twin Arc] Existing event migration failed',await r.text());return false;}
    localStorage.removeItem(LOCAL_EVENT_KEY);await loadCloudEvents();console.info(`[Twin Arc] Migrated ${payload.length} existing events to Supabase`);return true;
  }

  window.deleteEvent=async function(i){
    const ev=events[i];if(!ev||!confirm(`Delete ${ev.title}?`))return;
    const token=await getOwnerAccessToken();if(!token){if(typeof openAdmin==='function')openAdmin();return;}
    if(ev.id){const r=await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${ev.id}`,{method:'DELETE',headers:headers(token)});if(!r.ok){alert('Cloud delete failed. Please sign in again.');return;}}
    await loadCloudEvents();
  };

  // Capture submit before the old local-storage handler so only the cloud save runs.
  form.addEventListener('submit',async function(e){
    e.preventDefault();e.stopImmediatePropagation();
    const token=await getOwnerAccessToken();if(!token){if(typeof openAdmin==='function')openAdmin();return;}
    const idx=document.getElementById('eventEditIndex').value;
    const old=idx!==''?events[Number(idx)]:{};
    const ev={title:document.getElementById('eventTitle').value.trim(),date:document.getElementById('eventDate').value.trim(),time:document.getElementById('eventTime').value.trim(),status:document.getElementById('eventStatus').value,description:document.getElementById('eventDescription').value.trim(),photo:eventPhotoPreview.src||''};
    const payload=toRow(ev,idx===''?events.length:Number(idx));
    let url=`${SUPABASE_URL}/rest/v1/events`,method='POST';
    if(old&&old.id){url+=`?id=eq.${old.id}`;method='PATCH';}
    const r=await fetch(url,{method,headers:{...headers(token),Prefer:'return=representation'},body:JSON.stringify(payload)});
    if(!r.ok){console.error('[Twin Arc] Cloud event save failed',await r.text());alert('Event cloud save failed. Please try again.');return;}
    eventManager.hidden=true;resetEventManager();await loadCloudEvents();
  },true);

  loadCloudEvents().then(()=>migrateLocalEventsIfNeeded());
  // If the desktop already has events but Owner Mode was not signed in on page load,
  // retry migration after login becomes available. Stops automatically once migrated.
  let tries=0;const migrationTimer=setInterval(async()=>{tries++;const done=await migrateLocalEventsIfNeeded();if(done||tries>=90)clearInterval(migrationTimer);},2000);
})();
