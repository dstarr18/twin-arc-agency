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

        // Force the selected host's Performance table to refresh immediately.
        // This is especially important after iPhone/Safari back navigation,
        // where the previous dashboard DOM can be restored from history.
        if(typeof renderQuotaSheet==='function'){
          try{renderQuotaSheet();}catch(_){/* retry below after navigation settles */}
        }

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
          // Re-apply the host and rerender after mobile history/hash navigation
          // has finished restoring/replacing the page DOM.
          if(typeof setHostHeader==='function') setHostHeader(i);
          if(typeof renderQuotaSheet==='function'){
            try{renderQuotaSheet();}catch(_){ }
          }

          const performanceSection=document.getElementById('performance');
          if(performanceSection){
            performanceSection.hidden=false;
            performanceSection.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
            window.scrollTo({top:0,left:0,behavior:'auto'});
          }

          // Signal add-on modules that a fresh host dashboard is active.
          window.dispatchEvent(new CustomEvent('twinArcPerformanceHostChanged',{detail:{hostIndex:i}}));
        },80);

        setTimeout(()=>{
          if(typeof renderQuotaSheet==='function'){
            try{renderQuotaSheet();}catch(_){ }
          }
        },260);
      }catch(err){
        console.error('[Twin Arc] Dashboard navigation failed',err);
      }
    };
  }

  install();
})();
