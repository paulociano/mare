'use strict';
(()=> {
const puzzles=[['OCEANO','Natureza'],['CORAL','Vida marinha'],['BARCO','Navegação'],['MARUJO','Navegação'],['BALEIA','Vida marinha'],['ANCHOVA','Vida marinha'],['TESOURO','Aventura'],['FAROL','Navegação'],['AREIA','Praia'],['LAGUNA','Natureza'],['TUBARAO','Vida marinha'],['PORTO','Navegação'],['CONCHA','Praia'],['NAVIO','Navegação'],['MERGULHO','Aventura'],['GOLFINHO','Vida marinha'],['ESTRELA','Natureza'],['COSTEIRA','Natureza'],['AGUA','Natureza'],['ILHOTA','Natureza'],['ARQUIPELAGO','Geografia'],['ESTUARIO','Natureza'],['ENSEADA','Geografia'],['CORRENTEZA','Natureza'],['MARINHEIRO','Navegação'],['CARAVELA','Navegação'],['TIMONEIRO','Navegação'],['CONVES','Navegação'],['LITORAL','Geografia'],['PENINSULA','Geografia'],['RECIFE','Vida marinha'],['CACHALOTE','Vida marinha'],['ANEMONA','Vida marinha'],['PLANCTON','Vida marinha'],['NAUTILO','Vida marinha'],['AMARRA','Navegação'],['GAIVOTA','Vida marinha'],['CANOA','Navegação'],['BUSAULA','Navegação'],['BARRAGEM','Geografia']];
const $=id=>document.getElementById(id);
const date=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const today=date(),day=Math.floor((Date.parse(today+'T12:00:00Z')-Date.UTC(2025,0,1))/86400000);
let mode='daily',seed=day,round=0,state;
const answer=()=>puzzles[((seed%puzzles.length)+puzzles.length)%puzzles.length];
const key=()=> 'mare-forca-'+mode+'-'+(mode==='daily'?today:round);
function save(){try{state.seed=seed;localStorage.setItem(key(),JSON.stringify(state))}catch{}}
function load(){try{const s=JSON.parse(localStorage.getItem(key()));if(s&&Array.isArray(s.used)&&s.used.length<=26&&s.used.every(l=>typeof l==='string'&&/^[A-Z]$/.test(l))&&new Set(s.used).size===s.used.length&&typeof s.won==='boolean'&&typeof s.lost==='boolean'&&Number.isInteger(s.misses)&&s.misses>=0&&s.misses<=6)return s}catch{}return {used:[],misses:0,won:false,lost:false}}
function begin(){state=load();if(mode==='free'&&Number.isInteger(state.seed)&&state.seed>=0)seed=state.seed;render()}
function newRound(){mode='free';round++;seed=day+round*7+3;state={used:[],misses:0,won:false,lost:false};try{localStorage.setItem('mare-forca-free-round',String(round))}catch{}save();render()}
function guess(letter,asHint=false){if(state.won||state.lost||state.used.includes(letter))return;const word=answer()[0];state.used.push(letter);if(!word.includes(letter)||asHint)state.misses++;state.won=[...word].every(x=>state.used.includes(x));state.lost=state.misses>=6&&!state.won;save();if((state.won||state.lost)&&typeof window!=='undefined')window.MareProgress?.record('forca',state.won?'win':'loss',mode+':'+(mode==='daily'?today:round));render()}
function render(){let [word,category]=answer();$('category').textContent='TEMA · '+category;$('edition').textContent=mode==='daily'?'DESAFIO DIÁRIO':'JOGO LIVRE';$('remaining').textContent=Math.max(0,6-state.misses)+' erros disponíveis';
$('daily').setAttribute('aria-pressed',String(mode==='daily'));$('free').setAttribute('aria-pressed',String(mode==='free'));
$('word').replaceChildren(...[...word].map(c=>{let el=document.createElement('span');el.className='forca-slot';el.textContent=state.used.includes(c)||state.lost?c:'_';el.setAttribute('aria-label',state.used.includes(c)||state.lost?c:'Letra oculta');return el}));
document.querySelectorAll('[data-part]').forEach(p=>p.style.visibility=Number(p.dataset.part)<=state.misses?'visible':'hidden');document.querySelector?.('.wreck-illustration')?.setAttribute('aria-label','Naufrágio: '+state.misses+' de 6 partes reveladas');
$('keyboard').replaceChildren(...[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l=>{let b=document.createElement('button');b.textContent=l;b.type='button';b.disabled=state.used.includes(l)||state.won||state.lost;b.setAttribute('aria-label','Tentar letra '+l);b.setAttribute('aria-pressed',String(state.used.includes(l)));b.addEventListener('click',()=>guess(l));return b}));
$('notice').textContent=state.won?'Você venceu! Palavra: '+word:state.lost?'Fim de jogo. A palavra era '+word+'.':'Selecione uma letra para descobrir a palavra.';
$('hint').disabled=state.won||state.lost;$('share').disabled=!(state.won||state.lost)}
$('daily').onclick=()=>{mode='daily';seed=day;begin()};$('free').onclick=()=>{mode='free';seed=day+round*7+3;begin()};$('next').onclick=newRound;
$('hint').onclick=()=>{let missing=[...new Set([...answer()[0]].filter(x=>!state.used.includes(x)))];if(missing.length)guess(missing[0],true)};
$('share').onclick=async()=>{let s='MARÉ · Náufrago '+(state.won?'✓':'×')+' '+state.used.length+' letras';try{await navigator.clipboard.writeText(s);$('notice').textContent='Resultado copiado!'}catch{$('notice').textContent=s}};
document.addEventListener('keydown',e=>{if($('rules').open||e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA/.test(document.activeElement?.tagName||''))return;let l=e.key.toUpperCase();if(/^[A-Z]$/.test(l))guess(l)});
$('help').onclick=()=>$('rules').showModal();$('close').onclick=$('gotit').onclick=()=>$('rules').close();
try{round=Math.max(0,Math.min(100000,Number(localStorage.getItem('mare-forca-free-round'))||0))}catch{}begin();
})();
