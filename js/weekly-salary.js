// Twin Arc weekly salary: owner-editable, PIN-protected public viewing.
(function(){
  const SALARY_FIELD='weekly_salary';
  const previousFetch=window.fetch.bind(window);
  let salaryRenderVersion=0;
  let revealedSlots=new Set();

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

  function ensureStyles(){
    if(document.getElementById('salaryPrivacyStyles'))return;
    const style=document.createElement('style');
    style.id='salaryPrivacyStyles';
    style.textContent=`
      .salary-lock-btn{border:1px solid rgba(151,92,255,.55);background:rgba(70,28,125,.28);color:#fff;border-radius:10px;padding:8px 10px;font:inherit;font-weight:800;cursor:pointer;white-space:nowrap}
      .salary-lock-btn:hover{background:rgba(116,54,205,.4)}
      .salary-revealed{color:#fff;font-weight:900;cursor:pointer}
      .salary-pin-hint{display:block;margin-top:5px;font-size:.78rem;opacity:.7;font-weight:600}
      .salary-pin-field input{letter-spacing:.18em}
      @media(max-width:700px){.salary-lock-btn{padding:7px 8px;font-size:.82rem}}
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
    }catch(err){console.warn('[Twin Arc] Could not update salary PIN.',err);const msg=document.getElementById('perfMessage');if(msg)msg.textContent='Weekly record saved, but salary PIN could not be updated.';return false;}
  }

  function renderPrivateSalaryRow(){
    const myVersion=++salaryRenderVersion;
    const body=document.getElementById('quotaBody');
    if(!body)return;
    if(myVersion!==salaryRenderVersion||!document.body.contains(body))return;
    body.querySelectorAll('.weekly-salary-row').forEach(el=>el.remove());
    const d=(typeof getHostData==='function'&&typeof currentPerfHost!=='undefined'&&currentPerfHost>=0)?getHostData():{records:{}};
    const tr=document.createElement('tr');
    tr.className='weekly-salary-row';
    tr.innerHTML=`<th class="row-title">Weekly Salary</th>${[0,1,2,3,4].map(i=>{
      const key='slot'+i,hasRecord=!!d.records?.[key];
      if(!hasRecord)return `<td class="week-cell" data-salary-slot="${i}">-</td>`;
      return `<td class="week-cell" data-salary-slot="${i}"><button type="button" class="salary-lock-btn" data-view-salary="${i}">🔒 View Salary</button></td>`;
    }).join('')}`;
    const statusRow=Array.from(body.querySelectorAll('tr')).find(row=>row.querySelector('.row-title')?.textContent?.trim()==='Status');
    if(statusRow)body.insertBefore(tr,statusRow);else body.appendChild(tr);
  }

  async function verifyAndRevealSalary(slot,button){
    try{
      if(typeof currentPerfHost==='undefined'||currentPerfHost<0||!hosts?.[currentPerfHost]?.id)return;
      const key='slot'+slot;
      const cell=button.closest('td');
      if(revealedSlots.has(key)){
        revealedSlots.delete(key);
        cell.innerHTML=`<button type="button" class="salary-lock-btn" data-view-salary="${slot}">🔒 View Salary</button>`;
        return;
      }
      const pin=window.prompt(`Enter the 6-digit Salary PIN for ${hosts[currentPerfHost].stage}:`);
      if(pin===null)return;
      if(!/^\d{6}$/.test(pin.trim())){alert('Please enter a valid 6-digit PIN.');return;}
      button.disabled=true;button.textContent='Checking…';
      const month=(typeof getHostData==='function'?getHostData().month:'')||document.getElementById('perfMonth')?.value||'';
      const r=await previousFetch(`${SUPABASE_URL}/rest/v1/rpc/verify_host_weekly_salary`,{
        method:'POST',
        headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify({p_host_id:hosts[currentPerfHost].id,p_month_year:month,p_week_key:key,p_pin:pin.trim()})
      });
      if(!r.ok)throw new Error(await r.text());
      const result=await r.json();
      if(result?.ok){
        revealedSlots.add(key);
        cell.innerHTML=`<span class="salary-revealed" data-hide-salary="${slot}" title="Tap to hide">${formatSalary(result.salary)} 🔓</span>`;
        return;
      }
      if(result?.error==='wrong_pin')alert('Incorrect PIN.');
      else if(result?.error==='locked')alert('Too many incorrect attempts. Salary access is temporarily locked for 10 minutes.');
      else if(result?.error==='pin_not_set')alert('No Salary PIN has been set for this host yet.');
      else alert('Unable to unlock this salary.');
      button.disabled=false;button.textContent='🔒 View Salary';
    }catch(err){console.warn('[Twin Arc] Salary PIN verification failed.',err);alert('Could not verify the PIN right now.');if(button){button.disabled=false;button.textContent='🔒 View Salary';}}
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
    renderQuotaSheet=function(){originalRenderQuotaSheet();revealedSlots.clear();renderPrivateSalaryRow();};
  }

  const quota=document.getElementById('quotaSheet');
  if(quota){
    quota.addEventListener('click',e=>{
      const btn=e.target.closest('[data-view-salary]');
      if(btn){e.preventDefault();e.stopPropagation();verifyAndRevealSalary(Number(btn.dataset.viewSalary),btn);return;}
      const unlocked=e.target.closest('[data-hide-salary]');
      if(unlocked){e.preventDefault();e.stopPropagation();const slot=Number(unlocked.dataset.hideSalary),cell=unlocked.closest('td'),key='slot'+slot;revealedSlots.delete(key);cell.innerHTML=`<button type="button" class="salary-lock-btn" data-view-salary="${slot}">🔒 View Salary</button>`;}
    },true);
  }

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
