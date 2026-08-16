(()=>{'use strict';
const CREATOR_EMAIL='ljbooks3@gmail.com';
const CLIENT_ID='94430402616-5bhfnaric11em723f6pccmct6raqga2r.apps.googleusercontent.com';
const SCOPE='openid email profile';
let oauth=null,accessToken=null;
const $=id=>document.getElementById(id);
function toast(m){const t=$('toast');if(!t)return;t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3500)}
function hide(){document.querySelectorAll('[data-creator-only],#sync,#syncTop,#connect,#logout,#settingsScreen,.store').forEach(x=>x.style.display='none')}
function show(){document.querySelectorAll('[data-creator-only],#sync,#syncTop,#connect,#logout,#settingsScreen,.store').forEach(x=>x.style.display='')}
function init(){if(oauth)return;if(!window.google?.accounts?.oauth2)throw Error('Google sign-in is still loading');oauth=google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:SCOPE,callback:r=>{if(r.error){toast(r.error_description||r.error);return}verify(r.access_token)}})}
async function verify(t){try{const r=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+t}});if(!r.ok)throw Error('Could not verify Google account');const u=await r.json();if(String(u.email||'').toLowerCase()!==CREATOR_EMAIL)throw Error('Only the creator account can use these tools.');accessToken=t;show();const b=$('creatorLogin');if(b)b.textContent='Creator • '+u.email;toast('Creator tools unlocked')}catch(e){accessToken=null;hide();toast(e.message)}}
function login(){try{init();oauth.requestAccessToken({prompt:'select_account'})}catch(e){toast(e.message)}}
window.MyReelsCreator={isCreator:()=>!!accessToken,token:()=>accessToken,login};
window.addEventListener('load',()=>{hide();let b=document.createElement('div');b.id='creatorBadge';b.style.cssText='position:fixed;right:16px;top:14px;z-index:100000';b.innerHTML='<button id="creatorLogin" class="btn">Creator Login</button>';document.body.appendChild(b);b.firstElementChild.onclick=login});
})();