// Twin Arc Agency — safe separate-page navigation.
(function(){
  const groups={home:['home'],about:['about'],hosts:['hosts'],performance:['performance'],program:['program'],events:['events'],highlights:['live-highlights'],join:['join']};
  const routeForId=id=>id==='live-highlights'?'highlights':groups[id]?id:null;
  function allSections(){return Array.from(document.querySelectorAll('main > section')).filter(s=>s.id);}
  function reveal(section){section.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));}
  function show(route,updateHash=true){
    if(!groups[route])route='home';
    const wanted=new Set(groups[route]);
    allSections().forEach(section=>{const on=wanted.has(section.id);section.hidden=!on;if(on)reveal(section);});
    document.body.dataset.pageRoute=route;
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(a=>{const id=(a.getAttribute('href')||'').slice(1),r=routeForId(id);a.classList.toggle('active-page-link',r===route);});
    if(updateHash){const hash=route==='highlights'?'live-highlights':route;history.replaceState(null,'',`#${hash}`);}
    window.scrollTo({top:0,left:0,behavior:'auto'});
    const nav=document.querySelector('.nav-links');if(nav)nav.classList.remove('open');const toggle=document.querySelector('.menu-toggle');if(toggle)toggle.setAttribute('aria-expanded','false');
  }
  function current(){const id=(location.hash||'#home').slice(1);return routeForId(id)||'home';}
  function click(e){const a=e.target.closest('a[href^="#"]');if(!a)return;const id=(a.getAttribute('href')||'').slice(1),route=routeForId(id);if(!route)return;e.preventDefault();show(route,true);}
  function syncInjected(){
    const route=document.body.dataset.pageRoute||current();
    const highlights=document.getElementById('live-highlights');
    if(highlights){
      const on=route==='highlights';
      highlights.hidden=!on;
      if(on)reveal(highlights);
    }
  }
  function init(){
    const style=document.createElement('style');style.id='safePageNavStyles';style.textContent=`main>section[hidden]{display:none!important}.nav-links a.active-page-link{color:#cf8cff}`;document.head.appendChild(style);
    document.addEventListener('click',click);
    window.addEventListener('hashchange',()=>show(current(),false));
    show(current(),false);
    let tries=0;const timer=setInterval(()=>{tries++;syncInjected();if(document.getElementById('live-highlights')||tries>60)clearInterval(timer);},200);
    new MutationObserver(syncInjected).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
