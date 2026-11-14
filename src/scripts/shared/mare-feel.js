'use strict';
/* MARÉ · som e vibração (opcionais, desligados por padrão).
   Sons sintetizados com Web Audio: nenhum arquivo, nenhuma rede. O contexto de
   áudio só é criado depois de um toque do jogador com o som ligado. A preferência
   fica separada dos saves de jogo e das preferências de leitura.

   Os jogos não precisam chamar nada: as respostas são derivadas de sinais que já
   existem (toque em botão do tabuleiro, animações de erro/acerto e o evento
   mare:round-finished do diário). MareFeel.play(nome) fica disponível para usos
   diretos. */
(()=>{
 const KEY='mare-feel-v1';
 const defaults=Object.freeze({sound:false,haptics:false});
 function read(){
  try{
   const obj=JSON.parse(localStorage.getItem(KEY)||'null');
   if(!obj||typeof obj!=='object'||Array.isArray(obj))return {...defaults};
   return {sound:obj.sound===true,haptics:obj.haptics===true};
  }catch{return {...defaults}}
 }
 let settings=read();
 const canVibrate=typeof navigator!=='undefined'&&typeof navigator.vibrate==='function';
 const AudioCtor=typeof window!=='undefined'?(window.AudioContext||window.webkitAudioContext):null;

 /* nome → notas [frequência Hz, início s, duração s, ganho, forma] e padrão de vibração (ms) */
 const voices=Object.freeze({
  tap:{notes:[[660,0,.035,.5,'sine']],buzz:8},
  flip:{notes:[[520,0,.045,.4,'sine']],buzz:0},
  ok:{notes:[[523.25,0,.09,.7,'triangle'],[659.25,.08,.12,.7,'triangle']],buzz:12},
  bad:{notes:[[196,0,.16,.8,'triangle'],[185,.02,.14,.5,'sine']],buzz:[20,40,20]},
  win:{notes:[[523.25,0,.12,.7,'triangle'],[659.25,.1,.12,.7,'triangle'],[783.99,.2,.12,.7,'triangle'],[1046.5,.3,.28,.8,'triangle']],buzz:[30,60,60]},
  lose:{notes:[[329.63,0,.16,.6,'sine'],[261.63,.14,.16,.6,'sine'],[220,.28,.3,.6,'sine']],buzz:0}
 });

 let context=null,master=null;
 function audio(){
  if(!AudioCtor)return null;
  if(!context){
   try{
    context=new AudioCtor();
    master=context.createGain();master.gain.value=.16;master.connect(context.destination);
   }catch{context=null;return null}
  }
  if(context.state==='suspended')context.resume().catch(()=>{});
  return context;
 }
 function sound(notes){
  const ctx=audio();if(!ctx||!master)return;
  const now=ctx.currentTime+.005;
  for(const [frequency,start,duration,gain,type] of notes){
   const osc=ctx.createOscillator(),env=ctx.createGain();
   osc.type=type;osc.frequency.value=frequency;
   env.gain.setValueAtTime(.0001,now+start);
   env.gain.exponentialRampToValueAtTime(gain,now+start+.008);
   env.gain.exponentialRampToValueAtTime(.0001,now+start+duration);
   osc.connect(env);env.connect(master);
   osc.start(now+start);osc.stop(now+start+duration+.02);
  }
 }
 const last=new Map();
 function play(name,gap=0){
  const voice=voices[name];if(!voice)return false;
  if(!settings.sound&&!settings.haptics)return false;
  const stamp=Date.now();
  if(gap&&stamp-(last.get(name)||0)<gap)return false;
  last.set(name,stamp);
  if(settings.sound)try{sound(voice.notes)}catch{/* Som é enfeite: nunca interrompe a jogada. */}
  if(settings.haptics&&canVibrate&&voice.buzz)try{navigator.vibrate(voice.buzz)}catch{}
  return true;
 }

 /* Sinais que já existem nas páginas. */
 const isGame=()=>!document.body.classList.contains('mare-hub');
 document.addEventListener('pointerdown',event=>{
  if(!isGame()||!(event.target instanceof Element))return;
  const button=event.target.closest('button');
  if(!button||button.disabled||!button.closest('main,.shell'))return;
  play('tap',40);
 },{passive:true});
 document.addEventListener('animationstart',event=>{
  const name=event.animationName||'';
  if(name==='mare-shake')play('bad',180);
  else if(name==='mare-settle'||name==='mare-surface'||name==='mare-pop')play('ok',160);
  else if(name==='flip'||name==='mare-flip')play('flip',70);
 },{passive:true});
 window.addEventListener('mare:round-finished',event=>{
  const outcome=event.detail&&event.detail.outcome;
  setTimeout(()=>play(outcome==='win'?'win':'lose'),outcome==='win'?260:120);
 });

 /* Chaves no painel de ajustes, ao lado de contraste e movimento. */
 function save(next){
  settings={sound:next.sound===true,haptics:next.haptics===true};
  try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}
 }
 function mount(){
  const toggles=document.querySelector('.mare-access__toggles');
  if(!toggles||toggles.querySelector('[name="mare-feel-sound"]'))return;
  const inputs={};
  const add=(key,title,help)=>{
   const label=document.createElement('label');label.className='mare-access__toggle';
   const input=document.createElement('input');input.type='checkbox';input.name='mare-feel-'+key;input.checked=settings[key];
   const text=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');
   strong.textContent=title;small.textContent=help;text.append(strong,small);
   label.append(input,text);toggles.append(label);inputs[key]=input;
   input.addEventListener('change',()=>{
    save({...settings,[key]:input.checked});
    if(input.checked)play(key==='sound'?'ok':'tap');
    const status=document.getElementById('mare-access-status');
    if(status)status.textContent='Preferências aplicadas neste navegador.';
   });
  };
  add('sound','Sons do jogo','Toques, acertos e vitórias com sons curtos e discretos.');
  if(canVibrate)add('haptics','Vibração','Resposta tátil em toques, erros e vitórias, onde o aparelho permite.');
  document.querySelector('.mare-access__reset')?.addEventListener('click',()=>{
   try{localStorage.removeItem(KEY)}catch{}
   settings={...defaults};
   for(const input of Object.values(inputs))input.checked=false;
  });
  window.addEventListener('storage',event=>{
   if(event.key!==KEY)return;
   settings=read();
   for(const [key,input] of Object.entries(inputs))input.checked=settings[key];
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();

 window.MareFeel=Object.freeze({play,read:()=>({...settings}),voices:Object.keys(voices)});
})();
