'use strict';
/* Results driven exclusively by a persisted, verified round.
   Text such as "Parabéns" cannot masquerade as a won game. */
(()=>{
 if(!document.body.matches('.mar-app,.mare-recife'))return;
 const games=[
  ['recife','Recife','recife.html'],['abismo','Abismo','abismo.html'],
  ['cardume','Cardume','cardume.html'],['corrente','Corrente','corrente.html'],
  ['concha','Concha','concha.html'],['trilha','Trilha','trilha.html'],
  ['enigma','Enigma','enigma.html'],['marujo','Marujo','marujo.html'],
  ['forca','Náufrago','forca.html'],['criptograma','Sinais','criptograma.html'],
  ['perola','Pérola','perola.html'],['farol','Farol','farol.html']
 ];
 let panel;
 const el=(tag,className,txt)=>{
  const element=document.createElement(tag);
  if(className)element.className=className;
  if(txt!==undefined)element.textContent=txt;
  return element;
 };
 const make=()=>{
  const box=el('section','mare-finale');
  box.hidden=true;
  box.setAttribute('role','status');box.setAttribute('aria-live','polite');
  box.setAttribute('aria-atomic','true');box.setAttribute('aria-label','Resultado da expedição');
  const eyebrow=el('span','mare-finale__eyebrow','DIÁRIO DE BORDO');
  const summary=el('div','mare-finale__summary');
  const symbol=el('span','mare-finale__symbol','✦');symbol.setAttribute('aria-hidden','true');
  const title=el('strong','','Expedição concluída');summary.append(symbol,title);
  const description=el('p','mare-finale__detail','');
  const figures=el('p','mare-finale__stats','');
  const actions=el('div','mare-finale__actions');
  const next=el('a','','Próximo jogo ↗'),all=el('a','','Todos os jogos');
  all.href='./';actions.append(next,all);
  const close=el('button','mare-finale__close','×');
  close.type='button';close.setAttribute('aria-label','Fechar resumo da rodada');
  close.addEventListener('click',()=>{box.hidden=true;});
  box.append(eyebrow,summary,description,figures,actions,close);
  document.body.append(box);
  return {box,title,symbol,description,figures,next};
 };
 // Tempo até a virada do dia em São Paulo, que é quando os desafios diários mudam.
 function untilTomorrow(){
  try{
   const now=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
   const value=type=>Number(now.find(part=>part.type===type)?.value);
   const minutes=24*60-(value('hour')*60+value('minute'));
   if(!Number.isFinite(minutes)||minutes<=0)return '';
   const hours=Math.floor(minutes/60),rest=minutes%60;
   return hours?hours+' h'+(rest?' '+rest+' min':''):rest+' min';
  }catch{return ''}
 }
 function onFinish(event){
  const {game,outcome}=event.detail||{};
  if(!['win','loss'].includes(outcome))return;
  const idx=games.findIndex(g=>g[0]===game);
  if(idx<0)return;
  if(!panel)panel=make();
  const {box,title,symbol,description,figures,next}=panel;
  const won=outcome==='win';
  box.dataset.outcome=outcome;
  box.classList.toggle('mare-finale-win',won);
  title.textContent=won?'Tesouro encontrado!':'Expedição encerrada';
  symbol.textContent=won?'✦':'◌';
  const stats=window.MareProgress?.stats?.();
  description.textContent=won
   ?games[idx][1]+' concluído. '+(stats?(stats.wins===1?'Primeira vitória registrada no seu diário.':stats.wins+' vitórias registradas no seu diário.'):'Um novo desafio conquistado.')
   :games[idx][1]+' encerrado. O próximo mergulho pode começar quando quiser.';
  // Números deste jogo, sequência de dias e quanto falta para o próximo diário.
  const progress=window.MareProgress;
  const parts=[];
  let playedToday=new Set();
  try{
   const rounds=(progress?.read?.()||[]).filter(round=>round.game===game);
   if(rounds.length){
    const wins=rounds.filter(round=>round.outcome==='win').length;
    parts.push(wins+(wins===1?' vitória':' vitórias')+' em '+rounds.length+(rounds.length===1?' partida':' partidas')+' de '+games[idx][1]);
   }
   const streak=progress?.streak?.();
   if(streak&&streak.current>1)parts.push('sequência de '+streak.current+' dias');
   const today=progress?.dailyChallenge?.().day;
   if(today)playedToday=new Set((progress.recent?.(new Date(),20)||[]).filter(round=>round.day===today).map(round=>round.game));
   const left=untilTomorrow();
   if(left)parts.push('novo diário em '+left);
  }catch{/* O resumo continua válido sem os números. */}
  figures.textContent=parts.length?parts.join(' · ')+'.':'';
  figures.hidden=!parts.length;
  // Próximo destino: o primeiro jogo, a partir deste, ainda não jogado hoje.
  let destination=games[(idx+1)%games.length];
  for(let step=1;step<games.length;step++){
   const candidate=games[(idx+step)%games.length];
   if(!playedToday.has(candidate[0])){destination=candidate;break}
  }
  next.href=destination[2];next.textContent='Explorar '+destination[1]+' ↗';
  box.hidden=false;
 }
 window.addEventListener('mare:round-finished',onFinish);
 window.addEventListener('pagehide',()=>window.removeEventListener('mare:round-finished',onFinish),{once:true});
})();
