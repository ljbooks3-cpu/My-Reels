const FOLDER_ID = '1LjJocGAii6s8OzeY-OUZfuGI1pvl9x-r';
const ALLOWED_MIME_PREFIX = 'video/';

function doGet(e) {
  const action = String(e && e.parameter && e.parameter.action || 'list');
  if (action !== 'list') return json_({ok:false,error:'Unknown action'});
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFiles();
    const reels = [];
    while (files.hasNext()) {
      const file = files.next();
      if (!file.getMimeType().startsWith(ALLOWED_MIME_PREFIX)) continue;
      const description = file.getDescription() || '';
      const meta = parseMeta_(description);
      reels.push({
        id: file.getId(),
        name: meta.name || cleanName_(file.getName()),
        instagram: meta.instagram || '',
        caption: meta.caption || '',
        createdTime: file.getDateCreated().toISOString(),
        modifiedTime: file.getLastUpdated().toISOString(),
        thumbnail: 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(file.getId()) + '&sz=w900',
        video: 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(file.getId()),
        drive: file.getUrl()
      });
    }
    reels.sort((a,b) => new Date(b.createdTime) - new Date(a.createdTime));
    return json_({ok:true,updatedAt:new Date().toISOString(),count:reels.length,reels:reels});
  } catch (err) {
    return json_({ok:false,error:String(err && err.message || err)});
  }
}

function parseMeta_(description) {
  if (!description) return {};
  try {
    const marker = 'MY_REELS_META:';
    const i = description.indexOf(marker);
    if (i >= 0) return JSON.parse(description.slice(i + marker.length).trim());
  } catch (_) {}
  return {caption: description};
}

function cleanName_(name) {
  return String(name || 'Reel').replace(/\.(mp4|webm|mov|m4v)$/i, '').replace(/[_-]+/g, ' ').trim() || 'Reel';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function testList() {
  const result = doGet({parameter:{action:'list'}}).getContent();
  console.log(result);
}
