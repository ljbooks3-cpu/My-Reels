(()=>{
'use strict';
const get=id=>document.getElementById(id);
function openCard(id){
  if(!id)return;
  if(typeof openViewer==='function'){try{openViewer(Number(id));return}catch(e){console.warn('openViewer failed',e)}}
  const req=indexedDB.open('private_reels_v3',1);
  req.onerror=()=>typeof toast==='function'&&toast('Could not open reel storage.');
  req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains('reels')){db.close();return typeof toast==='function'&&toast('Reel storage is unavailable.')}const tx=db.transaction('reels','readonly'),q=tx.objectStore('reels').get(Number(id));q.onsuccess=()=>{const x=q.result;db.close();if(!x?.video)return typeof toast==='function'&&toast('Video is not available on this device. Sync again.');const viewer=get('viewer'),video=get('viewerVideo');if(!viewer||!video)return;viewer.classList.add('show');get('viewerTitle').textContent=x.name||'Reel';video.src=URL.createObjectURL(x.video);video.load();if(x.instaId){get('viewerIg').style.display='block';get('viewerIg').onclick=()=>window.open('https://www.instagram.com/'+encodeURIComponent(String(x.instaId).replace(/^@/,''))+'/','_blank','noopener')}else get('viewerIg').style.display='none';video.play().catch(()=>{})}}
}
function bind(){const lib=get('library');if(!lib||lib.dataset.cardPlayFix==='v4')return;lib.dataset.cardPlayFix='v4';const handler=e=>{const card=e.target.closest('.card');if(!card||!lib.contains(card))return;if(e.target.closest('.del'))return;const play=card.querySelector('.open');if(play){e.preventDefault();e.stopPropagation();openCard(play.dataset.id)}};lib.addEventListener('click',handler,true);lib.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')return;handler(e)},true)}
function start(){bind();new MutationObserver(bind).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,100));else setTimeout(start,100)
})();
