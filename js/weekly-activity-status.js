// Twin Arc weekly activity status + flexible dashboard month/range + no-quota dash patch.
// Keeps permanent host status separate from each week's activity status.
(function(){
  const STATUS_FIELD='activity_status';
  const originalFetch=window.fetch.bind(window);
  const dashFlags={};

  function dashboardMonth(){
    const weekly=document.getElementById('weeklyMonth')?.value?.trim();
    if(weekly)return weekly;
    const perf=document.getElementById('perfMonth')?.value?.trim();
    if(perf)return perf;
    if(typeof getHostData==='function')return (getHostData().month||'').trim();
    return '';
  }
  function normalizeMonthLabel(value){return String(value||'').trim().replace(/\s+/g,' ');}
  function parsePlainNumber(value){
    const raw=String(value??'').trim();
    if(!raw||raw==='-')return 0;
    const cleaned=raw.replace(/,/g,'').replace(/[^0-9.+-]/g,'');
    const n=Number(cleaned);
    return Number.isFinite(n)?n:0;
  }
  function parseHoursValue(value){
    const raw=String(value??'').trim().toLowerCase();
    if(!raw||raw==='-')return 0;
    const colon=raw.match(/^(\d+(?:\.\d+)?):([0-5]?\d)$/);
    if(colon)return Number(colon[1])+Number(colon[2])/60;
    const hm=raw.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)(?:\s*(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes))?$/);
    if(hm)return Number(hm[1])+(hm[2]?Number(hm[2])/60:0);
    return parsePlainNumber(raw)/60; // A plain number in this editor means minutes.
  }
  function hoursToMinutes(value){return Math.round((Number(value)||0)*60);}
  function formatHours(value){
    const minutes=hoursToMinutes(value);
    const h=Math.floor(minutes/60),m=minutes%60;
    return h?`${h}h${m?' '+m+'m':''}`:`${m}m`;
  }

  function ensureEditorField(){
    const form=document.getElementById('weeklyRecordForm');if(!form)return;
    const weeklyMonth=document.getElementById('weeklyMonth');
    if(weeklyMonth){weeklyMonth.readOnly=false;weeklyMonth.removeAttribute('pattern');weeklyMonth.placeholder='e.g. Oct-Nov 2026';weeklyMonth.title='Dashboard label only — weeks remain together';const label=weeklyMonth.closest('label');if(label&&label.firstChild)label.firstChild.textContent='Dashboard Month / Year';}
    ['weeklyCoins','weeklyDays','weeklyHours'].forEach(id=>{const el=document.getElementById(id);if(!el)return;el.type='text';el.inputMode='decimal';el.placeholder='0 or -';el.removeAttribute('min');el.removeAttribute('max');el.removeAttribute('step');el.setAttribute('autocomplete','off');});
    const hoursInput=document.getElementById('weeklyHours');
    if(hoursInput){
      hoursInput.placeholder='e.g. 150';
      hoursInput.inputMode='decimal';
      const hoursLabel=hoursInput.closest('label');
      if(hoursLabel&&hoursLabel.firstChild)hoursLabel.firstChild.textContent='Streaming Time (Minutes)';
      let inline=document.getElementById('streamMinutesInlineWrap');
      if(!inline){
        inline=document.createElement('div');
        inline.id='streamMinutesInlineWrap';
        inline.style.cssText='position:relative;width:100%;min-width:0';
        hoursInput.parentNode.insertBefore(inline,hoursInput);
        inline.appendChild(hoursInput);
      }
      hoursInput.style.setProperty('box-sizing','border-box');
      hoursInput.style.setProperty('width','100%');
      hoursInput.style.setProperty('padding-right','min(43%, 180px)','important');
      hoursInput.style.setProperty('font-size','16px'); // Avoid iOS Safari zoom on focus.
      let hint=document.getElementById('streamMinutesPreview');
      if(!hint){
        hint=document.createElement('span');
        hint.id='streamMinutesPreview';
        hint.style.cssText='position:absolute;right:14px;top:50%;transform:translateY(-50%);color:#d8b8ff;font:600 13px Montserrat,Arial,sans-serif;white-space:nowrap;pointer-events:none;max-width:42%;text-align:right;overflow:hidden;text-overflow:ellipsis';
        hint.setAttribute('aria-live','polite');
        inline.appendChild(hint);
        hoursInput.addEventListener('input',()=>{
          const v=hoursInput.value.trim();
          const valid=v==='-'||v===''||((/^\d+(?:\.\d+)?$/.test(v))&&Number.isFinite(Number(v)));
          hint.textContent=valid&&v!==''&&v!=='-'?'≈ '+formatHours(parseHoursValue(v)):'';
        });
      }
      hoursInput.dispatchEvent(new Event('input',{bubbles:false}));
    }
    if(!document.getElementById('weeklyActivityStatus')){const grid=form.querySelector('.manager-grid');if(grid){const label=document.createElement('label');label.innerHTML='Weekly Activity Status<select id="weeklyActivityStatus"><option value="Active">Active</option><option value="Inactive">Inactive</option></select>';const notes=grid.querySelector('label.full');if(notes)grid.insertBefore(label,notes);else grid.appendChild(label);}}
  }
  function currentKey(){return document.getElementById('perfWeek')?.value||'';}
  function flagKey(key,field){return `${currentSpark?.()||''}|${dashboardMonth()}|${key}|${field}`;}
  function rememberDashInputs(){const key=currentKey();if(!key)return;[['weeklyCoins','coins'],['weeklyDays','days'],['weeklyHours','hours']].forEach(([id,field])=>{dashFlags[flagKey(key,field)]=document.getElementById(id)?.value?.trim()==='-';});}
  function applyDashToLocalRecord(){if(typeof getHostData!=='function')return;const key=currentKey(),r=getHostData().records?.[key];if(!key||!r)return;if(dashFlags[flagKey(key,'coins')])r.coinsDisplay='-';else delete r.coinsDisplay;if(dashFlags[flagKey(key,'days')])r.daysDisplay='-';else delete r.daysDisplay;if(dashFlags[flagKey(key,'hours')])r.hoursDisplay='-';else delete r.hoursDisplay;}

  window.fetch=async function(input,init){
    try{
      const url=typeof input==='string'?input:(input?.url||'');
      if(url.includes('/rest/v1/host_weekly_records')&&String(init?.method||'GET').toUpperCase()==='POST'&&init?.body){
        const payload=JSON.parse(init.body);const select=document.getElementById('weeklyActivityStatus');payload[STATUS_FIELD]=select?.value==='Inactive'?'Inactive':'Active';const month=normalizeMonthLabel(document.getElementById('weeklyMonth')?.value||dashboardMonth());if(month)payload.month_year=month;
        // Read directly from the editor inputs so formatted values are not lost when the core code turns NaN into null during JSON serialization.
        const coinsEl=document.getElementById('weeklyCoins'),daysEl=document.getElementById('weeklyDays'),hoursEl=document.getElementById('weeklyHours');
        if(coinsEl)payload.coins_received=parsePlainNumber(coinsEl.value);
        if(daysEl)payload.streaming_days=parsePlainNumber(daysEl.value);
        if(hoursEl)payload.streaming_hours=parseHoursValue(hoursEl.value);
        ['coins_received','streaming_days','streaming_hours'].forEach(k=>{if(payload[k]===null||payload[k]==='-'||!Number.isFinite(Number(payload[k])))payload[k]=0;});
        init={...init,body:JSON.stringify(payload)};
      }
    }catch(err){console.warn('[Twin Arc] Weekly save patch skipped.',err);}
    return originalFetch(input,init);
  };

  // Load every saved week for the host. month_year is treated as a display label,
  // not as a filter that can hide Week 1 when Week 2 uses a different month/range label.
  async function loadAllWeeksForCurrentHost(){
    try{
      if(typeof currentPerfHost==='undefined'||currentPerfHost<0||typeof hosts==='undefined'||typeof getHostData!=='function')return;
      const h=hosts[currentPerfHost],d=getHostData();if(!h?.id)return;
      const r=await originalFetch(`${SUPABASE_URL}/rest/v1/host_weekly_records?host_id=eq.${encodeURIComponent(h.id)}&select=id,month_year,week_key,week_label,extra_date,coins_received,streaming_days,streaming_hours,notes,activity_status,updated_at&order=updated_at.desc`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});if(!r.ok)return;
      const rows=await r.json(),bySlot={};
      rows.forEach(x=>{const i=Number(String(x.week_key||'').replace('slot',''));if(i>=0&&i<5&&!bySlot[x.week_key])bySlot[x.week_key]=x;});
      d.headers=['','','','',''];d.records={};
      Object.values(bySlot).forEach(x=>{const i=Number(String(x.week_key).replace('slot',''));d.headers[i]=x.week_label||x.extra_date||'';d.records[x.week_key]={id:x.id,coins:Number(x.coins_received||0),days:Number(x.streaming_days||0),hours:Number(x.streaming_hours||0),notes:x.notes||'',activityStatus:x.activity_status||'Active',coinTarget:Number(document.getElementById('perfCoinTarget')?.value||2800),daysTarget:Number(document.getElementById('perfDaysTarget')?.value||5)};});
      const newest=rows[0];if(newest?.month_year)d.month=newest.month_year;
      const perfMonth=document.getElementById('perfMonth');if(perfMonth)perfMonth.value=d.month||'';
      if(typeof savePerformance==='function')savePerformance();if(typeof renderQuotaSheet==='function')renderQuotaSheet();
      const msg=document.getElementById('perfMessage');if(msg)msg.textContent=Object.keys(bySlot).length?'All saved weekly records loaded.':'No weekly records yet for this host.';
    }catch(err){console.warn('[Twin Arc] all-week load failed.',err);}
  }

  ensureEditorField();
  if(typeof openWeekEditor==='function'){const originalOpenWeekEditor=openWeekEditor;openWeekEditor=function(i){originalOpenWeekEditor(i);ensureEditorField();const d=typeof getHostData==='function'?getHostData():null,key='slot'+i,r=d?.records?.[key];const monthInput=document.getElementById('weeklyMonth');if(monthInput)monthInput.value=d?.month||document.getElementById('perfMonth')?.value||'';const select=document.getElementById('weeklyActivityStatus');if(select)select.value=r?.activityStatus==='Inactive'?'Inactive':'Active';if(r){if(r.coinsDisplay==='-')document.getElementById('weeklyCoins').value='-';if(r.daysDisplay==='-')document.getElementById('weeklyDays').value='-';if(r.hoursDisplay==='-')document.getElementById('weeklyHours').value='-';else document.getElementById('weeklyHours').value=String(hoursToMinutes(r.hours));
      }else document.getElementById('weeklyHours').value='';
      const input=document.getElementById('weeklyHours');input?.dispatchEvent(new Event('input',{bubbles:false}));
    };}

  if(typeof renderQuotaSheet==='function'){const originalRenderQuotaSheet=renderQuotaSheet;let rendering=false;renderQuotaSheet=function(){if(rendering)return;rendering=true;try{originalRenderQuotaSheet();const body=document.getElementById('quotaBody');if(!body||typeof getHostData!=='function')return;body.querySelectorAll('.weekly-activity-row').forEach(x=>x.remove());const d=currentPerfHost>=0?getHostData():{headers:['','','','',''],records:{}};const rowMap={'Coins Received':'coinsDisplay','Streaming Days':'daysDisplay','Streaming Hours':'hoursDisplay'};Object.entries(rowMap).forEach(([title,prop])=>{const row=Array.from(body.querySelectorAll('tr')).find(x=>x.querySelector('.row-title')?.textContent===title);if(!row)return;Array.from(row.querySelectorAll('[data-slot]')).forEach((cell,i)=>{if(d.records?.['slot'+i]?.[prop]==='-')cell.textContent='-';});});const hourRow=Array.from(body.querySelectorAll('tr')).find(x=>x.querySelector('.row-title')?.textContent==='Streaming Hours');
      if(hourRow)Array.from(hourRow.querySelectorAll('[data-slot]')).forEach((cell,i)=>{
        const rec=d.records?.['slot'+i];if(rec&&rec.hoursDisplay!=='-')cell.textContent=formatHours(rec.hours);
      });
      const monthHours=document.getElementById('monthHours');
      if(monthHours){let total=0;Object.values(d.records||{}).forEach(r=>{if(r)total+=Number(r.hours)||0;});monthHours.textContent=formatHours(total);}
      const tr=document.createElement('tr');tr.className='weekly-activity-row';tr.innerHTML=`<th class="row-title">Weekly Activity</th>${(d.headers||[]).map((h,i)=>{const r=d.records['slot'+i];if(!r)return '<td class="week-cell" data-slot="'+i+'"></td>';const st=r.activityStatus==='Inactive'?'Inactive':'Active';return '<td class="week-cell '+(st==='Active'?'cell-ok':'cell-bad')+'" data-slot="'+i+'">'+st.toUpperCase()+'</td>';}).join('')}`;const statusRow=Array.from(body.querySelectorAll('tr')).find(row=>row.querySelector('.row-title')?.textContent==='Status');if(statusRow)body.insertBefore(tr,statusRow);else body.appendChild(tr);}finally{rendering=false;}};}

  if(typeof loadPerformanceForCurrentHost==='function'){loadPerformanceForCurrentHost=async function(){await loadAllWeeksForCurrentHost();};}

  const perfMonth=document.getElementById('perfMonth');if(perfMonth){perfMonth.placeholder='Dashboard label (weeks stay together)';perfMonth.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();perfMonth.dispatchEvent(new Event('change',{bubbles:true}));}});}
  const form=document.getElementById('weeklyRecordForm');
  if(form)form.addEventListener('submit',()=>{
    const typedMonth=normalizeMonthLabel(document.getElementById('weeklyMonth')?.value||dashboardMonth());if(perfMonth&&typedMonth)perfMonth.value=typedMonth;if(typeof getHostData==='function'&&typedMonth)getHostData().month=typedMonth;
    rememberDashInputs();['weeklyCoins','weeklyDays','weeklyHours'].forEach(id=>{const el=document.getElementById(id);if(el&&el.value.trim()==='-')el.value='0';});
    setTimeout(async()=>{applyDashToLocalRecord();await loadAllWeeksForCurrentHost();},250);
  },true);
})();
