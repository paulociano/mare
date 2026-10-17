'use strict';
/* MARÉ / Fase 9 · social local-first
   - fragments carry only game, day and an optional self-declared win/loss;
   - the player's persisted ledger is read only, never transmitted automatically;
   - daily puzzle invitations expire at São Paulo midnight;
   - no remote rankings, names, IDs, network calls, analytics or cookies. */
(()=>{
 const GAMES=Object.freeze([
  ['recife','Recife','recife.html'],['abismo','Abismo','abismo.html'],
  ['cardume','Cardume','cardume.html'],['corrente','Corrente','corrente.html'],
  ['concha','Concha','concha.html'],['trilha','Trilha','trilha.html'],
  ['enigma','Enigma','enigma.html'],['marujo','Marujo','marujo.html'],
  ['forca','Náufrago','forca.html'],['criptograma','Sinais','criptograma.html'],
  ['perola','Pérola','perola.html'],['farol','Farol','farol.html']
 ]);
 const allowed=new Map(GAMES.map(row=>[row[0],row]));
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
 function day(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',
   year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const pick=k=>parts.find(x=>x.type===k)?.value;
  return pick('year')+'-'+pick('month')+'-'+pick('day');
 }
 function dayIndex(date){
  if(!/^\d{4}-\d\d-\d\d$/.test(date))return null;
  const [y,m,d]=date.split('-').map(Number),t=Date.UTC(y,m-1,d);
  const v=new Date(t);
  return v.getUTCFullYear()===y&&v.getUTCMonth()===m-1&&v.getUTCDate()===d
   ?Math.floor(t/86400000):null;
 }
 const CODE_RE=/^#mare9=1\.([a-z]{4,12})\.(\d{4}-\d{2}-\d{2})\.([pwl])$/;
 function parse(input){
  if(typeof input!=='string'||input.length>90)return null;
  const match=CODE_RE.exec(input);
  if(!match||!allowed.has(match[1])||dayIndex(match[2])===null)return null;
  return {game:match[1],day:match[2],claim:match[3]};
 }
 function code(game,date,claim='p'){
  if(!allowed.has(game)||dayIndex(date)===null||!['p','w','l'].includes(claim))return null;
  return '#mare9=1.'+game+'.'+date+'.'+claim;
 }
 function url(game,date,claim='p',target='index.html'){
  const fragment=code(game,date,claim);
  if(!fragment||!['index.html',...GAMES.map(x=>x[2])].includes(target))return null;
  const link=new URL(target,document.baseURI);
  link.search='';link.hash=fragment;
  return link.href;
 }
 function current(candidate,now=new Date()){return !!candidate&&candidate.day===day(now)}
 function abismoIndex(date,count){
  const number=dayIndex(date);
  return number===null||!Number.isInteger(count)||count<1?null:
   ((number*13+7)%count+count)%count;
 }
 function gameChallenge(game,hash=location.hash,now=new Date()){
  const ticket=parse(hash);
  if(!ticket||!current(ticket,now)||ticket.game!==game)return null;
  return {...ticket,index:game==='abismo'?abismoIndex(ticket.day,48):null};
 }
 function belongs(row,game,date,now=new Date()){
  if(!row||row.game!==game||!['win','loss'].includes(row.outcome)||
   typeof row.at!=='string'||typeof row.id!=='string')return false;
  const at=Date.parse(row.at);
  if(!Number.isFinite(at)||at>now.getTime()||day(new Date(at))!==date)return false;
  const key=row.id.slice(game.length+1);
  if(!row.id.startsWith(game+':'))return false;
  if(game==='recife')return /^mare-(?:game-|solo-|duo-|quartet-)/.test(key);
  if(game==='abismo')return key==='mare-semantico-challenge-'+date;
  if(['forca','perola','farol'].includes(game))return key==='daily:'+date;
  if(game==='cardume')return /^mare-cardume-daily-\d+-\d{4}-\d\d-\d\d$/.test(key)&&key.endsWith('-'+date);
  return key==='mare-'+game+'-daily-'+date;
 }
 function localOutcome(game,date,now=new Date()){
  if(!allowed.has(game)||dayIndex(date)===null)return null;
  const events=window.MareProgress?.read?.()||[];
  const items=events.filter(row=>belongs(row,game,date,now));
  return items.some(x=>x.outcome==='win')?'w':items.some(x=>x.outcome==='loss')?'l':null;
 }
 function compare(mine,claim){
  if(!['w','l'].includes(claim)||!['w','l'].includes(mine))return null;
  return mine===claim?'empate':mine==='w'?'você venceu':'amigo venceu';
 }
 const api=Object.freeze({games:GAMES,day,dayIndex,parse,code,url,current,abismoIndex,gameChallenge,belongs,localOutcome,compare});
 window.MareSocial=api;
 if(typeof document==='undefined')return;
 const el=(tag,css,txt)=>{
  const node=document.createElement(tag);
  if(css)node.className=css;
  if(txt!==undefined)node.textContent=String(txt);
  return node;
 };
 const makeButton=(label,handler)=>{
  const b=el('button','mare-social__button',label);
  b.type='button';b.addEventListener('click',handler);
  return b;
 };
 const nameOf=key=>allowed.get(key)?.[1]||'Jogo';
 const outcomeName=outcome=>outcome==='w'?'Vitória':outcome==='l'?'Partida encerrada':'Ainda não concluído';
 async function copy(value,status){
  try{
   if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
   else{
    const ta=el('textarea');ta.value=value;ta.style.position='fixed';ta.style.left='-10000px';
    document.body.append(ta);ta.select();
    if(!document.execCommand?.('copy'))throw Error('clipboard unavailable');
    ta.remove();
   }
   status.textContent='Link copiado. Envie somente para quem você escolher.';
  }catch{status.textContent='Não foi possível copiar automaticamente. Selecione o link exibido.'}
 }
 function paintCard(game,date,outcome){
  const canvas=document.createElement('canvas');
  canvas.width=1200;canvas.height=675;
  const c=canvas.getContext('2d');
  if(!c)return null;
  const gradient=c.createLinearGradient(0,0,1200,675);
  gradient.addColorStop(0,'#061b2b');gradient.addColorStop(1,'#145b60');
  c.fillStyle=gradient;c.fillRect(0,0,1200,675);
  c.strokeStyle='rgba(167,245,220,.15)';c.lineWidth=1;
  for(let x=0;x<1200;x+=80){c.beginPath();c.moveTo(x,0);c.lineTo(x,675);c.stroke()}
  for(let y=0;y<675;y+=80){c.beginPath();c.moveTo(0,y);c.lineTo(1200,y);c.stroke()}
  c.beginPath();c.arc(1060,110,185,0,Math.PI*2);c.fillStyle='rgba(133,235,202,.085)';c.fill();
  c.fillStyle='#a1f3d9';c.font='800 32px system-ui,sans-serif';c.fillText('M A R É   /   DESAFIOS',80,94);
  c.fillStyle='#ecfbf5';c.font='800 76px system-ui,sans-serif';c.fillText(nameOf(game),80,220);
  c.font='650 32px system-ui,sans-serif';c.fillText('EXPEDIÇÃO DO DIA · '+date.split('-').reverse().join('/'),80,298);
  c.fillStyle='#a1f3d9';c.font='800 54px system-ui,sans-serif';c.fillText(outcomeName(outcome),80,410);
  c.font='500 26px system-ui,sans-serif';c.fillText('Um desafio de palavras para compartilhar.',80,490);
  c.fillStyle='#d6ebe6';c.font='600 24px system-ui,sans-serif';c.fillText('paulociano.github.io/mare/',80,599);
  c.fillStyle='#f0cc89';c.font='600 18px system-ui,sans-serif';c.fillText('Resultado local · Sem ranking público',80,631);
  return canvas;
 }
 function png(canvas){
  return new Promise(resolve=>{if(!canvas)return resolve(null);canvas.toBlob(resolve,'image/png')});
 }
 function download(blob,filename){
  const href=URL.createObjectURL(blob),a=el('a');
  a.href=href;a.download=filename;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
 }
 function activityActions(game,date,claim,status,area){
  const result=localOutcome(game,date);
  const invite=url(game,date,'p');
  const share=url(game,date,result||'p');
  const link=el('input','mare-social__url');link.type='text';link.readOnly=true;
  link.setAttribute('aria-label','Link para o desafio do dia');link.value=invite;
  link.addEventListener('focus',()=>link.select());
  const copyButton=makeButton('Copiar convite',()=>copy(invite,status));
  const resultBtn=makeButton('Compartilhar meu resultado',()=>{
   if(!result){status.textContent='Conclua a edição diária deste jogo antes de compartilhar um resultado.';return}
   const text='MARÉ · '+nameOf(game)+' · '+date+'\n'+outcomeName(result)+'\n'+share+
    '\nResultado informado pelo jogador, sem validação externa.';
   if(navigator.share){
    navigator.share({title:'Resultado MARÉ · '+nameOf(game),text,url:share})
     .then(()=>{status.textContent='Compartilhamento iniciado.'})
     .catch(error=>{if(error?.name!=='AbortError')copy(share,status)});
   }else copy(text,status);
  });
  const cardBtn=makeButton('Baixar cartão PNG',async()=>{
   const card=paintCard(game,date,result);
   const file=await png(card);
   if(file){download(file,'mare-'+game+'-'+date+'.png');status.textContent='Cartão PNG gerado neste navegador.'}
   else status.textContent='O navegador não conseguiu gerar a imagem. Use o convite em texto.';
  });
  area.append(link,copyButton,resultBtn,cardBtn);
 }
 function sectionHeading(section,kicker,title,description){
  section.append(el('span','mare-social__eyebrow',kicker),el('h2','',title),el('p','',description));
 }
 function renderHub(){
  const catalog=document.getElementById('jogos');if(!catalog)return;
  const section=el('section','mare-social mare-social--hub');
  section.id='desafios-entre-amigos';section.setAttribute('aria-labelledby','mare-social-heading');
  section.append(el('span','mare-social__eyebrow','ENCONTRO DAS MARÉS'));
  const h=el('h2','','Convide alguém para mergulhar');h.id='mare-social-heading';
  section.append(h,el('p','mare-social__intro','Escolha um jogo e envie o desafio diário. Cada pessoa joga no próprio navegador, sem conta ou ranking público.'));
  const layout=el('div','mare-social__layout');
  const left=el('div','mare-social__choice');
  const label=el('label','','Escolha o jogo');
  const select=el('select','mare-social__select');select.id='mare-social-game';
  for(const [game,name] of GAMES){const option=el('option','',name);option.value=game;select.append(option)}
  label.append(select);
  const badge=el('p','mare-social__badge');
  const area=el('div','mare-social__actions');
  const notice=el('p','mare-social__status');notice.setAttribute('role','status');
  left.append(label,badge,area,notice);
  const right=el('div','mare-social__peer');
  const headline=el('h3','','Comparação entre amigos');
  const detail=el('p','','Resultados recebidos por link são declarações de quem compartilhou. O MARÉ não autentica partidas de outras pessoas.');
  const theirs=el('p','mare-social__compare');
  const yours=el('p','mare-social__compare');
  const verdict=el('p','mare-social__verdict');
  const play=el('a','mare-social__play','Jogar desafio diário ↗');
  right.append(headline,detail,theirs,yours,verdict,play);
  layout.append(left,right);section.append(layout);
  const foot=el('p','mare-social__foot','Convites válidos apenas no dia da edição, pelo horário de São Paulo. Links têm jogo, data e, se compartilhado, resultado declarado. Sem nomes, identificadores ou histórico.');
  section.append(foot);
  catalog.before(section);
  const incoming=parse(location.hash);
  if(incoming)select.value=incoming.game;
  function refresh(){
   area.replaceChildren();notice.textContent='';
   const ticket=parse(location.hash);
   const game=select.value;
   const date=day();
   badge.textContent='Edição do dia · '+date.split('-').reverse().join('/');
   if(ticket && ticket.game===game && !current(ticket)){
    theirs.textContent='Convite expirado: '+ticket.day.split('-').reverse().join('/');
    yours.textContent='O puzzle do dia já mudou.';
    verdict.textContent='Envie um novo convite para comparar a mesma edição.';
   }else{
    theirs.textContent=ticket&&ticket.game===game&&ticket.claim!=='p'
     ?'Amigo (resultado declarado): '+outcomeName(ticket.claim)
     :'Amigo: ainda não compartilhou resultado.';
    const local=localOutcome(game,date);
    yours.textContent='Você (registro local): '+outcomeName(local);
    verdict.textContent=ticket&&ticket.game===game&&current(ticket)&&compare(local,ticket.claim)
     ?'Comparação voluntária: '+compare(local,ticket.claim)+'.'
     :'Cada pessoa pode compartilhar o próprio resultado quando terminar.';
   }
   const validTicket=ticket&&ticket.game===game&&current(ticket);
   play.href=url(game,date,validTicket?ticket.claim:'p',allowed.get(game)[2]);
   activityActions(game,date,validTicket?ticket.claim:'p',notice,area);
  }
  select.addEventListener('change',refresh);
  window.addEventListener('hashchange',()=>{
   const incoming=parse(location.hash);if(incoming)select.value=incoming.game;
   refresh();
  });
  refresh();
  if(incoming)requestAnimationFrame(()=>section.scrollIntoView({block:'start'}));
  else if(location.hash.startsWith('#mare9=')){
   notice.textContent='Este convite é inválido. Escolha um jogo e crie outro link.';
  }
 }
 function renderGame(){
  const filename=location.pathname.split('/').pop()||'index.html';
  const entry=GAMES.find(x=>x[2]===filename);if(!entry)return;
  const [game,name]=entry;
  const main=document.querySelector('main')||document.body;
  const section=el('section','mare-social mare-social--game');
  section.setAttribute('aria-label','Desafio entre amigos');
  section.append(el('span','mare-social__eyebrow','DESAFIO ENTRE AMIGOS'));
  const title=el('h2','','Compartilhe esta expedição');
  const hint=el('p','mare-social__game-hint');
  const status=el('p','mare-social__status');status.setAttribute('role','status');
  const actions=el('div','mare-social__actions');
  const back=el('a','mare-social__play','Ver comparação no convés ↗');
  section.append(title,hint,actions,back,status);
  const footer=main.querySelector('footer');
  if(footer)footer.before(section);else main.append(section);
  function refresh(){
   const ticket=parse(location.hash),valid=gameChallenge(game);
   actions.replaceChildren();
   const date=day();
   if(ticket&&!valid){
    hint.textContent='O link enviado é inválido, de outro jogo ou de uma edição anterior. A partida atual continua disponível normalmente.';
   }else if(valid){
    hint.textContent='Convite para a edição de '+date.split('-').reverse().join('/')+'. Você joga a mesma edição diária; resultados recebidos são autodeclarados.';
   }else{
    hint.textContent='Convide um amigo para jogar a mesma edição diária de '+name+'. Não é necessário criar uma conta.';
   }
   const outcome=localOutcome(game,date);
   if(outcome)hint.textContent+=' Seu resultado diário está registrado: '+outcomeName(outcome)+'.';
   activityActions(game,date,valid?.claim||'p',status,actions);
   back.href=url(game,date,valid?.claim||outcome||'p');
  }
  window.addEventListener('mare:round-finished',refresh);
  window.addEventListener('hashchange',refresh);
  refresh();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
  if(document.body.classList.contains('mare-hub'))renderHub();else renderGame();
 },{once:true});
 else if(document.body.classList.contains('mare-hub'))renderHub();else renderGame();
})();
