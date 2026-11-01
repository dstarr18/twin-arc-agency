// Twin Arc Preview loader: approved V11 source + cloud host persistence + verified cloud events.
(function(){
  if(!document.querySelector('link[data-twin-arc-event-uniform]')){
    const css=document.createElement('link');css.rel='stylesheet';css.href='css/event-card-uniform.css';css.setAttribute('data-twin-arc-event-uniform','true');document.head.appendChild(css);
  }
  if(!document.querySelector('link[data-twin-arc-brand-centered]')){
    const brandCss=document.createElement('link');brandCss.rel='stylesheet';brandCss.href='css/brand-centered.css';brandCss.setAttribute('data-twin-arc-brand-centered','true');document.head.appendChild(brandCss);
  }
  // Security-first UI: hide every owner management control before auth resolves.
  if(!document.querySelector('link[data-twin-arc-owner-security]')){
    const securityCss=document.createElement('link');securityCss.rel='stylesheet';securityCss.href='css/owner-security.css';securityCss.setAttribute('data-twin-arc-owner-security','true');document.head.appendChild(securityCss);
  }

  try{
    const nativeSetItem=Storage.prototype.setItem;
    if(!window.__twinArcHostCacheGuard){
      window.__twinArcHostCacheGuard=true;
      Storage.prototype.setItem=function(key,value){
        if(this===localStorage&&key==='twinArcHosts'){
          try{const parsed=JSON.parse(value);if(Array.isArray(parsed)){const compact=parsed.map(h=>({...h,photo:(typeof h.photo==='string'&&h.photo.startsWith('data:'))?'':h.photo}));return nativeSetItem.call(this,key,JSON.stringify(compact));}}catch(err){console.warn('[Twin Arc] Host cache guard skipped malformed cache.',err);}
        }
        return nativeSetItem.call(this,key,value);
      };
    }
  }catch(err){console.warn('[Twin Arc] Could not install early host cache guard.',err);}

  function installCloudDelete(){
    window.deleteHost=async i=>{
      const h=hosts[i];if(!h||!confirm(`Remove ${h.stage} from Twin Arc Agency?`))return;
      if(!adminUnlocked){openAdmin();if(adminStatus)adminStatus.textContent='Owner sign-in required to delete hosts.';return;}
      const token=await getOwnerAccessToken();if(!token){openAdmin();return;}
      try{
        if(h.id){const r=await fetch(`${SUPABASE_URL}/rest/v1/hosts?id=eq.${encodeURIComponent(h.id)}`,{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,Prefer:'return=minimal'}});if(!r.ok)throw new Error(`Host delete failed (${r.status}): ${await r.text()}`);}
        hosts.splice(i,1);saveHosts();renderHosts();await loadHostsFromSupabase();
      }catch(err){console.error('[Twin Arc] Host cloud delete failed',err);alert(err.message||'Could not delete host. Please try again.');}
    };
  }

  function load(src,next){const s=document.createElement('script');s.src=src;s.onload=()=>next&&next();s.onerror=()=>console.error('[Twin Arc] Failed to load',src);document.head.appendChild(s);}

  // Independent enhancements: these cannot block the core site chain.
  load('js/page-content-editor-v2.js?v=20261101b');
  load('js/owner-page-edit-ui-fix.js?v=20261101b');
  load('js/safe-page-navigation-v2.js?v=20261101b');
  load('js/host-program-edit-position-fix.js?v=20261101a');
  load('js/host-program-showcase.js?v=20261101a');

  load('js/script-core-v11.js',()=>load('js/host-persistence-patch.js',()=>{
    installCloudDelete();
    load('js/weekly-activity-status.js',()=>load('js/cloud-events.js',()=>load('js/live-highlights.js',()=>load('js/editable-site-content.js',()=>load('js/dual-logo-controls.js')))));
  }));
})();