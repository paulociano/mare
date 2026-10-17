'use strict';
/** Validate the actual deployable output instead of only the source tree. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const manifest=require('../config/site-manifest.json');
const out=path.resolve(__dirname,'../_site');
const exists=relative=>fs.existsSync(path.join(out,relative));
const read=relative=>fs.readFileSync(path.join(out,relative),'utf8');
assert.ok(exists('.nojekyll'),'Pages package missing .nojekyll');
for(const page of manifest.pages){
 const filename=page+'.html';
 assert.ok(exists(filename),'Página ausente do pacote: '+filename);
 const html=read(filename);
 const styles=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)];
 assert.equal(styles.length,1,filename+': publicação deve carregar somente um CSS consolidado');
 assert.match(styles[0][1],/^styles\/mare-[a-f0-9]{12}\.css$/,filename+': CSS sem fingerprint');
 const combined=read(styles[0][1]);
 assert.ok(combined.includes('/* Source: src/styles/shared/mare-3.css */'),filename+': camada base de componentes ausente do bundle');
 assert.ok(combined.includes('/* Source: src/styles/shared/mare-brand.css */'),filename+': camada da marca ausente do bundle');
 for(const asset of combined.matchAll(/url\(\s*['"]?(\.\.\/[^'")]+)['"]?\s*\)/g)){
  const local=path.posix.normalize(path.posix.join(path.posix.dirname(styles[0][1]),asset[1].split(/[?#]/)[0]));
  if(local.endsWith('.webp')&&!exists(local)&&exists(local.replace(/\.webp$/,'.svg')))continue;
  assert.ok(exists(local),filename+': recurso CSS consolidado ausente '+local);
 }


 for(const match of html.matchAll(/<(?:script|link|img)\b[^>]*?(?:src|href)=["']([^"']+)["']/g)){
  const ref=match[1];
  if(/^(?:https?:|#|data:|mailto:)/.test(ref))continue;
  const local=ref.split(/[?#]/)[0];
  if(!local)continue;
  if(local.endsWith('.html')){
   assert.ok(exists(local),filename+': navegação quebrada '+local);
  }else if(/\.(js|css|svg|png|webp|mp4)$/.test(local)){
   assert.ok(exists(local),filename+': asset não publicado '+local);
  }
 }
}
for(const file of manifest.requiredFiles)assert.ok(exists(file),'Obrigatório ausente do pacote: '+file);
const activeCss=new Set(manifest.runtimeStyles||[]);
for(const file of activeCss)assert.ok(exists(file),'CSS dinâmico ausente: '+file);
for(const file of manifest.pages){
 const html=read(file+'.html');
 const assets=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)];
 assert.equal(assets.length,1,'CSS não consolidado: '+file);
}
assert.ok(!exists('src/styles/shared/mare-3.css'),'CSS-fonte duplicado no pacote de publicação');
assert.ok(!exists('src/styles/shared/mare-brand.css'),'CSS-fonte duplicado no pacote de publicação');

assert.ok(exists('src/scripts/games/recife.js'),'Recife sem script no pacote final');
for(const game of ['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo']){
 assert.ok(exists('assets/backgrounds/'+game+'.svg'),'Arte ausente: '+game);
}
for(const scene of ['naufrago','sinais'])assert.ok(exists('assets/backgrounds/'+scene+'.svg'),'Arte ausente: '+scene);
assert.ok(!exists('AUDITORIA.md'),'Relatório obsoleto não deve ser publicado');
assert.ok(exists('sw.js'),'Service worker versionado não foi publicado');
const worker=read('sw.js');
for(const page of manifest.pages)assert.ok(worker.includes(page+'.html'),'Jogo fora do cache: '+page);
assert.ok(worker.includes("mare-shell-"),'Cache sem versão determinística');
const app=JSON.parse(read('app.webmanifest'));
assert.equal(app.start_url,'./');assert.equal(app.scope,'./');assert.equal(app.display,'standalone');
for(const icon of app.icons){if(!icon.src.endsWith('.svg'))assert.ok(exists(icon.src),'Ícone instalável ausente: '+icon.src)}

console.log('PASS: artefato Pages completo, links internos e assets essenciais');
