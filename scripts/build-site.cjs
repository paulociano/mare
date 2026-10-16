'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=process.cwd(),out=path.join(root,'_site');
const pages=['index','recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma'];
const copied=new Set();
function copy(rel){if(copied.has(rel))return;assert.ok(!rel.startsWith('/')&&!rel.includes('..'),'Caminho não permitido: '+rel);const src=path.join(root,rel),dst=path.join(out,rel);assert.ok(fs.existsSync(src),'Arquivo de publicação ausente: '+rel);assert.ok(fs.statSync(src).isFile(),'Asset não é arquivo: '+rel);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);copied.add(rel)}
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const p of pages)copy(p+'.html');
for(const p of ['hub.js','modos.js','palavras-ptbr-5.txt','data/cardume-puzzles.json'])copy(p);
if(fs.existsSync('data/semantic-ranks.json'))copy('data/semantic-ranks.json');
copy('assets/ocean-depth.svg');
const backgrounds=fs.readdirSync('assets/backgrounds').filter(x=>/\.(svg|webp)$/.test(x));
for(const file of backgrounds)copy('assets/backgrounds/'+file);
for(const page of pages){
 const doc=fs.readFileSync(page+'.html','utf8');
 for(const m of doc.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)=["']([^"']+)["']/g)){
  const value=m[1];if(/^(?:https?:|#|data:|mailto:)/.test(value))continue;
  const rel=value.split(/[?#]/)[0];if(!rel)continue;
  if(rel.endsWith('.html')){assert.ok(pages.includes(path.basename(rel,'.html')),page+': destino não publicado '+rel);continue}
  if(/\.(js|css|svg|png|webp|mp4)$/.test(rel))copy(rel);
 }
}
for(const css of [...copied].filter(x=>x.endsWith('.css'))){
 const data=fs.readFileSync(css,'utf8');
 for(const m of data.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)){
  const url=m[1].trim();if(/^(data:|https?:|#)/.test(url))continue;
  const rel=path.normalize(path.join(path.dirname(css),url));
  if(rel.endsWith('.webp')&&!fs.existsSync(rel)&&fs.existsSync(rel.replace(/\.webp$/,'.svg')))continue;
  copy(rel);
 }
}
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('PASS: pacote Pages com '+copied.size+' arquivos, '+pages.length+' páginas e '+backgrounds.length+' cenários');
