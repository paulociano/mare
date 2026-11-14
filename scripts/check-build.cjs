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
 assert.ok(styles.length>=1&&styles.length<=7,filename+': esperado de 1 a 7 pacotes de CSS, há '+styles.length);
 for(const style of styles)assert.match(style[1],/^styles\/mare-[a-f0-9]{12}\.css$/,filename+': CSS sem fingerprint');
 const combined=styles.map(style=>read(style[1])).join('\n');
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
// Um arquivo obrigatório pode estar publicado como arquivo ou dentro de um pacote de scripts.
const scriptBundles=fs.existsSync(path.join(out,'scripts'))?fs.readdirSync(path.join(out,'scripts')).map(name=>read('scripts/'+name)):[];
const published=file=>exists(file)||scriptBundles.some(bundle=>bundle.includes('/* Source: '+file+' */'));
for(const file of manifest.requiredFiles)assert.ok(published(file),'Obrigatório ausente do pacote: '+file);
const activeCss=new Set(manifest.runtimeStyles||[]);
for(const file of activeCss)assert.ok(exists(file),'CSS dinâmico ausente: '+file);
for(const file of manifest.pages){
 const html=read(file+'.html');
 const assets=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)];
 assert.ok(assets.every(asset=>asset[1].startsWith('styles/mare-')),'CSS não consolidado: '+file);
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

// Orçamento de entrega (plano de otimização, fase 1). Os limites têm folga sobre
// o medido em novembro de 2026 e existem para a próxima fase não desfazer o ganho.
const size=relative=>fs.statSync(path.join(out,relative)).size;
const usedBy=new Map();
const pageAssets=new Map();
for(const page of manifest.pages){
 const html=read(page+'.html');
 const styles=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)].map(match=>match[1]);
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(match=>match[1]);
 pageAssets.set(page,{styles,scripts});
 for(const file of styles){if(!usedBy.has(file))usedBy.set(file,new Set());usedBy.get(file).add(page)}
}
const allCss=fs.readdirSync(path.join(out,'styles')).reduce((sum,name)=>sum+size('styles/'+name),0);
assert.ok(allCss<=450*1024,'CSS publicado excede 450 KiB somados: '+allCss);
for(const [page,{styles,scripts}] of pageAssets){
 const own=styles.filter(file=>usedBy.get(file).size<=2).reduce((sum,file)=>sum+size(file),0);
 assert.ok(own<=48*1024,page+': CSS exclusivo da página excede 48 KiB: '+own);
 assert.ok(scripts.length<=8,page+': mais de 8 scripts ('+scripts.length+')');
 if(page!=='index')assert.ok(!read(page+'.html').includes('mare-gsap')&&!scripts.some(file=>read(file).includes('gsap-3.15.0.min.js')),page+': GSAP só deve ser carregado no hub');
}
assert.ok(size('sw.js')>0);

console.log('PASS: artefato Pages completo, links internos, assets essenciais e orçamento de entrega');
