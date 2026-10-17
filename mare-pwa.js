'use strict';
/* MARÉ: local-only PWA registration, explicit update and install actions.
   Never force reload during an active round. */
(()=>{
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
 const make=(tag,className,value)=>{
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(value!==undefined)el.textContent=value;
  return el;
 };
 const hub=document.body.classList.contains('mare-hub');
 const holder=make('div','mare-pwa');
 const status=make('span','mare-pwa__status','Preparando acesso offline…');
 status.setAttribute('role','status');
 const install=make('button','mare-pwa__action','Instalar MARÉ');
 install.type='button';install.hidden=true;
 const update=make('button','mare-pwa__action','Atualizar aplicativo');
 update.type='button';update.hidden=true;
 holder.append(status,install,update);
 if(hub){
  const visual=document.querySelector('.mare-studio-hero__copy');
  if(visual)visual.append(holder);
  else document.body.append(holder);
 }else{
  // On games the status is visible only when an update or offline state is relevant.
  holder.classList.add('mare-pwa--compact');
  holder.hidden=true;document.body.append(holder);
 }
 const show=msg=>{
  status.textContent=msg;
  if(!hub)holder.hidden=!(update.hidden===false||!navigator.onLine);
 };
 const network=()=>show(navigator.onLine?'Disponível offline após a primeira visita completa.':'Sem conexão · jogue com o conteúdo salvo.');
 window.addEventListener('offline',network);
 window.addEventListener('online',network);
 let deferredPrompt=null,registration=null,requestedReload=false;
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();deferredPrompt=event;install.hidden=false;
  show('Instale o MARÉ para jogar direto da tela inicial.');
 });
 window.addEventListener('appinstalled',()=>{
  deferredPrompt=null;install.hidden=true;show('MARÉ instalado. Boa exploração!');
 });
 install.addEventListener('click',async()=>{
  if(!deferredPrompt)return;
  const prompt=deferredPrompt;deferredPrompt=null;install.hidden=true;
  try{
   await prompt.prompt();const choice=await prompt.userChoice;
   show(choice?.outcome==='accepted'?'Instalação iniciada.':'Você pode instalar quando quiser.');
  }catch{show('Instalação não disponível neste navegador.')}
 });
 const offerUpdate=worker=>{
  // The installed event may fire just before registration.waiting is populated.
  // The currently controlled client guarantees this new installed worker must wait.
  if(!worker||worker.state!=='installed'||!navigator.serviceWorker.controller)return;
  update.hidden=false;
  show('Nova versão pronta · atualize quando terminar a rodada.');
 };
 update.addEventListener('click',()=>{
  if(!registration?.waiting)return;
  requestedReload=true;
  registration.waiting.postMessage({type:'SKIP_WAITING'});
 });
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(requestedReload){requestedReload=false;location.reload();}
 });
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
  registration=reg;
  if(reg.waiting)offerUpdate(reg.waiting);
  reg.addEventListener('updatefound',()=>{
   const worker=reg.installing;
   if(!worker)return;
   worker.addEventListener('statechange',()=>{
    if(worker.state==='installed')offerUpdate(worker);
   });
  });
  return navigator.serviceWorker.ready;
 }).then(()=>{
  const checkWaiting=()=>{
   if(registration?.waiting)offerUpdate(registration.waiting);
  };
  checkWaiting();
  if(update.hidden)show(navigator.onLine?'MARÉ preparado para jogar offline.':'Sem conexão · jogos salvos disponíveis.');
  // Foreground checks close the gap if a worker became waiting before
  // registration listeners settled. Never reload or skipWaiting automatically.
  const refresh=()=>registration?.update().then(checkWaiting).catch(()=>checkWaiting());
  window.addEventListener('pageshow',refresh);
  window.addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()});
 }).catch(()=>{
  show('Modo offline indisponível. Os jogos online continuam funcionando.');
 });
})();
