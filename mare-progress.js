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
 window.MareProgress=Object.freeze({record,read,stats});
})();
