// Twin Arc Agency — Dashboard button navigation fix.
// Ensures host Dashboard buttons open the separate Performance page
// while preserving the selected host and loading its cloud records.
(function(){
  function install(){
    if(typeof window.setHostHeader!=='function' && typeof window.openPerformance!=='function'){
      setTimeout(install,100);
      return;
    }

    window.openPerformance=function(i){
      try{
        if(typeof setHostHeader==='function') setHostHeader(i);

        // The site uses separate-page navigation. Changing the hash lets
        // safe-page-navigation-v2 reveal #performance instead of trying
        // to scroll to a section that is still hidden.
        if(location.hash!=='#performance'){
          location.hash='performance';
        }else{
          const performanceSection=document.getElementById('performance');
          if(performanceSection) performanceSection.hidden=false;
        }

        setTimeout(()=>{
          const performanceSection=document.getElementById('performance');
          if(performanceSection){
            performanceSection.hidden=false;
            performanceSection.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
            window.scrollTo({top:0,left:0,behavior:'auto'});
          }
        },50);
      }catch(err){
        console.error('[Twin Arc] Dashboard navigation failed',err);
      }
    };
  }

  install();
})();
