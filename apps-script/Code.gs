const FOLDER_ID = '1LjJocGAii6s8OzeY-OUZfuGI1pvl9x-r';
function doGet(e) {
  const action = String(e && e.parameter && e.parameter.action || 'list');
  const callback = String(e && e.parameter && e.parameter.callback || '');
  try {
    if (action !== 'list') return output_({ok:false,error:'Unknown action'}, callback);
    const folder = DriveApp.getFolderById(FOLDER_ID), files = folder.getFiles(), reels = [];
    while (files.hasNext()) {
      const file = files.next();
      if (!String(file.getMimeType()).startsWith('video/')) continue;
      try { file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW); } catch (_) {}
      const meta = parseMeta_(file.getDescription() || ''), id = file.getId();
      reels.push({id:id,name:meta.name || cleanName_(file.getName()),instagram:meta.instagram || '',caption:meta.caption || '',createdTime:file.getDateCreated().toISOString(),modifiedTime:file.getLastUpdated().toISOString(),thumbnail:'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w900',video:'https://drive.google.com/uc?export=download&id='+encodeURIComponent(id),drive:'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/view'});
    }
    reels.sort((a,b)=>new Date(b.createdTime)-new Date(a.createdTime));
    return output_({ok:true,updatedAt:new Date().toISOString(),count:reels.length,reels:reels}, callback);
  } catch (err) { return output_({ok:false,error:String(err && err.message || err)}, callback); }
}
function parseMeta_(description) { try { const m='MY_REELS_META:', i=description.indexOf(m); if(i>=0)return JSON.parse(description.slice(i+m.length).trim()); } catch(_){} return {caption:description}; }
function cleanName_(name) { return String(name||'Reel').replace(/\.(mp4|webm|mov|m4v)$/i,'').replace(/[_-]+/g,' ').trim()||'Reel'; }
function output_(obj, callback) {
  const text = JSON.stringify(obj);
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) return ContentService.createTextOutput(callback+'('+text+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}
function testList() { console.log(doGet({parameter:{action:'list'}}).getContent()); }
