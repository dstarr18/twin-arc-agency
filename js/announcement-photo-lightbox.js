// Twin Arc Agency — tap announcement photos to enlarge, tap again to close.
(function(){
  function ensureLightbox(){
    let box=document.getElementById('announcementPhotoLightbox');
    if(box)return box;

    const style=document.createElement('style');
    style.id='announcementPhotoLightboxStyles';
    style.textContent=`
      .program-announcement-media img{cursor:zoom-in}
      .announcement-photo-lightbox[hidden]{display:none!important}
      .announcement-photo-lightbox{position:fixed;inset:0;z-index:260;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.88);backdrop-filter:blur(8px);cursor:zoom-out}
      .announcement-photo-lightbox img{display:block;max-width:min(94vw,1100px);max-height:90vh;width:auto;height:auto;object-fit:contain;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.65),0 0 0 1px rgba(180,120,255,.35)}
      @media(max-width:560px){.announcement-photo-lightbox{padding:10px}.announcement-photo-lightbox img{max-width:96vw;max-height:88vh;border-radius:12px}}
    `;
    document.head.appendChild(style);

    box=document.createElement('div');
    box.id='announcementPhotoLightbox';
    box.className='announcement-photo-lightbox';
    box.hidden=true;
    box.innerHTML='<img id="announcementPhotoLightboxImage" alt="Announcement preview">';
    document.body.appendChild(box);

    box.addEventListener('click',()=>closeLightbox());
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox();});
    return box;
  }

  function openLightbox(img){
    const box=ensureLightbox();
    const large=document.getElementById('announcementPhotoLightboxImage');
    large.src=img.currentSrc||img.src;
    large.alt=img.alt||'Announcement preview';
    box.hidden=false;
    document.body.style.overflow='hidden';
  }

  function closeLightbox(){
    const box=document.getElementById('announcementPhotoLightbox');
    if(!box||box.hidden)return;
    box.hidden=true;
    const large=document.getElementById('announcementPhotoLightboxImage');
    if(large)large.removeAttribute('src');
    document.body.style.overflow='';
  }

  document.addEventListener('click',e=>{
    const img=e.target.closest('.program-announcement-media img');
    if(!img)return;
    e.preventDefault();
    e.stopPropagation();
    openLightbox(img);
  });

  ensureLightbox();
})();
