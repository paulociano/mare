const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const home = fs.readFileSync('index.html','utf8');
const html = fs.readFileSync('recife.html','utf8');
const modes = fs.readFileSync('modos.js','utf8');
const css = fs.readFileSync('modos.css','utf8');
const inline = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inline, 'script principal ausente');
new vm.Script(inline[1]);
new vm.Script(modes);
assert.ok(html.includes('src="modos.js"'));
assert.ok(html.includes('href="modos.css"'));
assert.ok(modes.includes('quartet:{count:4,tries:9'));
assert.ok(modes.includes('duo:{count:2,tries:7'));
assert.ok(modes.includes("setAttribute('role','gridcell')"));
assert.ok(css.includes('.mare-modes'));
const words = fs.readFileSync('palavras-ptbr-5.txt','utf8').trim().split(/\r?\n/);
assert.ok(words.length >= 8500);
assert.equal(new Set(words).size, words.length);
assert.ok(words.every(w => /^[A-Z]{5}$/.test(w)));
assert.ok(html.includes('const DICTIONARY=new Set('));
assert.ok(html.includes(words[0]+' '+words[1]));
assert.ok(html.includes('href="visual-v3.css"'));
assert.ok(fs.readFileSync('visual-v3.css','utf8').includes('assets/ocean-depth.svg'));
assert.ok(fs.readFileSync('assets/ocean-depth.svg','utf8').startsWith('<svg'));
const semantic = fs.readFileSync('abismo.js','utf8');
const semanticHtml = fs.readFileSync('abismo.html','utf8');
new vm.Script(semantic);
assert.ok(semantic.includes('BANK.push('));
assert.ok(semantic.includes('const relations=new Map()'));
assert.ok(!semantic.includes('const prefix='), 'Ranking não deve depender de letras comuns');
assert.ok(semanticHtml.includes('abismo.js'));
assert.ok(semanticHtml.includes('abismo.css'));
assert.ok(fs.existsSync('abismo.css'));
const cx=fs.readFileSync('cardume.js','utf8');
new vm.Script(cx);
const puzzles=JSON.parse(fs.readFileSync('data/cardume-puzzles.json','utf8'));
assert.ok(puzzles.length>=10);
assert.ok(puzzles.every(p=>p.length===4&&new Set(p.flatMap(g=>g.words)).size===16));
assert.ok(fs.readFileSync('cardume.html','utf8').includes('cardume.js'));
const corrente=fs.readFileSync('corrente.js','utf8');
new vm.Script(corrente);
assert.ok(fs.readFileSync('corrente.html','utf8').includes('corrente.js'));
assert.ok(fs.existsSync('corrente.css'));
assert.ok(home.includes('href="abismo.html"'));
assert.ok(home.includes('href="cardume.html"'));
assert.ok(home.includes('href="corrente.html"'));
for(const old of ['contexto.html','contexto.js','contexto.css','conexoes.html','conexoes.js','conexoes.css'])assert.ok(!fs.existsSync(old),'Arquivo legado ainda existe: '+old);
assert.ok(home.includes('recife.html') && home.includes('cardume.html'));
assert.ok(home.includes('mare-system.css') && fs.existsSync('hub.js'));
new vm.Script(fs.readFileSync('hub.js','utf8'));
assert.ok(fs.existsSync('mare-system.css'));
const concha=fs.readFileSync('concha.js','utf8');
new vm.Script(concha);
assert.ok(fs.readFileSync('concha.html','utf8').includes('concha.js'));
assert.ok(fs.existsSync('concha.css'));
const seedMatch=concha.match(/const SEEDS=(\[[^;]+\]);/);
assert.ok(seedMatch);
assert.ok(JSON.parse(seedMatch[1].replace(/'/g,'"')).every(w=>new Set(w).size===7));
assert.ok(home.includes('concha.html'));
const trilha=fs.readFileSync('trilha.js','utf8');
new vm.Script(trilha);
assert.ok(fs.readFileSync('trilha.html','utf8').includes('trilha.js'));
assert.ok(fs.existsSync('trilha.css'));
assert.ok(fs.existsSync('assets/backgrounds/trilha.svg'));
assert.ok(home.includes('href="trilha.html"'));
const enigma=fs.readFileSync('enigma.js','utf8');
new vm.Script(enigma);
assert.ok(fs.readFileSync('enigma.html','utf8').includes('enigma.js'));
assert.ok(fs.existsSync('enigma.css'));
assert.ok(fs.existsSync('assets/backgrounds/enigma.svg'));
assert.ok(home.includes('href="enigma.html"'));
const marujo=fs.readFileSync('marujo.js','utf8');
new vm.Script(marujo);
assert.ok(fs.readFileSync('marujo.html','utf8').includes('marujo.js'));
assert.ok(fs.existsSync('marujo.css'));
assert.ok(fs.existsSync('assets/backgrounds/marujo.svg'));
assert.ok(home.includes('href="marujo.html"'));
assert.ok(home.includes('mare-editorial.css'));
assert.ok(!home.includes('mar-hero-video'), 'Home deve abrir diretamente no catálogo, sem banner');
assert.ok(home.includes('id="jogos"'));
// Testa a integridade das folhas compartilhadas citadas pelas páginas publicadas.
const pages = ['index.html','recife.html','abismo.html','cardume.html','corrente.html','concha.html','trilha.html','enigma.html','marujo.html'];
for (const page of pages) {
  const document = fs.readFileSync(page, 'utf8');
  for (const match of document.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)) {
    const stylesheet = match[1].split(/[?#]/)[0];
    assert.ok(fs.existsSync(stylesheet), page + ': CSS ausente ' + stylesheet);
  }
  assert.ok(document.includes('href="mare-3.css"'), page + ': design system não carregado');
}
for (const game of pages.slice(1)) {
  const document = fs.readFileSync(game, 'utf8');
  assert.equal((document.match(/class="mare-game-nav"/g) || []).length, 1, game + ': rodapé ausente');
  assert.equal((document.match(/aria-current="page"/g) || []).length, 1, game + ': jogo ativo incorreto');
}
assert.ok(fs.existsSync('mare-editorial.css'));
// Cenários publicados: apenas SVGs presentes no repositório.
const seaDesign = fs.readFileSync('mare-3.css', 'utf8');
for (const name of ['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo']) {
  const asset = 'assets/backgrounds/' + name + '.svg';
  assert.ok(fs.existsSync(asset), 'Arte ausente: ' + asset);
  assert.ok(seaDesign.includes('url("'+asset+'")'), 'Arte não usada no tema: '+asset);
}
const newGames=['forca','criptograma'];
for (const game of newGames){
  const page=fs.readFileSync(game+'.html','utf8');
  new vm.Script(fs.readFileSync(game+'.js','utf8'));
  assert.ok(page.includes('src="'+game+'.js"'));
  assert.ok(page.includes('mare-newgames.css'));
  assert.ok(page.includes('aria-current="page"'));
  assert.ok(home.includes('href="'+game+'.html"'));
  assert.ok(page.includes('id="daily"') && page.includes('id="free"'));
}
for (const game of ['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo']){
  const page=fs.readFileSync(game+'.html','utf8');
  for(const added of newGames)assert.ok(page.includes('href="'+added+'.html"'));
}
assert.ok(fs.existsSync('mare-newgames.css'));
for (const scene of ['naufrago','sinais']) assert.ok(fs.existsSync('assets/backgrounds/'+scene+'.svg'));
assert.ok(home.includes('Náufrago') && home.includes('Sinais'));
for (const asset of ['mare-logo.svg','mare-logo-transparent.svg','mare-favicon.svg']) assert.ok(fs.readFileSync('assets/brand/'+asset,'utf8').includes('<svg'), 'Marca SVG ausente: '+asset);
for (const page of ['index','recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma']) {
 const html=fs.readFileSync(page+'.html','utf8');
 assert.ok(html.includes('assets/brand/mare-logo-transparent.svg'), 'Logo MARÉ ausente: '+page);
 assert.ok(html.includes('assets/brand/mare-favicon.svg'), 'Favicon MARÉ ausente: '+page);
 assert.ok(html.includes('mare-brand.css'), 'Estilo da marca ausente: '+page);
}
const naufragoCode=fs.readFileSync('forca.js','utf8');
const sinaisCode=fs.readFileSync('criptograma.js','utf8');
new vm.Script(naufragoCode);
new vm.Script(sinaisCode);
assert.ok(naufragoCode.includes('state.seed=seed'),'Náufrago não salva a palavra da partida livre');
assert.ok(naufragoCode.includes('seed=state.seed'),'Náufrago não restaura a palavra da partida livre');
assert.ok(sinaisCode.includes('state.index=index'),'Sinais não salva a frase da partida livre');
assert.ok(sinaisCode.includes('index=state.index'),'Sinais não restaura a frase da partida livre');
const accessibleNaufrago=fs.readFileSync('forca.html','utf8');
const accessibleSinais=fs.readFileSync('criptograma.html','utf8');
assert.ok(accessibleNaufrago.includes('aria-label="Partida de Náufrago"'));
assert.ok(accessibleNaufrago.includes('id="remaining" role="status"'));
assert.ok(accessibleSinais.includes('id="cipher-help"'));
assert.ok(accessibleSinais.includes('aria-describedby="cipher-help"'));
assert.ok(fs.readFileSync('forca.js','utf8').includes("aria-pressed"));
assert.ok(fs.readFileSync('criptograma.js','utf8').includes("aria-pressed"));
for(const page of ['index','recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma']){
 const doc=fs.readFileSync(page+'.html','utf8');
 assert.ok(doc.includes('class="mare-skip-link" href="#conteudo-principal"'),page+': atalho de teclado ausente');
 assert.ok(/<main\b[^>]*id="conteudo-principal"/.test(doc),page+': destino do atalho ausente');
}
assert.ok(fs.readFileSync('mare-brand.css','utf8').includes('.mare-skip-link:focus'));
assert.ok(fs.readFileSync('marujo.html','utf8').includes('Use as setas para navegar'));
assert.ok(fs.readFileSync('marujo.js','utf8').includes("addEventListener('keydown'"));
for (const game of ['trilha','enigma']) {
 const source=fs.readFileSync(game+'.js','utf8');
 assert.ok(source.includes('document.activeElement'),'Foco não preservado em '+game);
 new vm.Script(source);
}
const recifeCard=home.split('<article class="mar-game mar-letters">')[1]?.split('</article>')[0];
assert.ok(recifeCard,'Card do Recife ausente');
assert.ok(recifeCard.includes('<h2 class="recife-card-heading">Recife</h2>'),'Título textual do Recife ausente');
assert.equal(recifeCard.split('<h2').length-1,1,'Título duplicado no card');
assert.ok(!home.includes('assets/brand/recife.svg'),'SVG antigo ainda referenciado na home');
assert.ok(!html.includes('assets/brand/recife.svg'),'SVG antigo ainda referenciado no Recife');
assert.ok(html.includes('<h2 class="recife-title-lockup">Recife</h2>'),'Título da página Recife ausente');
const catalogCards=home.split('<article class="mar-game ').slice(1).map(x=>x.split('</article>')[0]);
assert.equal(catalogCards.length,10,'Catálogo precisa ter dez cards');
for(const [i,markup] of catalogCards.entries()){
 assert.equal(markup.split('<h2').length-1,1,'Título duplicado no card '+(i+1));
 assert.ok(markup.includes('<h2 class="recife-card-heading">'),'Card '+(i+1)+' não usa a classe do Recife');
 assert.ok(markup.indexOf('<h2 ')<markup.indexOf('mar-game-info'),'Título deve ficar acima da descrição');
 assert.ok(markup.includes('class="mar-cta"'),'Botão ausente no card '+(i+1));
}
assert.ok(home.includes('mare-brand.css?v=card-layout-2'),'CSS da home deve evitar cache antigo');
assert.ok(fs.existsSync('mare-brand.css'),'Arquivo físico do CSS versionado ausente');
console.log('PASS: sintaxe, integração, modos e '+words.length+' palavras');
