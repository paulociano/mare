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
  // Free-play setting, secondary to the round: a compact disclosure placed
  // AFTER the board so it never pushes the puzzle below the fold or takes a
  // grid column that belongs to the game's own side panel.
  const section=document.createElement('details');
  section.className='mare-content-control';
  // Named region so the setting sits inside a landmark wherever it lands.
  const region=document.createElement('section');
  region.className='mare-content-region';
  region.setAttribute('aria-label','Escolher intensidade das expedições livres');
  region.append(section);
  const summary=document.createElement('summary');
  summary.className='mare-content-control__summary';
  const summaryTitle=document.createElement('strong');summaryTitle.textContent='Curadoria das marés';
  const current=document.createElement('span');current.className='mare-content-control__current';
  const describe=()=>{current.textContent='Modo livre · '+(labels[get()]||'Original')};
  describe();
  summary.append(summaryTitle,current);
  const text=document.createElement('div');text.className='mare-content-control__body';
  const note=document.createElement('p');
  note.textContent='Escolha o ritmo dos próximos desafios livres. O desafio diário não muda e seus resultados são preservados.';
  text.append(note);
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
   describe();
   const target=document.getElementById('free')||document.getElementById('new')||document.getElementById('next');
   if(target&&!target.disabled){
    target.click();
    status.textContent='Intensidade '+(labels[select.value]||'original')+' aplicada a uma expedição livre.';
   }else status.textContent='Preferência salva. Escolha uma nova expedição livre para usar.';
  });
  actions.append(label,apply,status);text.append(actions);section.append(summary,text);
  // Anchor before the "outros jogos" footer when it exists; otherwise after main.
  const footer=document.querySelector('.mare-game-nav')?.closest('footer');
  if(footer&&footer.parentElement)footer.before(region);
  else main.after(region);
 }
 if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
 }
})();
