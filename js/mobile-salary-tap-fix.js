// Twin Arc Agency — iPhone/Safari salary tap fallback.
// Uses touch coordinates at document capture level so the salary action still works
// even if Safari leaves a stale compositing/hit-test layer after back navigation.
(function(){
  function visibleSalaryButton(){
    const performance=document.getElementById('performance');
    if(!performance||performance.hidden)return null;
    return performance.querySelector('[data-toggle-all-salaries]');
  }

  function pointInside(rect,x,y){
    return x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
  }

  document.addEventListener('touchend',function(e){
    if(!e.changedTouches||e.changedTouches.length!==1)return;
    const btn=visibleSalaryButton();
    if(!btn)return;
    const t=e.changedTouches[0];
    const rect=btn.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0||!pointInside(rect,t.clientX,t.clientY))return;

    // Stop any stale overlay/target handler from swallowing or double-processing the tap.
    e.preventDefault();
    e.stopImmediatePropagation();

    // Force Safari to refresh layout/hit testing before invoking the normal button logic.
    void btn.offsetHeight;
    btn.click();
  },{capture:true,passive:false});

  function refreshHitLayer(){
    const btn=visibleSalaryButton();
    if(!btn)return;
    const row=btn.closest('.weekly-salary-row');
    if(row){
      row.style.transform='translateZ(0)';
      void row.offsetHeight;
      requestAnimationFrame(()=>{row.style.transform='';});
    }
  }

  window.addEventListener('pageshow',()=>setTimeout(refreshHitLayer,80));
  window.addEventListener('popstate',()=>setTimeout(refreshHitLayer,120));
  window.addEventListener('hashchange',()=>setTimeout(refreshHitLayer,160));
})();