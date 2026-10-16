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
})();
