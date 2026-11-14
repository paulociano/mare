'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const home=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/styles/shared/mare-studio.css','utf8');
assert.equal((home.match(/<h1\b/g)||[]).length,1,'Homepage deve ter um H1');
assert.match(home,/class="mare-studio-hero"/);
assert.match(home,/data-ocean-scene aria-hidden="true"/);
assert.ok(home.includes('href="src/styles/shared/mare-studio.css"'));
assert.ok(!home.includes('mare-ocean.js'),'O shader WebGL antigo foi aposentado: a gravura é SVG');
assert.ok(!fs.existsSync('src/scripts/shared/mare-ocean.js'),'mare-ocean.js não deve voltar sem uso');
assert.match(home,/id="jogos"/);
assert.match(home,/href="#jogos"/);
const cards=[...home.matchAll(/<article class="mar-game\b/g)];
assert.equal(cards.length,12,'12 jogos devem continuar no catálogo');
for(const page of ['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma','perola','farol']){
  assert.ok(home.includes('href="'+page+'.html"'),'Rota obrigatória: '+page);
}
assert.match(css,/article\.mar-game\[hidden\]\{display:none!important\}/,'Filtragem precisa ocultar cards');
assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(css,/@media\(max-width:520px\)/);
console.log('PASS: Oceanic Studio semantic structure, all games, static engraving without WebGL');