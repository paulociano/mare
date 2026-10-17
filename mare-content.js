'use strict';
/* MARÉ Phase 8: explicit opt-in difficulty for free-play content only.
   Deterministic selection, no scoring inflation, no changes to daily puzzles.
   Stored game states remain keyed by the game script's original round IDs. */
(()=>{
 const KEY='mare-difficulty-v1';
 const labels={leve:'Maré calma',equilibrada:'Maré viva',intensa:'Maré funda'};
 const games={
  'abismo.html':'Abismo','cardume.html':'Cardume','corrente.html':'Corrente',
  'concha.html':'Concha','trilha.html':'Trilha','enigma.html':'Enigma',
  'marujo.html':'Marujo','forca.html':'Náufrago','criptograma.html':'Sinais',
  'perola.html':'Pérola','farol.html':'Farol'
 };
 function get(){try{const v=localStorage.getItem(KEY);return Object.hasOwn(labels,v)?v:null}catch{return null}}
 // Equal-sized quantile buckets by lexical/structural complexity; stable index
 // tie breaker. Not a claim of psychometric calibrated difficulty.
 function pick(game,scores,ordinal){
  const level=get();
  if(!level||!Array.isArray(scores)||scores.length<3||!scores.every(Number.isFinite))
   return ((ordinal%scores.length)+scores.length)%scores.length;
  const ranked=scores.map((score,index)=>({score,index}))
   .sort((a,b)=>a.score-b.score||a.index-b.index);
  const order={leve:0,equilibrada:1,intensa:2}[level];
  const from=Math.floor(order*scores.length/3);
  const to=Math.floor((order+1)*scores.length/3);
  const selection=ranked.slice(from,to).map(e=>e.index);
  return selection[((ordinal%selection.length)+selection.length)%selection.length];
 }
 const api=Object.freeze({get,pick,labels});
 if(typeof window!=='undefined')window.MareContent=api;
 function mount(){
  const page=location.pathname.split('/').pop();
  const game=games[page],main=document.querySelector('main');
  if(!game||!main)return;
  const section=document.createElement('section');
  section.className='mare-content-control';
  section.setAttribute('aria-label','Escolher intensidade das expedições livres');
  const text=document.createElement('div');
  const eyebrow=document.createElement('strong');eyebrow.textContent='CURADORIA DAS MARÉS';
  const note=document.createElement('p');
  note.textContent='Escolha o ritmo dos próximos desafios livres. O desafio diário não muda e seus resultados são preservados.';
  text.append(eyebrow,note);
  const actions=document.createElement('div');actions.className='mare-content-control__actions';
  const label=document.createElement('label');
  label.textContent='Intensidade ';
  const select=document.createElement('select');select.id='mare-intensity';
  select.setAttribute('aria-label','Intensidade do desafio livre');
  for(const [value,name] of [['','Original'],...Object.entries(labels)]){
   const option=document.createElement('option');
   option.value=value;option.textContent=name;select.append(option);
  }
  select.value=get()||'';
  label.append(select);
  const apply=document.createElement('button');apply.type='button';apply.textContent='Aplicar ao modo livre';
  const status=document.createElement('span');status.className='mare-content-control__status';status.setAttribute('role','status');
  apply.addEventListener('click',()=>{
   try{if(select.value)localStorage.setItem(KEY,select.value);else localStorage.removeItem(KEY)}
   catch{status.textContent='Preferência não pôde ser salva neste navegador.';return}
   const target=document.getElementById('free')||document.getElementById('next');
   if(target&&!target.disabled){
    target.click();
    status.textContent='Intensidade '+(labels[select.value]||'original')+' aplicada a uma expedição livre.';
   }else status.textContent='Preferência salva. Escolha uma nova expedição livre para usar.';
  });
  actions.append(label,apply,status);section.append(text,actions);
  // Keep primary game heading before supplementary configuration.
  const first=main.firstElementChild;
  if(first)first.after(section);else main.append(section);
 }
 if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
 }
})();
