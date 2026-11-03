// Twin Arc Agency — mobile salary tap bridge only.
// The main weekly-salary module owns PIN, reveal, hide, and state.
(function(){
  let lastHandledAt=0;
  function isMobile(){return window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;}
  function salaryButton(){const p=document.getElementById('performance');if(!p||p.hidden)return null;return p.querySelector('[data-toggle-all-salaries]');}
  function inside(r,x,y){return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;}
  function handle(e,x,y){
    if(!isMobile())return false;
    const btn=salaryButton();if(!btn)return false;
    const r=btn.getBoundingClientRect();if(r.width<=0||r.height<=0||!inside(r,x,y))return false;
    e.preventDefault();e.stopImmediatePropagation();
    const now=Date.now();if(now-lastHandledAt<800)return true;lastHandledAt=now;
    const hiding=(btn.textContent||'').includes('HIDE') || (typeof window.__twinArcSalaryIsRevealed==='function'&&window.__twinArcSalaryIsRevealed());
    if(hiding){
      if(typeof window.__twinArcMobileSalaryHide==='function')window.__twinArcMobileSalaryHide();
    }else{
      if(typeof window.__twinArcMobileSalaryView==='function')window.__twinArcMobileSalaryView();
    }
    return true;
  }
  document.addEventListener('touchend',e=>{if(!e.changedTouches||e.changedTouches.length!==1)return;const t=e.changedTouches[0];handle(e,t.clientX,t.clientY);},{capture:true,passive:false});
  document.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')return;handle(e,e.clientX,e.clientY);},{capture:true,passive:false});
  document.addEventListener('click',e=>{if(!isMobile())return;const btn=e.target?.closest?.('[data-toggle-all-salaries]');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();},true);
  function reset(){lastHandledAt=0;}
  window.addEventListener('pageshow',reset);window.addEventListener('popstate',reset);window.addEventListener('hashchange',reset);
})();