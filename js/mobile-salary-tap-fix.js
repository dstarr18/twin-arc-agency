// Twin Arc Agency — iPhone/Safari salary PIN modal fallback.
// Mobile taps are handled directly here so Safari never has to reopen window.prompt()
// after browser Back/history navigation.
(function(){
  let busy=false;
  let lastHandledAt=0;

  function isMobile(){
    return window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  }

  function visibleSalaryButton(){
    const performance=document.getElementById('performance');
    if(!performance||performance.hidden)return null;
    return performance.querySelector('[data-toggle-all-salaries]');
  }

  function pointInside(rect,x,y){
    return x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
  }

  function hostInfo(){
    try{
      if(typeof currentPerfHost==='undefined'||currentPerfHost<0||!hosts?.[currentPerfHost]?.id)return null;
      return hosts[currentPerfHost];
    }catch(_){return null;}
  }

  function hostData(){
    try{return typeof getHostData==='function'?getHostData():{records:{}};}catch(_){return {records:{}};}
  }

  function formatSalary(value){
    const n=Number(value);
    if(value===null||value===undefined||value===''||!Number.isFinite(n))return '-';
    return '₱'+n.toLocaleString('en-PH',{minimumFractionDigits:0,maximumFractionDigits:2});
  }

  function ensureModal(){
    let modal=document.getElementById('mobileSalaryPinModal');
    if(modal)return modal;
    const style=document.createElement('style');
    style.id='mobileSalaryPinModalStyles';
    style.textContent=`
      #mobileSalaryPinModal{position:fixed;inset:0;z-index:2147483000;background:rgba(5,8,25,.72);display:flex;align-items:center;justify-content:center;padding:22px}
      #mobileSalaryPinModal[hidden]{display:none!important}
      #mobileSalaryPinModal .salary-pin-card{width:min(92vw,390px);background:#11183b;border:1px solid rgba(187,128,255,.45);border-radius:18px;padding:20px;box-shadow:0 22px 60px rgba(0,0,0,.5);color:#fff}
      #mobileSalaryPinModal h3{margin:0 0 6px;font-size:1.15rem}
      #mobileSalaryPinModal p{margin:0 0 14px;opacity:.8;font-size:.9rem}
      #mobileSalaryPinModal input{width:100%;box-sizing:border-box;font-size:1.3rem;letter-spacing:.28em;text-align:center;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:#090f2b;color:#fff}
      #mobileSalaryPinModal .salary-pin-error{min-height:20px;margin-top:8px;color:#ffaaaa;font-size:.82rem}
      #mobileSalaryPinModal .salary-pin-actions{display:flex;gap:10px;margin-top:12px}
      #mobileSalaryPinModal button{flex:1;min-height:44px;border:0;border-radius:10px;font-weight:800;cursor:pointer}
      #mobileSalaryPinModal .salary-pin-cancel{background:#2b3153;color:#fff}
      #mobileSalaryPinModal .salary-pin-submit{background:#8e5cff;color:#fff}
    `;
    document.head.appendChild(style);
    modal=document.createElement('div');
    modal.id='mobileSalaryPinModal';
    modal.hidden=true;
    modal.innerHTML=`<div class="salary-pin-card" role="dialog" aria-modal="true" aria-labelledby="mobileSalaryPinTitle">
      <h3 id="mobileSalaryPinTitle">Enter Salary PIN</h3>
      <p id="mobileSalaryPinHost"></p>
      <input id="mobileSalaryPinInput" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" autocomplete="off" placeholder="••••••">
      <div id="mobileSalaryPinError" class="salary-pin-error"></div>
      <div class="salary-pin-actions"><button type="button" class="salary-pin-cancel">Cancel</button><button type="button" class="salary-pin-submit">View Salary</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.salary-pin-cancel').addEventListener('click',()=>closeModal());
    modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
    return modal;
  }

  function closeModal(){
    const modal=document.getElementById('mobileSalaryPinModal');
    if(!modal)return;
    modal.hidden=true;
    const input=document.getElementById('mobileSalaryPinInput');if(input)input.value='';
    const err=document.getElementById('mobileSalaryPinError');if(err)err.textContent='';
    busy=false;
  }

  async function verifySlot(hostId,key,pin){
    const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_host_weekly_salary`,{
      method:'POST',
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({p_host_id:hostId,p_month_year:'',p_week_key:key,p_pin:pin})
    });
    if(!r.ok)throw new Error(await r.text());
    return r.json();
  }

  function maskRow(){
    const row=document.querySelector('#performance .weekly-salary-row');
    if(!row)return;
    const d=hostData();
    [0,1,2,3,4].forEach(i=>{
      const td=row.querySelector(`[data-salary-slot="${i}"]`);
      if(!td)return;
      td.innerHTML=d.records?.['slot'+i]?'<span class="salary-masked">••••</span>':'-';
    });
    const btn=row.querySelector('[data-toggle-all-salaries]');
    if(btn)btn.innerHTML='<span>Weekly Salary /</span><span class="salary-unlock-line2">Enter PIN to VIEW 🔒</span>';
  }

  function revealRow(values){
    const row=document.querySelector('#performance .weekly-salary-row');
    if(!row)return;
    const d=hostData();
    [0,1,2,3,4].forEach(i=>{
      const key='slot'+i;
      const td=row.querySelector(`[data-salary-slot="${i}"]`);
      if(!td)return;
      td.innerHTML=d.records?.[key]?`<span class="salary-revealed">${formatSalary(values[key])}</span>`:'-';
    });
    const btn=row.querySelector('[data-toggle-all-salaries]');
    if(btn)btn.innerHTML='<span>Weekly Salary /</span><span class="salary-unlock-line2">Tap to HIDE 🔓</span>';
  }

  function openModal(){
    const host=hostInfo();if(!host)return;
    const modal=ensureModal();
    document.getElementById('mobileSalaryPinHost').textContent=`${host.stage} — enter the 6-digit PIN once to reveal all weekly salaries.`;
    modal.hidden=false;
    const input=document.getElementById('mobileSalaryPinInput');
    input.value='';
    document.getElementById('mobileSalaryPinError').textContent='';
    const submit=modal.querySelector('.salary-pin-submit');
    submit.onclick=async()=>{
      if(busy)return;
      const pin=input.value.trim();
      const error=document.getElementById('mobileSalaryPinError');
      if(!/^\d{6}$/.test(pin)){error.textContent='Please enter a valid 6-digit PIN.';return;}
      const latestHost=hostInfo();if(!latestHost){closeModal();return;}
      const d=hostData();
      const slots=[0,1,2,3,4].filter(i=>!!d.records?.['slot'+i]);
      if(!slots.length){error.textContent='No weekly salary records are available yet.';return;}
      busy=true;submit.disabled=true;submit.textContent='Checking…';error.textContent='';
      try{
        const values={};
        for(const i of slots){
          const key='slot'+i;
          const result=await verifySlot(latestHost.id,key,pin);
          if(!result?.ok){
            error.textContent=result?.error==='wrong_pin'?'Incorrect PIN.':result?.error==='locked'?'Too many incorrect attempts. Try again after 10 minutes.':result?.error==='pin_not_set'?'No Salary PIN has been set for this host yet.':'Unable to unlock the weekly salaries.';
            busy=false;submit.disabled=false;submit.textContent='View Salary';return;
          }
          values[key]=result.salary;
        }
        revealRow(values);
        closeModal();
      }catch(err){
        console.warn('[Twin Arc] Mobile salary PIN verification failed.',err);
        error.textContent='Could not verify the PIN right now.';
        busy=false;
      }finally{
        submit.disabled=false;submit.textContent='View Salary';
      }
    };
    input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();submit.click();}};
    setTimeout(()=>input.focus(),80);
  }

  function handleSalaryTap(e,x,y){
    if(!isMobile())return false;
    const btn=visibleSalaryButton();if(!btn)return false;
    const rect=btn.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0||!pointInside(rect,x,y))return false;

    e.preventDefault();
    e.stopImmediatePropagation();

    const now=Date.now();
    if(now-lastHandledAt<700)return true;
    lastHandledAt=now;

    const hiding=(btn.textContent||'').includes('HIDE');
    if(hiding)maskRow();else openModal();
    return true;
  }

  // Intercept BOTH touchend and pointerup at document capture level. iPhone can fire
  // the legacy target touchend before a pointer-only fallback gets a chance to stop it.
  // A short duplicate guard means only the first mobile event performs the action.
  document.addEventListener('touchend',function(e){
    if(!e.changedTouches||e.changedTouches.length!==1)return;
    const t=e.changedTouches[0];
    handleSalaryTap(e,t.clientX,t.clientY);
  },{capture:true,passive:false});

  document.addEventListener('pointerup',function(e){
    if(e.pointerType!=='touch')return;
    handleSalaryTap(e,e.clientX,e.clientY);
  },{capture:true,passive:false});

  // Safari may synthesize a click afterward. Block it so weekly-salary.js cannot
  // reach its legacy window.prompt() code path.
  document.addEventListener('click',function(e){
    if(!isMobile())return;
    const btn=e.target?.closest?.('[data-toggle-all-salaries]');
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  function cleanupAfterNavigation(){
    closeModal();
    lastHandledAt=0;
    setTimeout(maskRow,160);
  }
  window.addEventListener('pageshow',cleanupAfterNavigation);
  window.addEventListener('popstate',cleanupAfterNavigation);
  window.addEventListener('hashchange',cleanupAfterNavigation);
})();
