'use strict';
/* Directional contracts, not a substitute for a rendered-browser audit. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const manifest=require('../config/site-manifest.json');
const css=fs.readFileSync('src/styles/shared/mare-kanagawa.css','utf8');
const art=fs.readFileSync('assets/backgrounds/kanagawa-wave.svg','utf8');
assert.ok(art.startsWith('<svg')&&art.includes('viewBox="0 0 1200 940"'));
assert.ok(art.includes('A crista da maré')&&art.endsWith('</svg>'));
assert.match(css,/--kan-paper:#f8f3e8/);
assert.match(css,/--kan-ink:#173e5e/);
assert.match(css,/--kan-focus:#ab6a17/);
assert.ok(css.includes('kanagawa-wave.svg'),'A gravura deve compor o hero');
assert.ok(css.includes('data-mare-contrast="high"'),'O modo alto contraste é obrigatório');
assert.ok(css.includes('data-mare-motion="reduce"'),'A escolha de reduzir motion deve vencer a estética');
assert.ok(css.includes('data-mare-focus="on"'),'O modo foco deve remover a ilustração');
assert.ok(css.includes('prefers-reduced-motion:reduce'),'Preferência nativa de motion deve ser respeitada');
assert.ok(!css.includes('color-scheme:dark!important;')||css.includes('data-mare-contrast="high"'));
for(const route of manifest.pages){
 const html=fs.readFileSync(route+'.html','utf8');
 assert.match(html,/<body class="[^"]*\bmare-kanagawa\b/,'Nova identidade não ativada em '+route);
 const last=html.lastIndexOf('<link rel="stylesheet"');
 assert.equal(html.slice(last).split('</head>')[0].includes('src/styles/shared/mare-kanagawa.css'),true,
  route+': o CSS Kanagawa deve ser carregado por último');
 assert.ok(html.includes('<meta name="theme-color" content="#f8f3e8"'),route+': cor do navegador incompatível');
 assert.ok(html.includes('href="assets/brand/mare-favicon.svg"'),route+': favicon não preservado');
}
const ocean=fs.readFileSync('src/scripts/shared/mare-ocean.js','utf8');
assert.ok(ocean.includes("classList.contains('mare-kanagawa')"),'O shader antigo deve estar desativado na nova identidade');
const home=fs.readFileSync('index.html','utf8');
assert.ok(home.includes('data-ocean-scene aria-hidden="true"'),'A gravura permanece decorativa');
assert.equal((home.match(/<article class="mar-game /g)||[]).length,12);
function luminosity(color){
 const rgb=color.replace('#','').match(/../g).map(value=>parseInt(value,16)/255);
 const [r,g,b]=rgb.map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b;
}
function contrast(a,b){
 const x=luminosity(a),y=luminosity(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
for(const [fg,bg] of [
 ['#173e5e','#f8f3e8'],['#446578','#f8f3e8'],
 ['#173e5e','#fffdf7'],['#fffdf7','#174b6a']
])assert.ok(contrast(fg,bg)>=4.5,'Contraste de texto insuficiente: '+fg+' / '+bg);
console.log('PASS: Kanagawa Light em 13 rotas, gravura própria, preferências preservadas e pares de cor AA');
