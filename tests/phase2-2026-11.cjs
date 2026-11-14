'use strict';
/* Fase 2 do plano de otimização (novembro de 2026): hub com jogar em primeiro lugar. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const home=read('index.html'),css=read('src/styles/shared/mare-hub.css'),hub=read('src/scripts/shared/hub.js');

assert.ok(home.includes('<link rel="stylesheet" href="src/styles/shared/mare-hub.css">'),'Hub sem a folha de layout');
for(const page of JSON.parse(read('config/site-manifest.json')).pages)if(page!=='index')assert.ok(!read(page+'.html').includes('mare-hub.css'),page+': folha do hub fora do hub');

// Só layout, em camada própria: a camada vence as folhas antigas sem disputar especificidade.
assert.match(css,/^@layer mare-hub\{/m);
assert.ok(!/font-family\s*:/.test(css),'A folha do hub não troca a família tipográfica');
assert.ok(css.includes('[data-mare-contrast="high"] body.mare-hub .mar-top nav{background:#061925!important'),'Barra inferior precisa de versão em alto contraste');

// Ordem: apresentação, continuar, sugestão, catálogo; depois diário, selos e amigos.
const order=sel=>Number(css.match(new RegExp(sel.replace(/[.#>]/g,'\\$&')+'\\{order:(-?\\d+)!important\\}'))?.[1]);
const sequence=['main>.mare-studio-hero','main>#continuar','main>.mare-recommendation','main>.mar-section-head','main>.mare-discover','main>#jogos','main>#diario-de-bordo','main>#colecao-de-selos','main>#desafios-entre-amigos'].map(order);
assert.ok(sequence.every(Number.isFinite),'Ordem do hub incompleta: '+sequence);
assert.deepEqual([...sequence].sort((a,b)=>a-b),sequence,'Jogos devem vir antes de diário, selos e convites');

// Catálogo denso e navegação de app no celular.
assert.match(css,/#jogos\.mar-catalog\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
assert.match(css,/\.mar-top nav\{position:fixed!important;[^}]*bottom:0!important;[^}]*env\(safe-area-inset-bottom/);
assert.ok(home.includes('<a href="#ajustes-de-leitura">Ajustes</a>'),'Rótulo curto para caber na barra inferior');

// O cartão inteiro leva ao jogo e mostra o estado do dia.
assert.match(css,/\.mar-game \.mar-cta::after\{content:""!important;position:absolute!important;inset:0!important/);
for(const token of ["progress.dailyChallenge().day","progress.recent(new Date(), 20)","'Vencido hoje'","'Jogado hoje'","card.dataset.today = outcome"])assert.ok(hub.includes(token),'hub.js sem: '+token);
console.log('PASS: fase 2 — hub reordenado, catálogo em duas colunas, estado do dia e barra inferior');
