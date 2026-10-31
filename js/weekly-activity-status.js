// Twin Arc weekly activity status patch.
// Keeps the host's main profile status separate from each week's activity status.
(function(){
  const STATUS_FIELD='activity_status';
  const originalFetch=window.fetch.bind(window);

  function ensureEditorField(){
    const form=document.getElementById('weeklyRecordForm');
    if(!form||document.getElementById('weeklyActivityStatus'))return;
    const grid=form.querySelector('.manager-grid');
    if(!grid)return;
    const label=document.createElement('label');
    label.innerHTML='Weekly Activity Status<select id="weeklyActivityStatus"><option value="Active">Active</option><option value="Inactive">Inactive</option></select>';
    const notes=grid.querySelector('label.full');
    if(notes)grid.insertBefore(label,notes);else grid.appendChild(label);
  }

  function currentRecord(){
    if(typeof getHostData!=='function')return null;
    const key=document.getElementById('perfWeek')?.value;
    return key?getHostData().records?.[key]:null;
  }

  // Add activity_status to weekly saves without changing the approved core dashboard logic.
  window.fetch=async function(input,init){
    try{
      const url=typeof input==='string'?input:(input?.url||'');
      if(url.includes('/rest/v1/host_weekly_records')&&String(init?.method||'GET').toUpperCase()==='POST'&&init?.body){
        const payload=JSON.parse(init.body);
        const select=document.getElementById('weeklyActivityStatus');
        payload[STATUS_FIELD]=select?.value==='Inactive'?'Inactive':'Active';
        init={...init,body:JSON.stringify(payload)};
      }
    }catch(err){console.warn('[Twin Arc] Weekly activity save patch skipped.',err);}
    return originalFetch(input,init);
  };

  async function syncWeeklyStatuses(){
    try{
      if(typeof currentPerfHost==='undefined'||currentPerfHost<0||typeof hosts==='undefined')return;
      const h=hosts[currentPerfHost],d=getHostData();
      if(!h?.id||!d?.month)return;
      const r=await originalFetch(`${SUPABASE_URL}/rest/v1/host_weekly_records?host_id=eq.${encodeURIComponent(h.id)}&month_year=eq.${encodeURIComponent(d.month)}&select=week_key,activity_status`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
      if(!r.ok)return;
      const rows=await r.json();
      rows.forEach(x=>{if(d.records?.[x.week_key])d.records[x.week_key].activityStatus=x.activity_status||'Active';});
      renderQuotaSheet();
    }catch(err){console.warn('[Twin Arc] Weekly activity status load failed.',err);}
  }

  ensureEditorField();

  if(typeof openWeekEditor==='function'){
    const originalOpenWeekEditor=openWeekEditor;
    openWeekEditor=function(i){
      originalOpenWeekEditor(i);
      ensureEditorField();
      const select=document.getElementById('weeklyActivityStatus');
      const r=currentRecord();
      if(select)select.value=r?.activityStatus==='Inactive'?'Inactive':'Active';
    };
  }

  if(typeof renderQuotaSheet==='function'){
    const originalRenderQuotaSheet=renderQuotaSheet;
    let rendering=false;
    renderQuotaSheet=function(){
      if(rendering)return;
      rendering=true;
      try{
        originalRenderQuotaSheet();
        const body=document.getElementById('quotaBody');
        if(!body||typeof getHostData!=='function')return;
        const d=currentPerfHost>=0?getHostData():{headers:['','','','',''],records:{}};
        const headers=d.headers||['','','','',''];
        const tr=document.createElement('tr');
        tr.className='weekly-activity-row';
        tr.innerHTML=`<th class="row-title">Weekly Activity</th>${headers.map((h,i)=>{const r=d.records['slot'+i];if(!r)return '<td class="week-cell" data-slot="'+i+'"></td>';const st=r.activityStatus==='Inactive'?'Inactive':'Active';return '<td class="week-cell '+(st==='Active'?'cell-ok':'cell-bad')+'" data-slot="'+i+'">'+st.toUpperCase()+'</td>';}).join('')}`;
        const statusRow=Array.from(body.querySelectorAll('tr')).find(row=>row.querySelector('.row-title')?.textContent==='Status');
        if(statusRow)body.insertBefore(tr,statusRow);else body.appendChild(tr);
      }finally{rendering=false;}
    };
  }

  if(typeof loadPerformanceForCurrentHost==='function'){
    const originalLoadPerformance=loadPerformanceForCurrentHost;
    loadPerformanceForCurrentHost=async function(requestedMonth=''){
      await originalLoadPerformance(requestedMonth);
      await syncWeeklyStatuses();
    };
  }

  const form=document.getElementById('weeklyRecordForm');
  if(form)form.addEventListener('submit',()=>{
    const key=document.getElementById('perfWeek')?.value;
    const select=document.getElementById('weeklyActivityStatus');
    if(key&&select&&typeof getHostData==='function'){
      const r=getHostData().records?.[key];
      if(r)r.activityStatus=select.value;
    }
  },true);
})();
