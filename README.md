# My Reels

A small Google Drive powered reel library.

## Behavior

- The public page loads the current video list from the `My Reels` Google Drive folder.
- `Refresh` only reads the current list. It does not download or copy the existing videos.
- Clicking a reel uses the native browser video player with a Google Drive content URL. If the browser cannot stream that file, the viewer provides an `Open in Google Drive` fallback.
- `Upload` is the only action that asks for Google sign-in. There is no persistent login session and no sign-in gate for viewing the library.
- Upload uses Google's resumable Drive upload and puts the new video in `My Reels`.
- The Apps Script catalogue attempts to make the folder and video files view-only for link viewers, so the player can work without a repeated login.

## Google Apps Script

`apps-script/Code.gs` is the server-side catalogue used by the GitHub Pages frontend.

If the Apps Script deployment is changed, update the existing web-app deployment to the new version. GitHub Pages does not automatically publish a new Apps Script deployment version.

## Important

Google Drive is the storage and backup. This repository never contains the video files.
