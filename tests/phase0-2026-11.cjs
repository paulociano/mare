'use strict';
/* Fase 0 do plano de otimização (novembro de 2026): correções que os testes
   anteriores não viam porque só apareciam na tela ou em tela de toque. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

// 0.1 Enigma jogável por toque: teclado na tela ligado à mesma entrada do teclado físico.
const enigmaHtml=read('enigma.html'),enigma=read('src/scripts/games/enigma.js'),enigmaCss=read('src/styles/games/enigma.css');
assert.match(enigmaHtml,/<div class="enigma-dock">.*id="keys" class="enigma-keys" role="group"/s,'Enigma sem teclado na tela');
assert.ok(enigma.includes("'QWERTYUIOP','ASDFGHJKL','ZXCVBNM<'"),'Teclado do Enigma deve ter as 26 letras e apagar');
assert.ok(enigma.includes("input(b.dataset.key)"),'Teclas devem usar a mesma entrada do teclado físico');
assert.match(enigmaCss,/@media\(hover:none\),\(pointer:coarse\)\{\s*\.enigma-dock\{position:sticky;bottom:0/,'Pista e teclado devem ficar presos ao rodapé no toque');

// 0.2 Dicionário do Abismo fora do pacote inicial, guardado sob demanda.
const manifest=JSON.parse(read('config/site-manifest.json'));
assert.deepEqual(manifest.lazyOfflineFiles,['data/semantic-ranks.json']);
const build=read('scripts/build-site.cjs');
assert.ok(build.includes("!lazy.includes(file)"),'Arquivos sob demanda não entram no pré-cache');
assert.ok(build.includes("offlineBytes<=4*1024*1024"),'Orçamento do pacote offline: 4 MiB');
if(fs.existsSync('_site/sw.js')){
 const sw=read('_site/sw.js');
 assert.ok(!JSON.parse(sw.match(/const FILES=(\[.*?\]);/)[1]).includes('data/semantic-ranks.json'),'Dicionário do Abismo voltou ao pré-cache');
 assert.ok(sw.includes('const LAZY=new Set(["data/semantic-ranks.json"])'));
}

// 0.3 Cores do app instalado iguais às da interface.
const app=JSON.parse(read('app.webmanifest'));
assert.equal(app.theme_color,'#f8f3e8');assert.equal(app.background_color,'#f8f3e8');
assert.ok(read('index.html').includes('<meta name="theme-color" content="'+app.theme_color+'">'));

// 0.5 Cronômetro só corre com o jogador presente.
for(const game of ['enigma','marujo','trilha']){
 const src=read('src/scripts/games/'+game+'.js');
 assert.ok(src.includes('function begin()'),game+': relógio deve começar na primeira jogada');
 assert.ok(src.includes("addEventListener('visibilitychange'"),game+': relógio deve pausar com a aba oculta');
}

// 0.6 Piso de 12 px para texto (exceção: numerais das casas do Enigma).
const small=/font(?:-size)?:[^;}]*?\b(?:[0-9]|1[01])(?:\.[0-9]+)?px/g;
for(const dir of ['src/styles/shared','src/styles/games'])for(const file of fs.readdirSync(dir)){
 const css=read(dir+'/'+file).replace(/\.enigma-cell small\{[^}]*\}/g,'');
 assert.deepEqual(css.match(small)||[],[],dir+'/'+file+': texto abaixo de 12 px');
 assert.ok(!/font(?:-size)?:[^;}]*?(?:^|[\s(:])0?\.(?:[0-6]\d*|7[0-4]\d*)rem/.test(css),dir+'/'+file+': texto abaixo de .75rem');
}

// 0.7 Data legível na edição diária de Pérola e Farol.
const duo=read('src/scripts/games/mares-duo.js');
assert.ok(duo.includes("'DESAFIO DIÁRIO · '+dayLabel(day)"));
const dayLabel=new Function(duo.match(/function dayLabel[^\n]*/)[0]+';return dayLabel')();
assert.equal(dayLabel('2026-11-14'),'14 DE NOVEMBRO');assert.equal(dayLabel('x'),'x');

console.log('PASS: fase 0 — Enigma por toque, Abismo sob demanda, manifesto, relógios, piso de texto e datas');
