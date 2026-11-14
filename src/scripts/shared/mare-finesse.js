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

/* Primeira visita a um jogo: o botão "Como jogar" ganha um destaque discreto,
   sem abrir nada sozinho nem cobrir o tabuleiro. Some ao abrir a ajuda ou na
   primeira jogada, e não volta mais naquele jogo. */
(()=>{
 if(typeof document==='undefined'||!document.body||!document.body.matches('.mar-app,.mare-recife'))return;
 const help=document.getElementById('help');
 if(!help)return;
 const page=(location.pathname.split('/').pop()||'').replace(/\.html$/,'')||'jogo';
 const KEY='mare-ajuda-vista-v1';
 const seen=()=>{try{const list=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(list)?list.filter(item=>typeof item==='string'):[]}catch{return []}};
 if(seen().includes(page))return;
 help.classList.add('mare-help-nudge');
 // O aviso fica fora do botão, que pode cortar o que transborda.
 const tip=document.createElement('span');
 tip.className='mare-help-tip';tip.id='mare-help-tip';tip.textContent='Primeira vez? Veja como jogar';
 document.body.append(tip);help.setAttribute('aria-describedby','mare-help-tip');
 const place=()=>{
  // Só a altura vem do script; na horizontal o CSS centraliza o aviso, então ele
  // nunca alarga a página, em qualquer largura ou tamanho de texto.
  tip.style.top=Math.round(help.getBoundingClientRect().bottom+10+window.scrollY)+'px';
 };
 place();window.addEventListener('resize',place);window.addEventListener('load',place,{once:true});
 const done=()=>{
  help.classList.remove('mare-help-nudge');help.removeAttribute('aria-describedby');tip.remove();window.removeEventListener('resize',place);
  try{localStorage.setItem(KEY,JSON.stringify([...new Set([...seen(),page])].slice(-24)))}catch{}
  document.removeEventListener('pointerdown',onPlay,true);document.removeEventListener('keydown',onPlay,true);
 };
 const onPlay=event=>{
  const target=event.target instanceof Element?event.target:null;
  if(!target)return;
  if(target.closest('#help')||target.closest('main button,main input,.shell button,.shell input'))done();
 };
 document.addEventListener('pointerdown',onPlay,true);
 document.addEventListener('keydown',onPlay,true);
})();
