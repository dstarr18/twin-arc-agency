const menu=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav-links');menu.addEventListener('click',()=>{nav.classList.toggle('open');menu.setAttribute('aria-expanded',nav.classList.contains('open'))});document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));document.getElementById('year').textContent=new Date().getFullYear();
// Local host manager (Version 3)
const SUPABASE_URL='https://uhcfsdsdlqcqadkhlzkg.supabase.co';
let adminUnlocked=false;
const SUPABASE_KEY='sb_publishable_1tdi3y-UoBBnHKFsW1MFcw_vyRBbdgA';
const defaultHosts=[{stage:'ᵀ•ᴬ◈ Madam Bany',spark:'cbc169t2',platform:'Spark Live',country:'',category:'Host',status:'Active',bio:'',social:'',photo:'images/madam-bany.png'}];
let hosts=[];
async function loadHostsFromSupabase(){
  try{
    const r=await fetch(`${SUPABASE_URL}/rest/v1/hosts?select=id,stage_name,spark_id,platform,country,category,status,bio,social_link,photo_url&order=id.asc`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
    if(!r.ok) throw new Error(`Supabase hosts ${r.status}: ${await r.text()}`);
    const rows=await r.json();
    hosts=rows.map(x=>({id:x.id,stage:x.stage_name,spark:x.spark_id,platform:x.platform||'Spark Live',country:x.country||'',category:x.category||'Host',status:x.status||'Active',bio:x.bio||'',social:x.social_link||'',photo:x.photo_url||''}));
    localStorage.setItem('twinArcHosts',JSON.stringify(hosts));
    renderHosts();
    console.info(`[Twin Arc] Loaded ${hosts.length} hosts from Supabase`);
  }catch(err){
    console.error('[Twin Arc] Supabase load failed',err);
    hosts=JSON.parse(localStorage.getItem('twinArcHosts')||'null')||defaultHosts;
    renderHosts();
  }
}
const hostGrid=document.getElementById('hostGrid'),hostManager=document.getElementById('hostManager'),photoInput=document.getElementById('hostPhoto'),photoPreview=document.getElementById('photoPreview');
function saveHosts(){localStorage.setItem('twinArcHosts',JSON.stringify(hosts));}
function renderHosts(){
  const q=(document.getElementById('hostSearch')?.value||'').toLowerCase().trim();
  const filter=document.getElementById('hostFilter')?.value||'all';
  hostGrid.innerHTML='';
  const visible=hosts.map((h,i)=>({h,i})).filter(({h})=>{const matches=!q||[h.stage,h.spark,h.platform,h.country,h.category].filter(Boolean).join(' ').toLowerCase().includes(q);const status=filter==='all'||h.status===filter;return matches&&status;});
  visible.forEach(({h,i})=>{const card=document.createElement('article');card.className='host-card reveal visible';card.innerHTML=`<img src="${h.photo||'images/twin-arc-logo-v7.png'}" alt="${h.stage}"><div class="host-info"><h3>${h.stage}</h3><div class="host-id">Spark ID: ${h.spark}</div><p class="host-meta">${[h.platform,h.category,h.country,h.status].filter(Boolean).join(' • ')}</p><div class="host-actions"><button class="mini-btn" onclick="editHost(${i})">Edit</button><button class="mini-btn danger" onclick="deleteHost(${i})">Delete</button><button class="mini-btn view-profile" onclick="viewHost(${i})">View</button><button class="mini-btn dashboard-btn" onclick="openPerformance(${i})">Dashboard</button></div></div>`;hostGrid.appendChild(card)});
  document.getElementById('hostCount').textContent=hosts.length;
  document.getElementById('activeCount').textContent=hosts.filter(h=>h.status==='Active').length;
}
function resetManager(){document.getElementById('editIndex').value='';document.getElementById('managerTitle').textContent='Add New Host';['hostStage','hostSpark','hostPlatform','hostCountry','hostCategory','hostBio','hostSocial'].forEach(id=>document.getElementById(id).value='');document.getElementById('hostStatus').value='Active';photoInput.value='';photoPreview.hidden=true;photoPreview.src='';}
document.getElementById('addHostBtn').addEventListener('click',()=>{resetManager();hostManager.hidden=false;hostManager.scrollIntoView({behavior:'smooth',block:'center'});});
document.getElementById('cancelHostBtn').addEventListener('click',()=>{hostManager.hidden=true;resetManager();});
photoInput.addEventListener('change',()=>{const f=photoInput.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{photoPreview.src=r.result;photoPreview.hidden=false};r.readAsDataURL(f)});
window.editHost=i=>{const h=hosts[i];document.getElementById('editIndex').value=i;document.getElementById('managerTitle').textContent='Edit Host';document.getElementById('hostStage').value=h.stage||'';document.getElementById('hostSpark').value=h.spark||'';document.getElementById('hostPlatform').value=h.platform||'';document.getElementById('hostCountry').value=h.country||'';document.getElementById('hostCategory').value=h.category||'';document.getElementById('hostStatus').value=h.status||'Active';document.getElementById('hostBio').value=h.bio||'';document.getElementById('hostSocial').value=h.social||'';photoPreview.src=h.photo||'';photoPreview.hidden=!h.photo;hostManager.hidden=false;hostManager.scrollIntoView({behavior:'smooth',block:'center'});};
window.deleteHost=i=>{if(confirm(`Remove ${hosts[i].stage} from the local host list?`)){hosts.splice(i,1);saveHosts();renderHosts();}};
hostManager.addEventListener('submit',e=>{e.preventDefault();const idx=document.getElementById('editIndex').value;const old=idx!==''?hosts[Number(idx)]:{};const record={stage:document.getElementById('hostStage').value.trim(),spark:document.getElementById('hostSpark').value.trim(),platform:document.getElementById('hostPlatform').value.trim(),country:document.getElementById('hostCountry').value.trim(),category:document.getElementById('hostCategory').value.trim(),status:document.getElementById('hostStatus').value,bio:document.getElementById('hostBio').value.trim(),social:document.getElementById('hostSocial').value.trim(),photo:photoPreview.src||old.photo||'images/twin-arc-logo.jpg'};if(idx==='')hosts.push(record);else hosts[Number(idx)]=record;saveHosts();renderHosts();hostManager.hidden=true;resetManager();});
document.getElementById('hostSearch').addEventListener('input',renderHosts);
document.getElementById('hostFilter').addEventListener('change',renderHosts);
const profileModal=document.getElementById('profileModal');
window.viewHost=i=>{const h=hosts[i];document.getElementById('profilePhoto').src=h.photo||'images/twin-arc-logo-v7.png';document.getElementById('profileName').textContent=h.stage;document.getElementById('profileSpark').textContent='Spark ID: '+h.spark;document.getElementById('profileMeta').textContent=[h.platform,h.category,h.country,h.status].filter(Boolean).join(' • ');document.getElementById('profileBio').textContent=h.bio||'Official Twin Arc Agency host.';const social=document.getElementById('profileSocial');if(h.social){social.href=h.social;social.hidden=false}else social.hidden=true;profileModal.hidden=false;profileModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'};
function closeProfile(){profileModal.hidden=true;profileModal.setAttribute('aria-hidden','true');document.body.style.overflow=''}
document.querySelectorAll('[data-close-profile]').forEach(el=>el.addEventListener('click',closeProfile));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!profileModal.hidden)closeProfile()});
loadHostsFromSupabase();

// V11 Host Performance Dashboard — Supabase cloud records
const PERF_KEY='twinArcPerformanceV11Cloud';
let performance={};
let currentPerfHost=-1;
const $=id=>document.getElementById(id);
function savePerformance(){localStorage.setItem(PERF_KEY,JSON.stringify(performance));}
function currentSpark(){return currentPerfHost>=0?(hosts[currentPerfHost].spark||'').trim():'';}
function getHostData(){const spark=currentSpark();if(!spark)return {month:'',headers:['','','','',''],records:{}};performance[spark]=performance[spark]||{month:'',headers:['','','','',''],records:{}};const d=performance[spark];d.headers=d.headers||['','','','',''];while(d.headers.length<5)d.headers.push('');d.records=d.records||{};return d;}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function statusFor(r){if(!r)return 'NO RECORD';const ct=Number(r.coinTarget??$('perfCoinTarget').value??2800),dt=Number(r.daysTarget??$('perfDaysTarget').value??5);return Number(r.coins)>=ct&&Number(r.days)>=dt?'QUOTA ACHIEVED':'INCOMPLETE';}
async function loadPerformanceForCurrentHost(requestedMonth=''){
 if(currentPerfHost<0)return;const h=hosts[currentPerfHost],spark=currentSpark(),d=getHostData();
 try{const r=await fetch(`${SUPABASE_URL}/rest/v1/host_weekly_records?host_id=eq.${h.id}&select=id,host_id,month_year,week_key,week_label,extra_date,coins_received,streaming_days,streaming_hours,notes,updated_at&order=updated_at.desc`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});if(!r.ok)throw new Error(await r.text());const rows=await r.json();const month=requestedMonth||d.month||(rows[0]?.month_year||'');d.month=month;d.headers=['','','','',''];d.records={};rows.filter(x=>x.month_year===month).forEach(x=>{const i=Number(String(x.week_key).replace('slot',''));if(i>=0&&i<5){d.headers[i]=x.week_label||x.extra_date||'';d.records[x.week_key]={id:x.id,coins:Number(x.coins_received||0),days:Number(x.streaming_days||0),hours:Number(x.streaming_hours||0),notes:x.notes||'',coinTarget:Number($('perfCoinTarget').value||2800),daysTarget:Number($('perfDaysTarget').value||5)};}});$('perfMonth').value=month;savePerformance();renderQuotaSheet();$('perfMessage').textContent=month?'Cloud records loaded.':'No weekly records yet for this host.';}catch(err){console.error('[Twin Arc] weekly records load failed',err);$('perfMessage').textContent='Could not load cloud weekly records.';}
}
function setHostHeader(i){currentPerfHost=i;const h=hosts[i],d=getHostData();$('perfSparkSearch').value=h.spark||'';$('perfHostPhoto').src=h.photo||'images/twin-arc-logo-v7.png';$('perfHostName').textContent=h.stage;$('perfHostId').textContent='Spark ID: '+h.spark;$('perfHostStatus').textContent=h.status||'Active';$('perfMonth').value=d.month||'';$('perfMessage').textContent='Loading cloud records...';renderQuotaSheet();loadPerformanceForCurrentHost(d.month||'');}
window.openPerformance=i=>{setHostHeader(i);document.getElementById('performance').scrollIntoView({behavior:'smooth',block:'start'});};
function findHostBySpark(){const q=$('perfSparkSearch').value.trim().toLowerCase();const i=hosts.findIndex(h=>(h.spark||'').toLowerCase()===q);if(i<0){$('perfMessage').textContent='Spark ID not found.';return;}setHostHeader(i);}
$('perfSearchBtn').addEventListener('click',findHostBySpark);$('perfSparkSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findHostBySpark();}});
function renderQuotaSheet(){
  const d=currentPerfHost>=0?getHostData():{headers:['','','','',''],records:{}};
  const headers=d.headers||['','','','',''];
  $('quotaHead').innerHTML=`<tr><th class="row-title">WEEKLY QUOTA</th>${headers.map((h,i)=>`<th><input class="manual-week-header" data-header-index="${i}" value="${esc(h)}" placeholder="Type month/date/year"></th>`).join('')}</tr>`;
  const rows=[
    ['Weekly Result',r=>r?`${Number(r.days||0)} days / ${Number(r.coins||0).toLocaleString()} coins`:''],
    ['Coins Received',r=>r?Number(r.coins||0).toLocaleString():''],
    ['Streaming Days',r=>r?Number(r.days||0):''],
    ['Streaming Hours',r=>r?`${Number(r.hours||0)} hrs`:''],
    ['Status',r=>r?statusFor(r):''],
    ['Notes',r=>r&&r.notes?esc(r.notes):'']
  ];
  $('quotaBody').innerHTML=rows.map(([name,fn])=>`<tr><th class="row-title">${name}</th>${headers.map((h,i)=>{const r=d.records['slot'+i];const st=name==='Status'?statusFor(r):'';return `<td class="week-cell ${st==='QUOTA ACHIEVED'?'cell-ok':st==='INCOMPLETE'?'cell-bad':''}" data-slot="${i}">${fn(r)}</td>`}).join('')}</tr>`).join('');
  let coins=0,days=0,hours=0,quota=0;Object.values(d.records||{}).forEach(r=>{if(!r)return;coins+=Number(r.coins||0);days+=Number(r.days||0);hours+=Number(r.hours||0);if(statusFor(r)==='QUOTA ACHIEVED')quota++;});
  $('monthCoins').textContent=coins.toLocaleString();$('monthDays').textContent=days;$('monthHours').textContent=(Number.isInteger(hours)?hours:hours.toFixed(2))+'h';$('monthQuota').textContent=quota;
}
function openWeekEditor(i){if(!adminUnlocked){openAdmin();adminStatus.textContent='Owner sign-in required to edit weekly records.';return;}if(currentPerfHost<0)return;const d=getHostData(),key='slot'+i,r=d.records[key]||{};$('perfWeek').value=key;$('weeklyMonth').value=d.month||$('perfMonth').value||'';$('weeklyStart').value=d.headers[i]||'';$('weeklyCoins').value=r.coins??'';$('weeklyDays').value=r.days??'';$('weeklyHours').value=r.hours??'';$('weeklyNotes').value=r.notes??'';$('editingWeekTitle').textContent=d.headers[i]||`Weekly Column ${i+1}`;$('weeklyRecordForm').hidden=false;}
$('perfMonth').addEventListener('change',()=>{if(currentPerfHost<0)return;const d=getHostData();d.month=$('perfMonth').value.trim();loadPerformanceForCurrentHost(d.month);});
$('perfCoinTarget').addEventListener('change',renderQuotaSheet);$('perfDaysTarget').addEventListener('change',renderQuotaSheet);
$('quotaSheet').addEventListener('input',e=>{if(!e.target.matches('.manual-week-header')||currentPerfHost<0)return;const d=getHostData(),i=Number(e.target.dataset.headerIndex);d.headers[i]=e.target.value;savePerformance();});
$('quotaSheet').addEventListener('click',e=>{const cell=e.target.closest('[data-slot]');if(cell)openWeekEditor(Number(cell.dataset.slot));});
$('quotaSheet').addEventListener('dblclick',e=>{if(e.target.matches('.manual-week-header'))openWeekEditor(Number(e.target.dataset.headerIndex));});
$('closeWeekEditor').addEventListener('click',()=>{$('weeklyRecordForm').hidden=true;});
$('weeklyStart').addEventListener('input',()=>{$('editingWeekTitle').textContent=$('weeklyStart').value||'Blank Weekly Column';});
$('weeklyRecordForm').addEventListener('submit',async e=>{e.preventDefault();if(currentPerfHost<0||!$('perfWeek').value||!adminUnlocked)return;const token=await getOwnerAccessToken();if(!token){openAdmin();return;}const d=getHostData(),key=$('perfWeek').value,i=Number(key.replace('slot','')),month=$('weeklyMonth').value.trim();if(!month){$('perfMessage').textContent='Enter month/year first.';return;}const payload={host_id:hosts[currentPerfHost].id,month_year:month,week_key:key,week_label:$('weeklyStart').value.trim(),extra_date:$('weeklyStart').value.trim(),coins_received:Number($('weeklyCoins').value||0),streaming_days:Number($('weeklyDays').value||0),streaming_hours:Number($('weeklyHours').value||0),notes:$('weeklyNotes').value.trim(),updated_at:new Date().toISOString()};const r=await fetch(`${SUPABASE_URL}/rest/v1/host_weekly_records?on_conflict=host_id,month_year,week_key`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(payload)});if(!r.ok){console.error(await r.text());$('perfMessage').textContent='Cloud save failed. Please sign in again.';return;}d.month=month;$('perfMonth').value=month;d.headers[i]=payload.week_label;$('perfMessage').textContent='Weekly record saved to Supabase successfully.';$('weeklyRecordForm').hidden=true;await loadPerformanceForCurrentHost(month);});
$('deleteWeekBtn').addEventListener('click',async()=>{const key=$('perfWeek').value;if(currentPerfHost<0||!key||!adminUnlocked)return;const d=getHostData();if(!d.records[key]||!confirm('Delete this weekly record?'))return;const token=await getOwnerAccessToken();if(!token){openAdmin();return;}const month=$('weeklyMonth').value.trim()||d.month;const r=await fetch(`${SUPABASE_URL}/rest/v1/host_weekly_records?host_id=eq.${hosts[currentPerfHost].id}&month_year=eq.${encodeURIComponent(month)}&week_key=eq.${encodeURIComponent(key)}`,{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}});if(!r.ok){$('perfMessage').textContent='Cloud delete failed.';return;}$('weeklyRecordForm').hidden=true;$('perfMessage').textContent='Weekly record deleted.';await loadPerformanceForCurrentHost(month);});
renderQuotaSheet();

// V9 Twin Arc Event Manager (local browser storage)
const EVENT_KEY='twinArcEventsV9';
let events=JSON.parse(localStorage.getItem(EVENT_KEY)||'[]');
const eventGrid=document.getElementById('eventGrid'),eventManager=document.getElementById('eventManager'),eventPhoto=document.getElementById('eventPhoto'),eventPhotoPreview=document.getElementById('eventPhotoPreview');
function saveEvents(){localStorage.setItem(EVENT_KEY,JSON.stringify(events));}
function renderEvents(){
  eventGrid.innerHTML='';
  events.forEach((ev,i)=>{const card=document.createElement('article');card.className='event-card';const media=ev.photo?`<img class="event-poster" src="${ev.photo}" alt="${esc(ev.title)} event poster">`:`<div class="event-poster-placeholder">TWIN ARC EVENT</div>`;card.innerHTML=`${media}<div class="event-info"><span class="event-status">${esc(ev.status||'Upcoming')}</span><h3>${esc(ev.title)}</h3><p class="event-date">${esc([ev.date,ev.time].filter(Boolean).join(' • '))}</p><p class="event-description">${esc(ev.description||'')}</p><div class="event-actions"><button class="mini-btn" type="button" onclick="editEvent(${i})">Edit</button><button class="mini-btn danger" type="button" onclick="deleteEvent(${i})">Delete</button></div></div>`;eventGrid.appendChild(card)});
  document.getElementById('eventCount').textContent=events.length;
  document.getElementById('eventEmpty').hidden=events.length>0;
}
function resetEventManager(){document.getElementById('eventEditIndex').value='';document.getElementById('eventManagerTitle').textContent='Add New Event';['eventTitle','eventDate','eventTime','eventDescription'].forEach(id=>document.getElementById(id).value='');document.getElementById('eventStatus').value='Upcoming';eventPhoto.value='';eventPhotoPreview.src='';eventPhotoPreview.hidden=true;}
document.getElementById('addEventBtn').addEventListener('click',()=>{resetEventManager();eventManager.hidden=false;eventManager.scrollIntoView({behavior:'smooth',block:'center'});});
document.getElementById('cancelEventBtn').addEventListener('click',()=>{eventManager.hidden=true;resetEventManager();});
eventPhoto.addEventListener('change',()=>{const f=eventPhoto.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{eventPhotoPreview.src=r.result;eventPhotoPreview.hidden=false};r.readAsDataURL(f)});
const clearEventPhotoBtn=document.getElementById('clearEventPhotoBtn');if(clearEventPhotoBtn)clearEventPhotoBtn.addEventListener('click',()=>{eventPhoto.value='';eventPhotoPreview.src='';eventPhotoPreview.hidden=true;});
window.editEvent=i=>{const ev=events[i];document.getElementById('eventEditIndex').value=i;document.getElementById('eventManagerTitle').textContent='Edit Event';document.getElementById('eventTitle').value=ev.title||'';document.getElementById('eventDate').value=ev.date||'';document.getElementById('eventTime').value=ev.time||'';document.getElementById('eventStatus').value=ev.status||'Upcoming';document.getElementById('eventDescription').value=ev.description||'';eventPhoto.value='';eventPhotoPreview.src=ev.photo||'';eventPhotoPreview.hidden=!ev.photo;eventManager.hidden=false;eventManager.scrollIntoView({behavior:'smooth',block:'center'});};
window.deleteEvent=i=>{if(confirm(`Delete ${events[i].title}?`)){events.splice(i,1);saveEvents();renderEvents();}};
eventManager.addEventListener('submit',e=>{e.preventDefault();const idx=document.getElementById('eventEditIndex').value;const old=idx!==''?events[Number(idx)]:{};const ev={title:document.getElementById('eventTitle').value.trim(),date:document.getElementById('eventDate').value.trim(),time:document.getElementById('eventTime').value.trim(),status:document.getElementById('eventStatus').value,description:document.getElementById('eventDescription').value.trim(),photo:eventPhotoPreview.src||''};if(idx==='')events.push(ev);else events[Number(idx)]=ev;saveEvents();renderEvents();eventManager.hidden=true;resetEventManager();});
renderEvents();


// Join Us: continue application through Agency Owner Facebook profile
const joinHostForm = document.getElementById('hostForm');
if (joinHostForm) {
  joinHostForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = document.getElementById('formStatus');
    const success = document.getElementById('joinSuccess');
    if (status) status.textContent = 'Your information is ready. Please message the Agency Owner on Facebook to continue your application.';
    if (success) { success.hidden = false; success.scrollIntoView({behavior:'smooth', block:'nearest'}); }
  });
}

// V11 Owner Mode — Supabase Auth + site_owners authorization
const OWNER_SESSION_KEY='twinArcOwnerSessionV11';

const adminModal=document.getElementById('adminModal'),adminModeBtn=document.getElementById('adminModeBtn'),adminForm=document.getElementById('adminForm'),adminEmail=document.getElementById('adminEmail'),adminPassword=document.getElementById('adminPassword'),adminStatus=document.getElementById('adminStatus'),adminUnlockedActions=document.getElementById('adminUnlockedActions');
function readOwnerSession(){try{return JSON.parse(localStorage.getItem(OWNER_SESSION_KEY)||'null')}catch{return null}}
function writeOwnerSession(x){if(x)localStorage.setItem(OWNER_SESSION_KEY,JSON.stringify(x));else localStorage.removeItem(OWNER_SESSION_KEY);}
async function ownerRowExists(token){const r=await fetch(`${SUPABASE_URL}/rest/v1/site_owners?select=user_id&limit=1`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}});return r.ok&&(await r.json()).length===1;}
async function refreshOwnerSession(){const s=readOwnerSession();if(!s?.refresh_token)return null;const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});if(!r.ok){writeOwnerSession(null);return null;}const n=await r.json();writeOwnerSession(n);return n.access_token;}
async function getOwnerAccessToken(){const s=readOwnerSession();if(!s)return null;if(s.expires_at&&Date.now()/1000<s.expires_at-60)return s.access_token;return refreshOwnerSession();}
function setAdminVisibility(){const selectors=['#addHostBtn','#addEventBtn','.host-actions .mini-btn:not(.view-profile):not(.dashboard-btn)','.event-actions','.sheet-toolbar','#weeklyRecordForm'];document.querySelectorAll(selectors.join(',')).forEach(el=>el.classList.toggle('admin-only-hidden',!adminUnlocked));document.querySelectorAll('.manual-week-header').forEach(el=>{el.disabled=!adminUnlocked;el.title=adminUnlocked?'Edit weekly header':'Owner login required to edit';});document.querySelectorAll('.week-cell').forEach(el=>{el.style.cursor=adminUnlocked?'pointer':'default';});if(adminModeBtn){adminModeBtn.textContent=adminUnlocked?'OWNER MODE ✓':'Owner Login';adminModeBtn.classList.toggle('is-unlocked',adminUnlocked);adminModeBtn.setAttribute('aria-label',adminUnlocked?'Owner Mode active':'Owner Login');}if(!adminUnlocked){hostManager.hidden=true;eventManager.hidden=true;$('weeklyRecordForm').hidden=true;}}
function refreshAdminUI(){adminForm.hidden=adminUnlocked;adminUnlockedActions.hidden=!adminUnlocked;document.getElementById('adminHelp').textContent=adminUnlocked?'Secure Owner Mode is active on this device.':'Sign in with your Twin Arc Owner account to unlock management controls.';}
function openAdmin(){if(adminStatus)adminStatus.textContent='';if(adminPassword)adminPassword.value='';refreshAdminUI();if(adminModal){adminModal.hidden=false;adminModal.removeAttribute('hidden');adminModal.setAttribute('aria-hidden','false');adminModal.style.display='grid';}}
window.twinArcOpenOwnerLogin=function(e){if(e){e.preventDefault();e.stopPropagation();}openAdmin();return false;}
function closeAdmin(){if(adminModal){adminModal.hidden=true;adminModal.setAttribute('hidden','');adminModal.setAttribute('aria-hidden','true');adminModal.style.display='';}}
if(adminModeBtn){adminModeBtn.onclick=function(e){e.preventDefault();e.stopPropagation();openAdmin();};}document.querySelectorAll('[data-close-admin]').forEach(el=>el.addEventListener('click',closeAdmin));
adminForm.addEventListener('submit',async e=>{e.preventDefault();adminStatus.textContent='Signing in...';const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:adminEmail.value.trim(),password:adminPassword.value})});if(!r.ok){adminStatus.textContent='Incorrect owner email or password.';return;}const session=await r.json();if(!await ownerRowExists(session.access_token)){adminStatus.textContent='This account is not authorized as the Agency Owner.';return;}writeOwnerSession(session);adminUnlocked=true;setAdminVisibility();refreshAdminUI();adminStatus.textContent='Owner Mode unlocked securely. Opening dashboard...';setTimeout(()=>{closeAdmin();const perf=document.getElementById('performance');if(perf)perf.scrollIntoView({behavior:'smooth',block:'start'});const search=document.getElementById('perfSparkSearch');if(search)setTimeout(()=>search.focus(),650);},350);});
document.getElementById('lockAdminBtn').addEventListener('click',async()=>{const token=await getOwnerAccessToken();if(token)fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}}).catch(()=>{});writeOwnerSession(null);adminUnlocked=false;setAdminVisibility();refreshAdminUI();adminStatus.textContent='Signed out.';});
(async()=>{const token=await getOwnerAccessToken();adminUnlocked=!!token&&await ownerRowExists(token);if(!adminUnlocked)writeOwnerSession(null);setAdminVisibility();refreshAdminUI();})();

// Guard management entry points.
const addHostBtnEl=document.getElementById('addHostBtn');
if(addHostBtnEl)addHostBtnEl.addEventListener('click',e=>{if(!adminUnlocked){e.preventDefault();e.stopImmediatePropagation();openAdmin();adminStatus.textContent='Owner sign-in required to add hosts.';}} ,true);
const addEventBtnEl=document.getElementById('addEventBtn');
if(addEventBtnEl)addEventBtnEl.addEventListener('click',e=>{if(!adminUnlocked){e.preventDefault();e.stopImmediatePropagation();openAdmin();adminStatus.textContent='Owner sign-in required to manage events.';}} ,true);
