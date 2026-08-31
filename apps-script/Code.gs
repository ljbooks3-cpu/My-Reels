const FOLDER_NAME = 'My Reels';

function findFolder_() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (!folders.hasNext()) throw new Error('My Reels folder not found.');
  return folders.next();
}

function doGet(e) {
  const action = String(e?.parameter?.action || 'list');
  const callback = String(e?.parameter?.callback || '');
  try {
    if (action !== 'list') return output_({ok:false,error:'Unknown action'}, callback);
    const folder = findFolder_();
    const files = folder.getFiles();
    const reels = [];
    while (files.hasNext()) {
      const file = files.next();
      if (!String(file.getMimeType()).startsWith('video/')) continue;
      const id = file.getId();
      try { file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW); } catch (_) {}
      const meta = parseMeta_(file.getDescription() || '');
      reels.push({
        id,
        name: meta.name || cleanName_(file.getName()),
        instagram: meta.instagram || '',
        caption: meta.caption || '',
        createdTime: file.getDateCreated().toISOString(),
        modifiedTime: file.getLastUpdated().toISOString(),
        thumbnail: 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w900',
        video: 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(id),
        drive: 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view'
      });
    }
    reels.sort((a,b)=>new Date(b.createdTime)-new Date(a.createdTime));
    return output_({ok:true,updatedAt:new Date().toISOString(),count:reels.length,reels}, callback);
  } catch (err) {
    return output_({ok:false,error:String(err?.message || err)}, callback);
  }
}

function parseMeta_(description) {
  try {
    const marker='MY_REELS_META:';
    const i=description.indexOf(marker);
    if(i>=0) return JSON.parse(description.slice(i+marker.length).trim());
  } catch (_) {}
  return {caption:description};
}

function cleanName_(name) {
  return String(name || 'Reel').replace(/\.(mp4|webm|mov|m4v)$/i,'').replace(/[_-]+/g,' ').trim() || 'Reel';
}

function output_(obj, callback) {
  const text=JSON.stringify(obj);
  if(callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback+'('+text+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}
