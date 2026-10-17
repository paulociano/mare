'use strict';
/* Progressive enhancement for the MARÉ hub. Core catalog always remains usable. */
(()=>{
 const catalog=document.getElementById('jogos');
 const header=document.querySelector('.mar-section-head');
 if(!catalog||!header)return;
 const cards=[...catalog.querySelectorAll('article.mar-game')];
 const families={
  'mar-letters':'deducao','mar-abyss':'deducao','mar-school':'associacao','mar-current':'deducao',
  'mar-shell':'criacao','mar-trail':'criacao','mar-enigma':'deducao','mar-marujo':'observacao',
  'mar-forca':'deducao','mar-criptograma':'deducao','mar-perola':'criacao','mar-farol':'associacao'
 };
 const descriptions={deducao:'Lógica e descobertas',associacao:'Conecte ideias',criacao:'Encontre palavras',observacao:'Atenção e percepção'};
 const toolbar=document.createElement('section');toolbar.className='mare-discover';toolbar.setAttribute('aria-label','Explorar jogos por estilo');
 const title=document.createElement('div');title.className='mare-discover-title';
 const heading=document.createElement('strong');heading.textContent='Descubra seu próximo desafio';
 const subtitle=document.createElement('span');subtitle.textContent='Escolha pelo tipo de experiência ou explore tudo.';
 title.append(heading,subtitle);
 const controls=document.createElement('div');controls.className='mare-filters';controls.setAttribute('role','group');controls.setAttribute('aria-label','Filtrar jogos');
 const options=[['todos','Todos os jogos'],['deducao','Dedução'],['associacao','Conexões'],['criacao','Palavras'],['observacao','Observação']];
 const empty=document.createElement('p');empty.className='mare-empty';empty.textContent='Nenhum jogo nesta categoria.';empty.hidden=true;
 for(const [key,label] of options){
  const button=document.createElement('button');button.type='button';button.className='mare-filter';button.textContent=label;button.setAttribute('aria-pressed',String(key==='todos'));
  button.addEventListener('click',()=>{
   for(const item of controls.children)item.setAttribute('aria-pressed',String(item===button));
   let visible=0;
   for(const card of cards){const show=key==='todos'||card.dataset.family===key;card.hidden=!show;if(show)visible++}
   empty.hidden=visible!==0;
   subtitle.textContent=key==='todos'?'Escolha pelo tipo de experiência ou explore tudo.':visible+' jogos · '+label;
  });
  controls.append(button);
 }
 toolbar.append(title,controls);header.after(toolbar);catalog.after(empty);
 for(const card of cards){
  const family=Object.keys(families).find(c=>card.classList.contains(c))||'deducao';card.dataset.family=families[family];
  const name=card.querySelector('h2')?.textContent?.trim()||'Jogo';
  const info=card.querySelector('.mar-game-info');if(!info)continue;
  const meta=document.createElement('div');meta.className='mare-card-meta';
  const type=document.createElement('span');const dot=document.createElement('span');dot.className='mare-dot';dot.setAttribute('aria-hidden','true');
  type.append(dot,document.createTextNode(descriptions[card.dataset.family]));meta.append(type);
  info.insertBefore(meta,info.querySelector('.mar-cta'));
  card.setAttribute('aria-label',name+' · '+descriptions[card.dataset.family]);
 }
 try{
  const saved=Object.keys(localStorage).filter(key=>key.startsWith('mare-')&&!key.includes('last-played'));
  document.body.dataset.depth=saved.length>=12?'deep':saved.length>=4?'explorer':'surface';
 }catch{document.body.dataset.depth='surface'}
 // A lightweight next-game recommendation without external tracking or a login.
 // Prefer a game not previously opened, falling back to the first available game.
 const candidate=cards.find(card=>{
  const href=card.querySelector('.mar-cta')?.getAttribute('href')?.split('?')[0];
  if(!href)return false;
  try{return localStorage.getItem('mare-last-played')!==href}catch{return true}
 })||cards[0];
 const suggestedLink=candidate?.querySelector('.mar-cta');
 const suggestedName=candidate?.querySelector('h2')?.textContent?.trim();
 if(suggestedLink&&suggestedName){
  const recommendation=document.createElement('section');
  recommendation.className='mare-recommendation';
  recommendation.setAttribute('aria-label','Sugestão de jogo');
  const summary=document.createElement('div');
  const label=document.createElement('div');label.className='mare-recommendation__title';label.textContent='Que tal jogar '+suggestedName+'?';
  const hint=document.createElement('p');hint.className='mare-recommendation__copy';hint.textContent='Um novo desafio, quando você quiser. Todos os jogos continuam disponíveis abaixo.';
  const open=document.createElement('a');open.className='mare-recommendation__link';open.href=suggestedLink.getAttribute('href');open.textContent='Jogar '+suggestedName+' ↗';
  summary.append(label,hint);recommendation.append(summary,open);toolbar.after(recommendation);
 }
 // First-visit guidance is unobtrusive and can be reopened through the toolbar.
 const guide=document.createElement('section');guide.className='mare-guide';
 guide.setAttribute('aria-label','Orientação para começar');
 const guideText=document.createElement('div');
 const guideTitle=document.createElement('strong');guideTitle.textContent='Primeira vez por aqui?';
 const guideDescription=document.createElement('p');
 guideDescription.textContent='Escolha um jogo, descubra as regras no botão Como jogar e acompanhe seu progresso. Você pode voltar ao convés sempre que quiser.';
 guideText.append(guideTitle,guideDescription);
 const guideToggle=document.createElement('button');guideToggle.type='button';guideToggle.className='mare-guide-toggle';guideToggle.textContent='Entendi';
 guideToggle.addEventListener('click',()=>{guide.hidden=true;try{localStorage.setItem('mare-guide-dismissed-v1','1')}catch{}});
 guide.append(guideText,guideToggle);
 let dismissed=false;try{dismissed=localStorage.getItem('mare-guide-dismissed-v1')==='1'}catch{}
 guide.hidden=dismissed;
 header.after(guide);
 const guideOpen=document.createElement('button');guideOpen.type='button';guideOpen.className='mare-filter';
 guideOpen.textContent='Como começar';guideOpen.setAttribute('aria-controls','mare-quick-guide');
 guide.id='mare-quick-guide';
 guideOpen.addEventListener('click',()=>{guide.hidden=false;guideToggle.focus()});
 controls.append(guideOpen);

})();
