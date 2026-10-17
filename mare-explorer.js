'use strict';
/* Diário de Bordo 2.0: leitura local, nenhuma vitória presumida.
   Registros de partidas só existem quando MareProgress.record persistiu o resultado. */
(()=>{
 const catalog=document.getElementById('jogos');
 if(!catalog)return;
 const registry=[
  ['Recife','recife.html',['mare-solo-','mare-duo-','mare-quartet-']],
  ['Abismo','abismo.html',['mare-semantico-']],
  ['Cardume','cardume.html',['mare-cardume-daily-','mare-cardume-free-']],
  ['Corrente','corrente.html',['mare-corrente-daily-','mare-corrente-free-']],
  ['Concha','concha.html',['mare-concha-daily-','mare-concha-free-']],
  ['Trilha','trilha.html',['mare-trilha-daily-','mare-trilha-free-']],
  ['Enigma','enigma.html',['mare-enigma-daily-','mare-enigma-free-']],
  ['Marujo','marujo.html',['mare-marujo-daily-','mare-marujo-free-','mare-marulho-daily-','mare-marulho-free-']],
  ['Náufrago','forca.html',['mare-forca-daily-','mare-forca-free-']],
  ['Sinais','criptograma.html',['mare-criptograma-daily-','mare-criptograma-free-']],
  ['Pérola','perola.html',['mare-perola-free-index']],
  ['Farol','farol.html',['mare-farol-free-index']]
 ];
 const recordedGames=[['recife','Recife'],['abismo','Abismo'],['cardume','Cardume'],['corrente','Corrente'],['concha','Concha'],['trilha','Trilha'],['enigma','Enigma'],['marujo','Marujo'],['forca','Náufrago'],['criptograma','Sinais'],['perola','Pérola'],['farol','Farol']];
 const make=(tag,className,text)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=String(text);
  return node;
 };
 let keys=[],available=true;
 try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key)keys.push(key)}}catch{available=false}
 const active=registry.filter(([name,page,prefixes])=>keys.some(key=>prefixes.some(prefix=>key.startsWith(prefix))&&(page!=='abismo.html'||/^mare-semantico-\d+$/.test(key))));
 const outcomes=typeof window!=='undefined'?window.MareProgress?.read?.()||[]:[];
 const profile=typeof window!=='undefined'?window.MareProgress?.stats?.():null;
 const missions=typeof window!=='undefined'?window.MareProgress?.missions?.():null;
 const total=profile?.rounds??0,wins=profile?.wins??0,unique=profile?.uniqueWins??0;
 const panel=make('section','mare-explorer mare-logbook');
 panel.id='diario-de-bordo';
 panel.setAttribute('aria-label','Diário de Bordo e progresso verificado');
 const intro=make('div','mare-explorer__intro');
 const eyebrow=make('span','mare-explorer__eyebrow','DIÁRIO DE BORDO / Nº 001');
 const heading=make('h2','','Sua jornada pelo oceano');
 const summary=make('p','mare-explorer__lead',available
  ?active.length+' de 12 jogos com registros neste navegador. Isso não indica vitórias.'
  :'Seu navegador não permite ler o progresso local. Todos os jogos continuam disponíveis.');
 intro.append(eyebrow,heading,summary);
 const stats=make('div','mare-logbook__stats');
 for(const [number,label,detail] of [
  [wins,'Vitórias','Resultados confirmados'],
  [total,'Partidas','Rodadas concluídas'],
  [unique+'/12','Mares vencidos','Jogos diferentes com vitória'],
  [profile?.level??1,'Nível','Seu posto de navegador']
 ]){
  const item=make('div','mare-logbook__stat');
  item.append(make('strong','mare-logbook__stat-value',number),
   make('span','mare-logbook__stat-label',label),
   make('small','mare-logbook__stat-detail',detail));
  stats.append(item);
 }
 intro.append(stats);
 const level=make('div','mare-logbook__level');
 const levelLabel=make('div','mare-logbook__level-head');
 levelLabel.append(make('strong','','Progresso de nível'),
  make('span','',profile?(profile.xp+' / '+profile.nextLevelXp+' XP'):'0 XP'));
 const levelTrack=make('div','mare-explorer__track');
 levelTrack.setAttribute('role','progressbar');levelTrack.setAttribute('aria-label','Experiência até o próximo nível');
 levelTrack.setAttribute('aria-valuemin',String(profile?(profile.level-1)*500:0));
 levelTrack.setAttribute('aria-valuemax',String(profile?.nextLevelXp??500));
 levelTrack.setAttribute('aria-valuenow',String(profile?.xp??0));
 const levelFill=make('span','mare-explorer__fill');
 levelFill.style.width=((profile?.xp??0)%500/500*100)+'%';
 levelTrack.append(levelFill);level.append(levelLabel,levelTrack);intro.append(level);
 if(total===0)intro.append(make('p','mare-logbook__empty','Sua primeira conquista começa com uma partida. Explore um dos 12 jogos para preencher este diário.'));
 const meter=make('div','mare-explorer__meter');
 const meterHead=make('div','mare-logbook__section-head');
 meterHead.append(make('span','mare-explorer__eyebrow','MAPA DA EXPLORAÇÃO'),
  make('strong','',''+active.length+' / 12 jogos visitados'));
 const line=make('div','mare-explorer__track');
 line.setAttribute('role','progressbar');line.setAttribute('aria-label','Jogos com registros de exploração');
 line.setAttribute('aria-valuemin','0');line.setAttribute('aria-valuemax','12');line.setAttribute('aria-valuenow',String(active.length));
 const fill=make('span','mare-explorer__fill');fill.style.width=(active.length/12*100)+'%';line.append(fill);
 const badges=make('div','mare-explorer__badges');
 for(const [threshold,label] of [[1,'Primeiro mergulho'],[3,'Explorador curioso'],[6,'Navegador experiente'],[12,'Oceano completo']]){
  const item=make('span','mare-explorer__badge',label);
  if(active.length>=threshold)item.classList.add('is-earned');
  item.setAttribute('aria-label',label+(active.length>=threshold?', conquistado':', ainda não conquistado'));
  badges.append(item);
 }
 const note=make('p','mare-logbook__disclaimer','Jogos visitados não contam como vitória. O painel usa apenas resultados registrados pelo jogo.');
 meter.append(line,meterHead,badges,note);
 panel.append(intro,meter);

 const bottom=make('div','mare-logbook__body');
 const achievements=make('section','mare-logbook__panel');
 achievements.setAttribute('aria-label','Conquistas por resultados verificados');
 achievements.append(make('span','mare-explorer__eyebrow','CONQUISTAS'),make('h3','','Marcos da expedição'));
 const awardGrid=make('div','mare-logbook__awards');
 for(const item of profile?.earned||[
   {name:'Primeira vitória',earned:false},
   {name:'Cinco conquistas',earned:false},
   {name:'Três mares',earned:false},
   {name:'Mestre dos doze mares',earned:false}
 ]){
  const badge=make('div','mare-logbook__award');
  if(item.earned)badge.classList.add('is-earned');
  const mark=make('span','mare-logbook__award-symbol',item.earned?'✦':'◇');
  mark.setAttribute('aria-hidden','true');
  const description=make('span','mare-logbook__award-description');
  description.append(make('strong','',item.name));
  if(item.detail)description.append(make('small','',item.detail));
  if(item.earnedAt)description.append(make('small','mare-logbook__award-date','Conquistada em '+item.earnedAt.split('-').reverse().join('/')));
  else if(Number.isFinite(item.progress)&&item.target)
   description.append(make('small','mare-logbook__award-date',item.progress+' / '+item.target));
  badge.append(mark,description);
  badge.setAttribute('aria-label',item.name+(item.earned?', conquistada':', ainda não conquistada'));
  awardGrid.append(badge);
 }
 const earnedCount=(profile?.earned||[]).filter(item=>item.earned).length;
 const collection=make('details','mare-logbook__collection');
 const toggle=make('summary','','Ver conquistas · '+earnedCount+' de '+(profile?.earned?.length||4)+' desbloqueadas');
 collection.append(toggle,awardGrid);
 achievements.append(collection);

 const missionsPanel=make('section','mare-logbook__panel');
 missionsPanel.setAttribute('aria-label','Missões diárias e semanais');
 missionsPanel.append(make('span','mare-explorer__eyebrow','ROTA DO DIA'),make('h3','','Missões em curso'));
 const missionList=make('div','mare-explorer__missions');
 for(const mission of missions||[]){
  const row=make('div','mare-explorer__mission');
  if(mission.value>=mission.target)row.classList.add('is-complete');
  const text=make('div','mare-logbook__mission-name');
  text.append(make('strong','',mission.name),make('span','',mission.detail));
  const count=make('strong','mare-logbook__mission-count',mission.value+' / '+mission.target);
  const track=make('div','mare-logbook__mission-track');
  const progress=make('span','');progress.style.width=(Math.min(1,mission.value/mission.target)*100)+'%';track.append(progress);
  row.append(text,count,track);
  missionList.append(row);
 }
 if(!missions)missionList.append(make('p','','Missões disponíveis quando o diário puder ser carregado.'));
 missionsPanel.append(missionList);
 bottom.append(achievements,missionsPanel);

 const fleet=make('section','mare-logbook__fleet');
 fleet.setAttribute('aria-label','Resultados verificados por jogo');
 const fleetHead=make('div','mare-logbook__fleet-head');
 fleetHead.append(make('div','',''));
 fleetHead.children[0].append(make('span','mare-explorer__eyebrow','MAPA DAS CONQUISTAS'),make('h3','','Seus 12 destinos'));
 fleetHead.append(make('span','mare-logbook__fleet-caption','Vitórias e rodadas realmente concluídas'));
 fleet.append(fleetHead);
 const destinations=make('div','mare-logbook__destinations');
 for(const [game,name] of recordedGames){
  const row=make('a','mare-logbook__destination');
  const page=registry.find(([label])=>label===name);
  row.href=page?.[1]||'./';
  const entries=outcomes.filter(item=>item.game===game);
  const won=entries.filter(item=>item.outcome==='win').length;
  if(won)row.classList.add('has-win');
  const sign=make('span','mare-logbook__destination-icon',won?'✦':'◌');sign.setAttribute('aria-hidden','true');
  const text=make('span','mare-logbook__destination-info');
  text.append(make('strong','',name),make('small','',entries.length
   ?entries.length+' partida'+(entries.length===1?'':'s')+' · '+won+' vitória'+(won===1?'':'s')
   :'Nenhuma partida concluída'));
  row.append(sign,text,make('span','mare-logbook__destination-arrow','↗'));
  destinations.append(row);
 }
 fleet.append(destinations);
 panel.append(bottom,fleet);

 // Share only aggregates, never storage IDs, timestamps or raw history.
 if(profile){
  const actions=make('div','mare-logbook__actions');
  const share=make('button','mare-explorer__share','Compartilhar meu progresso');
  share.type='button';
  const feedback=make('span','mare-explorer__share-feedback');
  feedback.setAttribute('role','status');
  share.addEventListener('click',async()=>{
   const text='MARÉ · Diário de Bordo\nNível '+profile.level+' · '+profile.xp+' XP\n'+profile.wins+
     ' vitórias confirmadas em '+profile.uniqueWins+' jogos.\nJogue também: https://paulociano.github.io/mare/';
   try{
    if(navigator.share){await navigator.share({title:'Meu Diário de Bordo no MARÉ',text});feedback.textContent='Compartilhamento iniciado.'}
    else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);feedback.textContent='Resumo copiado!'}
    else feedback.textContent=text;
   }catch(error){if(error?.name!=='AbortError')feedback.textContent='Não foi possível compartilhar.'}
  });
  actions.append(share,feedback);panel.append(actions);
 }
 catalog.before(panel);
})();
