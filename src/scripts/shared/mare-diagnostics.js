'use strict';
/* Phase 5 opt-in local diagnostics. No cookies, beacons, identifiers or
   automatic persistence. This script does nothing without ?diagnostico=1.
   See docs/phase5-quality-report.md for privacy and limits. */
(()=>{
 if(new URLSearchParams(location.search).get('diagnostico')!=='1')return;
 const VERSION=1,KEY='mare-local-vitals-v1',CAP=120;
 const NAMES=['LCP','CLS','INP','FCP','TTFB'];
 const LABEL={LCP:'LCP',CLS:'CLS',INP:'INP',FCP:'FCP',TTFB:'TTFB'};
 const SCALES={LCP:[2500,4000],CLS:[.1,.25],INP:[200,500],FCP:[1800,3000],TTFB:[800,1800]};
 const safePage=(()=>{
  const value=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'');
  return ['index','recife','abismo','cardume','corrente','concha','trilha','enigma',
    'marujo','forca','criptograma','perola','farol'].includes(value)?value:'index';
 })();
 const metrics={};
 const element=(tag,cls,txt)=>{
  const e=document.createElement(tag);if(cls)e.className=cls;
  if(txt!==undefined)e.textContent=txt;return e;
 };
 const safeNumbers=object=>{
  const out={};
  for(const name of NAMES){
   const v=object?.[name];
   if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<1e7)
    out[name]=Math.round(v*(name==='CLS'?1000:1))/(name==='CLS'?1000:1);
  }
  return out;
 };
 const read=()=>{
  try{
   const list=JSON.parse(localStorage.getItem(KEY));
   if(!Array.isArray(list))return [];
   return list.filter(x=>x&&x.version===VERSION&&typeof x.page==='string'
      &&/^(index|recife|abismo|cardume|corrente|concha|trilha|enigma|marujo|forca|criptograma|perola|farol)$/.test(x.page)
      &&/^\d{4}-\d{2}-\d{2}$/.test(x.day)&&x.metrics&&typeof x.metrics==='object')
    .map(x=>({version:VERSION,page:x.page,day:x.day,metrics:safeNumbers(x.metrics)}))
    .slice(-CAP);
  }catch{return []}
 };
 const percentile=(xs,p)=>xs.length?xs.slice().sort((a,b)=>a-b)[Math.ceil(xs.length*p)-1]:null;
 const grade=(name,value)=>{
  const limits=SCALES[name];
  return value<=limits[0]?'Bom':value<=limits[1]?'Melhorar':'Ruim';
 };
 const link=document.createElement('link');
 link.rel='stylesheet';link.href='src/styles/shared/mare-diagnostics.css';document.head.append(link);
 // Keep the tool active while moving between the hub and individual games.
 document.querySelectorAll('a[href]').forEach(a=>{
  const raw=a.getAttribute('href');
  if(!raw||raw.includes('?')||raw.startsWith('#')||/^(?:https?:|mailto:|javascript:)/i.test(raw))return;
  if(raw==='./'||/^(?:\.\/)?(?:index|recife|abismo|cardume|corrente|concha|trilha|enigma|marujo|forca|criptograma|perola|farol)\.html$/.test(raw)){
   a.setAttribute('href',raw+(raw.includes('?')?'&':'?')+'diagnostico=1');
  }
 });
 const widget=element('aside','mare-diagnostics');
 widget.setAttribute('aria-label','Diagnóstico local de desempenho');
 const details=element('details');
 const summary=element('summary','','Diagnóstico local');
 details.append(summary);
 const head=element('h2','','Métricas desta sessão');
 const info=element('p','mare-diagnostics__note',
  'Somente neste navegador. Nenhum dado é enviado automaticamente. Interaja com a página para medir INP.');
 const status=element('p','mare-diagnostics__status','Carregando medidores...');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const grid=element('dl','mare-diagnostics__grid');
 const current=new Map();
 for(const name of NAMES){
  const item=element('div','mare-diagnostics__metric');
  item.append(element('dt','',LABEL[name]));
  const value=element('dd','','Aguardando...');
  item.append(value);grid.append(item);current.set(name,value);
 }
 const controls=element('div','mare-diagnostics__actions');
 const save=element('button','','Salvar amostra local');
 const exportBtn=element('button','','Exportar JSON');
 const clear=element('button','','Limpar amostras');
 clear.className='mare-diagnostics__danger';
 const close=element('a','','Fechar diagnóstico');
 close.href=location.pathname+(location.hash||'');
 controls.append(save,exportBtn,clear,close);
 const summaryStat=element('p','mare-diagnostics__note','Nenhuma amostra salva.');
 const privacy=element('p','mare-diagnostics__foot',
  'Dados: página, dia e cinco métricas numéricas. Sem contas, ID de sessão, histórico de jogos ou endereços. Biblioteca web-vitals carregada pelo CDN somente neste modo.');
 details.append(head,info,status,grid,controls,summaryStat,privacy);
 widget.append(details);document.body.append(widget);
 function render(){
  for(const name of NAMES){
   const el=current.get(name),value=metrics[name];
   el.textContent=value===undefined?'Aguardando...'
    :(name==='CLS'?value.toFixed(3):Math.round(value)+' ms')+' · '+grade(name,value);
  }
  const samples=read();
  const lines=[];
  for(const name of ['LCP','CLS','INP']){
   const values=samples.filter(s=>s.page===safePage).map(s=>s.metrics[name]).filter(v=>typeof v==='number');
   if(values.length>=20){
    const p=percentile(values,.75);
    lines.push(name+' p75 local: '+(name==='CLS'?p.toFixed(3):Math.round(p)+' ms')+' ('+values.length+' amostras)');
   }
  }
  summaryStat.textContent=samples.length+' amostras locais salvas. '+(
   lines.length?lines.join(' · '):'p75 por página será exibido com 20 amostras da mesma métrica.');
 }
 function record(metric){
  if(!NAMES.includes(metric?.name)||typeof metric.value!=='number'
     ||!Number.isFinite(metric.value)||metric.value<0)return;
  metrics[metric.name]=metric.value;
  render();
 }
 function respond(msg){status.textContent=msg}
 save.addEventListener('click',()=>{
  const values=safeNumbers(metrics);
  if(!Object.keys(values).length){respond('Nenhuma métrica disponível ainda.');return}
  try{
   const list=read();
   list.push({version:VERSION,page:safePage,day:new Date().toISOString().slice(0,10),metrics:values});
   localStorage.setItem(KEY,JSON.stringify(list.slice(-CAP)));
   render();respond('Amostra salva somente neste navegador.');
  }catch{respond('Armazenamento indisponível. Use a exportação sem salvar.')}
 });
 exportBtn.addEventListener('click',()=>{
  const data={schema:'mare-local-vitals-v1',source:'opt-in local',
   meaning:'User-chosen samples only; not population RUM or Core Web Vitals field p75',
   page:safePage,current:safeNumbers(metrics),samples:read()};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const a=element('a');a.href=url;a.download='mare-diagnostico-local.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  respond('JSON gerado neste navegador. Nenhum envio automático.');
 });
 clear.addEventListener('click',()=>{
  try{localStorage.removeItem(KEY);render();respond('Amostras locais apagadas.')}
  catch{respond('Não foi possível limpar o armazenamento.')}
 });
 render();
 import('https://cdn.jsdelivr.net/npm/web-vitals@6.2.3/dist/web-vitals.js').then(api=>{
  const opts={reportAllChanges:true};
  for(const [name,handler] of [['LCP','onLCP'],['CLS','onCLS'],['INP','onINP'],['FCP','onFCP'],['TTFB','onTTFB']]){
   if(typeof api[handler]==='function'){
    try{api[handler](record,opts)}catch{/* Browser may not support this metric */ }
   }
  }
  respond('Medição ativa. Métricas podem ficar indisponíveis em alguns navegadores.');
 }).catch(()=>{
  respond('Biblioteca indisponível neste acesso. Nada foi transmitido; verifique a conexão.');
 });
})();
