(()=>{
'use strict';
const get=id=>document.getElementById(id);
function fallbackOpen(id){
  const req=indexedDB.open('private_reels_v3',1);
  req.onerror=()=>window.toast?.('Could not open reel storage.');
  req.onsuccess=()=>{
    const db=req.result;
    if(!db.objectStoreNames.contains('reels')){db.close();return window.toast?.('Reel storage is unavailable.')}
    const q=db.transaction('reels','readonly').objectStore('reels').get(Number(id));
    q.onsuccess=()=>{
      const x=q.result; db.close();
      if(!x?.video)return window.toast?.('Video is not available on this device.');
      const viewer=get('viewer'),video=get('viewerVideo');
      if(!viewer||!video)return window.toast?.('Video viewer is unavailable.');
      viewer.classList.add('show');
      get('viewerTitle').textContent=x.name||'Reel';
      const url=URL.createObjectURL(x.video); video.src=url; video.load();
      if(x.instaId){const b=get('viewerIg');b.style.display='block';b.onclick=()=>window.open('https://www.instagram.com/'+encodeURIComponent(String(x.instaId).replace(/^@/,''))+'/','_blank','noopener')}else get('viewerIg').style.display='none';
    };
  };
}
function play(id){
  if(!id)return;
  if(typeof window.openViewer==='function'){
    try{window.openViewer(Number(id));return}catch(e){console.warn('openViewer failed',e)}
  }
  fallbackOpen(id);
}
function bindCards(){
  const lib=get('library');
  if(!lib)return;
  lib.querySelectorAll('.card').forEach(card=>{
    if(card.dataset.playBound==='v5')return;
    const btn=card.querySelector('.open');
    if(!btn)return;
    const id=btn.dataset.id;
    card.dataset.playBound='v5';
    card.style.cursor='pointer';
    card.addEventListener('click',e=>{
      if(e.target.closest('.del'))return;
      e.preventDefault();e.stopPropagation();play(id);
    });
    card.addEventListener('touchend',e=>{
      if(e.target.closest('.del'))return;
      e.preventDefault();play(id);
    },{passive:false});
  });
}
function start(){
  bindCards();
  new MutationObserver(()=>bindCards()).observe(document.body,{childList:true,subtree:true});
  setInterval(bindCards,1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,500));else setTimeout(start,500);
})();
