// Twin Arc weekly salary: owner-editable, PIN-protected public viewing.
(function(){
  const SALARY_FIELD='weekly_salary';
  const previousFetch=window.fetch.bind(window);
  let salaryRenderVersion=0;
  let salariesRevealed=false;
  let revealedSalaryValues={};
  let revealedHostId=null;

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

  function currentHostId(){
    try{return (typeof currentPerfHost!=='undefined'&&currentPerfHost>=0&&hosts?.[currentPerfHost]?.id)?String(hosts[currentPerfHost].id):null;}catch(_){return null;}
  }

  function resetSalaryReveal(){
    salariesRevealed=false;
    revealedSalaryValues={};
    revealedHostId=null;
  }

  function ensureStyles(){
    if(document.getElementById('salaryPrivacyStyles'))return;
    const style=document.createElement('style');
    style.id='salaryPrivacyStyles';
    style.textContent=`
      .salary-row-unlock{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;border:0;background:transparent;color:inherit;padding:0;margin:0;font:inherit;font-weight:inherit;text-align:left;cursor:pointer;line-height:1.15;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      .salary-row-unlock .salary-unlock-line2{font-size:.78em;opacity:.9;font-weight:800;white-space:normal}
      .salary-row-unlock:hover .salary-unlock-line2{text-decoration:underline}
      .salary-masked{opacity:.58;font-weight:800;letter-spacing:.08em}
      .salary-revealed{color:#fff;font-weight:900}
      .salary-pin-hint{display:block;margin-top:5px;font-size:.78rem;opacity:.7;font-weight:600}
      .salary-pin-field input{letter-spacing:.18em}
      @media(max-width:700px){
        .salary-row-unlock{font-size:.94em;min-height:44px;justify-content:center}
        .salary-row-unlock .salary-unlock-line2{font-size:.72em;line-height:1.15}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSalaryField(){
    ensureStyles();
    const form=document.getElementById('weeklyRecordForm');
    if(!form)return;
    const grid=form.querySelector('.manager-grid');
    if(!grid)return;

    if(!document.getElementById('weeklySalary')){
      const label=document.createElement('label');
      label.setAttribute('data-weekly-salary-field','true');
      label.innerHTML='Weekly Salary<input id="weeklySalary" type="number" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 1200.00" autocomplete="off">';
      const status=document.getElementById('weeklyActivityStatus')?.closest('label');
      const notes=grid.querySelector('label.full');
      if(status&&status.parentNode===grid)status.insertAdjacentElement('afterend',label);
      else if(notes)grid.insertBefore(label,notes);
      else grid.appendChild(label);
    }

    if(!document.getElementById('hostSalaryPin')){
      const pinLabel=document.createElement('label');
      pinLabel.className='salary-pin-field';
      pinLabel.setAttribute('data-host-salary-pin-field','true');
      pinLabel.innerHTML='Set / Change Salary PIN<input id="hostSalaryPin" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="6-digit PIN — leave blank to keep current" autocomplete="new-password"><span class="salary-pin-hint">Owner only. The PIN is stored securely and is never shown back.</span>';
      const salaryLabel=document.querySelector('[data-weekly-salary-field="true"]');
      if(salaryLabel&&salaryLabel.parentNode===grid)salaryLabel.insertAdjacentElement('afterend',pinLabel);
      else grid.appendChild(pinLabel);
    }
  }

  async function ownerToken(){
    try{return typeof getOwnerAccessToken==='function'?await getOwnerAccessToken():null;}catch(_){return null;}
  }

  async function loadSalaryForOpenWeek(){
    ensureSalaryField();
    const input=document.getElementById('weeklySalary');
    if(!input)return;
    input.value='';
    const pin=document.getElementById('hostSalaryPin');
    if(pin)pin.value='';
    try{
      if(typeof currentPerfHost==='undefined'||currentPerfHost<0||typeof hosts==='undefined')return;
      const host=hosts[currentPerfHost];
      const weekKey=document.getElementById('perfWeek')?.value||'';
      if(!host?.id||!weekKey)return;
      const token=await ownerToken();
      if(!token)return;
      const url=`${SUPABASE_URL}/rest/v1/host_weekly_records?host_id=eq.${encodeURIComponent(host.id)}&week_key=eq.${encodeURIComponent(weekKey)}&select=weekly_salary,updated_at&order=updated_at.desc&limit=1`;
      const r=await previousFetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}});
      if(!r.ok)return;
      const rows=await r.json();
      const value=rows?.[0]?.[SALARY_FIELD];
      input.value=(value===null||value===undefined||value==='')?'':String(value);
    }catch(err){console.warn('[Twin Arc] Could not load owner weekly salary.',err);}
  }

  async function saveHostSalaryPin(pin){
    try{
      if(!/^\d{6}$/.test(pin||'')){
        const msg=document.getElementById('perfMessage');if(msg)msg.textContent='Salary PIN must be exactly 6 digits.';
        return false;
      }
      if(typeof currentPerfHost==='undefined'||currentPerfHost<0||!hosts?.[currentPerfHost]?.id)return false;
      const token=await ownerToken();
      if(!token)return false;
      const r=await previousFetch(`${SUPABASE_URL}/rest/v1/rpc/set_host_salary_pin`,{
        method:'POST',
        headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify({p_host_id:hosts[currentPerfHost].id,p_pin:pin})
      });
      if(!r.ok)throw new Error(await r.text());
      const msg=document.getElementById('perfMessage');if(msg)msg.textContent='Weekly record saved. Host salary PIN updated.';
      const el=document.getElementById('hostSalaryPin');if(el)el.value='';
      return true;
    }catch(err){
      console.warn('[Twin Arc] Could not update salary PIN.',err);
      const msg=document.getElementById('perfMessage');if(msg)msg.textContent='Weekly record saved, but salary PIN could not be updated.';
      return false;
    }
  }

  function salaryRowLabel(){
    return salariesRevealed
      ? '<button type="button" class="salary-row-unlock" data-toggle-all-salaries><span>Weekly Salary /</span><span class="salary-unlock-line2">Tap to HIDE 🔓</span></button>'
      : '<button type="button" class="salary-row-unlock" data-toggle-all-salaries><span>Weekly Salary /</span><span class="salary-unlock-line2">Enter PIN to VIEW 🔒</span></button>';
  }

  function bindSalaryButton(scope){
    const btn=scope?.querySelector?.('[data-toggle-all-salaries]');
    if(!btn||btn.dataset.salaryBound==='1')return;
    btn.dataset.salaryBound='1';
    let lastTouchAt=0;

    btn.addEventListener('touchend',function(e){
      lastTouchAt=Date.now();
      e.preventDefault();
      e.stopPropagation();
      unlockAllSalaries(btn);
    },{passive:false});

    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      if(Date.now()-lastTouchAt<800)return;
      unlockAllSalaries(btn);
    });
  }

  function renderPrivateSalaryRow(){
    const myVersion=++salaryRenderVersion;
    const body=document.getElementById('quotaBody');
    if(!body)return;
    const hostId=currentHostId();
    if(revealedHostId&&hostId!==revealedHostId)resetSalaryReveal();
    if(myVersion!==salaryRenderVersion||!document.body.contains(body))return;
    body.querySelectorAll('.weekly-salary-row').forEach(el=>el.remove());
    const d=(typeof getHostData==='function'&&typeof currentPerfHost!=='undefined'&&currentPerfHost>=0)?getHostData():{records:{}};
    const tr=document.createElement('tr');
    tr.className='weekly-salary-row';
    tr.innerHTML=`<th class="row-title">${salaryRowLabel()}</th>${[0,1,2,3,4].map(i=>{
      const key='slot'+i,hasRecord=!!d.records?.[key];
      if(!hasRecord)return `<td class="week-cell" data-salary-slot="${i}">-</td>`;
      if(salariesRevealed)return `<td class="week-cell" data-salary-slot="${i}"><span class="salary-revealed">${formatSalary(revealedSalaryValues[key])}</span></td>`;
      return `<td class="week-cell" data-salary-slot="${i}"><span class="salary-masked">••••</span></td>`;
    }).join('')}`;
    const statusRow=Array.from(body.querySelectorAll('tr')).find(row=>row.querySelector('.row-title')?.textContent?.trim()==='Status');
    if(statusRow)body.insertBefore(tr,statusRow);else body.appendChild(tr);
    bindSalaryButton(tr);
  }

  async function verifySalaryForSlot(hostId,key,pin){
    const r=await previousFetch(`${SUPABASE_URL}/rest/v1/rpc/verify_host_weekly_salary`,{
      method:'POST',
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({p_host_id:hostId,p_month_year:'',p_week_key:key,p_pin:pin})
    });
    if(!r.ok)throw new Error(await r.text());
    return r.json();
  }

  async function unlockAllSalaries(button){
    try{
      if(typeof currentPerfHost==='undefined'||currentPerfHost<0||!hosts?.[currentPerfHost]?.id)return;
      const host=hosts[currentPerfHost];
      const hostId=String(host.id);
      if(revealedHostId&&revealedHostId!==hostId)resetSalaryReveal();
      if(salariesRevealed){
        resetSalaryReveal();
        renderPrivateSalaryRow();
        return;
      }

      const d=(typeof getHostData==='function')?getHostData():{records:{}};
      const slots=[0,1,2,3,4].filter(i=>!!d.records?.['slot'+i]);
      if(!slots.length){alert('No weekly salary records are available yet.');return;}

      const pin=window.prompt(`Enter the 6-digit Salary PIN for ${host.stage}:`);
      if(pin===null)return;
      const cleanPin=pin.trim();
      if(!/^\d{6}$/.test(cleanPin)){alert('Please enter a valid 6-digit PIN.');return;}

      button.disabled=true;
      const line2=button.querySelector('.salary-unlock-line2');
      if(line2)line2.textContent='Checking PIN…';

      const values={};
      for(const i of slots){
        const key='slot'+i;
        const result=await verifySalaryForSlot(host.id,key,cleanPin);
        if(!result?.ok){
          if(result?.error==='wrong_pin')alert('Incorrect PIN.');
          else if(result?.error==='locked')alert('Too many incorrect attempts. Salary access is temporarily locked for 10 minutes.');
          else if(result?.error==='pin_not_set')alert('No Salary PIN has been set for this host yet.');
          else alert('Unable to unlock the weekly salaries.');
          renderPrivateSalaryRow();
          return;
        }
        values[key]=result.salary;
      }

      revealedSalaryValues=values;
      salariesRevealed=true;
      revealedHostId=hostId;
      renderPrivateSalaryRow();
    }catch(err){
      console.warn('[Twin Arc] Salary PIN verification failed.',err);
      alert('Could not verify the PIN right now.');
      renderPrivateSalaryRow();
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
    }catch(err){console.warn('[Twin Arc] Weekly salary save patch skipped.',err);}
    return previousFetch(input,init);
  };

  ensureSalaryField();

  if(typeof openWeekEditor==='function'){
    const originalOpenWeekEditor=openWeekEditor;
    openWeekEditor=function(i){originalOpenWeekEditor(i);ensureSalaryField();loadSalaryForOpenWeek();};
  }

  if(typeof renderQuotaSheet==='function'){
    const originalRenderQuotaSheet=renderQuotaSheet;
    renderQuotaSheet=function(){
      originalRenderQuotaSheet();
      resetSalaryReveal();
      renderPrivateSalaryRow();
    };
  }

  function refreshSalaryAfterNavigation(){
    resetSalaryReveal();
    setTimeout(()=>{ensureSalaryField();renderPrivateSalaryRow();},80);
    setTimeout(renderPrivateSalaryRow,320);
  }
  window.addEventListener('popstate',refreshSalaryAfterNavigation);
  window.addEventListener('pageshow',e=>{if(e.persisted)refreshSalaryAfterNavigation();});
  window.addEventListener('hashchange',()=>setTimeout(refreshSalaryAfterNavigation,30));

  const pageObserver=new MutationObserver(()=>{
    const body=document.getElementById('quotaBody');
    if(body&&!body.querySelector('.weekly-salary-row'))renderPrivateSalaryRow();
  });
  pageObserver.observe(document.body,{childList:true,subtree:true});

  const form=document.getElementById('weeklyRecordForm');
  if(form){
    const observer=new MutationObserver(()=>ensureSalaryField());
    observer.observe(form,{childList:true,subtree:true});
    form.addEventListener('submit',()=>{
      const pin=document.getElementById('hostSalaryPin')?.value?.trim()||'';
      if(pin)setTimeout(()=>saveHostSalaryPin(pin),120);
      setTimeout(renderPrivateSalaryRow,450);
    },true);
  }

  setTimeout(renderPrivateSalaryRow,300);
})();
