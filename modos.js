
(() => {
const MODES={solo:{count:1,tries:6,label:'Clássico'},duo:{count:2,tries:7,label:'Dueto'},quartet:{count:4,tries:9,label:'Quarteto'}};
let mode = new URLSearchParams(location.search).get('modo') || localStorage.getItem('mare-mode') || 'solo';
if(!MODES[mode])mode='solo';
let targets=[], oldStatusTimeout, modalOpener=null, activePane=0;
const game=document.querySelector('.game'),boardEl=document.getElementById('board'),statusEl=document.getElementById('status');
const panel=document.createElement('div');
panel.className='mare-modes';
panel.setAttribute('role','group');
panel.setAttribute('aria-label','Modo de jogo');
panel.innerHTML='<button data-m="solo">Clássico<small>1 palavra</small></button><button data-m="duo">Dueto<small>2 palavras</small></button><button data-m="quartet">Quarteto<small>4 palavras</small></button>';
game.insertBefore(panel,game.querySelector('.gameheading'));
const progress=document.createElement('div');progress.className='mare-progress';progress.setAttribute('aria-live','off');game.querySelector('.gameheading').after(progress);
const quickGuide=document.createElement('div');quickGuide.className='mare-legend';quickGuide.innerHTML='<span><i class="legend-good">✓</i> Lugar certo</span><span><i class="legend-near">↔</i> Outro lugar</span><span><i class="legend-miss">×</i> Ausente</span>';game.querySelector('.mare-boards, #board').before(quickGuide);
const title=game.querySelector('.gameheading h2'),sub=game.querySelector('.gameheading p'),description=document.querySelector('.leftPanel .desc');
function targetsFor(m) {
 const index=((day%WORDS.length)+WORDS.length)%WORDS.length;
 const used=new Set(),out=[];
 const seed=m==='solo'?0:m==='duo'?7:17;
 for(let i=0;out.length<MODES[m].count&&i<WORDS.length;i++){
  const candidate=WORDS[(index+seed+i*11)%WORDS.length];
  if(!used.has(candidate)){used.add(candidate);out.push(candidate)}
 }
 return out;
}
function wonBoard(i){return state.guesses.includes(targets[i])}
function grade(guess,secret){
 const out=Array(5).fill('absent'),pool={};
 for(let i=0;i<5;i++){if(guess[i]===secret[i])out[i]='correct';else pool[secret[i]]=(pool[secret[i]]||0)+1}
 for(let i=0;i<5;i++)if(out[i]!=='correct'&&pool[guess[i]]>0){out[i]='present';pool[guess[i]]--}
 return out;
}
function setMode(m){
 delete statusEl.dataset.notice;
 mode=m;targets=targetsFor(m);
 key='mare-game-'+(m==='solo'?'':m+'-')+day;
 statsKey=m==='solo'?'mare-stats-v1':'mare-stats-'+m+'-v1';
 state={guesses:[],current:'',finished:false};stats={played:0,wins:0,streak:0,best:0};
 try {Object.assign(state,JSON.parse(localStorage.getItem(key)||'{}'));Object.assign(stats,JSON.parse(localStorage.getItem(statsKey)||'{}'))}catch(e){}
 if(!Array.isArray(state.guesses))state.guesses=[];
 state.guesses=state.guesses.filter(g=>typeof g==='string'&&/^[A-Z]{5}$/.test(g)&&DICTIONARY.has(g)).slice(0,MODES[m].tries);
 if(typeof state.current!=='string'||!/^[A-Z]{0,5}$/.test(state.current))state.current='';
 state.finished=targets.every(t=>state.guesses.includes(t))||state.guesses.length>=MODES[m].tries;
 document.querySelectorAll('.mare-modes button').forEach(b=>{const on=b.dataset.m===m;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 game.dataset.mode=m;activePane=0;
 title.textContent=m==='solo'?'Descubra a palavra':m==='duo'?'Desvende duas palavras':'Explore quatro palavras';
 sub.textContent=m==='solo'?'Cinco letras. Seis tentativas. Um oceano de possibilidades.':m==='duo'?'Dois mistérios. Sete palpites compartilhados.':'Quatro mistérios. Nove palpites compartilhados.';
 if(description)description.textContent=m==='solo'?'Uma palavra misteriosa se esconde nas profundezas. Você tem 6 tentativas para encontrá-la.':m==='duo'?'Duas palavras de cinco letras, sete tentativas compartilhadas.':'Quatro palavras de cinco letras, nove tentativas compartilhadas.';
 localStorage.setItem('mare-mode',m);
 if(state.guesses.length&&!state.finished){statusEl.dataset.notice='1';statusEl.textContent='Partida retomada: '+state.guesses.length+' palpites registrados.';clearTimeout(oldStatusTimeout);oldStatusTimeout=setTimeout(()=>{delete statusEl.dataset.notice;render()},3000)}
 if(!statusEl.dataset.notice)statusEl.textContent='';
 render();
}
render=function(){
 const focusedKey=document.activeElement?.classList?.contains('key')?document.activeElement.getAttribute('aria-label'):null;
 boardEl.className='mare-boards';boardEl.innerHTML='';progress.textContent=targets.filter((_,i)=>wonBoard(i)).length+' de '+targets.length+' palavras descobertas · '+(MODES[mode].tries-state.guesses.length)+' tentativas restantes';
 const max=MODES[mode].tries,scores={},ranks={absent:1,present:2,correct:3};
 targets.forEach((secret,i)=>{
  const done=wonBoard(i),pane=document.createElement('section');
  pane.className='mare-pane'+(done?' solved':'')+(i===activePane?' focused':'');pane.dataset.pane=String(i);
  pane.setAttribute('aria-label','Palavra '+(i+1)+(done?' resolvida':''));
  const heading=document.createElement('div');heading.className='mare-pane-head';
  heading.textContent='SONDA '+String(i+1).padStart(2,'0')+(done?'  ✓ DESCOBERTA':'  ◈ EM BUSCA');pane.append(heading);
  const grid=document.createElement('div');grid.className='mare-grid';grid.setAttribute('role','grid');grid.setAttribute('aria-label','Tentativas da palavra '+(i+1));
  for(let r=0;r<max;r++){
   const row=document.createElement('div');row.className='mare-row';row.setAttribute('role','row');
   const guess=state.guesses[r],letters=guess||(r===state.guesses.length&&!state.finished&&!done?state.current:'');
   const evaluations=guess?grade(guess,secret):[];
   for(let c=0;c<5;c++){
    const tile=document.createElement('div');tile.className='tile'+(letters[c]?' filled':'')+(evaluations[c]?' '+evaluations[c]:'');
    tile.textContent=letters[c]||'';tile.setAttribute('role','gridcell');tile.setAttribute('aria-label',letters[c]?(letters[c]+' '+(evaluations[c]||'')):'vazio');row.append(tile);
   }
   grid.append(row);
   if(guess&&(!done||r<=state.guesses.indexOf(secret))) evaluations.forEach((v,c)=>{const k=guess[c];if(!scores[k]||ranks[v]>ranks[scores[k]])scores[k]=v});
  }
  pane.append(grid);boardEl.append(pane);
 });
 keyboard.innerHTML='';
 for(const letters of ['QWERTYUIOP','ASDFGHJKL','↵ZXCVBNM⌫']){
  const row=document.createElement('div');row.className='keyrow';
  for(const letter of letters){
   const b=document.createElement('button');b.className='key'+(('↵⌫'.includes(letter))?' wide':'')+(scores[letter]?' '+scores[letter]:'');
   b.textContent=letter==='↵'?'ENTER':letter==='⌫'?'APAGAR':letter;
   b.setAttribute('aria-label',letter==='↵'?'Enviar':letter==='⌫'?'Apagar':letter);
   b.onclick=()=>type(letter);row.append(b);
  }keyboard.append(row);
 }
 if(mode==='quartet'){let picker=document.createElement('div');picker.className='mare-sonda-picker';picker.setAttribute('role','group');picker.setAttribute('aria-label','Ampliar tabuleiro');targets.forEach((_,i)=>{const b=document.createElement('button');b.textContent='Sonda '+(i+1)+(wonBoard(i)?' ✓':'');b.className=i===activePane?'chosen':'';b.setAttribute('aria-pressed',String(i===activePane));b.onclick=()=>{activePane=i;boardEl.dataset.focus=String(i);render()};picker.append(b)});boardEl.prepend(picker);boardEl.dataset.focus=String(activePane)}else boardEl.removeAttribute('data-focus');
 if(focusedKey){const next=[...keyboard.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===focusedKey);next?.focus()}
 if(!statusEl.dataset.notice)statusEl.textContent=state.finished?(targets.every((_,i)=>wonBoard(i))?'✦ Todos os tesouros encontrados!':'As palavras eram '+targets.join(', ')+'. Volte amanhã!'):state.guesses.length+'/'+max+' palpites';
};
type=function(ch){
 if(state.finished||document.getElementById('overlay').classList.contains('open'))return;
 if(ch==='⌫'||ch==='BACKSPACE')state.current=state.current.slice(0,-1);
 else if(ch==='↵'||ch==='ENTER'){
  if(state.current.length<5){message('A palavra precisa ter 5 letras');return}
  if(!DICTIONARY.has(state.current)){message('Palavra não encontrada no dicionário');return}
  state.guesses.push(state.current);state.current='';
  delete statusEl.dataset.notice;
  const victory=targets.every((_,i)=>wonBoard(i));
  if(victory||state.guesses.length>=MODES[mode].tries){
   state.finished=true;stats.played++;
   if(victory){stats.wins++;stats.streak++;stats.best=Math.max(stats.best,stats.streak)}else stats.streak=0;
   save();
   // Registro canônico: o controlador dos três modos substitui type() do Recife.
   // Persistir antes de anunciar o resultado evita conquistas fantasmas.
   window.MareProgress?.record('recife',victory?'win':'loss',key);
   render();setTimeout(()=>showResult(victory),400);return;
  }
 }else if(/^[A-Z]$/.test(ch)&&state.current.length<5)state.current+=ch;
 save();render();
};
message=function(value){
 statusEl.dataset.notice='1';statusEl.textContent=value;clearTimeout(oldStatusTimeout);
 oldStatusTimeout=setTimeout(()=>{delete statusEl.dataset.notice;if(!state.finished)render()},2700);
};
showResult=function(victory){
 const rows=targets.map((target,i)=>'SONDA '+(i+1)+': '+(wonBoard(i)?'✓':'✕')+' '+target).join('<br>');
 openModal('<div class="eyebrow">'+(victory?'✦ EXPEDIÇÃO CONCLUÍDA':'◈ FIM DA EXPEDIÇÃO')+'</div><h3>'+(victory?'Todos os tesouros encontrados!':'O mar guarda seus segredos')+'</h3><p>'+rows+'</p><p>'+state.guesses.length+' de '+MODES[mode].tries+' tentativas.</p><button class="primary" id="shareBtn">Compartilhar resultado</button>');
 document.getElementById('shareBtn').onclick=async()=>{
  const grids=targets.map((secret,i)=>'SONDA '+(i+1)+'\n'+state.guesses.map(g=>grade(g,secret).map(v=>v==='correct'?'🟩':v==='present'?'🟨':'⬛').join('')).join('\n')).join('\n\n');
  const text='MARÉ '+MODES[mode].label+' #'+(day+1)+' '+(victory?state.guesses.length:'X')+'/'+MODES[mode].tries+'\n'+grids+'\n🌊';
  try{await navigator.clipboard.writeText(text);closeModal();message('Resultado copiado!')}catch(e){prompt('Copie seu resultado:',text)}
 };
};
document.getElementById('help').onclick=()=>openModal('<div class="eyebrow">MANUAL DO EXPLORADOR</div><h3>Como jogar</h3><p><b>Clássico:</b> 1 palavra em 6 tentativas.<br><b>Dueto:</b> 2 palavras em 7 tentativas.<br><b>Quarteto:</b> 4 palavras em 9 tentativas.</p><p>Cada palpite é aplicado em todos os tabuleiros. Verde: letra na posição correta; dourado: em outra posição; azul-escuro: ausente. Os tabuleiros resolvidos permanecem visíveis.</p><button class="primary" onclick="closeModal()">Vamos mergulhar!</button>');
document.getElementById('stats').onclick=()=>openModal('<div class="eyebrow">DIÁRIO DE BORDO</div><h3>Estatísticas · '+MODES[mode].label+'</h3><div class="statgrid"><div class="stat"><b>'+stats.played+'</b><small>Jogos</small></div><div class="stat"><b>'+(stats.played?Math.round(stats.wins/stats.played*100):0)+'%</b><small>Vitórias</small></div><div class="stat"><b>'+stats.streak+'</b><small>Sequência</small></div><div class="stat"><b>'+stats.best+'</b><small>Recorde</small></div></div><p>Os modos têm estatísticas independentes.</p><button class="primary" onclick="closeModal()">Voltar</button>');
const originalOpenModal=openModal,originalCloseModal=closeModal;
openModal=function(markup){modalOpener=document.activeElement;originalOpenModal(markup);overlay.setAttribute('aria-labelledby','mare-modal-title');const heading=content.querySelector('h3');if(heading)heading.id='mare-modal-title';document.body.classList.add('modal-active')};
closeModal=function(){originalCloseModal();document.body.classList.remove('modal-active');if(modalOpener?.isConnected)modalOpener.focus();modalOpener=null};
document.getElementById('close').onclick=()=>closeModal();
overlay.addEventListener('click',e=>{if(e.target===overlay&&modalOpener){document.body.classList.remove('modal-active');modalOpener?.focus();modalOpener=null}});
overlay.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const items=[...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')].filter(el=>el.getClientRects().length);if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
panel.addEventListener('click',e=>{const button=e.target.closest('button[data-m]');if(!button||button.dataset.m===mode)return;setMode(button.dataset.m);history.replaceState(null,'',location.pathname+'?modo='+mode)});
setMode(mode);
})();
