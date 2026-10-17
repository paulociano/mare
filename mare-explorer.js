'use strict';
/* Read-only exploration overview. Never interpret a saved round as a win. */
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
 let keys=[];let available=true;
 try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key)keys.push(key)}}catch{available=false}
 const active=registry.filter(([name,page,prefixes])=>keys.some(key=>prefixes.some(prefix=>key.startsWith(prefix))&&(page!=='abismo.html'||/^mare-semantico-\d+$/.test(key))));
 const panel=document.createElement('section');panel.className='mare-explorer';panel.setAttribute('aria-label','Meu progresso de exploração');
 const intro=document.createElement('div');intro.className='mare-explorer__intro';
 const eyebrow=document.createElement('span');eyebrow.className='mare-explorer__eyebrow';eyebrow.textContent='DIÁRIO DE BORDO';
 const heading=document.createElement('h2');heading.textContent='Sua exploração';
 const summary=document.createElement('p');
 summary.textContent=available?active.length+' de 12 jogos com registros neste navegador. Isso não indica vitórias.':'Seu navegador não permite ler o progresso local. Todos os jogos continuam disponíveis.';
 intro.append(eyebrow,heading,summary);
 const meter=document.createElement('div');meter.className='mare-explorer__meter';
 const line=document.createElement('div');line.className='mare-explorer__track';line.setAttribute('role','progressbar');
 line.setAttribute('aria-label','Jogos com registros de exploração');
 line.setAttribute('aria-valuemin','0');line.setAttribute('aria-valuemax','12');line.setAttribute('aria-valuenow',String(active.length));
 const fill=document.createElement('span');fill.className='mare-explorer__fill';fill.style.width=(active.length/12*100)+'%';line.append(fill);
 const badges=document.createElement('div');badges.className='mare-explorer__badges';
 for(const [threshold,label] of [[1,'Primeiro mergulho'],[3,'Explorador curioso'],[6,'Navegador experiente'],[12,'Oceano completo']]){
  const item=document.createElement('span');item.className='mare-explorer__badge';item.textContent=label;
  if(active.length>=threshold)item.classList.add('is-earned');
  item.setAttribute('aria-label',label+(active.length>=threshold?', conquistado':', ainda não conquistado'));badges.append(item);
 }
 meter.append(line,badges);panel.append(intro,meter);
 // Place immediately before the catalog, independently of optional recommendation widgets.
 catalog.before(panel);
})();
