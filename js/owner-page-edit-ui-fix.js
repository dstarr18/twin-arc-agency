// Twin Arc Agency — keep static page edit controls synced with the real Owner Mode state.
(function(){
  const isOwner=()=>{
    const btn=document.getElementById('adminModeBtn');
    if(!btn)return false;
    return btn.classList.contains('is-unlocked') || /OWNER\s*MODE\s*✓/i.test(btn.textContent||'');
  };

  function sync(){
    const unlocked=isOwner();
    document.body.classList.toggle('site-owner-unlocked',unlocked);
    document.querySelectorAll('.page-edit-btn').forEach(btn=>{
      btn.hidden=!unlocked;
      btn.style.setProperty('display',unlocked?'inline-flex':'none','important');
      if(unlocked){
        btn.style.setProperty('z-index','80','important');
      }
    });
  }

  function init(){
    sync();
    let observed=null;
    const attach=()=>{
      const btn=document.getElementById('adminModeBtn');
      if(btn&&btn!==observed){
        observed=btn;
        new MutationObserver(sync).observe(btn,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
      }
      sync();
    };
    attach();
    setInterval(attach,400);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
