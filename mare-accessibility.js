'use strict';
/* MARÉ Phase 10 | preferences are deliberately separate from game saves.
   No network, trackers, profile or rewards. Native HTML controls first. */
(()=>{
 const KEY='mare-accessibility-v1';
 const defaults=Object.freeze({scale:'normal',contrast:false,motion:false,focus:false});
 const valid=new Set(['normal','large','extra']);
 function read(){
  try{
   const obj=JSON.parse(localStorage.getItem(KEY)||'null');
   if(!obj||typeof obj!=='object'||Array.isArray(obj))return {...defaults};
   return {
    scale:valid.has(obj.scale)?obj.scale:'normal',
    contrast:obj.contrast===true,motion:obj.motion===true,focus:obj.focus===true
   };
  }catch{return {...defaults}}
 }
 function apply(settings,announce=false){
  const root=document.documentElement;
  root.dataset.mareScale=settings.scale;
  root.dataset.mareContrast=settings.contrast?'high':'normal';
  root.dataset.mareMotion=settings.motion?'reduce':'system';
  root.dataset.mareFocus=settings.focus?'on':'off';
  try{window.dispatchEvent(new CustomEvent('mare:accessibility',{detail:{...settings}}))}
  catch{/* Event is an enhancement, not a dependency of preference changes. */}
  if(announce){
   const status=document.getElementById('mare-access-status');
   if(status)status.textContent='Preferências aplicadas neste navegador.';
  }
 }
 const state=read();
 apply(state);
 const make=(tag,cls,value)=>{
  const element=document.createElement(tag);
  if(cls)element.className=cls;
  if(value!==undefined)element.textContent=value;
  return element;
 };
 function render(){
  const section=make('section','mare-access');
  section.id='ajustes-de-leitura';
  section.setAttribute('aria-label','Preferências de acessibilidade e leitura');
  const details=make('details','mare-access__details');
  const summary=make('summary','mare-access__summary');
  summary.append(make('span','mare-access__icon','◈'),make('strong','','Acessibilidade e leitura'),
    make('span','mare-access__summary-caption','Personalize sua experiência'));
  const content=make('div','mare-access__content');
  const intro=make('p','','Ajustes para conforto visual e navegação. Não mudam as regras, pontuações ou desafios.');
  const form=make('form','mare-access__form');
  form.setAttribute('aria-label','Configurações de apresentação');
  form.addEventListener('submit',e=>e.preventDefault());
  const fieldset=make('fieldset','mare-access__scale');
  const legend=make('legend','','Tamanho da leitura');
  fieldset.append(legend);
  for(const [value,label] of [['normal','Padrão'],['large','Ampliado'],['extra','Muito ampliado']]){
   const option=make('label','mare-access__radio');
   const input=make('input');input.type='radio';input.name='mare-access-scale';
   input.value=value;input.checked=state.scale===value;
   option.append(input,make('span','',label));
   fieldset.append(option);
   input.addEventListener('change',()=>{if(input.checked)update({...read(),scale:value})});
  }
  const toggles=make('div','mare-access__toggles');
  function addToggle(key,title,help){
   const label=make('label','mare-access__toggle');
   const input=make('input');input.type='checkbox';input.checked=state[key];
   input.name='mare-access-'+key;
   const text=make('span','');
   text.append(make('strong','',title),make('small','',help));
   label.append(input,text);toggles.append(label);
   input.addEventListener('change',()=>update({...read(),[key]:input.checked}));
   return input;
  }
  const high=addToggle('contrast','Contraste reforçado','Destaque de texto, bordas e foco.');
  const motion=addToggle('motion','Reduzir movimentos','Desativa animações decorativas. Respeita também a preferência do sistema.');
  const focus=addToggle('focus','Modo concentração','Oculta efeitos de fundo que não fazem parte dos jogos.');
  const status=make('p','mare-access__status','');
  status.id='mare-access-status';status.setAttribute('role','status');
  const reset=make('button','mare-access__reset','Restaurar apresentação padrão');
  reset.type='button';
  reset.addEventListener('click',()=>{
   try{localStorage.removeItem(KEY)}catch{}
   apply({...defaults},true);
   for(const input of fieldset.querySelectorAll('input'))input.checked=input.value==='normal';
   high.checked=false;motion.checked=false;focus.checked=false;
   status.textContent='Apresentação padrão restaurada.';
  });
  function update(next){
   const validSettings={
    scale:valid.has(next.scale)?next.scale:'normal',
    contrast:next.contrast===true,motion:next.motion===true,focus:next.focus===true
   };
   try{localStorage.setItem(KEY,JSON.stringify(validSettings))}
   catch{status.textContent='A apresentação foi aplicada, mas o navegador não conseguiu salvá-la.'}
   apply(validSettings);
   if(!status.textContent.includes('não conseguiu'))status.textContent='Preferências aplicadas neste navegador.';
  }
  form.append(fieldset,toggles,reset,status);
  content.append(intro,form);
  details.append(summary,content);section.append(details);
  document.body.append(section);
  window.addEventListener('storage',event=>{
   if(event.key!==KEY)return;
   const latest=read();apply(latest);
   for(const input of fieldset.querySelectorAll('input'))input.checked=input.value===latest.scale;
   high.checked=latest.contrast;motion.checked=latest.motion;focus.checked=latest.focus;
   status.textContent='Preferências sincronizadas com outra aba.';
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});
 else render();
 window.MareAccessibility=Object.freeze({read});
})();
