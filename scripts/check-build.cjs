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
assert.ok(exists('recife.js'),'Recife sem script no pacote final');
for(const game of ['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo']){
 assert.ok(exists('assets/backgrounds/'+game+'.svg'),'Arte ausente: '+game);
}
for(const scene of ['naufrago','sinais'])assert.ok(exists('assets/backgrounds/'+scene+'.svg'),'Arte ausente: '+scene);
assert.ok(!exists('AUDITORIA.md'),'Relatório obsoleto não deve ser publicado');
console.log('PASS: artefato Pages completo, links internos e assets essenciais');
