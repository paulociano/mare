'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const root=process.cwd(),out=path.join(root,'_site');
const manifest=require('../config/site-manifest.json');
const pages=manifest.pages;
const copied=new Set();
function copy(rel){if(copied.has(rel))return;assert.ok(!rel.startsWith('/')&&!rel.includes('..'),'Caminho não permitido: '+rel);const src=path.join(root,rel),dst=path.join(out,rel);assert.ok(fs.existsSync(src),'Arquivo de publicação ausente: '+rel);assert.ok(fs.statSync(src).isFile(),'Asset não é arquivo: '+rel);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);copied.add(rel)}
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const p of pages)copy(p+'.html');
for(const p of manifest.requiredFiles)copy(p);
for(const p of manifest.optionalFiles)if(fs.existsSync(p))copy(p);
const backgrounds=fs.readdirSync(manifest.backgroundsDirectory).filter(x=>/\.(svg|webp)$/.test(x));
for(const file of backgrounds)copy(manifest.backgroundsDirectory+'/'+file);
for(const page of pages){
 const doc=fs.readFileSync(page+'.html','utf8');
 for(const m of doc.matchAll(/<(?:script|link|img)\b[^>]*?(?:src|href)=["']([^"']+)["']/g)){
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

/*
 * Consolida estilos e scripts compartilhados sem mudar a ordem declarada no HTML.
 *
 * Cada página lista seus arquivos na ordem da cascata. Arquivos vizinhos usados
 * pelo mesmo conjunto de páginas viram um pacote; onde o conjunto muda, o pacote
 * termina. A ordem das regras é exatamente a de autoria, mas o que é comum a
 * todas as páginas fica em um arquivo só, baixado e guardado uma única vez, e
 * trocar de jogo baixa apenas a folha daquele jogo.
 */
const hashOf=text=>crypto.createHash('sha256').update(text).digest('hex').slice(0,12);
function segment(list,keyOf){
 const runs=[];
 for(const item of list){
  const key=keyOf(item),last=runs[runs.length-1];
  if(last&&last.key===key)last.items.push(item);else runs.push({key,items:[item]});
 }
 return runs;
}
function usageOf(perPage,idOf){
 const usage=new Map();
 for(const [page,list] of perPage)for(const item of list){
  const id=idOf(item);if(!usage.has(id))usage.set(id,new Set());usage.get(id).add(page);
 }
 return id=>[...usage.get(id)].sort().join(',');
}

const styleLink=/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+\.css(?:[?#][^"']*)?)["'][^>]*>/gi;
const pageStyles=new Map();
for(const page of pages){
 const html=fs.readFileSync(path.join(out,page+'.html'),'utf8');
 const styles=[...html.matchAll(styleLink)].map(match=>match[1].split(/[?#]/)[0]);
 if(styles.some(file=>file.startsWith('/')||file.includes('..')||!copied.has(file))){
  throw new Error(page+': stylesheet fora do inventário');
 }
 assert.equal(new Set(styles).size,styles.length,page+': stylesheet repetido');
 pageStyles.set(page,styles);
}
const styleUsage=usageOf(pageStyles,file=>file);
const bundles=new Map();
function styleBundle(files){
 const bundleKey=JSON.stringify(files);
 if(bundles.has(bundleKey))return bundles.get(bundleKey);
 const imports=[],chunks=[];
 for(const file of files){
  let css=fs.readFileSync(path.join(root,file),'utf8');
  // Hoist @import rules because CSS requires them before normal rules.
  css=css.replace(/@import\s+url\(\s*(["'])(.*?)\1\s*\)\s*;/g,rule=>{
   if(!imports.includes(rule))imports.push(rule);
   return '';
  });
  // Bundles live in styles/ while sources live at the repository root.
  // Rebase relative asset URLs without touching data, remote or fragment URLs.
  css=css.replace(/url\(\s*(["']?)([^)"']+)\1\s*\)/g,(whole,quote,url)=>{
   const value=url.trim();
   if(/^(?:data:|https?:|\/|#)/i.test(value))return whole;
   const rebased=path.posix.relative('styles',path.posix.normalize(path.posix.join(path.posix.dirname(file),value)));
   return 'url('+quote+rebased+quote+')';
  });
  chunks.push('/* Source: '+file+' */\n'+css);
 }
 const combined=imports.join('\n')+'\n'+chunks.join('\n');
 const bundle='styles/mare-'+hashOf(bundleKey+'\0'+combined)+'.css';
 fs.mkdirSync(path.join(out,'styles'),{recursive:true});
 fs.writeFileSync(path.join(out,bundle),combined);
 copied.add(bundle);bundles.set(bundleKey,bundle);
 return bundle;
}

// Scripts compartilhados são IIFEs estritas sem declarações globais, então podem
// ser unidos. Cada um continua isolado: se um falhar, os seguintes ainda rodam
// e o erro é relançado para o console e para os relatórios de erro.
const scriptTag=/<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi;
const sharedScript=file=>file.startsWith('src/scripts/shared/');
const scriptMode=attrs=>/\bdefer\b/.test(attrs)?'defer':/\basync\b/.test(attrs)?'async':'sync';
const pageScripts=new Map();
for(const page of pages){
 const html=fs.readFileSync(path.join(out,page+'.html'),'utf8');
 pageScripts.set(page,[...html.matchAll(scriptTag)].map(match=>({file:match[2].split(/[?#]/)[0],mode:scriptMode(match[1]+' '+match[3])})));
}
const scriptId=item=>item.mode+':'+item.file;
const scriptUsage=usageOf(pageScripts,scriptId);
const scriptBundles=new Map(),bundledScripts=new Set();
function scriptBundle(files){
 const bundleKey=JSON.stringify(files);
 if(scriptBundles.has(bundleKey))return scriptBundles.get(bundleKey);
 const parts=files.map(file=>{
  const code=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(/^\s*'use strict';/.test(code),file+': script compartilhado precisa ser estrito para entrar no pacote');
  assert.ok(!/^(?:const|let|var|function|class)\s/m.test(code),file+': script compartilhado não pode declarar globais');
  return '/* Source: '+file+' */\ntry{\n'+code+'\n}catch(error){setTimeout(()=>{throw error})}';
 });
 const combined="'use strict';\n"+parts.join('\n')+'\n';
 const bundle='scripts/mare-'+hashOf(bundleKey+'\0'+combined)+'.js';
 fs.mkdirSync(path.join(out,'scripts'),{recursive:true});
 fs.writeFileSync(path.join(out,bundle),combined);
 copied.add(bundle);scriptBundles.set(bundleKey,bundle);
 for(const file of files)bundledScripts.add(file);
 return bundle;
}

const standaloneScripts=new Set();
for(const page of pages){
 const filename=page+'.html';
 let html=fs.readFileSync(path.join(out,filename),'utf8');

 const styleRuns=segment(pageStyles.get(page),styleUsage);
 const styleFirst=new Map(styleRuns.map(run=>[run.items[0],styleBundle(run.items)]));
 // Replace only stylesheet links, keeping other link elements unchanged.
 html=html.replace(styleLink,(whole,href)=>{
  const file=href.split(/[?#]/)[0];
  return styleFirst.has(file)?'<link rel="stylesheet" href="'+styleFirst.get(file)+'">':'';
 });

 const scriptRuns=segment(pageScripts.get(page),item=>sharedScript(item.file)?scriptUsage(scriptId(item))+'|'+item.mode:'solo:'+item.file);
 const scriptFirst=new Map(),scriptDrop=new Set();
 for(const run of scriptRuns){
  if(run.items.length<2){standaloneScripts.add(run.items[0].file);continue}
  const bundle=scriptBundle(run.items.map(item=>item.file));
  scriptFirst.set(run.items[0].file,{bundle,mode:run.items[0].mode});
  for(const item of run.items.slice(1))scriptDrop.add(item.file);
 }
 html=html.replace(scriptTag,(whole,before,src)=>{
  const file=src.split(/[?#]/)[0];
  if(scriptDrop.has(file))return '';
  const first=scriptFirst.get(file);
  if(!first)return whole;
  return '<script src="'+first.bundle+'"'+(first.mode==='sync'?'':' '+first.mode)+'></script>';
 });
 fs.writeFileSync(path.join(out,filename),html);
}
// Do not duplicate the original CSS layers in the deployable offline package.
// Only runtime-injected stylesheets must remain addressable by their original URL.
const runtimeStyles=new Set(manifest.runtimeStyles||[]);
for(const file of [...copied]){
 if(!file.endsWith('.css')||file.startsWith('styles/')||runtimeStyles.has(file))continue;
 fs.rmSync(path.join(out,file));
 copied.delete(file);
}
for(const file of runtimeStyles)assert.ok(copied.has(file),'CSS dinâmico não publicado: '+file);
// O mesmo vale para scripts que só existem dentro de um pacote.
for(const file of bundledScripts){
 if(standaloneScripts.has(file)||!copied.has(file))continue;
 fs.rmSync(path.join(out,file));
 copied.delete(file);
}
console.log('CSS: '+bundles.size+' pacotes para '+pages.length+' páginas; JS compartilhado: '+scriptBundles.size+' pacotes');

fs.writeFileSync(path.join(out,'.nojekyll'),'');

// PWA shell is generated only AFTER all assets are copied. Version includes
// content digests, not a mutable deployment date; cache updates are atomic.
// Arquivos grandes que só um jogo usa ficam fora do pacote inicial: o worker
// os guarda na primeira visita ao jogo e os serve offline a partir daí.
const lazy=(manifest.lazyOfflineFiles||[]).filter(file=>copied.has(file)).sort();
const precache=[...copied].filter(file=>!file.endsWith('.map')&&!lazy.includes(file)).sort();
const lazyDigest=crypto.createHash('sha256');
for(const file of lazy){lazyDigest.update(file+'\0');lazyDigest.update(fs.readFileSync(path.join(out,file)));lazyDigest.update('\0')}
const lazyVersion=lazyDigest.digest('hex').slice(0,18);
const digest=crypto.createHash('sha256');
for(const file of precache){
 digest.update(file+'\0');digest.update(fs.readFileSync(path.join(out,file)));digest.update('\0');
}
// Full offline shell budget; refuse unbounded precache growth.
const offlineBytes=precache.reduce((sum,file)=>sum+fs.statSync(path.join(out,file)).size,0);
assert.ok(offlineBytes<=4*1024*1024,'Pacote offline excede 4 MiB: '+offlineBytes);
const version=digest.digest('hex').slice(0,18);
const worker=[
 "'use strict';",
 "/* Generated by scripts/build-site.cjs. Do not edit _site/sw.js. */",
 "const CACHE='mare-shell-"+version+"';",
 "const FILES="+JSON.stringify(precache)+";",
 "const PATHS=new Set(FILES);",
 "const DATA='mare-data-"+lazyVersion+"';",
 "const LAZY=new Set("+JSON.stringify(lazy)+");",
 "self.addEventListener('install',event=>{",
 " event.waitUntil((async()=>{",
 "  const cache=await caches.open(CACHE);",
 "  try{await cache.addAll(FILES.map(file=>new Request(new URL(file,self.registration.scope),{cache:'reload'})));}",
 "  catch(error){await caches.delete(CACHE);throw error;}",
 " })());",
 "});",
 "self.addEventListener('activate',event=>{",
 " event.waitUntil((async()=>{",
 "  const keys=await caches.keys();",
 "  await Promise.all(keys.filter(k=>(k.startsWith('mare-shell-')&&k!==CACHE)||(k.startsWith('mare-data-')&&k!==DATA)).map(k=>caches.delete(k)));",
 "  await self.clients.claim();",
 " })());",
 "});",
 "self.addEventListener('message',event=>{",
 " if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();",
 "});",
 "self.addEventListener('fetch',event=>{",
 " const req=event.request;",
 " if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;",
 " const scope=new URL(self.registration.scope);",
 " const url=new URL(req.url);",
 " if(!url.pathname.startsWith(scope.pathname))return;",
 " const relative=url.pathname.slice(scope.pathname.length)||'index.html';",
 " if(LAZY.has(relative)){",
 "  event.respondWith((async()=>{",
 "   const cache=await caches.open(DATA);",
 "   const key=new URL(relative,scope).href;",
 "   const hit=await cache.match(key);",
 "   if(hit)return hit;",
 "   const response=await fetch(req);",
 "   if(response.ok)event.waitUntil(cache.put(key,response.clone()).catch(()=>{}));",
 "   return response;",
 "  })());",
 "  return;",
 " }",
 " if(!PATHS.has(relative))return;",
 " event.respondWith((async()=>{",
 "  const cache=await caches.open(CACHE);",
 "  const key=new URL(relative,scope).href;",
 "  const response=await cache.match(key);",
 "  return response||fetch(req);",
 " })());",
 "});"
].join('\n')+'\n';
fs.writeFileSync(path.join(out,'sw.js'),worker);

console.log('PASS: pacote Pages com '+copied.size+' arquivos, '+pages.length+' páginas e '+backgrounds.length+' cenários');
