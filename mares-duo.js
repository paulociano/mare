'use strict';
(() => {
 const type=document.body.dataset.game;
 const puzzles={
  perola:[
   {answer:'CORAL',hint:'Colônia marinha que forma recifes'},
   {answer:'BARCO',hint:'Embarcação pequena'},
   {answer:'PRAIA',hint:'Faixa de areia junto ao mar'},
   {answer:'CONCHA',hint:'Proteção calcária de moluscos'},
   {answer:'ÂNCORA',hint:'Mantém a embarcação parada'},
   {answer:'BALEIA',hint:'Grande mamífero dos oceanos'},
   {answer:'OCEANO',hint:'Extensa massa de água salgada'},
   {answer:'MARUJO',hint:'Pessoa que trabalha em um navio'},
   {answer:'TESOURO',hint:'Riqueza escondida a ser encontrada'},
   {answer:'NAVEGAR',hint:'Conduzir uma embarcação em viagem'},
   {answer:'FAROL',hint:'Estrutura luminosa que orienta os navegantes'},
   {answer:'PORTO',hint:'Lugar onde os navios atracam'},
   {answer:'ILHOTA',hint:'Pequena ilha'},
   {answer:'TIMÃO',hint:'Roda ou mecanismo usado para dirigir uma embarcação'},
   {answer:'GAIVOTA',hint:'Ave costeira de voo ágil'},
   {answer:'LITORAL',hint:'Região próxima ao mar'},
   {answer:'MARÉS',hint:'Movimentos periódicos de subida e descida do nível do mar'}
  ],
  farol:[
   {answer:'NAVEGAR É PRECISO',hint:'Expressão célebre sobre seguir viagem'},
   {answer:'ÁGUA MOLE EM PEDRA DURA',hint:'Início de um provérbio sobre persistência'},
   {answer:'DE GRÃO EM GRÃO',hint:'Início de um ditado sobre progresso'},
   {answer:'QUEM ESPERA SEMPRE ALCANÇA',hint:'Provérbio sobre paciência'},
   {answer:'A UNIÃO FAZ A FORÇA',hint:'Expressão sobre trabalhar em conjunto'},
   {answer:'DEPOIS DA TEMPESTADE VEM A BONANÇA',hint:'Expressão sobre dias melhores'},
   {answer:'O SABER NÃO OCUPA LUGAR',hint:'Ditado sobre o valor de aprender'},
   {answer:'A PRESSA É INIMIGA DA PERFEIÇÃO',hint:'Conselho para não agir precipitadamente'},
   {answer:'QUEM NÃO ARRISCA NÃO PETISCA',hint:'Ditado sobre aproveitar oportunidades'},
   {answer:'CADA COISA A SEU TEMPO',hint:'Expressão sobre respeitar o ritmo das coisas'},
   {answer:'DEVAGAR SE VAI AO LONGE',hint:'Ditado sobre perseverança'},
   {answer:'QUEM PROCURA ACHA',hint:'Ditado sobre investigação e persistência'},
   {answer:'UMA ANDORINHA SÓ NÃO FAZ VERÃO',hint:'Ditado sobre ações individuais'},
   {answer:'O SEGURO MORREU DE VELHO',hint:'Ditado sobre a importância da cautela'},
   {answer:'NEM TUDO QUE RELUZ É OURO',hint:'Aviso sobre aparências'}
  ]
 };
 if(!puzzles[type])return;
 const $=id=>document.getElementById(id);
 const bank=puzzles[type];
 const key='mare-'+type+'-free-index';
 let mode='daily',round=0,tries=0,complete=false,selected=[];
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const hash=[...day].reduce((n,ch)=>n*31+ch.charCodeAt(0),0)>>>0;
 const safeNumber=()=>{try{const raw=Number(localStorage.getItem(key));return Number.isSafeInteger(raw)&&raw>=0?raw:0}catch{return 0}};
 const save=n=>{try{localStorage.setItem(key,String(n))}catch{}};
 const shuffle=(source,seed)=>{
  const arr=source.slice();let n=(seed||1)>>>0;
  for(let i=arr.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}
  if(arr.join('|')===source.join('|')&&arr.length>1)[arr[0],arr[1]]=[arr[1],arr[0]];
  return arr;
 };
 let tiles=[];
 function message(value){$('feedback').textContent=value}
 function start(){
  const index=mode==='daily'?hash%bank.length:safeNumber()%bank.length;
  round=index;tries=0;complete=false;selected=[];
  $('edition').textContent=mode==='daily'?'DESAFIO DIÁRIO '+day:'MODO LIVRE';
  $('hint').textContent=bank[round].hint;
  $('next').hidden=mode==='daily';$('next').disabled=false;
  $('submit').disabled=false;$('undo').hidden=type!=='farol';
  $('entry').hidden=type!=='perola';$('tiles').hidden=type!=='farol';
  $('entry').value='';$('entry').disabled=false;
  $('daily').setAttribute('aria-pressed',String(mode==='daily'));
  $('free').setAttribute('aria-pressed',String(mode==='free'));
  if(type==='perola'){
   $('scramble').hidden=false;
   $('scramble').textContent=shuffle(Array.from(bank[round].answer),(hash+round+13)).join('  ');
  }else{
   $('scramble').hidden=true;
   tiles=shuffle(bank[round].answer.split(' '),hash+round+23).map((word,id)=>({word,id}));
  }
  message('Monte a resposta usando a pista.');
  render();
 }
 function render(){
  if(type!=='farol')return;
  const pool=$('tiles');pool.replaceChildren();
  const chosen=$('chosen');chosen.replaceChildren();
  for(const tile of tiles){
   const b=document.createElement('button');b.type='button';b.textContent=tile.word;
   b.className='depth-tile';b.disabled=complete||selected.includes(tile.id);
   b.setAttribute('aria-label','Adicionar '+tile.word);b.onclick=()=>{selected.push(tile.id);render()};
   pool.append(b);
  }
  for(const id of selected){
   const tile=tiles.find(x=>x.id===id);
   const b=document.createElement('button');b.type='button';b.className='depth-tile depth-picked';
   b.textContent=tile.word;b.disabled=complete;b.setAttribute('aria-label','Remover '+tile.word);
   b.onclick=()=>{selected=selected.filter(x=>x!==id);render()};chosen.append(b);
  }
 }
 function answer(){return type==='perola'?$('entry').value:selected.map(id=>tiles.find(x=>x.id===id).word).join(' ')}
 function submit(){
  if(complete)return;
  const value=normalize(answer());
  if(!value){message('Escolha ou digite uma resposta primeiro.');return}
  tries++;
  if(value===normalize(bank[round].answer)){
   complete=true;message('Você acertou! Resposta: '+bank[round].answer+'.');
  }else if(tries>=3){
   complete=true;message('Fim da rodada. Resposta: '+bank[round].answer+'.');
  }else message('Ainda não. '+(3-tries)+' tentativa(s) restante(s).');
  if(complete){$('submit').disabled=true;$('entry').disabled=true;if(mode==='free'){$('next').hidden=false;$('next').focus()}}
  render();
 }
 $('submit').addEventListener('click',submit);
 $('entry').addEventListener('keydown',e=>{if(e.key==='Enter')submit()});
 $('undo').addEventListener('click',()=>{selected.pop();render()});
 $('daily').addEventListener('click',()=>{mode='daily';start()});
 $('free').addEventListener('click',()=>{mode='free';start()});
 $('next').addEventListener('click',()=>{if(mode!=='free')return;save(safeNumber()+1);start()});
 $('help').addEventListener('click',()=>{$('instructions').hidden=!$('instructions').hidden});
 start();
})();
