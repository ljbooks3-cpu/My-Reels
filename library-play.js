(()=>{
  const DB='private_reels_v3', STORE='reels';
  const getReel=id=>new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onsuccess=()=>{const db=r.result;const q=db.transaction(STORE,'readonly').objectStore(STORE).get(id);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error);};r.onerror=()=>reject(r.error)});
  const play=async id=>{
    try{
      const x=await getReel(Number(id));
      if(!x||!x.video){alert('This reel video is not available in local storage.');return;}
      const viewer=document.getElementById('viewer'),video=document.getElementById('viewerVideo');
      if(!viewer||!video)return;
      if(video._libraryUrl)URL.revokeObjectURL(video._libraryUrl);
      video._libraryUrl=URL.createObjectURL(x.video);
      video.src=video._libraryUrl;
      video.load();
      document.getElementById('viewerTitle').textContent=x.name||'Reel';
      const ig=document.getElementById('viewerIg');
      if(ig){if(x.instaId){ig.style.display='block';ig.onclick=()=>window.open('https://www.instagram.com/'+String(x.instaId).replace(/^@/,'')+'/','_blank','noopener')}else ig.style.display='none'}
      viewer.classList.add('show');
      const p=video.play(); if(p&&p.catch)p.catch(()=>{});
    }catch(e){console.error(e);alert('Could not open this reel: '+e.message)}
  };
  const bind=()=>document.querySelectorAll('#library .card').forEach(card=>{
    if(card.dataset.libraryPlayBound)return;
    const btn=card.querySelector('.open'), id=btn?.dataset.id;
    if(!id)return;
    card.dataset.libraryPlayBound='1';
    card.style.cursor='pointer';
    card.addEventListener('click',e=>{
      if(e.target.closest('.del')||e.target.closest('button.del')||e.target.closest('a'))return;
      e.preventDefault(); e.stopPropagation(); play(id);
    },true);
    card.querySelectorAll('.thumb,.cardTitle,.cardMeta').forEach(el=>el.style.cursor='pointer');
  });
  const start=()=>{bind();const root=document.getElementById('library');if(root&&!root._libraryPlayObserver){root._libraryPlayObserver=new MutationObserver(bind);root._libraryPlayObserver.observe(root,{childList:true,subtree:true)}}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();