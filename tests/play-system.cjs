'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const manifest=require('../config/site-manifest.json');
const css=fs.readFileSync('src/styles/shared/mare-play.css','utf8');
const home=fs.readFileSync('index.html','utf8');
assert.ok(home.includes('href="src/styles/shared/mare-evolution.css"'),'Home mantém a experiência de descoberta');
assert.ok(!home.includes('href="src/styles/shared/mare-play.css"'),'Camada de partidas não entra na homepage');
for(const page of manifest.pages.filter(p=>p!=='index')){
 const src=fs.readFileSync(page+'.html','utf8');
 assert.ok(src.includes('href="src/styles/shared/mare-play.css"'),page+': Play System não carregado');
 assert.equal(src.split('href="src/styles/shared/mare-play.css"').length-1,1,page+': Play System duplicado');
 assert.ok(!src.includes('href="src/styles/shared/mare-evolution.css"'),page+': CSS do hub não deve ser carregado no jogo');
 assert.equal((src.match(/<h1\b/g)||[]).length,1,page+': exatamente um H1');
 assert.ok(src.includes('href="./"'),page+': retorno ao catálogo ausente');
 assert.ok(src.includes('← Todos os jogos'),page+': retorno sem nomenclatura padronizada');
 assert.ok(src.includes('id="conteudo-principal"'),page+': área principal ausente');
 assert.ok(src.includes('class="mare-skip-link"'),page+': skip-link ausente');
 assert.ok(src.includes('class="mare-game-nav"'),page+': navegação entre jogos ausente');
 assert.equal((src.match(/class="mare-game-nav__name"/g)||[]).length,12,page+': navegação deve incluir todos os doze jogos');
 for(const link of ['perola.html','farol.html'])assert.ok(src.includes('href="'+link+'"'),page+': destino omitido da navegação '+link);
 assert.ok(src.includes('aria-current="page"'),page+': jogo atual sem marcação');
}
const recife=fs.readFileSync('recife.html','utf8');
assert.ok(recife.includes('<h1 class="recife-title-lockup">Recife</h1>'));
assert.ok(recife.includes('class="brand mare-brand-lockup" href="./"'));
for(const selector of ['--play-mint','--play-sand','body.mare-cardume #grid .tile',
                      '.mare-game-nav__link','prefers-reduced-motion:reduce',
                      'prefers-contrast:more',':focus-visible','[hidden]']){
 assert.ok(css.includes(selector),'Contrato Play System ausente: '+selector);
}
const evolved=fs.readFileSync('src/styles/shared/mare-evolution.css','utf8');
assert.ok(!evolved.includes('/* Shared game surfaces:'),'Estilos de partidas não devem continuar duplicados no hub');
console.log('PASS: 12 jogos, headings, estilos isolados, navegação, foco e reduced motion');
