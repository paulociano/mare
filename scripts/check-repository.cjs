'use strict';
/**
 * Verifica a estrutura do repositório sem dependências externas.
 * Executar na raiz: node scripts/check-repository.cjs
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const manifest=require('../config/site-manifest.json');
const root=path.resolve(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const exists=relative=>fs.existsSync(path.join(root,relative));
const games=manifest.pages.filter(name=>name!=='index');
const unique=values=>new Set(values).size===values.length;
assert.ok(unique(manifest.pages),'Páginas duplicadas no manifesto');
assert.equal(games.length,10,'O catálogo deve conter exatamente dez jogos');
assert.ok(unique(manifest.requiredFiles),'Arquivos obrigatórios duplicados');
assert.ok(unique(manifest.optionalFiles),'Arquivos opcionais duplicados');
assert.ok(exists('index.html'),'Home ausente');
for(const page of manifest.pages){
 const filename=page+'.html';
 assert.ok(exists(filename),'Página ausente: '+filename);
 const html=read(filename);
 assert.ok(html.includes('lang="pt-BR"'),'Idioma ausente: '+filename);
 assert.ok(html.includes('<main'),'Elemento main ausente: '+filename);
 assert.ok(html.includes('mare-brand.css'),'Estilo da marca ausente: '+filename);
 assert.ok(html.includes('assets/brand/mare-favicon.svg'),'Favicon ausente: '+filename);
}
for(const file of manifest.requiredFiles)assert.ok(exists(file),'Arquivo obrigatório ausente: '+file);
assert.ok(exists(manifest.backgroundsDirectory),'Diretório de cenários ausente');
const home=read('index.html');
const cards=home.split('<article class="mar-game ').slice(1);
assert.equal(cards.length,games.length,'Quantidade de cards divergente do manifesto');
for(const name of games){
 assert.ok(home.includes('href="'+name+'.html"'),'Jogo sem link na home: '+name);
}
console.log('PASS: estrutura, manifesto, 11 páginas e 10 jogos');
