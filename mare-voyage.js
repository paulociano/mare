'use strict';
/* MARÉ Phase 7: daily voyage + participation calendar + real activity.
   Presentation only; reads immutable MareProgress APIs. */
(()=>{
 const panel=document.getElementById('diario-de-bordo'),api=window.MareProgress;
 if(!panel||!api?.dailyChallenge||!api?.streak||!api?.recent)return;
 const make=(tag,cls,txt)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(txt!==undefined)el.textContent=String(txt);
  return el;
 };
 const challenge=api.dailyChallenge(),streak=api.streak(),history=api.recent(undefined,6);
 const section=make('div','mare-voyage');
 const focus=make('section','mare-voyage__spotlight');
 focus.setAttribute('aria-labelledby','mare-voyage-title');
 const top=make('div','mare-voyage__eyebrow','DESAFIO DO DIA · '+challenge.day.split('-').reverse().join('/'));
 const heading=make('h3','','Rumo a '+challenge.name);
 heading.id='mare-voyage-title';
 const description=make('p','',challenge.description);
 const state=make('span','mare-voyage__state',challenge.completed
  ?(challenge.won?'Vitória registrada hoje':'Expedição concluída hoje')
  :'Uma partida para completar a rota');
 state.setAttribute('role','status');
 if(challenge.completed)focus.classList.add('is-complete');
 const link=make('a','mare-voyage__play',challenge.completed?'Explorar '+challenge.name+' novamente ↗':'Jogar '+challenge.name+' ↗');
 link.href=challenge.page;
 const copy=make('div','mare-voyage__spotlight-copy');
 copy.append(top,heading,description,state,link);
 const seal=make('div','mare-voyage__seal');
 seal.setAttribute('aria-hidden','true');
 seal.append(make('span','','◈'),make('small','','ROTA / '+challenge.day.slice(-2)));
 focus.append(copy,seal);

 const rhythm=make('section','mare-voyage__rhythm');
 rhythm.setAttribute('aria-labelledby','mare-voyage-streak');
 rhythm.append(make('span','mare-voyage__eyebrow','CONSTÂNCIA SEM PRESSÃO'));
 const title=make('h3','','Seu ritmo de exploração');
 title.id='mare-voyage-streak';rhythm.append(title);
 const metrics=make('div','mare-voyage__streak-metrics');
 const now=make('div','');
 now.append(make('strong','',streak.current),make('span','','dias na sequência'));
 const best=make('div','');
 best.append(make('strong','',streak.longest),make('span','','melhor sequência'));
 metrics.append(now,best);rhythm.append(metrics);
 const weekdays=make('div','mare-voyage__week');
 weekdays.setAttribute('aria-label','Participação na semana de segunda a domingo');
 for(const [i,day] of streak.week.entries()){
  const item=make('div','mare-voyage__day');
  if(day.done)item.classList.add('is-done');
  if(day.future)item.classList.add('is-future');
  const symbol=make('span','mare-voyage__day-mark',day.done?'✓':'·');
  symbol.setAttribute('aria-hidden','true');
  const label=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'][i];
  item.append(make('small','',label),symbol);
  item.setAttribute('aria-label',label+', '+day.day.split('-').reverse().join('/')+': '+
   (day.done?'partida concluída':day.future?'dia futuro':'sem partida registrada'));
  weekdays.append(item);
 }
 rhythm.append(weekdays);
 const note=make('p','mare-voyage__note',streak.playedToday
  ?'Seu mergulho de hoje está registrado. Volte quando quiser.'
  :streak.current?'A sequência considera também ontem. Uma partida hoje mantém o ritmo.'
   :'Não há sequência ativa. Você pode recomeçar quando quiser.');
 rhythm.append(note);
 section.append(focus,rhythm);
 const body=panel.querySelector('.mare-logbook__body');
 if(body)panel.insertBefore(section,body);
 else panel.append(section);

 const activity=make('section','mare-voyage__activity');
 activity.setAttribute('aria-labelledby','mare-voyage-history');
 const titleBar=make('div','mare-voyage__history-head');
 const titleText=make('div','');
 titleText.append(make('span','mare-explorer__eyebrow','REGISTROS DA JORNADA'));
 const titleH=make('h3','','Últimas expedições');
 titleH.id='mare-voyage-history';titleText.append(titleH);
 titleBar.append(titleText,make('span','mare-voyage__history-caption','Somente partidas verificadas neste navegador'));
 activity.append(titleBar);
 if(!history.length){
  activity.append(make('p','mare-voyage__history-empty','Quando você concluir uma partida, ela aparecerá aqui. Seus dados permanecem neste navegador.'));
 }else{
  const list=make('ol','mare-voyage__history-list');
  for(const item of history){
   const entry=make('li','mare-voyage__history-item');
   const mark=make('span','mare-voyage__history-icon',item.outcome==='win'?'✦':'◌');
   mark.setAttribute('aria-hidden','true');
   const text=make('span','');
   text.append(make('strong','',item.name),make('small','',item.outcome==='win'?'Vitória':'Partida concluída'));
   const date=make('time','',item.day.split('-').reverse().join('/'));
   date.setAttribute('datetime',item.day);
   entry.append(mark,text,date);list.append(entry);
  }
  activity.append(list);
 }
 const actions=panel.querySelector('.mare-logbook__actions');
 if(actions)panel.insertBefore(activity,actions);
 else panel.append(activity);
})();
