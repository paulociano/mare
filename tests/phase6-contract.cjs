'use strict';
/* Phase 6 contracts: diary remains tied to verified ledger; PWA is real and scoped. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const paths=require('../config/site-manifest.json').pages;
const app=JSON.parse(fs.readFileSync('app.webmanifest','utf8'));
const build=fs.readFileSync('scripts/build-site.cjs','utf8');
const sw=fs.readFileSync('src/scripts/shared/mare-pwa.js','utf8');
const diary=fs.readFileSync('src/scripts/shared/mare-explorer.js','utf8');
new vm.Script(sw);new vm.Script(diary);
assert.equal(app.start_url,'./');assert.equal(app.scope,'./');assert.equal(app.display,'standalone');
assert.ok(app.icons.some(i=>i.type==='image/png'&&i.sizes==='192x192'));
assert.ok(app.icons.some(i=>i.type==='image/png'&&i.sizes==='512x512'&&i.purpose.includes('maskable')));
for(const page of paths){
 const html=fs.readFileSync(page+'.html','utf8');
 for(const p of ['href="app.webmanifest"','src="src/scripts/shared/mare-pwa.js"','href="src/styles/shared/mare-pwa.css"'])
  assert.ok(html.includes(p),page+': missing '+p);
}
assert.ok(build.includes('crypto.createHash'), 'Cache release version must reflect content changes');
assert.ok(build.includes('await cache.addAll'), 'Offline cache must be transactional');
assert.ok(build.includes('event.data.type===')&&build.includes('SKIP_WAITING'), 'Update must be gated by a user action');
assert.ok(build.includes("await self.clients.claim()"), 'Activated worker must control existing tabs');
assert.ok(build.includes("req.method!=='GET'"), 'Do not intercept write requests');
assert.ok(build.includes("new URL(req.url).origin!==self.location.origin"), 'Intercept same-origin only');
assert.ok(!/serviceWorker\.register\(\s*['"]https?:/.test(sw),'Service worker scope cannot leave the site');
assert.ok(sw.includes('requestedReload')&&sw.includes("waiting.postMessage({type:'SKIP_WAITING'})"),'An in-progress round must not auto-update');
assert.ok(sw.includes('beforeinstallprompt'),'Optional native install button required');
assert.ok(sw.includes("navigator.serviceWorker.ready"),'Do not claim readiness before install completes');
assert.ok(diary.includes("MareProgress?.read?.()"),'Verified outcomes only');
assert.ok(diary.includes("MareProgress?.stats?.()")&&diary.includes("MareProgress?.missions?.()"),'No synthetic XP or missions');
assert.ok(diary.includes("['recife','Recife']")&&diary.includes("['farol','Farol']"),'Twelve games in log');
assert.ok(!/localStorage\.setItem/.test(diary),'Diary is read-only');
assert.ok(fs.readFileSync('index.html','utf8').includes('href="#diario-de-bordo"'),'Diary must be discoverable');
console.log('PASS: installable PWA, safe scoped cache contract, user-driven updates and verified Diary 2.0');
