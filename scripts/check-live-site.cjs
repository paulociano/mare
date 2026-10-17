'use strict';
/**
 * Compares the *deployed* GitHub Pages shell with this run's built _site/ files.
 * HTTP 200 alone is insufficient: stale CDN contents and missing offline assets
 * must fail the release gate.
 *
 * Usage: MARE_LIVE_URL=https://owner.github.io/repo/ node scripts/check-live-site.cjs
 * Node.js >=20; no third-party dependencies.
 */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs/promises');
const path=require('node:path');

const SITE=path.resolve(__dirname,'../_site');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16);
const pause=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));

async function verifyPublished(siteUrl, request=globalThis.fetch){
 const base=new URL(siteUrl);
 assert.equal(base.protocol,'https:','A URL pública precisa usar HTTPS');
 assert.ok(base.pathname.endsWith('/'),'A URL da publicação deve terminar com /');
 assert.ok(!base.search&&!base.hash,'A URL de publicação não deve conter query/hash');
 const worker=await fs.readFile(path.join(SITE,'sw.js'),'utf8');
 const manifest=worker.match(/const FILES=(\[[^\n]*\]);/);
 assert.ok(manifest,'Não foi possível ler o manifesto offline do build');
 const files=JSON.parse(manifest[1]);
 assert.ok(Array.isArray(files)&&files.length>=13,'Manifesto offline vazio ou inválido');
 for(const name of ['index.html','app.webmanifest']){
  assert.ok(files.includes(name),'Arquivo obrigatório fora do precache: '+name);
 }
 const checks=['', 'sw.js',...files];
 const problems=[];
 let cursor=0;
 const jobs=Array.from({length:Math.min(8,checks.length)},async()=>{
  while(cursor<checks.length){
   const index=cursor++;
   const name=checks[index];
   const relative=name||'index.html';
   try{
    assert.ok(relative&&!relative.startsWith('/')&&!relative.includes('..'),'Caminho inseguro: '+relative);
    const target=new URL(name,base);
    const response=await request(target.href,{
     cache:'no-store',
     signal:AbortSignal.timeout(20000),
     headers:{'Accept':'*/*'}
    });
    if(!response.ok)throw new Error('HTTP '+response.status);
    const actual=Buffer.from(await response.arrayBuffer());
    const expected=await fs.readFile(path.join(SITE,relative));
    if(!actual.equals(expected)){
     throw new Error('conteúdo diferente do build (local '+digest(expected)+', público '+digest(actual)+')');
    }
   }catch(error){
    problems.push((name||'[rota raiz]')+': '+error.message);
   }
  }
 });
 await Promise.all(jobs);
 if(problems.length){
  throw new Error(problems.length+' falhas na publicação:\n'+problems.slice(0,12).join('\n'));
 }
 return {checked:checks.length,files:files.length,cache:worker.match(/mare-shell-[a-f0-9]{18}/)?.[0]||'unknown'};
}

async function main(){
 const url=process.env.MARE_LIVE_URL||process.argv[2];
 if(!url)throw new Error('MARE_LIVE_URL não definido');
 const attempts=6;
 for(let attempt=1;attempt<=attempts;attempt++){
  try{
   const checked=await verifyPublished(url);
   console.log('PASS: publicação HTTPS íntegra, '+checked.checked+' rotas/assets, '+checked.files+' arquivos offline, '+checked.cache);
   return;
  }catch(error){
   console.error('Verificação pública '+attempt+'/'+attempts+': '+error.message);
   if(attempt===attempts)throw error;
   await pause(8000);
  }
 }
}
if(require.main===module){
 main().catch(error=>{console.error('FAIL: verificação de publicação:',error.message);process.exitCode=1;});
}
module.exports={verifyPublished};
