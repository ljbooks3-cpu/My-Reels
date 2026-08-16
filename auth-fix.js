(()=>{
'use strict';
// Google Identity Services can load after app.js. This wrapper makes token-client
// initialization deterministic and ensures the first authorization request uses consent.
const originalInit=()=>window.google?.accounts?.oauth2?.initTokenClient;
let wrapped=false;
function install(){
  const oauth=window.google?.accounts?.oauth2;
  if(!oauth||wrapped||typeof oauth.initTokenClient!=='function')return;
  const original=oauth.initTokenClient.bind(oauth);
  oauth.initTokenClient=function(opts){
    const userCallback=opts.callback;
    let finished=false;
    const wrappedOpts={...opts,callback:(resp)=>{finished=true;try{userCallback?.(resp)}catch(e){console.error('GIS callback error',e);}}};
    const client=original(wrappedOpts);
    const request=client.requestAccessToken.bind(client);
    client.requestAccessToken=(args={})=>{
      const a={...args};
      if(a.prompt===undefined||a.prompt==='')a.prompt='consent';
      request(a);
      setTimeout(()=>{if(!finished){console.warn('Google authorization did not return a callback');document.getElementById('driveStatus')?.replaceChildren('Google sign-in is taking too long. Please try Connect Drive again.');}},30000);
    };
    return client;
  };
  wrapped=true;
}
const timer=setInterval(()=>{install();if(wrapped)clearInterval(timer)},100);
install();
})();
