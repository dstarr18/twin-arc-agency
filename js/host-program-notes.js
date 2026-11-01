// Twin Arc Agency — editable Host Program notes under Announcements.
(function(){
  const API='https://uhcfsdsdlqcqadkhlzkg.supabase.co';
  const KEY='sb_publishable_1tdi3y-UoBBnHKFsW1MFcw_vyRBbdgA';
  const $=id=>document.getElementById(id);
  let noteText='';
  const owner=()=>document.getElementById('adminModeBtn')?.classList.contains('is-unlocked')===true;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function styles(){
    if($('hostProgramNotesStyles'))return;
    const s=document.createElement('style');s.id='hostProgramNotesStyles';
    s.textContent=`
      .program-notes-box{margin-top:16px;padding:12px 14px;border:1px solid rgba(154,105,255,.34);border-radius:14px;background:rgba(8,7,20,.55);min-height:82px;position:relative}
      .program-notes-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}
      .program-notes-head strong{font-size:14px;color:#fff}
      .program-notes-text{margin:0;color:#c8c3d5;font-size:12px;line-height:1.5;white-space:pre-wrap}
      .program-notes-empty{color:#8f88a2;font-style:italic}
      .program-notes-edit{display:none;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(126,65,255,.18);color:#fff;font-size:10px;cursor:pointer}
      body.site-owner-unlocked .program-notes-edit,body:has(#adminModeBtn.is-unlocked) .program-notes-edit{display:inline-flex}
      .program-notes-modal[hidden]{display:none!important}.program-notes-modal{position:fixed;inset:0;z-index:230;display:grid;place-items:center;padding:18px}
      .program-notes-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(8px)}
      .program-notes-dialog{position:relative;z-index:1;width:min(560px,96vw);border:1px solid rgba(177,108,255,.45);border-radius:20px;background:linear-gradient(145deg,#11102a,#090814);padding:26px}
      .program-notes-dialog textarea{width:100%;min-height:170px;resize:vertical;background:#07091d;border:1px solid #383c70;color:#fff;border-radius:10px;padding:12px;margin:12px 0}
      .program-notes-actions{display:flex;gap:10px;flex-wrap:wrap}.program-notes-status{min-height:18px;color:#c793ff;font-size:12px}
      @media(max-width:860px){.program-notes-box{min-height:76px}}
    `;
    document.head.appendChild(s);
  }

  function render(){
    const ann=document.querySelector('.program-announcements');
    if(!ann)return false;
    let box=$('programNotesBox');
    if(!box){box=document.createElement('div');box.id='programNotesBox';box.className='program-notes-box';ann.appendChild(box);}
    box.innerHTML=`<div class="program-notes-head"><strong>Notes:</strong><button class="program-notes-edit" id="programNotesEditBtn" type="button">Edit Notes</button></div><p class="program-notes-text ${noteText?'':'program-notes-empty'}">${noteText?esc(noteText):'No notes added yet.'}</p>`;
    $('programNotesEditBtn').onclick=openModal;
    return true;
  }

  async function loadNote(){
    try{
      const r=await fetch(`${API}/rest/v1/site_content?id=eq.1&select=program_notes`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
      if(!r.ok)throw new Error(await r.text());
      const data=await r.json();noteText=data?.[0]?.program_notes||'';render();
    }catch(err){console.error('[Twin Arc] Host Program notes load failed',err);render();}
  }

  function buildModal(){
    if($('programNotesModal'))return;
    const m=document.createElement('div');m.id='programNotesModal';m.className='program-notes-modal';m.hidden=true;
    m.innerHTML=`<div class="program-notes-backdrop" data-pn-close></div><section class="program-notes-dialog"><h2>Edit Host Program Notes</h2><p>Add reminders, mechanics, deadlines, reward details, or other notes.</p><form id="programNotesForm"><textarea id="programNotesInput" maxlength="1500" placeholder="Type notes here..."></textarea><p class="program-notes-status" id="programNotesStatus"></p><div class="program-notes-actions"><button class="btn btn-primary" type="submit">Save Notes</button><button class="btn btn-secondary" type="button" data-pn-close>Cancel</button></div></form></section>`;
    document.body.appendChild(m);m.querySelectorAll('[data-pn-close]').forEach(x=>x.onclick=closeModal);$('programNotesForm').onsubmit=saveNote;
  }

  function openModal(){if(!owner())return;buildModal();$('programNotesInput').value=noteText;$('programNotesStatus').textContent='';$('programNotesModal').hidden=false;document.body.style.overflow='hidden';}
  function closeModal(){if($('programNotesModal'))$('programNotesModal').hidden=true;document.body.style.overflow='';}

  async function saveNote(e){
    e.preventDefault();if(!owner())return;
    const token=typeof getOwnerAccessToken==='function'?await getOwnerAccessToken():null;
    if(!token){$('programNotesStatus').textContent='Owner session expired.';return;}
    try{
      $('programNotesStatus').textContent='Saving…';
      const value=$('programNotesInput').value.trim();
      const r=await fetch(`${API}/rest/v1/site_content?id=eq.1`,{method:'PATCH',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({program_notes:value,updated_at:new Date().toISOString()})});
      if(!r.ok)throw new Error(await r.text());
      noteText=value;render();closeModal();
    }catch(err){console.error('[Twin Arc] Host Program notes save failed',err);$('programNotesStatus').textContent='Save failed. Please try again.';}
  }

  function boot(){styles();let tries=0;const timer=setInterval(()=>{tries++;if(render()){clearInterval(timer);loadNote();}else if(tries>80)clearInterval(timer);},100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();