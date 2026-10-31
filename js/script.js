// Twin Arc Preview loader: approved V11 source + cloud persistence patch.
(function(){
  function load(src,next){const s=document.createElement('script');s.src=src;s.onload=()=>next&&next();s.onerror=()=>console.error('[Twin Arc] Failed to load',src);document.head.appendChild(s);}
  load('js/script-core-v11.js',()=>load('js/host-persistence-patch.js'));
})();
