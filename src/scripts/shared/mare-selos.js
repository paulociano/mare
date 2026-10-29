'use strict';
/* MARÉ · Selos do Mar
   Colecionáveis derivados somente de vitórias verificadas por MareProgress.
   - 12 selos de jogo com 3 níveis (Espuma 1, Onda 5, Grande Onda 15 vitórias);
   - 3 selos especiais ligados a conquistas que já existem no diário;
   - o diário guarda só as últimas 200 rodadas, então o maior nível já conquistado
     fica em 'mare-selos-v1' e nunca diminui;
   - compartilhamento por fragmento '#mare10=1.<15 dígitos>', autodeclarado:
     sem nomes, IDs, histórico, rede, cookies ou ranking público. */
(()=>{
 const GAMES=Object.freeze([
  ['recife','Recife','RE','recife.html'],['abismo','Abismo','AB','abismo.html'],
  ['cardume','Cardume','CA','cardume.html'],['corrente','Corrente','CO','corrente.html'],
  ['concha','Concha','CH','concha.html'],['trilha','Trilha','TR','trilha.html'],
  ['enigma','Enigma','EN','enigma.html'],['marujo','Marujo','MA','marujo.html'],
  ['forca','Náufrago','NA','forca.html'],['criptograma','Sinais','SI','criptograma.html'],
  ['perola','Pérola','PE','perola.html'],['farol','Farol','FA','farol.html']
 ].map(row=>Object.freeze(row)));
 const LEVELS=Object.freeze([
  Object.freeze({n:1,name:'Espuma',wins:1}),
  Object.freeze({n:2,name:'Onda',wins:5}),
  Object.freeze({n:3,name:'Grande Onda',wins:15})
 ]);
 const SPECIALS=Object.freeze([
  Object.freeze({id:'daily-treasure',name:'Tesouro da rota',detail:'Vença o jogo em destaque do dia.'}),
  Object.freeze({id:'seven-streak',name:'Maré de sete dias',detail:'Participe em sete dias seguidos.'}),
  Object.freeze({id:'all-games',name:'Mestre dos doze mares',detail:'Vença em cada um dos 12 jogos.'})
 ]);
 const KEY='mare-selos-v1';
 const MAX_POINTS=GAMES.length*LEVELS.length+SPECIALS.length;
 const gameIds=new Set(GAMES.map(g=>g[0]));
 const specialIds=new Set(SPECIALS.map(s=>s.id));
 const dateFormat=new Intl.DateTimeFormat('en-CA',{
  timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'
 });
 function dayKey(when){
  const parts=dateFormat.formatToParts(when);
  const pick=k=>parts.find(p=>p.type===k)?.value;
  return pick('year')+'-'+pick('month')+'-'+pick('day');
 }
 function empty(){
  const games={},specials={};
  for(const g of GAMES)games[g[0]]=0;
  for(const s of SPECIALS)specials[s.id]=false;
  return {games,specials,dates:{}};
 }
 const validDateKey=k=>specialIds.has(k)||/^([a-z]+):([123])$/.test(k)&&gameIds.has(k.split(':')[0]);
 /* Pure: rounds + earned achievements in, collection out. */
 function derive(rounds,earned,now=new Date()){
  const out=empty();
  const limit=now.getTime();
  const wins=new Map(GAMES.map(g=>[g[0],[]]));
  const list=(Array.isArray(rounds)?rounds:[]).filter(r=>{
   if(!r||r.outcome!=='win'||!wins.has(r.game)||typeof r.at!=='string')return false;
   const t=Date.parse(r.at);
   return Number.isFinite(t)&&t>=0&&t<=limit;
  }).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  for(const r of list)wins.get(r.game).push(dayKey(new Date(r.at)));
  for(const [game] of GAMES){
   const days=wins.get(game);
   for(const level of LEVELS)if(days.length>=level.wins){
    out.games[game]=level.n;out.dates[game+':'+level.n]=days[level.wins-1];
   }
  }
  for(const s of SPECIALS){
   const found=(Array.isArray(earned)?earned:[]).find(x=>x&&x.id===s.id);
   if(found){out.specials[s.id]=true;if(typeof found.earnedAt==='string'&&/^\d{4}-\d\d-\d\d$/.test(found.earnedAt))out.dates[s.id]=found.earnedAt}
  }
  return out;
 }
 function merge(stored,derived,today){
  const out=empty();
  for(const [game] of GAMES){
   out.games[game]=Math.max(stored.games[game],derived.games[game]);
   for(let n=1;n<=out.games[game];n++){
    const key=game+':'+n;
    out.dates[key]=stored.dates[key]||derived.dates[key]||today;
   }
  }
  for(const s of SPECIALS){
   out.specials[s.id]=stored.specials[s.id]||derived.specials[s.id];
   if(out.specials[s.id])out.dates[s.id]=stored.dates[s.id]||derived.dates[s.id]||today;
  }
  return out;
 }
 function load(){
  const state=empty();
  try{
   const saved=JSON.parse(localStorage.getItem(KEY));
   if(!saved||typeof saved!=='object'||saved.v!==1)return state;
   for(const [game] of GAMES){
    const n=saved.g&&saved.g[game];
    if(Number.isInteger(n)&&n>=1&&n<=LEVELS.length)state.games[game]=n;
   }
   if(Array.isArray(saved.s))for(const s of SPECIALS)if(saved.s.includes(s.id))state.specials[s.id]=true;
   if(saved.d&&typeof saved.d==='object')for(const [k,v] of Object.entries(saved.d))
    if(validDateKey(k)&&typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v))state.dates[k]=v;
  }catch{/* unreadable storage: start from the ledger alone */}
  return state;
 }
 function save(state){
  const g={},s=[];
  for(const [game] of GAMES)if(state.games[game]>0)g[game]=state.games[game];
  for(const item of SPECIALS)if(state.specials[item.id])s.push(item.id);
  try{localStorage.setItem(KEY,JSON.stringify({v:1,g,s,d:state.dates}));return true}
  catch{return false}
 }
 let memo=null;
 function claim(now=new Date()){
  const progress=typeof window!=='undefined'?window.MareProgress:null;
  let rounds=[],earned=[];
  try{rounds=progress?.read?.()||[]}catch{rounds=[]}
  try{earned=(progress?.achievements?.(now)||[]).filter(x=>x&&x.earned)}catch{earned=[]}
  const derived=derive(rounds,earned,now);
  const stored=memo||load();
  const merged=merge(stored,derived,dayKey(now));
  const fresh=[];
  for(const [game,name] of GAMES){
   const level=merged.games[game];
   if(level>stored.games[game])fresh.push({kind:'game',game,name,level,levelName:LEVELS[level-1].name});
  }
  for(const s of SPECIALS)
   if(merged.specials[s.id]&&!stored.specials[s.id])fresh.push({kind:'special',id:s.id,name:s.name});
  if(fresh.length)save(merged);
  memo=merged;
  return {collection:merged,fresh};
 }
 function score(c){
  let points=0;
  for(const [game] of GAMES)points+=c.games[game];
  for(const s of SPECIALS)if(c.specials[s.id])points++;
  return {points,max:MAX_POINTS};
 }
 /* Share fragment: 12 digits (0-3, one per game, registry order) + 3 flags. */
 const CODE_RE=/^#mare10=1\.([0-3]{12})([01]{3})$/;
 function encode(c){
  return GAMES.map(g=>c.games[g[0]]).join('')+SPECIALS.map(s=>c.specials[s.id]?1:0).join('');
 }
 function code(c){return '#mare10=1.'+encode(c)}
 function parse(input){
  if(typeof input!=='string'||input.length>40)return null;
  const match=CODE_RE.exec(input);
  if(!match)return null;
  const out=empty();
  GAMES.forEach((g,i)=>{out.games[g[0]]=Number(match[1][i])});
  SPECIALS.forEach((s,i)=>{out.specials[s.id]=match[2][i]==='1'});
  return out;
 }
 function url(c,base){
  const link=new URL('index.html',base||(typeof document!=='undefined'?document.baseURI:'https://paulociano.github.io/mare/'));
  link.search='';link.hash=code(c);
  return link.href;
 }
 /* Who is ahead on which seal. Both sides are self-declared; nothing is verified. */
 function compare(mine,theirs){
  const ahead=[],behind=[];
  for(const [game,name] of GAMES){
   const a=mine.games[game],b=theirs.games[game];
   if(a>b)ahead.push(name+' · '+LEVELS[a-1].name);
   else if(b>a)behind.push(name+' · '+LEVELS[b-1].name);
  }
  for(const s of SPECIALS){
   if(mine.specials[s.id]&&!theirs.specials[s.id])ahead.push(s.name);
   else if(theirs.specials[s.id]&&!mine.specials[s.id])behind.push(s.name);
  }
  return {ahead,behind};
 }
 /* ---------- SVG: one drawing, used on screen and in the PNG card ---------- */
 const esc=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const SERIF="Georgia,'Times New Roman',serif",SANS='system-ui,-apple-system,Segoe UI,sans-serif';
 /* Medalhas: cada nível é um material diferente (prata-espuma, esmalte azul, ouro).
    Sem gradientes nem ids, para o mesmo selo poder aparecer várias vezes na página
    e dentro do cartão PNG sem conflito; o relevo vem de camadas e arcos translúcidos. */
 const PALETTE=Object.freeze({
  0:{rim:'#a9bcc1',edge:'#8aa0a7',face:'#e9ece6',disc:'#f7f2e6',ink:'#4f6a78',hi:'#ffffff'},
  1:{rim:'#6ba5ae',edge:'#3f7885',face:'#cfe8ea',disc:'#f1faf8',ink:'#173e5e',hi:'#ffffff'},
  2:{rim:'#2a6a99',edge:'#123f5f',face:'#4a8cb8',disc:'#e8f3f9',ink:'#123f5f',hi:'#ffffff'},
  3:{rim:'#d4ad57',edge:'#886020',face:'#ecd596',disc:'#fdf4d6',ink:'#173e5e',hi:'#fffbe8'}
 });
 const pt=(r,a,cx=60,cy=60)=>[(cx+r*Math.cos(a)).toFixed(2),(cy+r*Math.sin(a)).toFixed(2)];
 const wave=(y,ink)=>'<path d="M46 '+y+'q3.5 -3.5 7 0t7 0t7 0t7 0" fill="none" stroke="'+ink+'" stroke-width="2.3" stroke-linecap="round"/>';
 const star=(cx,cy,r,fill)=>{
  let d='';
  for(let i=0;i<10;i++){const [x,y]=pt(i%2?r*.42:r,-Math.PI/2+i*Math.PI/5,cx,cy);d+=(i?'L':'M')+x+' '+y}
  return '<path d="'+d+'Z" fill="'+fill+'" stroke="'+fill+'" stroke-width=".8" stroke-linejoin="round"/>';
 };
 function emblem(key,level,pal){
  const game=GAMES.find(g=>g[0]===key);
  if(game){
   let out='<text x="60" y="59" text-anchor="middle" font-family="'+SERIF+'" font-size="23" font-weight="700" letter-spacing="1" fill="'+pal.ink+'">'+esc(game[2])+'</text>';
   const rows=level===1?[71]:level===2?[69,76]:level===3?[67,73,79]:[];
   for(const y of rows)out+=wave(y,pal.ink);
   return out;
  }
  if(key==='daily-treasure'){
   let out='<path d="M60 36L65 55L84 60L65 65L60 84L55 65L36 60L55 55Z" fill="'+pal.ink+'" stroke="'+pal.ink+'" stroke-width="1" stroke-linejoin="round"/>';
   out+='<path d="M60 46L62.2 57.8L74 60L62.2 62.2L60 74L57.8 62.2L46 60L57.8 57.8Z" fill="'+pal.disc+'"/>';
   return out+'<circle cx="60" cy="60" r="3" fill="'+pal.ink+'"/>';
  }
  if(key==='seven-streak'){
   let out='';
   for(let i=0;i<7;i++){
    const [x,y]=pt(19,Math.PI+i*Math.PI/6,60,66);
    out+='<circle cx="'+x+'" cy="'+y+'" r="3.5" fill="'+pal.ink+'"/><circle cx="'+(x-.9)+'" cy="'+(y-.9)+'" r="1" fill="'+pal.hi+'" fill-opacity=".8"/>';
   }
   return out+wave(76,pal.ink)+wave(83,pal.ink);
  }
  let out='<circle cx="60" cy="60" r="6.5" fill="none" stroke="'+pal.ink+'" stroke-width="2.2"/><circle cx="60" cy="60" r="2" fill="'+pal.ink+'"/>';
  for(let i=0;i<12;i++){
   const [x,y]=pt(19,i*Math.PI/6);
   out+='<circle cx="'+x+'" cy="'+y+'" r="3" fill="'+pal.ink+'"/><circle cx="'+(x-.8)+'" cy="'+(y-.8)+'" r=".9" fill="'+pal.hi+'" fill-opacity=".8"/>';
  }
  return out;
 }
 function sealGroup(key,level){
  const lv=level>0?Math.min(LEVELS.length,level):0;
  const special=specialIds.has(key);
  const pal=PALETTE[special?(lv?3:0):lv];
  const tier=special?(lv?3:0):lv;
  let out='';
  /* sombra projetada sutil */
  out+='<circle cx="61.2" cy="61.8" r="49" fill="#173e5e" fill-opacity=".16"/>';
  /* aro recortado em 24 ondas */
  out+='<circle cx="60" cy="60" r="49" fill="'+pal.rim+'"/>';
  for(let i=0;i<24;i++){const [x,y]=pt(49,i*Math.PI/12);out+='<circle cx="'+x+'" cy="'+y+'" r="6.4" fill="'+pal.rim+'"/>'}
  /* borda escura do aro e brilho do metal */
  out+='<circle cx="60" cy="60" r="46.6" fill="none" stroke="'+pal.edge+'" stroke-width="1.2" stroke-opacity=".55"/>';
  out+='<path d="M24 36A42 42 0 0 1 52 18.6" fill="none" stroke="'+pal.hi+'" stroke-width="2.6" stroke-linecap="round" stroke-opacity=".55"/>';
  out+='<path d="M96 84A42 42 0 0 1 68 101.4" fill="none" stroke="#000" stroke-width="2.6" stroke-linecap="round" stroke-opacity=".14"/>';
  /* face */
  out+='<circle cx="60" cy="60" r="41.5" fill="'+pal.face+'" stroke="'+pal.edge+'" stroke-width="1.2" stroke-opacity=".7"/>';
  if(tier===3){
   /* raios do ouro */
   for(let i=0;i<16;i++){
    const a=i*Math.PI/8,[x1,y1]=pt(41,a-.1),[x2,y2]=pt(41,a+.1);
    out+='<path d="M60 60L'+x1+' '+y1+'L'+x2+' '+y2+'Z" fill="'+pal.hi+'" fill-opacity=".42"/>';
   }
  }else if(tier===2){
   /* cordão de pérolas */
   for(let i=0;i<30;i++){const [x,y]=pt(36.4,i*Math.PI/15);out+='<circle cx="'+x+'" cy="'+y+'" r="1.45" fill="'+pal.hi+'" fill-opacity=".85"/>'}
  }else if(tier===1){
   /* bolhas de espuma */
   [[-2.4,35,3],[-1.5,36,2],[-.6,34.5,3.4],[.5,36.5,2.2],[1.6,35,3],[2.7,36,2.2],[3.8,34.5,2.8],[4.8,36.4,2]].forEach(([a,r,s])=>{
    const [x,y]=pt(r,a);out+='<circle cx="'+x+'" cy="'+y+'" r="'+s+'" fill="'+pal.hi+'" fill-opacity=".55" stroke="'+pal.edge+'" stroke-opacity=".5" stroke-width=".7"/>';
   });
  }else{
   out+='<circle cx="60" cy="60" r="36.5" fill="none" stroke="'+pal.rim+'" stroke-width="1.3" stroke-dasharray="3 4"/>';
  }
  /* medalhão central */
  out+='<circle cx="60" cy="60" r="29" fill="'+pal.disc+'" stroke="'+pal.edge+'" stroke-width="1.6"/>';
  out+='<circle cx="60" cy="60" r="26.4" fill="none" stroke="'+pal.edge+'" stroke-width=".7" stroke-opacity=".45"/>';
  out+='<path d="M37 47A25 25 0 0 1 52 36" fill="none" stroke="'+pal.hi+'" stroke-width="2" stroke-linecap="round" stroke-opacity=".9"/>';
  /* coroa do nível: losango no esmalte, estrela no ouro */
  if(!special&&tier===3)out+=star(60,16.2,5.2,pal.edge);
  else if(!special&&tier===2)out+='<path d="M60 11.8L64.4 16.2L60 20.6L55.6 16.2Z" fill="'+pal.hi+'" stroke="'+pal.edge+'" stroke-width=".8"/>';
  else if(special&&tier===3)out+=star(60,16.2,5.2,pal.edge);
  return out+emblem(key,lv,pal);
 }
 function labelFor(key,level){
  const game=GAMES.find(g=>g[0]===key);
  if(game)return level?game[1]+', selo '+LEVELS[level-1].name:game[1]+', selo ainda não conquistado';
  const special=SPECIALS.find(s=>s.id===key);
  return special?special.name+(level?', selo conquistado':', selo ainda não conquistado'):'Selo';
 }
 function sealSvg(key,level,{decorative=false}={}){
  if(!gameIds.has(key)&&!specialIds.has(key))return null;
  const head='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" focusable="false"';
  const aria=decorative?' aria-hidden="true"':' role="img" aria-label="'+esc(labelFor(key,level))+'"';
  return head+aria+'>'+sealGroup(key,level)+'</svg>';
 }
 function text(x,y,size,weight,fill,content,{family=SANS,anchor='start',spacing=0}={}){
  return '<text x="'+x+'" y="'+y+'" font-family="'+family+'" font-size="'+size+'" font-weight="'+weight+'" fill="'+fill+'"'+
   (anchor!=='start'?' text-anchor="'+anchor+'"':'')+(spacing?' letter-spacing="'+spacing+'"':'')+'>'+esc(content)+'</text>';
 }
 function cardSvg(c,{level=null,xp=null}={}){
  const {points,max}=score(c);
  let out='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">'+
   '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#e2edf0"/></linearGradient>'+
   '<pattern id="ln" width="12" height="13" patternUnits="userSpaceOnUse"><path d="M0 12.5H12" stroke="#295875" stroke-opacity=".075"/></pattern></defs>'+
   '<rect width="1200" height="675" fill="url(#bg)"/><rect width="1200" height="675" fill="url(#ln)"/>'+
   '<circle cx="120" cy="590" r="96" fill="#bf9d61" fill-opacity=".22"/>'+
   '<path d="M0 655H1200" stroke="#b0cbd2" stroke-width="2"/>';
  out+=text(70,96,24,800,'#315f87','M A R É   /   COLEÇÃO');
  out+=text(70,186,66,700,'#173e5e','Selos do Mar',{family:SERIF});
  out+=text(70,326,128,700,'#315f87',points,{family:SERIF});
  out+=text(70,376,30,600,'#173e5e','de '+max+' selos');
  if(Number.isInteger(level)&&Number.isFinite(xp))out+=text(70,424,26,600,'#446578','Nível '+level+' · '+xp+' XP');
  out+=text(70,598,23,700,'#173e5e','paulociano.github.io/mare/');
  out+=text(70,634,17,600,'#886020','Coleção autodeclarada · Sem ranking público');
  GAMES.forEach(([game,name],i)=>{
   const col=i%4,row=Math.floor(i/4),cx=540+col*165,top=56+row*150,lv=c.games[game];
   out+='<g transform="translate('+(cx-50)+' '+top+') scale(.8333)">'+sealGroup(game,lv)+'</g>';
   out+=text(cx,top+126,18,700,'#173e5e',name,{anchor:'middle'});
   out+=text(cx,top+146,15,600,'#446578',lv?LEVELS[lv-1].name:'a conquistar',{anchor:'middle'});
  });
  SPECIALS.forEach((s,i)=>{
   const cx=540+i*165,top=512,on=c.specials[s.id];
   out+='<g transform="translate('+(cx-38)+' '+top+') scale(.6333)">'+sealGroup(s.id,on?1:0)+'</g>';
   out+=text(cx,top+98,15,700,'#173e5e',s.name,{anchor:'middle'});
  });
  return out+'</svg>';
 }
 /* ---------- Interface (browser only) ---------- */
 const api=Object.freeze({
  games:GAMES,levels:LEVELS,specials:SPECIALS,maxPoints:MAX_POINTS,
  derive,merge,claim,score,encode,code,parse,url,compare,sealSvg,cardSvg,labelFor
 });
 if(typeof window!=='undefined')window.MareSelos=api;
 if(typeof document==='undefined')return;
 const el=(tag,css,txt)=>{
  const node=document.createElement(tag);
  if(css)node.className=css;
  if(txt!==undefined)node.textContent=String(txt);
  return node;
 };
 function mount(svg){
  if(!svg)return null;
  const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
  if(doc.getElementsByTagName('parsererror').length)return null;
  return document.importNode(doc.documentElement,true);
 }
 const formatDate=iso=>iso?iso.split('-').reverse().join('/'):'';
 async function copyText(value,status){
  try{
   if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
   else{
    const area=el('textarea');area.value=value;area.style.position='fixed';area.style.left='-10000px';
    document.body.append(area);area.select();
    if(!document.execCommand?.('copy'))throw Error('clipboard unavailable');
    area.remove();
   }
   status.textContent='Copiado. Envie somente para quem você escolher.';
  }catch{status.textContent='Não foi possível copiar automaticamente.'}
 }
 function svgToPng(svg){
  return new Promise(resolve=>{
   const image=new Image();
   image.onload=()=>{
    try{
     const canvas=document.createElement('canvas');
     canvas.width=1200;canvas.height=675;
     canvas.getContext('2d').drawImage(image,0,0,1200,675);
     canvas.toBlob(blob=>resolve(blob),'image/png');
    }catch{resolve(null)}
   };
   image.onerror=()=>resolve(null);
   image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  });
 }
 function download(blob,filename){
  const href=URL.createObjectURL(blob),a=el('a');
  a.href=href;a.download=filename;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
 }
 function summaryText(collection){
  const {points,max}=score(collection);
  const stats=window.MareProgress?.stats?.();
  return 'MARÉ · Selos do Mar\n'+points+' de '+max+' selos'+(stats?' · Nível '+stats.level:'')+
   '\nColeção informada pelo jogador, sem validação externa.';
 }
 function renderHub(){
  const anchor=document.getElementById('diario-de-bordo');
  const catalog=document.getElementById('jogos');
  if(!anchor&&!catalog)return;
  const section=el('section','mare-selos');
  section.id='colecao-de-selos';section.setAttribute('aria-labelledby','mare-selos-title');
  section.append(el('span','mare-selos__eyebrow','COLEÇÃO DE SELOS'));
  const title=el('h2','','Selos do Mar');title.id='mare-selos-title';
  section.append(title,el('p','mare-selos__lead',
   'Cada vitória registrada no diário rende selos. Em cada jogo você coleciona três níveis: Espuma na primeira vitória, Onda na quinta e Grande Onda na décima quinta. Selos nunca são perdidos.'));
  const meter=el('div','mare-selos__meter');
  const number=el('strong','mare-selos__points');
  const caption=el('span','mare-selos__points-label');
  const track=el('div','mare-selos__track');
  track.setAttribute('role','progressbar');track.setAttribute('aria-label','Selos conquistados');
  track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(MAX_POINTS));
  const fill=el('span','mare-selos__fill');track.append(fill);
  meter.append(number,caption,track);section.append(meter);
  const gamesHeading=el('h3','','Selos dos 12 jogos');
  const grid=el('ul','mare-selos__grid');grid.setAttribute('role','list');
  const specialsHeading=el('h3','','Selos especiais');
  const specialGrid=el('ul','mare-selos__grid mare-selos__grid--special');specialGrid.setAttribute('role','list');
  section.append(gamesHeading,grid,specialsHeading,specialGrid);
  const actions=el('div','mare-selos__actions');
  const status=el('p','mare-selos__status');status.setAttribute('role','status');
  const friend=el('div','mare-selos__friend');friend.hidden=true;
  let current=empty();
  const makeButton=(label,handler,secondary)=>{
   const b=el('button','mare-selos__button'+(secondary?' mare-selos__button--quiet':''),label);
   b.type='button';b.addEventListener('click',handler);return b;
  };
  const share=makeButton('Compartilhar minha coleção',async()=>{
   const link=url(current);
   const message=summaryText(current);
   try{
    if(navigator.share){
     await navigator.share({title:'Meus Selos do Mar · MARÉ',text:message,url:link});
     status.textContent='Compartilhamento iniciado.';
    }else await copyText(message+'\n'+link,status);
   }catch(error){if(error?.name!=='AbortError')await copyText(message+'\n'+link,status)}
  });
  const imageButton=makeButton('Compartilhar cartão de selos',async()=>{
   const stats=window.MareProgress?.stats?.();
   const blob=await svgToPng(cardSvg(current,{level:stats?.level??null,xp:stats?.xp??null}));
   if(!blob){status.textContent='O navegador não conseguiu gerar a imagem. Use o link da coleção.';return}
   const file=new File([blob],'mare-selos.png',{type:'image/png'});
   try{
    if(navigator.canShare?.({files:[file]})&&navigator.share){
     await navigator.share({title:'Meus Selos do Mar · MARÉ',text:summaryText(current),url:url(current),files:[file]});
     status.textContent='Cartão enviado ao compartilhamento do dispositivo.';
    }else{download(blob,file.name);status.textContent='Cartão salvo. Compartilhe a imagem pelo aplicativo de sua escolha.'}
   }catch(error){if(error?.name!=='AbortError')status.textContent='Compartilhamento cancelado ou indisponível.'}
  },true);
  const copyButton=makeButton('Copiar link da coleção',()=>copyText(url(current),status),true);
  actions.append(share,imageButton,copyButton);
  section.append(actions,status,friend);
  function paintSeal(list,key,level,name,detail,date){
   const item=el('li','mare-selos__item'+(level?' is-earned':' is-locked'));
   const art=mount(sealSvg(key,level,{decorative:true}));
   if(art){art.classList.add('mare-selos__seal');item.append(art)}
   const info=el('div','mare-selos__info');
   info.append(el('strong','',name));
   const game=GAMES.find(g=>g[0]===key);
   const state=game?(level?LEVELS[level-1].name:'Ainda não conquistado'):(level?'Conquistado':'Ainda não conquistado');
   info.append(el('span','mare-selos__state',state));
   if(level&&date)info.append(el('small','','Conquistado em '+formatDate(date)));
   else if(game)info.append(el('small','',level<LEVELS.length?'Próximo: '+LEVELS[level].name+' com '+LEVELS[level].wins+' '+(LEVELS[level].wins===1?'vitória':'vitórias'):'Nível máximo'));
   else info.append(el('small','',detail));
   item.append(info);
   list.append(item);
  }
  function paint(){
   const {collection}=claim();
   current=collection;
   const {points,max}=score(collection);
   number.textContent=String(points);
   caption.textContent='de '+max+' selos';
   track.setAttribute('aria-valuenow',String(points));
   fill.style.width=(points/max*100)+'%';
   grid.replaceChildren();specialGrid.replaceChildren();
   for(const [game,name] of GAMES){
    const level=collection.games[game];
    paintSeal(grid,game,level,name,'',collection.dates[game+':'+level]);
   }
   for(const s of SPECIALS)paintSeal(specialGrid,s.id,collection.specials[s.id]?1:0,s.name,s.detail,collection.dates[s.id]);
   paintFriend();
  }
  function paintFriend(){
   const incoming=location.hash.startsWith('#mare10=')?parse(location.hash):null;
   friend.replaceChildren();
   if(!location.hash.startsWith('#mare10=')){friend.hidden=true;return}
   friend.hidden=false;
   if(!incoming){
    friend.append(el('h3','','Convite inválido'),el('p','','Este link de coleção não pôde ser lido. Peça outro ao seu amigo.'));
    return;
   }
   const their=score(incoming),mine=score(current),diff=compare(current,incoming);
   friend.append(el('h3','','Coleção de um amigo'));
   friend.append(el('p','mare-selos__friend-total','Seu amigo declarou '+their.points+' de '+their.max+' selos. Você tem '+mine.points+'.'));
   const mini=el('ul','mare-selos__mini');mini.setAttribute('role','list');
   for(const [game,name] of GAMES){
    const level=incoming.games[game],cell=el('li','mare-selos__mini-item');
    const art=mount(sealSvg(game,level,{decorative:true}));
    if(art)cell.append(art);
    cell.append(el('span','mare-selos__sr',name+': '+(level?LEVELS[level-1].name:'a conquistar')));
    mini.append(cell);
   }
   friend.append(mini);
   const list=(items,none)=>items.length?items.slice(0,6).join(', ')+(items.length>6?' e mais '+(items.length-6):'')+'.':none;
   friend.append(el('p','','Você está à frente em: '+list(diff.ahead,'nenhum selo.')));
   friend.append(el('p','','Seu amigo está à frente em: '+list(diff.behind,'nenhum selo.')));
   friend.append(el('p','mare-selos__note','A coleção do amigo é autodeclarada. O MARÉ não verifica partidas de outras pessoas e não guarda este link.'));
  }
  if(anchor)anchor.after(section);else catalog.before(section);
  paint();
  window.addEventListener('hashchange',paintFriend);
  window.addEventListener('mare:round-finished',paint);
  if(location.hash.startsWith('#mare10='))requestAnimationFrame(()=>section.scrollIntoView({block:'start'}));
 }
 /* On game pages: a new seal is announced inside the round summary that already exists. */
 function announce(fresh){
  const box=document.querySelector('.mare-finale');
  if(!box||box.hidden)return;
  box.querySelector('.mare-finale__seal')?.remove();
  if(!fresh.length)return;
  const names=fresh.map(f=>f.kind==='game'?f.name+' · '+f.levelName:f.name);
  const shown=names.length>2?names.slice(0,2).join(', ')+' e mais '+(names.length-2):names.join(' e ');
  const line=el('p','mare-finale__seal');
  const first=fresh[0];
  const art=mount(sealSvg(first.kind==='game'?first.game:first.id,first.kind==='game'?first.level:1,{decorative:true}));
  if(art){art.classList.add('mare-finale__seal-art');line.append(art)}
  /* Texto puro: o resumo mantém exatamente os dois links de navegação que já tinha. */
  const copy=el('span','',(fresh.length===1?'Novo selo: ':'Novos selos: ')+shown+'. Veja na coleção da página inicial.');
  line.append(copy);
  const actions=box.querySelector('.mare-finale__actions');
  box.insertBefore(line,actions||null);
 }
 function renderGame(){
  claim();/* silent baseline: players with earlier wins are not flooded by "new" seals */
  window.addEventListener('mare:round-finished',event=>{
   const won=event.detail?.outcome==='win';
   /* A loss must also clear the line left by an earlier win in the same summary box. */
   setTimeout(()=>announce(won?claim().fresh:[]),0);
  });
 }
 const start=()=>{if(document.body.classList.contains('mare-hub'))renderHub();else renderGame()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
