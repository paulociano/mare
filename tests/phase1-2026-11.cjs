'use strict';
/* Fase 1 do plano de otimização (novembro de 2026): entrega. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const manifest=JSON.parse(read('config/site-manifest.json'));
const motion=read('src/styles/shared/mare-motion.css');

for(const page of manifest.pages){
 const html=read(page+'.html');
 // Movimento compartilhado em CSS, antes da camada Kanagawa (que continua por último).
 assert.ok(html.includes('<link rel="stylesheet" href="src/styles/shared/mare-motion.css"><link rel="stylesheet" href="src/styles/shared/mare-kanagawa.css">'),page+': mare-motion.css ausente');
 // GSAP só onde há coreografia: o hub.
 assert.equal(html.includes('src/scripts/shared/mare-gsap.js'),page==='index',page+': GSAP só deve ser carregado no hub');
 // Pré-busca das páginas ao alcance do dedo; nunca pré-renderização, que executaria
 // os scripts do jogo (visitas, relógios) sem o jogador ter aberto a página.
 const rules=html.match(/<script type="speculationrules">(.*?)<\/script>/);
 assert.ok(rules,page+': regras de pré-busca ausentes');
 const parsed=JSON.parse(rules[1]);
 assert.ok(Array.isArray(parsed.prefetch)&&!('prerender' in parsed),page+': usar somente prefetch');
}

// Transição entre páginas, com saída para quem pede menos movimento.
assert.match(motion,/@view-transition\{navigation:auto\}/);
assert.match(motion,/@media \(prefers-reduced-motion:reduce\)\{\s*@view-transition\{navigation:none\}/);
assert.ok(motion.includes('[data-mare-motion="reduce"]'),'A preferência do MARÉ deve cancelar a transição');
for(const mark of ['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','naufrago','sinais','perola','farol']){
 assert.ok(motion.includes('img[src$="/'+mark+'-mark.svg"]{view-transition-name:mare-mark-'+mark+'}'),'Símbolo sem nome de transição: '+mark);
 assert.ok(fs.existsSync('assets/brand/'+mark+'-mark.svg'));
}
// Um nome de transição repetido na mesma página cancela a transição inteira.
for(const page of manifest.pages){
 const marks=[...read(page+'.html').matchAll(/<img[^>]*src="[^"]*\/([a-z]+)-mark\.svg"/g)].map(m=>m[1]);
 assert.equal(new Set(marks).size,marks.length,page+': símbolo repetido no HTML');
}

// O build separa o que é comum do que é de cada jogo, sem reordenar a cascata.
const build=read('scripts/build-site.cjs');
for(const token of ['function segment(list,keyOf)','styleBundle(run.items)','scriptBundle(run.items.map','catch(error){setTimeout(()=>{throw error})}'])assert.ok(build.includes(token),'Build sem: '+token);
console.log('PASS: fase 1 — CSS comum + folha do jogo, scripts unidos, GSAP só no hub, transição entre páginas e pré-busca');
