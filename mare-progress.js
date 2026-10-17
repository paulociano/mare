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
 window.MareProgress=Object.freeze({record,read});
})();
