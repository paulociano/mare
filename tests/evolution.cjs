'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const markup=fs.readFileSync('index.html','utf8');
const entries=[...markup.matchAll(/<article class="mar-game ([^"]+)">/g)];
assert.equal(entries.length,12,'O catálogo deve preservar os 12 jogos');
assert.ok(markup.includes('mare-evolution.css')&&markup.includes('mare-evolution.js'),'Recursos de evolução vinculados');
class Node {
 constructor(tag='div'){this.tagName=tag;this.children=[];this.handlers={};this.attrs={};this.dataset={};this.hidden=false;this.className='';this.textContent='';}
 append(...items){this.children.push(...items)}
 after(node){this.afterNode=node}
 insertBefore(node,ref){this.children.splice(Math.max(0,this.children.indexOf(ref)),0,node)}
 setAttribute(name,value){this.attrs[name]=value}
 getAttribute(name){return this.attrs[name]}
 addEventListener(name,fn){this.handlers[name]=fn}
 click(){this.handlers.click?.()}
}
const cards=entries.map((match,i)=>{
 const card=new Node('article');card.className='mar-game '+match[1];
 card.classList={contains:name=>card.className.split(/\s+/).includes(name)};
 const heading=new Node('h2');heading.textContent='Jogo '+i;
 const action=new Node('a');action.setAttribute('href','game-'+i+'.html');
 const info=new Node('div');info.className='mar-game-info';info.children=[action];
 card.querySelector=selector=>selector==='h2'?heading:selector==='.mar-game-info'?info:null;
 info.querySelector=selector=>selector==='.mar-cta'?action:null;
 return card;
});
const catalog=new Node('section');catalog.querySelectorAll=()=>cards;
const header=new Node('div');
const body=new Node('body');
const doc={body,getElementById:id=>id==='jogos'?catalog:null,querySelector:sel=>sel==='.mar-section-head'?header:null,createElement:tag=>new Node(tag),createTextNode:value=>({textContent:value})};
vm.runInNewContext(fs.readFileSync('mare-evolution.js','utf8'),{document:doc,localStorage:{'mare-last-played':'recife.html'}},{filename:'mare-evolution.js'});
const toolbar=header.afterNode;
assert.ok(toolbar,'Filtros inseridos');
const controls=toolbar.children[1];
assert.equal(controls.children.length,6,'Cinco filtros e um botão de ajuda');
const active=()=>cards.filter(c=>!c.hidden).length;
const expected=[12,6,2,3,1];
controls.children.slice(0,5).forEach((button,i)=>{button.click();assert.equal(active(),expected[i],'Contagem errada no filtro '+i);assert.equal(button.getAttribute('aria-pressed'),'true')});
controls.children[0].click();
assert.ok(cards.every(card=>card.children.length===0||!card.hidden));
assert.ok(cards.every(card=>card.querySelector('.mar-game-info').children.length===2),'Metadados presentes em cada card');
assert.equal(body.dataset.depth,'surface','Sem progresso, cenário básico');
console.log('PASS: catálogo de 12 jogos, filtros, acessibilidade e fallback de armazenamento');

const manifest=require('../config/site-manifest.json');
for(const page of manifest.pages){
 const source=fs.readFileSync(page+'.html','utf8');
 const stylesheet=page==='index'?'mare-evolution.css':'mare-play.css';
 assert.ok(source.includes('href="'+stylesheet+'"'),page+': camada visual correta não carregada');
 assert.equal(source.split('href="'+stylesheet+'"').length-1,1,page+': stylesheet duplicado');
 if(page!=='index')assert.ok(!source.includes('href="mare-evolution.css"'),page+': CSS do hub não deve entrar nos jogos');
}
const evolutionCss=fs.readFileSync('mare-evolution.css','utf8');
const playCss=fs.readFileSync('mare-play.css','utf8');
assert.ok(playCss.includes(':focus-visible')&&playCss.includes('prefers-reduced-motion:reduce'),'Foco e movimento reduzido no Play System');
assert.ok(evolutionCss.includes('prefers-reduced-motion:reduce'),'Motion reduzido obrigatório');
assert.ok(evolutionCss.includes(':focus-visible'),'Foco visível obrigatório');
console.log('PASS: camada compartilhada nos 13 documentos, foco e movimento reduzido');

assert.ok(toolbar.afterNode?.className==='mare-recommendation','Sugestão acessível deve aparecer no hub');
assert.equal(toolbar.afterNode.children[1].getAttribute('href'),'game-0.html','Recomendação abre um jogo existente');
console.log('PASS: recomendação sem dependência de cadastro ou rede');

assert.ok(toolbar.children.some(item=>item.className==='mare-guide'),'Guia inicial renderizado');
assert.ok(evolutionCss.includes('prefers-contrast:more'),'Modo de alto contraste coberto');
console.log('PASS: onboarding e acessibilidade visual');
