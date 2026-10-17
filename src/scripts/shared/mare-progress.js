'use strict';
/* MARÉ progress, Phase 7: derive every reward from actual persisted round
   outcomes. No extra storage, remote calls, calendar check-in or phantom XP. */
(()=>{
 const KEY='mare-verified-results-v1',MAX=200;
 const registry=[
  ['recife','Recife','recife.html'],['abismo','Abismo','abismo.html'],
  ['cardume','Cardume','cardume.html'],['corrente','Corrente','corrente.html'],
  ['concha','Concha','concha.html'],['trilha','Trilha','trilha.html'],
  ['enigma','Enigma','enigma.html'],['marujo','Marujo','marujo.html'],
  ['forca','Náufrago','forca.html'],['criptograma','Sinais','criptograma.html'],
  ['perola','Pérola','perola.html'],['farol','Farol','farol.html']
 ];
 const allowed=new Set(registry.map(x=>x[0]));
 const DAY_MS=86400000;
 const dateFormat=new Intl.DateTimeFormat('en-CA',{
  timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'
 });
 // Calendar boundaries always use São Paulo, regardless of device time zone.
 function dayKey(when){
  const parts=dateFormat.formatToParts(when);
  const value=key=>parts.find(part=>part.type===key)?.value;
  return value('year')+'-'+value('month')+'-'+value('day');
 }
 function dayNumber(key){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(key))return NaN;
  const [year,month,day]=key.split('-').map(Number);
  const stamp=Date.UTC(year,month-1,day);
  const date=new Date(stamp);
  return date.getUTCFullYear()===year&&date.getUTCMonth()+1===month&&date.getUTCDate()===day
   ?Math.floor(stamp/DAY_MS):NaN;
 }
 function read(){
  try{
   const saved=JSON.parse(localStorage.getItem(KEY));
   return Array.isArray(saved)?saved.filter(item=>
    item&&typeof item.id==='string'&&allowed.has(item.game)&&['win','loss'].includes(item.outcome)
   ).slice(-MAX):[];
  }catch{return []}
 }
 function record(game,outcome,id){
  if(!allowed.has(game)||!['win','loss'].includes(outcome)||typeof id!=='string'||!id||id.length>128)return false;
  const rounds=read();
  if(rounds.some(item=>item.id===game+':'+id))return false;
  rounds.push({id:game+':'+id,game,outcome,at:new Date().toISOString()});
  try{localStorage.setItem(KEY,JSON.stringify(rounds.slice(-MAX)))}catch{return false}
  try{
   if(typeof window.dispatchEvent==='function'&&typeof CustomEvent==='function')
    window.dispatchEvent(new CustomEvent('mare:round-finished',{detail:{game,outcome}}));
  }catch{/* UI listener must not interrupt a recorded result. */}
  return true;
 }
 function dated(now=new Date()){
  const limit=now.getTime();
  return read().filter(item=>{
   const time=typeof item.at==='string'?Date.parse(item.at):NaN;
   return Number.isFinite(time)&&time<=limit&&time>=0;
  }).map(item=>({...item,time:Date.parse(item.at),day:dayKey(new Date(item.at))}))
    .sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
 }
 function days(now=new Date()){
  const current=dayNumber(dayKey(now));
  return [...new Set(dated(now).map(item=>dayNumber(item.day)))]
   .filter(n=>Number.isFinite(n)&&n<=current).sort((a,b)=>a-b);
 }
 function streak(now=new Date()){
  const today=dayNumber(dayKey(now)),numbers=days(now);
  let longest=0,length=0,previous=null;
  for(const day of numbers){
   length=previous!==null&&day===previous+1?length+1:1;
   if(length>longest)longest=length;
   previous=day;
  }
  const active=new Set(numbers);
  let cursor=active.has(today)?today:today-1;
  let current=0;
  while(active.has(cursor)){current++;cursor--}
  const thisWeek=[];
  const start=today-(new Date(today*DAY_MS).getUTCDay()+6)%7;
  for(let x=start;x<start+7;x++)thisWeek.push({day:new Date(x*DAY_MS).toISOString().slice(0,10),done:active.has(x),future:x>today});
  return {current,longest,daysActive:numbers.length,playedToday:active.has(today),
   playedYesterday:active.has(today-1),week:thisWeek};
 }
 // Same game for all players on a given calendar day. No random round
 // selections, new storage IDs or a server-controlled challenge flag.
 function featuredFor(number){return registry[((number+4)%registry.length+registry.length)%registry.length]}
 function dailyChallenge(now=new Date()){
  const key=dayKey(now),index=dayNumber(key);
  const [game,name,page]=featuredFor(index);
  const matches=dated(now).filter(item=>item.day===key&&item.game===game);
  return {day:key,game,name,page,played:matches.length,completed:matches.length>0,
   won:matches.some(item=>item.outcome==='win'),
   description:'Conclua uma partida de '+name+' hoje. Vitórias e derrotas contam como participação.',
   state:matches.length?(matches.some(item=>item.outcome==='win')?'victory':'completed'):'open'};
 }
 function achievements(now=new Date()){
  const events=dated(now),wins=events.filter(e=>e.outcome==='win');
  const wonGames=new Set(wins.map(e=>e.game));
  const streakInfo=streak(now);
  const distinctDays=[...new Set(events.map(e=>e.day))];
  const firstIndex=(list,target)=>list.length>=target?list[target-1].day:null;
  const gamesUntil=(target)=>{
   const seen=new Set();
   for(const item of wins){seen.add(item.game);if(seen.size>=target)return item.day}
   return null;
  };
  const daysUntil=(target)=>{
   const sorted=distinctDays.slice().sort();
   return sorted.length>=target?sorted[target-1]:null;
  };
  const streakUntil=(target)=>{
   let run=0,last=null;
   for(const key of distinctDays.slice().sort()){
    const day=dayNumber(key);
    run=last!==null&&day===last+1?run+1:1;
    if(run>=target)return key;
    last=day;
   }
   return null;
  };
  const dailyWins=events.filter(e=>e.game===featuredFor(dayNumber(e.day))[0]&&e.outcome==='win');
  const dailyParticipations=events.filter(e=>e.game===featuredFor(dayNumber(e.day))[0]);
  const definitions=[
   ['first-win','Primeira vitória','Vença sua primeira partida.',wins.length,1,firstIndex(wins,1)],
   ['five-wins','Cinco conquistas','Vença cinco partidas.',wins.length,5,firstIndex(wins,5)],
   ['three-games','Três mares','Vença em três jogos diferentes.',wonGames.size,3,gamesUntil(3)],
   ['all-games','Mestre dos doze mares','Vença em cada um dos 12 jogos.',wonGames.size,12,gamesUntil(12)],
   ['first-dive','Primeira expedição','Conclua uma partida, com qualquer resultado.',events.length,1,firstIndex(events,1)],
   ['ten-rounds','Dez expedições','Conclua dez partidas verificadas.',events.length,10,firstIndex(events,10)],
   ['three-days','Explorador constante','Participe em três dias diferentes.',distinctDays.length,3,daysUntil(3)],
   ['seven-days','Sete dias no mar','Participe em sete dias diferentes.',distinctDays.length,7,daysUntil(7)],
   ['three-streak','Maré de três dias','Participe em três dias seguidos.',streakInfo.longest,3,streakUntil(3)],
   ['seven-streak','Maré de sete dias','Participe em sete dias seguidos.',streakInfo.longest,7,streakUntil(7)],
   ['daily-voyage','Rota do dia','Conclua um desafio rotativo do dia.',new Set(dailyParticipations.map(e=>e.day)).size,1,
     dailyParticipations.length?dailyParticipations[0].day:null],
   ['daily-treasure','Tesouro da rota','Vença o jogo em destaque em algum dia.',new Set(dailyWins.map(e=>e.day)).size,1,
     dailyWins.length?dailyWins[0].day:null]
  ];
  return definitions.map(([id,name,detail,progress,target,earnedAt])=>
   ({id,name,detail,progress:Math.min(progress,target),target,earned:progress>=target,earnedAt}));
 }
 function stats(){
  const rounds=read(),wins=rounds.filter(e=>e.outcome==='win');
  const uniqueWins=new Set(wins.map(e=>e.game)).size;
  const xp=rounds.reduce((sum,e)=>sum+(e.outcome==='win'?100:20),0);
  const level=Math.floor(xp/500)+1;
  return {rounds:rounds.length,wins:wins.length,uniqueWins,xp,level,
   nextLevelXp:level*500,earned:achievements()};
 }
 function missions(now=new Date()){
  const today=dayKey(now),todayNumber=dayNumber(today);
  const weekStart=todayNumber-(new Date(todayNumber*DAY_MS).getUTCDay()+6)%7;
  const events=dated(now),onDay=events.filter(e=>e.day===today);
  const thisWeek=events.filter(e=>dayNumber(e.day)>=weekStart);
  const distinct=new Set(thisWeek.filter(e=>e.outcome==='win').map(e=>e.game)).size;
  return [
   {id:'daily-round',name:'Mergulho do dia',detail:'Conclua 1 partida hoje',value:Math.min(1,onDay.length),target:1},
   {id:'daily-win',name:'Tesouro de hoje',detail:'Vença 1 partida hoje',value:Math.min(1,onDay.filter(e=>e.outcome==='win').length),target:1},
   {id:'weekly-rounds',name:'Rota da semana',detail:'Conclua 5 partidas nesta semana',value:Math.min(5,thisWeek.length),target:5},
   {id:'weekly-games',name:'Três destinos',detail:'Vença em 3 jogos diferentes nesta semana',value:Math.min(3,distinct),target:3}
  ];
 }
 function recent(now=new Date(),limit=6){
  return dated(now).slice(-Math.min(20,Math.max(0,Math.floor(limit)))).reverse()
   .map(item=>({game:item.game,name:registry.find(x=>x[0]===item.game)?.[1]||'Jogo',
    outcome:item.outcome,day:item.day}));
 }
 window.MareProgress=Object.freeze({record,read,stats,missions,streak,dailyChallenge,achievements,recent});
})();
