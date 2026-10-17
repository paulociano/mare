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
 * Combine stylesheets after dependency discovery, preserving cascade order.
 * Sources remain individually testable; published pages need one CSS request.
 * Hoist @import rules because CSS requires them before normal rules.
 */
const bundles=new Map();
for(const page of pages){
 const filename=page+'.html';
 let html=fs.readFileSync(path.join(out,filename),'utf8');
 const links=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+\.css(?:[?#][^"']*)?)["'][^>]*>/gi)];
 if(links.length===0)continue;
 const styles=links.map(match=>match[1].split(/[?#]/)[0]);
 if(styles.some(file=>file.startsWith('/')||file.includes('..')||!copied.has(file))){
  throw new Error(page+': stylesheet fora do inventário');
 }
 const bundleKey=JSON.stringify(styles);
 let bundle=bundles.get(bundleKey);
 if(!bundle){
  const imports=[],chunks=[];
  for(const file of styles){
   let css=fs.readFileSync(path.join(root,file),'utf8');
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
  const id=crypto.createHash('sha256').update(bundleKey+'\0'+combined).digest('hex').slice(0,12);
  bundle='styles/mare-'+id+'.css';
  fs.mkdirSync(path.join(out,'styles'),{recursive:true});
  fs.writeFileSync(path.join(out,bundle),combined);
  copied.add(bundle);
  bundles.set(bundleKey,bundle);
 }
 // Replace only stylesheet links, keeping other link elements unchanged.
 let first=true;
 html=html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']+\.css(?:[?#][^"']*)?["'][^>]*>/gi,()=>{
  if(!first)return '';
  first=false;
  return '<link rel="stylesheet" href="'+bundle+'">';
 });
 fs.writeFileSync(path.join(out,filename),html);
}
console.log('CSS: '+bundles.size+' bundles para '+pages.length+' páginas');

fs.writeFileSync(path.join(out,'.nojekyll'),'');

// PWA shell is generated only AFTER all assets are copied. Version includes
// content digests, not a mutable deployment date; cache updates are atomic.
const precache=[...copied].filter(file=>!file.endsWith('.map')).sort();
const digest=crypto.createHash('sha256');
for(const file of precache){
 digest.update(file+'\0');digest.update(fs.readFileSync(path.join(out,file)));digest.update('\0');
}
// Full offline shell budget; refuse unbounded precache growth.
const offlineBytes=precache.reduce((sum,file)=>sum+fs.statSync(path.join(out,file)).size,0);
assert.ok(offlineBytes<=12*1024*1024,'Pacote offline excede 12 MiB: '+offlineBytes);
const version=digest.digest('hex').slice(0,18);
const worker=[
 "'use strict';",
 "/* Generated by scripts/build-site.cjs. Do not edit _site/sw.js. */",
 "const CACHE='mare-shell-"+version+"';",
 "const FILES="+JSON.stringify(precache)+";",
 "const PATHS=new Set(FILES);",
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
 "  await Promise.all(keys.filter(k=>k.startsWith('mare-shell-')&&k!==CACHE).map(k=>caches.delete(k)));",
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
