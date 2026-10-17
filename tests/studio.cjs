'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const home=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/styles/shared/mare-studio.css','utf8');
const scene=fs.readFileSync('src/scripts/shared/mare-ocean.js','utf8');
new vm.Script(scene,{filename:'src/scripts/shared/mare-ocean.js'});
assert.equal((home.match(/<h1\b/g)||[]).length,1,'Homepage deve ter um H1');
assert.match(home,/class="mare-studio-hero"/);
assert.match(home,/data-ocean-scene aria-hidden="true"/);
assert.ok(home.includes('href="src/styles/shared/mare-studio.css"'));
assert.ok(home.includes('src="src/scripts/shared/mare-ocean.js" defer'));
assert.match(home,/id="jogos"/);
assert.match(home,/href="#jogos"/);
const cards=[...home.matchAll(/<article class="mar-game\b/g)];
assert.equal(cards.length,12,'12 jogos devem continuar no catálogo');
for(const page of ['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma','perola','farol']){
  assert.ok(home.includes('href="'+page+'.html"'),'Rota obrigatória: '+page);
}
for(const guard of ['prefers-reduced-motion','saveData','max-width: 720px','IntersectionObserver','pagehide','webglcontextlost']){
  assert.ok(scene.includes(guard),'Proteção da GPU ausente: '+guard);
}
assert.ok(scene.includes("import('https://cdn.jsdelivr.net/npm/three@0.180.0/"),'Dependência Three.js deve estar fixada');
assert.match(css,/article\.mar-game\[hidden\]\{display:none!important\}/,'Filtragem precisa ocultar cards');
assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(css,/@media\(max-width:520px\)/);
console.log('PASS: Oceanic Studio semantic structure, all games, shader source and GPU bypass gates');