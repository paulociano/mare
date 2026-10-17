'use strict';
const CHALLENGES=[['OCEANO','Grande extensão de água salgada'],['CORAL','Organismo que forma recifes'],['BALEIA','Grande mamífero marinho'],['TUBARAO','Peixe predador do oceano'],['MERGULHO','Exploração debaixo da água'],['CORRENTE','Fluxo de água em movimento'],['CONCHA','Proteção calcária de moluscos'],['MARINHO','Relacionado ao mar'],['TESOURO','Riqueza escondida'],['ABISMO','Profundidade imensa'],['RECIFE','Formação marinha de corais'],['NAUFRAGIO','Acidente de embarcação'],['PLANCTON','Seres microscópicos à deriva'],['GOLFINHO','Mamífero marinho conhecido por saltos'],['ESTRELA','Astro que brilha no céu'],['CAVERNAS','Grandes cavidades naturais'],['BRISA','Vento suave que sopra no litoral'],['MANGUE','Vegetação que cresce nas margens costeiras'],['MARINHEIRO','Profissional que trabalha embarcado'],['NAVEGACAO','Ato de conduzir um barco por uma rota'],['AQUARIO','Recipiente para observar peixes'],['PESCADOR','Profissional que captura peixes'],['CARAVELA','Embarcação usada em grandes navegações'],['CANOA','Pequena embarcação movida a remo']];
const $=id=>document.getElementById(id);const date=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
let mode='daily',index=0,board=[],answer='',path=[],attempts=0,won=false,hinted=false,started=0,finishedSeconds=0,timer=null;
const basePath=Array.from({length:16},(_,i)=>{let y=Math.floor(i/4),x=i%4;return y*4+(y%2===0?x:3-x)});
function rotate(cell,turn){let y=Math.floor(cell/4),x=cell%4;for(let i=0;i<turn;i++){const oldX=x;x=3-y;y=oldX}return y*4+x}
function storageKey(){return 'mare-trilha-'+mode+'-'+(mode==='daily'?date():index)}
function save(){try{localStorage.setItem(storageKey(),JSON.stringify({attempts,won,hinted,started,finishedSeconds}))}catch{}}
function neighbors(a,b){return Math.abs(Math.floor(a/4)-Math.floor(b/4))+Math.abs(a%4-b%4)===1}
function word(){return path.map(i=>board[i]).join('')}
function render(){const grid=$('grid');const activeIndex=grid.contains(document.activeElement)?Array.from(grid.children).indexOf(document.activeElement):-1;grid.replaceChildren();board.forEach((letter,i)=>{const b=document.createElement('button');b.type='button';b.textContent=letter;b.className=(path.includes(i)?'chosen':path.length&&neighbors(path.at(-1),i)&&!path.includes(i)?'available':'');b.setAttribute('aria-label','Linha '+(Math.floor(i/4)+1)+', coluna '+(i%4+1)+', letra '+letter);b.setAttribute('aria-pressed',String(path.includes(i)));b.disabled=won;b.onclick=()=>select(i);grid.append(b)});$('formed').textContent=word()||'Selecione uma letra';$('moves').textContent=path.length+' letras no caminho';$('tries').textContent=attempts+' tentativas';$('check').disabled=won||!path.length;$('undo').disabled=won||!path.length;$('clear').disabled=won||!path.length;$('share').disabled=!won;$('length').textContent=answer.length+' letras · somente movimentos horizontais ou verticais';if(activeIndex>=0&&!won)grid.children[activeIndex]?.focus();}
function focusTile(i){const tile=$('grid').children[i];if(tile&&!tile.disabled)tile.focus()}
function select(i){if(won)return;if(path.at(-1)===i){path.pop()}else if(!path.includes(i)&&(!path.length||neighbors(path.at(-1),i))){path.push(i)}else{$('notice').textContent='Escolha uma casa vizinha, sem reutilizar letras.';return}render();focusTile(i)}
function start(kind,num){mode=kind;index=num%CHALLENGES.length;[answer]=CHALLENGES[index];const turn=hash(kind+'|'+num)%4,solution=basePath.slice(0,answer.length).map(cell=>rotate(cell,turn));board=Array(16).fill('');solution.forEach((cell,i)=>board[cell]=answer[i]);const filler='AEIORSMTCNUP';board=board.map((x,i)=>x||filler[hash(kind+'-'+num+'-'+i)%filler.length]);path=[];attempts=0;won=false;hinted=false;started=Date.now();finishedSeconds=0;try{const old=JSON.parse(localStorage.getItem(storageKey())||'{}');attempts=Number.isInteger(old.attempts)?Math.max(0,old.attempts):0;won=!!old.won;hinted=!!old.hinted;started=Number.isFinite(old.started)?old.started:Date.now();finishedSeconds=Number.isFinite(old.finishedSeconds)?old.finishedSeconds:0}catch{}$('edition').textContent=kind==='daily'?'DESAFIO DIÁRIO':'EXPEDIÇÃO LIVRE #'+(num+1);$('clue').textContent=CHALLENGES[index][1];$('daily').setAttribute('aria-pressed',String(kind==='daily'));$('free').setAttribute('aria-pressed',String(kind==='free'));$('notice').textContent=won?'Expedição concluída!':'Encontre o caminho a partir da pista.';render()}
function check(){if(won||!path.length)return;attempts++;const guess=word();if(guess===answer){won=true;finishedSeconds=Math.floor((Date.now()-started)/1000);$('notice').textContent='Palavra descoberta! '+answer+' em '+attempts+' tentativa(s).'}else{$('notice').textContent='Ainda não é a palavra da pista. Tente outra rota.';path=[]}save();if(won&&typeof window!=='undefined')window.MareProgress?.record('trilha','win',storageKey());render()}
function time(){const sec=won?finishedSeconds:Math.max(0,Math.floor((Date.now()-started)/1000));$('clock').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')}
// Keyboard navigation uses real buttons; Enter/Space keep selecting the
// currently focused tile through the existing click handler.
$('grid').setAttribute('aria-label','Grade de letras. Use as setas para navegar; Enter ou Espaço para escolher.');
$('grid').addEventListener('keydown',event=>{
 const tile=event.target.closest?.('button');
 if(!tile||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 const id=Array.from($('grid').children).indexOf(tile);
 if(id<0)return;
 const row=Math.floor(id/4),col=id%4;
 let next=id;
 if(event.key==='ArrowUp')next=Math.max(0,row-1)*4+col;
 if(event.key==='ArrowDown')next=Math.min(3,row+1)*4+col;
 if(event.key==='ArrowLeft')next=row*4+Math.max(0,col-1);
 if(event.key==='ArrowRight')next=row*4+Math.min(3,col+1);
 if(event.key==='Home')next=row*4;
 if(event.key==='End')next=row*4+3;
 event.preventDefault();focusTile(next);
});
$('check').onclick=check;$('undo').onclick=()=>{path.pop();render()};$('clear').onclick=()=>{path=[];render()};$('daily').onclick=()=>start('daily',hash(date())%(date()==='2026-10-17'?16:CHALLENGES.length));$('free').onclick=()=>{const n=(Number(localStorage.getItem('mare-trilha-next')||'-1')+1)%CHALLENGES.length;localStorage.setItem('mare-trilha-next',String(n));start('free',globalThis.MareContent?.pick('trilha',CHALLENGES.map(c=>c[0].length),n)??n)};$('hint').onclick=()=>{hinted=true;save();$('notice').textContent='Primeira letra da resposta: '+answer[0]+'.'};
$('share').onclick=async()=>{const txt='MARÉ · TRILHA '+(mode==='daily'?date():index+1)+'\nResolvido em '+$('clock').textContent+' e '+attempts+' tentativas.';try{await navigator.clipboard.writeText(txt);$('notice').textContent='Resultado copiado!'}catch{$('notice').textContent=txt}};
document.addEventListener('keydown',e=>{if(!(e.target instanceof HTMLElement)||!e.target.closest('#grid')||e.ctrlKey||e.altKey||e.metaKey)return;if(e.key==='Backspace'){e.preventDefault();$('undo').click()}});
start('daily',hash(date())%(date()==='2026-10-17'?16:CHALLENGES.length));timer=setInterval(time,1000);time();
