(()=>{
'use strict';
const LEGACY_BUILD='drive-sync-v4';
async function patchDriveMeta(file,rec){
  const body={appProperties:{app:'my-reels',build:LEGACY_BUILD,hash:rec.hash||'',desc:rec.desc||'',instaId:rec.instaId||'',created:String(rec.created||Date.now())}};
  await driveFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
}
async function fixedSync(){
 if(syncBusy)return;
 if(!accessToken){connect();return}
 syncBusy=true;$('syncBtn').disabled=true;$('driveStatus').textContent='Reconciling Drive…';
 try{
  driveFolderId=driveFolderId||await getFolder();
  let remote=await listDrive();
  let local=await getAll();
  for(const x of local){if(!x.hash)x.hash=await hashBlob(x.video);}
  const localByHash=new Map(local.map(x=>[x.hash,x]));
  const localByNameSize=new Map();
  for(const x of local){const k=(x.name||'').trim().toLowerCase()+'|'+(x.video?.size||0);if(!localByNameSize.has(k))localByNameSize.set(k,x);}
  const used=new Set(),remoteByHash=new Map();
  for(const f of remote){
   if(f.mimeType==='application/vnd.google-apps.folder')continue;
   const ap=f.appProperties||{};let h=ap.hash||'';let match=h?localByHash.get(h):null;
   if(!match){const k=(f.name||'').trim().toLowerCase()+'|'+(Number(f.size)||0);match=localByNameSize.get(k)||null;}
   if(!match && !h){
    try{const blob=await downloadDrive(f);const calc=await hashBlob(blob);h=calc;match=localByHash.get(calc)||null;
      if(match){await patchDriveMeta(f,match);}
    }catch(err){console.warn('legacy Drive hash failed',f.name,err)}
   }
   if(match){
     if(used.has(match.hash)){try{await driveDelete(f.id)}catch(e){console.warn('duplicate delete failed',e)}continue;}
     used.add(match.hash);match.hash=match.hash||h;match.driveFileId=f.id;await putRecord(match);remoteByHash.set(match.hash,f);if(!ap.hash||ap.hash!==match.hash)await patchDriveMeta(f,match);
   }
  }
  local=await getAll();
  for(const x of local){if(!x.hash)x.hash=await hashBlob(x.video);if(x.driveFileId)continue;const existing=remoteByHash.get(x.hash);if(existing){x.driveFileId=existing.id;await putRecord(x);continue;}await uploadDrive(x);remoteByHash.set(x.hash,{id:x.driveFileId,appProperties:{hash:x.hash}});}
  await renderLibrary();await renderList();
  $('driveStatus').textContent='Connected • Drive reconciled • no duplicate uploads';toast('☁️ Sync complete — existing Drive videos were matched');
 }catch(e){console.error(e);$('driveStatus').textContent='Sync error: '+e.message;toast('Sync failed: '+e.message)}finally{syncBusy=false;$('syncBtn').disabled=false}
}
window.addEventListener('load',()=>{setTimeout(()=>{if(typeof sync==='function'){window.sync=fixedSync;$('syncBtn').onclick=fixedSync;}},0)});
})();
