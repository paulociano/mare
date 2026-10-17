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
const rootSource=fs.readdirSync(root).filter(file=>/\.(?:css|js)$/.test(file));
assert.deepEqual(rootSource,[], 'Estilos e scripts devem estar em src/, não na raiz');

const unique=values=>new Set(values).size===values.length;
assert.ok(unique(manifest.pages),'Páginas duplicadas no manifesto');
assert.equal(games.length,12,'O catálogo deve conter exatamente doze jogos');
assert.ok(unique(manifest.requiredFiles),'Arquivos obrigatórios duplicados');
assert.ok(unique(manifest.optionalFiles),'Arquivos opcionais duplicados');
assert.ok(exists('index.html'),'Home ausente');
for(const page of manifest.pages){
 const filename=page+'.html';
 assert.ok(exists(filename),'Página ausente: '+filename);
 const html=read(filename);
 assert.ok(html.includes('lang="pt-BR"'),'Idioma ausente: '+filename);
 assert.ok(html.includes('<main'),'Elemento main ausente: '+filename);
 assert.ok(html.includes('src/styles/shared/mare-brand.css'),'Estilo da marca ausente: '+filename);
 const localStyles=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+\.css)(?:[?#][^"']*)?["']/g)].map(x=>x[1]);
 for(const file of localStyles)assert.match(file,/^src\/styles\/(?:games|shared)\/[^/]+\.css$/,filename+': CSS fora de src: '+file);
 const localScripts=[...html.matchAll(/<script\b[^>]*src=["']([^"']+\.js)["']/g)].map(x=>x[1]);
 for(const file of localScripts)assert.match(file,/^src\/scripts\/(?:games|shared)\/[^/]+\.js$/,filename+': JS fora de src: '+file);

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
assert.ok(exists('README.md'),'README obrigatório ausente');
assert.ok(exists('docs/ARCHITECTURE.md'),'Documentação arquitetural ausente');
assert.ok(!exists('AUDITORIA.md'),'Auditoria histórica obsoleta ressurgiu na raiz');
assert.ok(!exists('docs/roadmap-20-melhorias-execucao.md'),'Roadmap histórico obsoleto ressurgiu');
console.log('PASS: estrutura, manifesto, 13 páginas e 12 jogos');
