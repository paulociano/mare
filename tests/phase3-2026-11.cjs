'use strict';
/* Fase 3 do plano de otimização (novembro de 2026): moldura de jogo e entrada por toque. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const manifest=JSON.parse(read('config/site-manifest.json'));
const games=manifest.pages.filter(page=>page!=='index');
const shell=read('src/styles/shared/mare-shell.css');

// Moldura compacta: mesma folha nos 12 jogos, junto das folhas de jogo.
for(const game of games)assert.ok(read(game+'.html').includes('<link rel="stylesheet" href="src/styles/shared/mare-finesse.css"><link rel="stylesheet" href="src/styles/shared/mare-shell.css">'),game+': sem a moldura compacta');
assert.ok(!read('index.html').includes('mare-shell.css'));
assert.match(shell,/^@layer mare-shell\{/m);
assert.ok(shell.includes('overscroll-behavior-y:contain'),'Puxar a página não deve recarregar a partida');
assert.match(shell,/@media \(max-width:650px\)\{[\s\S]*display:none!important/,'No celular, sobretítulo e descrição cedem lugar ao tabuleiro');

// Um nome só para cada coisa.
for(const game of games){
 const html=read(game+'.html');
 for(const old of ['>Desafio diário</button>','>Jogo livre</button>','Como navegar','? Regras'])assert.ok(!html.includes(old),game+': rótulo antigo "'+old+'"');
 // No Cardume os botões são ações do tabuleiro ("Desafio de hoje"), não abas de modo.
 if(game!=='cardume'&&html.includes('id="daily"'))assert.match(html,/<button id="daily"[^>]*>Diário<\/button>/,game+': modo diário');
 if(game!=='cardume'&&html.includes('id="free"'))assert.match(html,/<button id="free"[^>]*>Livre<\/button>/,game+': modo livre');
 if(/id="(?:help|rules)"/.test(html)&&/<button id="(?:help|rules)"/.test(html))assert.match(html,/<button id="(?:help|rules)"[^>]*>Como jogar<\/button>/,game+': ajuda');
}

// Pérola: letras tocáveis, com o campo de texto ainda disponível.
const duo=read('src/scripts/games/mares-duo.js');
for(const token of ["b.className='depth-letter'","$('entry').value+=letter;syncLetters()","function syncLetters()","$('entry').addEventListener('input',syncLetters)","'Apagar letra'"])assert.ok(duo.includes(token),'Pérola sem: '+token);
assert.ok(read('perola.html').includes('id="entry"'),'Pérola mantém o campo de texto');

// Sinais: teclado na tela no toque; campo de texto para teclado físico.
const sinais=read('src/scripts/games/criptograma.js'),newgames=read('src/styles/shared/mare-newgames.css');
assert.ok(read('criptograma.html').includes('<div id="keys" class="crypto-keys" role="group" aria-label="Teclado de letras"></div>'));
for(const token of ["matchMedia('(hover:none),(pointer:coarse)')","function focusGuess(){if(!touch)$('guess').focus()}","setLetter(b.dataset.key)","paintKeys()"])assert.ok(sinais.includes(token),'Sinais sem: '+token);
assert.match(newgames,/\.crypto-keys\{display:none\}\s*@media\(hover:none\),\(pointer:coarse\)\{/);
assert.ok(newgames.includes('.crypto-tile.crypto-correct:not(.selected) .crypto-letter{color:var(--kan-green'),'Casa correta precisa ser legível no tema claro');
console.log('PASS: fase 3 — moldura compacta, rótulos únicos, Pérola e Sinais por toque');
