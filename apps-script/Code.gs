const FOLDER_NAME = 'My Reels';

function folder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  if (!it.hasNext()) throw new Error('My Reels folder not found');
  return it.next();
}

function doGet(e) {
  const callback = String(e?.parameter?.callback || '');
  const action = String(e?.parameter?.action || 'list');
  try {
    if (action !== 'list') return out_({ ok:false, error:'Unknown action' }, callback);
    const folder = folder_();

    // One folder-level read-only permission is enough for the child videos.
    // This avoids doing a permission write for every video on every refresh.
    try {
      if (folder.getSharingAccess() !== DriveApp.Access.ANYONE) {
        folder.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
      }
    } catch (_) {}

    const it = folder.getFiles();
    const reels = [];
    while (it.hasNext()) {
      const f = it.next();
      if (!String(f.getMimeType()).startsWith('video/')) continue;
      const id = f.getId();
      const meta = parse_(f.getDescription());
      reels.push({
        id: id,
        name: meta.name || clean_(f.getName()),
        instagram: meta.instagram || '',
        createdTime: f.getDateCreated().toISOString(),
        modifiedTime: f.getLastUpdated().toISOString(),
        mimeType: f.getMimeType(),
        thumbnail: 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w900',
        video: 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(id),
        drive: 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view'
      });
    }

    reels.sort((a,b) => new Date(b.createdTime) - new Date(a.createdTime));
    return out_({ ok:true, count:reels.length, updatedAt:new Date().toISOString(), reels:reels }, callback);
  } catch (err) {
    return out_({ ok:false, error:String(err?.message || err) }, callback);
  }
}

function parse_(s) {
  const marker = 'MY_REELS_META:';
  try {
    const text = String(s || '');
    const i = text.indexOf(marker);
    if (i >= 0) return JSON.parse(text.slice(i + marker.length));
  } catch (_) {}
  return {};
}

function clean_(n) {
  return String(n || 'Reel')
    .replace(/\.(mp4|webm|mov|m4v)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim() || 'Reel';
}

function out_(obj, callback) {
  const text = JSON.stringify(obj);
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + text + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(text)
    .setMimeType(ContentService.MimeType.JSON);
}
