'use strict';
/* Opt-in, explicit round outcomes. No inference from UI copy or saved-game presence. */
(()=>{
 const KEY='mare-verified-results-v1',MAX=200,allowed=new Set(['forca','recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','criptograma','perola','farol']);
 function read(){try{const x=JSON.parse(localStorage.getItem(KEY));return Array.isArray(x)?x.filter(e=>e&&typeof e.id==='string'&&allowed.has(e.game)&&(e.outcome==='win'||e.outcome==='loss')).slice(-MAX):[]}catch{return []}}
 function record(game,outcome,id){
  if(!allowed.has(game)||!['win','loss'].includes(outcome)||typeof id!=='string'||!id||id.length>128)return false;
  const items=read();if(items.some(e=>e.id===game+':'+id))return false;
  items.push({id:game+':'+id,game,outcome,at:new Date().toISOString()});
  try{localStorage.setItem(KEY,JSON.stringify(items.slice(-MAX)))}catch{return false}
  return true;
 }

 function stats(){
  const rounds=read(),wins=rounds.filter(e=>e.outcome==='win'),games=new Set(wins.map(e=>e.game));
  const xp=rounds.reduce((sum,e)=>sum+(e.outcome==='win'?100:20),0);
  const level=Math.floor(xp/500)+1;
  const earned=[
   {id:'first-win',name:'Primeira vitória',earned:wins.length>=1},
   {id:'five-wins',name:'Cinco conquistas',earned:wins.length>=5},
   {id:'three-games',name:'Três mares',earned:games.size>=3},
   {id:'all-games',name:'Mestre dos doze mares',earned:games.size===12}
  ];
  return {rounds:rounds.length,wins:wins.length,uniqueWins:games.size,xp,level,nextLevelXp:level*500,earned};
 }
 function missions(now=new Date()){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const localDay=parts=>{const p=parts.split('-').map(Number);return Math.floor(Date.UTC(p[0],p[1]-1,p[2])/86400000)};
  const dayNumber=localDay(today);
  const weekStart=dayNumber-((new Date(dayNumber*86400000).getUTCDay()+6)%7);
  const rounds=read().filter(e=>typeof e.at==='string'&&!Number.isNaN(Date.parse(e.at)));
  const onDay=rounds.filter(e=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(e.at))===today);
  const thisWeek=rounds.filter(e=>{const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(e.at));return localDay(date)>=weekStart&&localDay(date)<=dayNumber});
  const distinct=new Set(thisWeek.filter(e=>e.outcome==='win').map(e=>e.game)).size;
  return [
   {id:'daily-round',name:'Mergulho do dia',detail:'Conclua 1 partida hoje',value:Math.min(1,onDay.length),target:1},
   {id:'daily-win',name:'Tesouro de hoje',detail:'Vença 1 partida hoje',value:Math.min(1,onDay.filter(e=>e.outcome==='win').length),target:1},
   {id:'weekly-rounds',name:'Rota da semana',detail:'Conclua 5 partidas nesta semana',value:Math.min(5,thisWeek.length),target:5},
   {id:'weekly-games',name:'Três destinos',detail:'Vença em 3 jogos diferentes nesta semana',value:Math.min(3,distinct),target:3}
  ];
 }
 window.MareProgress=Object.freeze({record,read,stats,missions});
})();
