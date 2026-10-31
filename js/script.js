// Twin Arc Preview loader: approved V11 source + cloud persistence patch.
(function(){
  // Install this BEFORE core V11 starts its first Supabase request. The host table
  // can contain large base64 photos; never let the browser cache of those photos
  // fill localStorage and break owner sessions or later Save Host actions.
  try{
    const nativeSetItem=Storage.prototype.setItem;
    if(!window.__twinArcHostCacheGuard){
      window.__twinArcHostCacheGuard=true;
      Storage.prototype.setItem=function(key,value){
        if(this===localStorage&&key==='twinArcHosts'){
          try{
            const parsed=JSON.parse(value);
            if(Array.isArray(parsed)){
              const compact=parsed.map(h=>({...h,photo:(typeof h.photo==='string'&&h.photo.startsWith('data:'))?'':h.photo}));
              return nativeSetItem.call(this,key,JSON.stringify(compact));
            }
          }catch(err){console.warn('[Twin Arc] Host cache guard skipped malformed cache.',err);}
        }
        return nativeSetItem.call(this,key,value);
      };
    }
  }catch(err){console.warn('[Twin Arc] Could not install early host cache guard.',err);}

  function load(src,next){const s=document.createElement('script');s.src=src;s.onload=()=>next&&next();s.onerror=()=>console.error('[Twin Arc] Failed to load',src);document.head.appendChild(s);}
  load('js/script-core-v11.js',()=>load('js/host-persistence-patch.js'));
})();
