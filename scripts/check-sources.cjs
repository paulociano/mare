'use strict';
/**
 * Static source-quality gate for the zero-dependency Pages application.
 * It never changes source files or relies on browser/DOM state.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const manifest=require('../config/site-manifest.json');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const exists=relative=>fs.existsSync(path.join(root,relative));
const pages=manifest.pages;
const sources=new Set();
const cssFiles=new Set();
const jsFiles=new Set();
const excluded=new Set(['node_modules','.git','_site','coverage']);
function collect(dir=''){
 for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  if(excluded.has(entry.name))continue;
  const relative=path.posix.join(dir,entry.name);
  if(entry.isDirectory())collect(relative);
  else if(entry.isFile()&&relative.endsWith('.js'))jsFiles.add(relative);
 }
}
collect();
for(const page of pages){
 const html=read(page+'.html');
 const styles=[...html.matchAll(/<link\b[^>]*?rel=["']stylesheet["'][^>]*?href=["']([^"']+)["']/g)].map(m=>m[1].split(/[?#]/)[0]);
 assert.ok(styles.length>0,page+': nenhum stylesheet');
 assert.equal(styles.length,new Set(styles).size,page+': CSS carregado mais de uma vez');
 assert.ok(styles.includes('mare-3.css'),page+': camada de componentes ausente');
 assert.ok(styles.includes('mare-brand.css'),page+': camada de marca ausente');
 assert.ok(styles.indexOf('mare-brand.css')>styles.indexOf('mare-3.css'),page+': marca deve carregar depois da camada de componentes');
 for(const css of styles){assert.ok(exists(css),page+': CSS ausente '+css);cssFiles.add(css)}
 for(const match of html.matchAll(/<(?:script|img)\b[^>]*?src=["']([^"']+)["']/g)){
  const url=match[1].split(/[?#]/)[0];
  if(/^(?:https?:|data:)/.test(url))continue;
  assert.ok(exists(url),page+': recurso não encontrado '+url);
  if(url.endsWith('.js'))jsFiles.add(url);
 }
}
for(const filename of [...jsFiles].sort()){
 const script=read(filename);
 try{new vm.Script(script,{filename})}catch(error){throw new Error(filename+': sintaxe inválida: '+error.message)}
}
for(const file of cssFiles){
 const css=read(file);
 for(const match of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)){
  const url=match[1].trim();
  if(/^(?:data:|https?:|#)/.test(url))continue;
  const relative=path.posix.normalize(path.posix.join(path.posix.dirname(file),url.split(/[?#]/)[0]));
  if(relative.endsWith('.webp')&&!exists(relative)&&exists(relative.replace(/\.webp$/,'.svg')))continue;
  assert.ok(!relative.startsWith('../')&&exists(relative),file+': recurso CSS ausente '+relative);
 }
}
const artwork=read('mare-3.css');
for(const [className,asset] of [['mar-forca','naufrago.svg'],['mar-criptograma','sinais.svg']]){
 const marker='.mare-hub .mar-game.'+className+'{background-image:';
 assert.equal(artwork.split(marker).length-1,1,'Cenário duplicado: '+className);
 assert.ok(artwork.split(marker)[1].split('}')[0].includes('assets/backgrounds/'+asset),'Cenário errado: '+className);
}

/* Guard against new abandoned CSS layers. Dynamic stylesheets count as
 * references when their path is mentioned by runtime JavaScript. */
const topLevelCss=fs.readdirSync(root).filter(file=>file.endsWith('.css'));
const javascript=[...jsFiles].map(file=>read(file)).join('\n');
for(const file of topLevelCss){
 assert.ok(cssFiles.has(file)||javascript.includes(file),
  'Folha CSS sem consumidor: '+file);
}
console.log('PASS: '+pages.length+' páginas, '+jsFiles.size+' scripts e '+cssFiles.size+' estilos validados');
