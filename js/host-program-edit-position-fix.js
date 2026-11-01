// Twin Arc Agency — keep Host Program edit control inside the text column.
(function(){
  function apply(){
    const program=document.getElementById('program');
    if(!program)return false;
    const btn=program.querySelector('[data-page-edit="program"]');
    const left=program.querySelector(':scope > div:first-child');
    if(!btn||!left)return false;
    if(!left.classList.contains('program-edit-anchor')){
      left.classList.add('program-edit-anchor');
    }
    if(btn.parentElement!==left){
      left.prepend(btn);
    }
    if(!document.getElementById('hostProgramEditPositionFixStyles')){
      const s=document.createElement('style');
      s.id='hostProgramEditPositionFixStyles';
      s.textContent=`
        #program .program-edit-anchor{position:relative}
        #program .program-edit-anchor > [data-page-edit="program"]{
          position:static !important;
          inset:auto !important;
          transform:none !important;
          margin:0 0 20px auto !important;
          width:max-content;
          max-width:100%;
        }
        @media(max-width:700px){
          #program .program-edit-anchor > [data-page-edit="program"]{
            margin:0 0 16px 0 !important;
          }
        }
      `;
      document.head.appendChild(s);
    }
    return true;
  }

  function init(){
    if(apply())return;
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(apply()||tries>50)clearInterval(timer);
    },120);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
