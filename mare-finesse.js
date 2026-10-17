'use strict';
/* Phase 3: presentation-only feedback, never records gameplay outcomes.
   An explicit outcome from MareProgress is the sole victory source. */
(()=>{
 const body=document.body;
 if(!body.matches('.mar-app,.mare-recife'))return;
 const path=(location.pathname.split('/').pop()||'').replace(/\.html$/,'');
 const routes={
  recife:['status','.game'],
  abismo:['message','.panel'],
  cardume:['notice','.game'],
  corrente:['notice','.panel'],
  concha:['notice','.concha-play'],
  trilha:['notice','.trilha-panel'],
  enigma:['notice','.enigma-card'],
  marujo:['notice','.marujo-panel'],
  forca:['notice','.newgame-panel'],
  criptograma:['notice','.newgame-panel'],
  perola:['feedback','.depth-panel'],
  farol:['feedback','.depth-panel']
 };
 const config=routes[path];
 if(!config)return;
 const notice=document.getElementById(config[0]);
 const surface=document.querySelector(config[1]);
 if(!surface||!notice||typeof MutationObserver==='undefined')return;
 const hint=/\bdica\b|\brevelad[ao]\b|\bprimeira letra\b|\binício:/i;
 const retry=/\bnão\b|\berro\b|\bincorret[ao]s?\b|\bmais uma vez\b|\bfora\b|\binválid/i;
 const read=()=>{
  const message=notice.textContent?.trim()||'';
  // These are stylistic hints only, never win/loss evidence.
  if(!message){delete surface.dataset.playFeedback;return}
  if(retry.test(message))surface.dataset.playFeedback='retry';
  else if(hint.test(message))surface.dataset.playFeedback='hint';
  else if(surface.dataset.playFeedback!=='win')surface.dataset.playFeedback='neutral';
 };
 const observer=new MutationObserver(read);
 observer.observe(notice,{childList:true,characterData:true,subtree:true});
 read();
 const onOutcome=event=>{
  if(event?.detail?.game===(path==='forca'?'forca':path==='criptograma'?'criptograma':path)){
   surface.dataset.playFeedback=event.detail.outcome==='win'?'win':'retry';
  }
 };
 window.addEventListener('mare:round-finished',onOutcome);
 window.addEventListener('pagehide',()=>{observer.disconnect();window.removeEventListener('mare:round-finished',onOutcome)},{once:true});
})();
