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
  const actions=el('div','mare-finale__actions');
  const next=el('a','','Próximo jogo ↗'),all=el('a','','Todos os jogos');
  all.href='./';actions.append(next,all);
  const close=el('button','mare-finale__close','×');
  close.type='button';close.setAttribute('aria-label','Fechar resumo da rodada');
  close.addEventListener('click',()=>{box.hidden=true;});
  box.append(eyebrow,summary,description,actions,close);
  document.body.append(box);
  return {box,title,symbol,description,next};
 };
 function onFinish(event){
  const {game,outcome}=event.detail||{};
  if(!['win','loss'].includes(outcome))return;
  const idx=games.findIndex(g=>g[0]===game);
  if(idx<0)return;
  if(!panel)panel=make();
  const {box,title,symbol,description,next}=panel;
  const won=outcome==='win';
  box.dataset.outcome=outcome;
  box.classList.toggle('mare-finale-win',won);
  title.textContent=won?'Tesouro encontrado!':'Expedição encerrada';
  symbol.textContent=won?'✦':'◌';
  const stats=window.MareProgress?.stats?.();
  description.textContent=won
   ?games[idx][1]+' concluído. '+(stats?stats.wins+' vitórias verificadas no seu diário.':'Um novo desafio conquistado.')
   :games[idx][1]+' encerrado. O próximo mergulho pode começar quando quiser.';
  const destination=games[(idx+1)%games.length];
  next.href=destination[2];next.textContent='Explorar '+destination[1]+' ↗';
  box.hidden=false;
 }
 window.addEventListener('mare:round-finished',onFinish);
 window.addEventListener('pagehide',()=>window.removeEventListener('mare:round-finished',onFinish),{once:true});
})();
