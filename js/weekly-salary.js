// Twin Arc weekly salary: owner-editable, publicly visible in Performance weekly table.
(function(){
  const SALARY_FIELD='weekly_salary';
  const previousFetch=window.fetch.bind(window);
  let salaryRenderVersion=0;

  function moneyNumber(value){
    const raw=String(value??'').trim().replace(/,/g,'').replace(/[^0-9.+-]/g,'');
    if(!raw)return null;
    const n=Number(raw);
    return Number.isFinite(n)&&n>=0?n:null;
  }

  function formatSalary(value){
    const n=Number(value);
    if(value===null||value===undefined||value===''||!Number.isFinite(n))return '-';
    return '₱'+n.toLocaleString('en-PH',{minimumFractionDigits:0,maximumFractionDigits:2});
  }

  function ensureSalaryField(){
    const form=document.getElementById('weeklyRecordForm');
    if(!form||document.getElementById('weeklySalary'))return;
    const grid=form.querySelector('.manager-grid');
    if(!grid)return;
    const label=document.createElement('label');
    label.setAttribute('data-weekly-salary-field','true');
    label.innerHTML='Weekly Salary<input id="weeklySalary" type="number" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 1200.00" autocomplete="off">';
    const status=document.getElementById('weeklyActivityStatus')?.closest('label');
    const notes=grid.querySelector('label.full');
    if(status&&status.parentNode===grid){
      status.insertAdjacentElement('afterend',label);
    }else if(notes){
      grid.insertBefore(label,notes);
    }else{
      grid.appendChild(label);
    }
  }

  async function fetchSalaryMap(){
    try{
      if(typeof currentPerfHost==='undefined'||currentPerfHost<0||typeof hosts==='undefined')return {};
      const host=hosts[currentPerfHost];
      if(!host?.id)return {};
      const url=`${SUPABASE_URL}/rest/v1/host_weekly_records?host_id=eq.${encodeURIComponent(host.id)}&select=week_key,weekly_salary,updated_at&order=updated_at.desc`;
      const r=await previousFetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
      if(!r.ok)return {};
      const rows=await r.json();
      const map={};
      rows.forEach(row=>{if(row?.week_key&&!Object.prototype.hasOwnProperty.call(map,row.week_key))map[row.week_key]=row.weekly_salary;});
      return map;
    }catch(err){
      console.warn('[Twin Arc] Could not load public weekly salaries.',err);
      return {};
    }
  }

  async function renderPublicSalaryRow(){
    const myVersion=++salaryRenderVersion;
    const body=document.getElementById('quotaBody');
    if(!body)return;
    const map=await fetchSalaryMap();
    if(myVersion!==salaryRenderVersion||!document.body.contains(body))return;

    // Always clean up immediately before insertion so overlapping async renders
    // can never leave more than one public Weekly Salary row behind.
    body.querySelectorAll('.weekly-salary-row').forEach(el=>el.remove());

    const tr=document.createElement('tr');
    tr.className='weekly-salary-row';
    tr.innerHTML=`<th class="row-title">Weekly Salary</th>${[0,1,2,3,4].map(i=>`<td class="week-cell" data-salary-slot="${i}">${formatSalary(map['slot'+i])}</td>`).join('')}`;
    const statusRow=Array.from(body.querySelectorAll('tr')).find(row=>row.querySelector('.row-title')?.textContent?.trim()==='Status');
    if(statusRow)body.insertBefore(tr,statusRow);else body.appendChild(tr);
  }

  async function loadSalaryForOpenWeek(){
    ensureSalaryField();
    const input=document.getElementById('weeklySalary');
    if(!input)return;
    input.value='';
    try{
      if(typeof currentPerfHost==='undefined'||currentPerfHost<0||typeof hosts==='undefined')return;
      const host=hosts[currentPerfHost];
      const weekKey=document.getElementById('perfWeek')?.value||'';
      if(!host?.id||!weekKey)return;
      const url=`${SUPABASE_URL}/rest/v1/host_weekly_records?host_id=eq.${encodeURIComponent(host.id)}&week_key=eq.${encodeURIComponent(weekKey)}&select=weekly_salary,updated_at&order=updated_at.desc&limit=1`;
      const r=await previousFetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
      if(!r.ok)return;
      const rows=await r.json();
      const value=rows?.[0]?.[SALARY_FIELD];
      input.value=(value===null||value===undefined||value==='')?'':String(value);
    }catch(err){
      console.warn('[Twin Arc] Could not load weekly salary.',err);
    }
  }

  window.fetch=async function(input,init){
    try{
      const url=typeof input==='string'?input:(input?.url||'');
      if(url.includes('/rest/v1/host_weekly_records')&&String(init?.method||'GET').toUpperCase()==='POST'&&init?.body){
        const payload=JSON.parse(init.body);
        const salaryEl=document.getElementById('weeklySalary');
        payload[SALARY_FIELD]=salaryEl?moneyNumber(salaryEl.value):null;
        init={...init,body:JSON.stringify(payload)};
      }
    }catch(err){
      console.warn('[Twin Arc] Weekly salary save patch skipped.',err);
    }
    return previousFetch(input,init);
  };

  ensureSalaryField();

  if(typeof openWeekEditor==='function'){
    const originalOpenWeekEditor=openWeekEditor;
    openWeekEditor=function(i){
      originalOpenWeekEditor(i);
      ensureSalaryField();
      loadSalaryForOpenWeek();
    };
  }

  if(typeof renderQuotaSheet==='function'){
    const originalRenderQuotaSheet=renderQuotaSheet;
    renderQuotaSheet=function(){
      originalRenderQuotaSheet();
      renderPublicSalaryRow();
    };
  }

  const form=document.getElementById('weeklyRecordForm');
  if(form){
    const observer=new MutationObserver(()=>ensureSalaryField());
    observer.observe(form,{childList:true,subtree:true});
    form.addEventListener('submit',()=>setTimeout(renderPublicSalaryRow,450),true);
  }

  setTimeout(renderPublicSalaryRow,300);
})();
