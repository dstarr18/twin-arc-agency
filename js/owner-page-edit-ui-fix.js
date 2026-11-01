// Twin Arc Agency — keep static page edit controls synced with the real Owner Mode state.
(function(){
  const isOwner=()=>{
    const btn=document.getElementById('adminModeBtn');
    if(!btn)return false;
    return btn.classList.contains('is-unlocked') || /OWNER\s*MODE\s*✓/i.test(btn.textContent||'');
  };

  function installPlacementFix(){
    if(document.getElementById('ownerPageEditPlacementFix'))return;
    const style=document.createElement('style');
    style.id='ownerPageEditPlacementFix';
    style.textContent=`
      main > section.page-editable > .page-edit-btn{
        top:92px!important;
        right:clamp(18px,4vw,58px)!important;
        z-index:70!important;
      }
      @media(max-width:700px){
        main > section.page-editable > .page-edit-btn{
          top:78px!important;
          right:12px!important;
          max-width:calc(100vw - 24px);
          white-space:nowrap;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function sync(){
    const unlocked=isOwner();
    document.body.classList.toggle('site-owner-unlocked',unlocked);
    document.querySelectorAll('.page-edit-btn').forEach(btn=>{
      btn.hidden=!unlocked;
      btn.style.setProperty('display',unlocked?'inline-flex':'none','important');
      if(unlocked){
        btn.style.setProperty('z-index','70','important');
      }
    });
  }

  function init(){
    installPlacementFix();
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
