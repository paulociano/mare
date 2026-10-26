'use strict';
/* Auditoria 2026-10: guards for the fixes and motion layer added in this pass. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const read=f=>fs.readFileSync(f,'utf8');

// 1. No third-party font or GSAP request: identical online/offline, no CDN dependency.
const styles=[];
(function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.css'))styles.push(p)}})('src/styles');
for(const file of styles)assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(read(file)),file+': remote font import');
const kanagawa=read('src/styles/shared/mare-kanagawa.css');
for(const font of ['dm-sans-latin-wght-normal','dm-sans-latin-ext-wght-normal','outfit-latin-wght-normal','outfit-latin-ext-wght-normal']){
 assert.ok(kanagawa.includes('assets/fonts/'+font+'.woff2'),'missing @font-face '+font);
 assert.ok(fs.existsSync('assets/fonts/'+font+'.woff2'),'missing font file '+font);
}
assert.ok(fs.existsSync('assets/fonts/OFL-DM-Sans.txt')&&fs.existsSync('assets/fonts/OFL-Outfit.txt'),'font licenses must ship with the fonts');
const gsapLoader=read('src/scripts/shared/mare-gsap.js');
assert.ok(gsapLoader.includes("assets/vendor/gsap-3.15.0.min.js")&&!gsapLoader.includes('cdn.jsdelivr'),'GSAP must be self-hosted');
const manifest=require('../config/site-manifest.json');
assert.ok(manifest.requiredFiles.includes('assets/vendor/gsap-3.15.0.min.js'),'GSAP must be published and precached');

// 2. Free-play intensity is a disclosure placed after the board, never above it.
const content=read('src/scripts/shared/mare-content.js');
assert.ok(content.includes("createElement('details')")&&content.includes("footer.before(region)"),'Curadoria must be a disclosure below the game');
assert.ok(!content.includes('first.after(section)'),'Curadoria must not be inserted before the game');

// 3. Gameplay fixes.
const cardume=read('src/scripts/games/cardume.js');
assert.ok(cardume.includes('attempted.has(signature)'),'Cardume must not charge for an identical repeated guess');
assert.ok(/mistakes\+\+;history\.push\(-1\);if\(mistakes>=4\)\{selected=\[\]/.test(cardume),'Cardume keeps a wrong selection for adjustment');
assert.ok(read('src/scripts/games/criptograma.js').includes("className='crypto-word'"),'Sinais tiles grouped per word');
const modes=read('src/scripts/games/modos.js');
assert.ok(modes.includes("' palavra descoberta'")&&modes.includes("' tentativa restante'"),'Recife progress copy must agree in number');
assert.ok(modes.includes("--mare-used")&&modes.includes("--mare-solved"),'Recife progress rail must reflect real progress');
assert.ok(modes.includes("aria-label',letter==='↵'?'Enviar'"),'Recife special keys keep accessible names');

// 4. Motion respects both reduced-motion signals in CSS and JS.
assert.ok(modes.includes("prefers-reduced-motion: reduce")&&modes.includes("mareMotion!=='reduce'"),'Recife JS motion must honour both preferences');
assert.ok(kanagawa.includes(':root[data-mare-motion="reduce"] body.mare-kanagawa *'),'Global in-app reduce-motion kill switch must remain');
for(const name of ['mare-flip','mare-pop','mare-shake','mare-rise','mare-surface']){
 const at=kanagawa.indexOf('animation:'+name)>=0?kanagawa.indexOf('animation:'+name):kanagawa.indexOf(name+' ');
 assert.ok(at>0,'missing animation '+name);
}
const motionBlock=kanagawa.slice(kanagawa.indexOf('/* --- Motion'));
assert.ok(/@media\(prefers-reduced-motion:no-preference\)\{[\s\S]*is-revealing/.test(motionBlock),'Game motion lives behind prefers-reduced-motion:no-preference');

// 5. Landmarks: every game title is inside a landmark.
for(const p of ['concha','trilha','enigma','marujo']){
 assert.ok(read(p+'.html').includes('<section class="'+p+'-hero" aria-label='),p+': title area needs a region label');
}
assert.ok(read('recife.html').includes('<div class="return-link" role="region" aria-label="Recife">'),'Recife title area needs a region');

console.log('PASS: auditoria 2026-10 — fontes/GSAP locais, curadoria abaixo do jogo, regras de jogo, motion acessível e landmarks');
