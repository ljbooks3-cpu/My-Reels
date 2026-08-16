(()=>{
'use strict';
const FIX='sync-v5';
const q=id=>document.getElementById(id);
const escFix=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function fixToast(s){if(typeof toast==='function')toast(s)}
function fixProgress(done,total,text){if(typeof progress==='function')progress(done,total,text);else{const p=total?Math.round(done/total*100):0;if(q('progressBox'))q('progressBox').classList.add('show');if(q('progressBar'))q('progressBar').style.width=p+'%';if(q('progressText'))q('progressText').textContent=text+' • '+done+'/'+total+' ('+p+'%)'}}
function getHash(f){const p=f.appProperties||{};if(p.sha256)return p.sha256;const m=String(f.name||'').match(/(?:reel-|video-|cover-|__)([a-f0-9]{64})(?:\.[^.]+)?$/i);return m?m[1]:''}
async function safeDriveList(){try{return await driveList()}catch(e){if(/404|not found/i.test(e.message||'')){driveFolderId=null;localStorage.removeItem('myReelsDriveFolder');return await driveList()}throw e}}
async function setMeta(id,rec){const body={appProperties:{...(rec.appProperties||{}),sha256:rec.sha256,kind:'reel',title:String(rec.name||'Reel').slice(0,120),instaId:String(rec.instaId||''),created:String(rec.created||Date.now())},description:rec.desc||''};const r=await driveFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error('Drive metadata update failed ('+r.status+')')}
async function hashUnknownRemote(f){const b=await driveDownload(f.id,'video/mp4');return await sha(b)}
async function buildRemote(files,locals,deleted){const videos=new Map(),covers=new Map(),tombs=new Set(deleted||[]),unknown=files.filter(f=>f.mimeType?.startsWith('video/')&&!getHash(f));let step=0;for(const f of unknown){step++;fixProgress(step,Math.max(1,unknown.length),'Identifying existing Drive video '+step+'/'+unknown.length);try{const h=await hashUnknownRemote(f);await driveFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(f.id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({appProperties:{...(f.appProperties||{}),sha256:h,kind:'reel'}})});f.appProperties={...(f.appProperties||{}),sha256:h,kind:'reel'};}catch(e){console.warn('Could not identify Drive file',f.name,e)}}for(const f of files){const p=f.appProperties||{},h=getHash(f);if(p.kind==='deleted'||f.name.startsWith('deleted-')){const x=h||f.name.replace(/^deleted-/,'').replace(/\.json$/,'');if(x)tombs.add(x);continue}if(!h)continue;if(p.kind==='cover'||f.mimeType?.startsWith('image/')){if(!covers.has(h))covers.set(h,f);else await driveDelete(f.id);continue}if(f.mimeType?.startsWith('video/')||p.kind==='reel'){if(!videos.has(h))videos.set(h,[]);videos.get(h).push(f)}}return{videos,covers,tombs}}
async function fixedSync(){if(syncBusy)return fixToast('Sync is already running…');if(!accessToken){connect();return}syncBusy=true;if(q('syncBtn'))q('syncBtn').disabled=true;if(q('syncTop'))q('syncTop').disabled=true;if(q('driveStatus'))q('driveStatus').textContent='Syncing…';if(q('progressBox'))q('progressBox').classList.add('show');try{
 let local=await all();
 let localBy=new Map();
 for(const x of local){if(!x.video||!(x.video instanceof Blob)||!x.video.size){continue}if(!x.sha256)x.sha256=await sha(x.video);const old=localBy.get(x.sha256);if(!old)localBy.set(x.sha256,x);else{if(!old.instaId&&x.instaId)old.instaId=x.instaId;if(!old.desc&&x.desc)old.desc=x.desc;if(!old.cover&&x.cover)old.cover=x.cover;await put(old);await remove(x.id)}}
 local=[...localBy.values()];
 fixProgress(0,Math.max(1,local.length+1),'Reading your library');
 let files=await safeDriveList();
 const remote=await buildRemote(files,local,[]);
 const total=Math.max(1,local.length+remote.videos.size+remote.tombs.size);let done=0;
 // Deletions are authoritative. A tombstone removes local and remote copies and prevents resurrection.
 for(const h of remote.tombs){const rec=localBy.get(h);if(rec){await remove(rec.id);localBy.delete(h)}const arr=remote.videos.get(h)||[];for(const f of arr)await driveDelete(f.id);const c=remote.covers.get(h);if(c)await driveDelete(c.id);done++;fixProgress(done,total,'Applying deletions')}
 // Collapse remote duplicate videos by SHA-256.
 for(const [h,arr] of remote.videos){if(remote.tombs.has(h))continue;for(let i=1;i<arr.length;i++)await driveDelete(arr[i].id);if(arr.length>1)remote.videos.set(h,[arr[0]])}
 // Upload/update every local reel by hash. Never rely on driveFileId alone.
 for(const x of [...localBy.values()]){if(remote.tombs.has(x.sha256)){done++;continue}let arr=remote.videos.get(x.sha256)||[];let f=arr[0];if(!f){f=await driveUpload(x.video,'reel-'+x.sha256+'.mp4',x.mime||x.video.type||'video/mp4',{sha256:x.sha256,kind:'reel',title:String(x.name||'Reel').slice(0,120),instaId:String(x.instaId||''),created:String(x.created||Date.now())},x.desc||'');remote.videos.set(x.sha256,[f]);}else{try{await setMeta(f.id,x)}catch(e){console.warn('metadata update failed',e)}}x.driveFileId=f.id;let c=remote.covers.get(x.sha256);if(!c&&x.cover){c=await driveUpload(x.cover,'cover-'+x.sha256+'.jpg','image/jpeg',{sha256:x.sha256,kind:'cover'},'Thumbnail for '+(x.name||'Reel'));remote.covers.set(x.sha256,c)}if(c)x.driveCoverId=c.id;await put(x);done++;fixProgress(done,total,'Checking '+(x.name||'Reel'))}
 // Re-read Drive after uploads/deletions so the download side sees the final state.
 files=await safeDriveList();
 const fresh=await buildRemote(files,[...localBy.values()],[]);
 const current=await all();const currentHashes=new Set(current.map(x=>x.sha256));
 const newRemote=[...fresh.videos.entries()].filter(([h])=>!fresh.tombs.has(h)&&!currentHashes.has(h));
 for(let i=0;i<newRemote.length;i++){const [h,arr]=newRemote[i],f=arr[0],p=f.appProperties||{};fixProgress(i+1,Math.max(1,newRemote.length),'Downloading new reel '+(i+1)+'/'+newRemote.length);const video=await driveDownload(f.id,'video/mp4');let cover=fresh.covers.get(h);let coverBlob=cover?await driveDownload(cover.id,'image/jpeg'):await makeCover(video);await add({name:p.title||String(f.name||'Reel').replace(/^reel-/,'').replace(/\.mp4$/i,''),desc:f.description||'',instaId:p.instaId||'',video,cover:coverBlob,created:Number(p.created)||Date.now(),mime:'video/mp4',sha256:h,driveFileId:f.id,driveCoverId:cover?.id||null});}
 await render();await listRender();
 if(q('driveStatus'))q('driveStatus').textContent='Connected • Synced just now';if(q('storageStatus'))q('storageStatus').textContent='Connected';if(q('statStatus'))q('statStatus').textContent='Online';fixProgress(1,1,'Sync complete');fixToast('☁️ Sync complete — new videos downloaded, duplicates skipped');setTimeout(()=>q('progressBox')?.classList.remove('show'),1200);
 }catch(e){console.error('My Reels sync v5',e);if(q('driveStatus'))q('driveStatus').textContent='Connected • Sync error';if(q('progressText'))q('progressText').textContent='Sync failed: '+(e?.message||e);fixToast('Sync failed: '+(e?.message||e));}finally{syncBusy=false;if(q('syncBtn'))q('syncBtn').disabled=false;if(q('syncTop'))q('syncTop').disabled=false}}
function install(){if(typeof db==='undefined')return;window.MyReelsSyncV5={sync:fixedSync};if(q('syncBtn'))q('syncBtn').onclick=fixedSync;if(q('syncTop'))q('syncTop').onclick=()=>{if(typeof showScreen==='function')showScreen('settingsScreen');fixedSync()};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,50));else setTimeout(install,50);
})();