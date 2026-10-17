const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const home = fs.readFileSync('index.html','utf8');
const html = fs.readFileSync('recife.html','utf8');
const modes = fs.readFileSync('src/scripts/games/modos.js','utf8');
const css = fs.readFileSync('src/styles/games/modos.css','utf8');
const recifeSource = fs.readFileSync('src/scripts/games/recife.js','utf8');
assert.ok(html.includes('src="src/scripts/games/recife.js"'), 'Script do Recife não referenciado');
assert.ok(!/<script>([\s\S]*?)<\/script>/.test(html), 'Script principal ainda embutido');
new vm.Script(recifeSource);
new vm.Script(modes);
assert.ok(html.includes('src="src/scripts/games/modos.js"'));
assert.ok(html.includes('href="src/styles/games/modos.css"'));
assert.ok(!html.includes('class="leftPanel"'),'Recife não possui a antiga barra lateral');
assert.ok(modes.includes('if(description)description.textContent='),'Modo não pode depender da barra lateral removida');
assert.ok(modes.includes('quartet:{count:4,tries:9'));
assert.ok(modes.includes('duo:{count:2,tries:7'));
assert.ok(modes.includes("setAttribute('role','gridcell')"));
assert.ok(css.includes('.mare-modes'));
const words = fs.readFileSync('palavras-ptbr-5.txt','utf8').trim().split(/\r?\n/);
assert.ok(words.length >= 8500);
assert.equal(new Set(words).size, words.length);
assert.ok(words.every(w => /^[A-Z]{5}$/.test(w)));
assert.ok(recifeSource.includes('const DICTIONARY=new Set('));
assert.ok(recifeSource.includes(words[0]+' '+words[1]));
assert.ok(html.includes('href="src/styles/games/visual-v3.css"'));
assert.ok(fs.readFileSync('src/styles/games/visual-v3.css','utf8').includes('assets/ocean-depth.svg'));
assert.ok(fs.readFileSync('assets/ocean-depth.svg','utf8').startsWith('<svg'));
const semantic = fs.readFileSync('src/scripts/games/abismo.js','utf8');
const semanticHtml = fs.readFileSync('abismo.html','utf8');
new vm.Script(semantic);
assert.ok(semantic.includes('BANK.push('));
assert.ok(semantic.includes('const relations=new Map()'));
assert.ok(!semantic.includes('const prefix='), 'Ranking não deve depender de letras comuns');
assert.ok(semanticHtml.includes('src/scripts/games/abismo.js'));
assert.ok(semanticHtml.includes('src/styles/games/abismo.css'));
assert.ok(fs.existsSync('src/styles/games/abismo.css'));
const cx=fs.readFileSync('src/scripts/games/cardume.js','utf8');
new vm.Script(cx);
const puzzles=JSON.parse(fs.readFileSync('data/cardume-puzzles.json','utf8'));
assert.ok(puzzles.length>=10);
assert.ok(puzzles.every(p=>p.length===4&&new Set(p.flatMap(g=>g.words)).size===16));
assert.ok(fs.readFileSync('cardume.html','utf8').includes('src/scripts/games/cardume.js'));
const corrente=fs.readFileSync('src/scripts/games/corrente.js','utf8');
new vm.Script(corrente);
assert.ok(fs.readFileSync('corrente.html','utf8').includes('src/scripts/games/corrente.js'));
assert.ok(fs.existsSync('src/styles/games/corrente.css'));
assert.ok(home.includes('href="abismo.html"'));
assert.ok(home.includes('href="cardume.html"'));
assert.ok(home.includes('href="corrente.html"'));
for(const old of ['contexto.html','contexto.js','contexto.css','conexoes.html','conexoes.js','conexoes.css'])assert.ok(!fs.existsSync(old),'Arquivo legado ainda existe: '+old);
assert.ok(home.includes('recife.html') && home.includes('cardume.html'));
assert.ok(home.includes('src/styles/shared/mare-system.css') && fs.existsSync('src/scripts/shared/hub.js'));
new vm.Script(fs.readFileSync('src/scripts/shared/hub.js','utf8'));
assert.ok(fs.existsSync('src/styles/shared/mare-system.css'));
const concha=fs.readFileSync('src/scripts/games/concha.js','utf8');
new vm.Script(concha);
assert.ok(fs.readFileSync('concha.html','utf8').includes('src/scripts/games/concha.js'));
assert.ok(fs.existsSync('src/styles/games/concha.css'));
const seedMatch=concha.match(/const SEEDS=(\[[^;]+\]);/);
assert.ok(seedMatch);
assert.ok(JSON.parse(seedMatch[1].replace(/'/g,'"')).every(w=>new Set(w).size===7));
assert.ok(home.includes('concha.html'));
const trilha=fs.readFileSync('src/scripts/games/trilha.js','utf8');
new vm.Script(trilha);
assert.ok(fs.readFileSync('trilha.html','utf8').includes('src/scripts/games/trilha.js'));
assert.ok(fs.existsSync('src/styles/games/trilha.css'));
assert.ok(fs.existsSync('assets/backgrounds/trilha.svg'));
assert.ok(home.includes('href="trilha.html"'));
const enigma=fs.readFileSync('src/scripts/games/enigma.js','utf8');
new vm.Script(enigma);
assert.ok(fs.readFileSync('enigma.html','utf8').includes('src/scripts/games/enigma.js'));
assert.ok(fs.existsSync('src/styles/games/enigma.css'));
assert.ok(fs.existsSync('assets/backgrounds/enigma.svg'));
assert.ok(home.includes('href="enigma.html"'));
const marujo=fs.readFileSync('src/scripts/games/marujo.js','utf8');
new vm.Script(marujo);
assert.ok(fs.readFileSync('marujo.html','utf8').includes('src/scripts/games/marujo.js'));
assert.ok(fs.existsSync('src/styles/games/marujo.css'));
assert.ok(fs.existsSync('assets/backgrounds/marujo.svg'));
assert.ok(home.includes('href="marujo.html"'));
assert.ok(home.includes('src/styles/shared/mare-editorial.css'));
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
  assert.ok(document.includes('href="src/styles/shared/mare-3.css"'), page + ': design system não carregado');
}
for (const game of pages.slice(1)) {
  const document = fs.readFileSync(game, 'utf8');
  assert.equal((document.match(/class="mare-game-nav"/g) || []).length, 1, game + ': rodapé ausente');
  assert.equal((document.match(/aria-current="page"/g) || []).length, 1, game + ': jogo ativo incorreto');
}
assert.ok(fs.existsSync('src/styles/shared/mare-editorial.css'));
// Cenários publicados: apenas SVGs presentes no repositório.
const seaDesign = fs.readFileSync('src/styles/shared/mare-3.css', 'utf8');
for (const name of ['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo']) {
  const asset = 'assets/backgrounds/' + name + '.svg';
  assert.ok(fs.existsSync(asset), 'Arte ausente: ' + asset);
  assert.ok(seaDesign.includes('url("../../../'+asset+'")'), 'Arte não usada no tema: '+asset);
}
const newGames=['forca','criptograma'];
for (const game of newGames){
  const page=fs.readFileSync(game+'.html','utf8');
  new vm.Script(fs.readFileSync('src/scripts/games/'+game+'.js','utf8'));
  assert.ok(page.includes('src="'+game+'.js"'));
  assert.ok(page.includes('src/styles/shared/mare-newgames.css'));
  assert.ok(page.includes('aria-current="page"'));
  assert.ok(home.includes('href="'+game+'.html"'));
  assert.ok(page.includes('id="daily"') && page.includes('id="free"'));
}
for (const game of ['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo']){
  const page=fs.readFileSync(game+'.html','utf8');
  for(const added of newGames)assert.ok(page.includes('href="'+added+'.html"'));
}
assert.ok(fs.existsSync('src/styles/shared/mare-newgames.css'));
for (const scene of ['naufrago','sinais']) assert.ok(fs.existsSync('assets/backgrounds/'+scene+'.svg'));
assert.ok(home.includes('Náufrago') && home.includes('Sinais'));
for (const asset of ['mare-logo.svg','mare-logo-transparent.svg','mare-favicon.svg']) assert.ok(fs.readFileSync('assets/brand/'+asset,'utf8').includes('<svg'), 'Marca SVG ausente: '+asset);
for (const page of ['index','recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma']) {
 const html=fs.readFileSync(page+'.html','utf8');
 assert.ok(html.includes('assets/brand/mare-logo-transparent.svg'), 'Logo MARÉ ausente: '+page);
 assert.ok(html.includes('assets/brand/mare-favicon.svg'), 'Favicon MARÉ ausente: '+page);
 assert.ok(html.includes('src/styles/shared/mare-brand.css'), 'Estilo da marca ausente: '+page);
}
const naufragoCode=fs.readFileSync('src/scripts/games/forca.js','utf8');
const sinaisCode=fs.readFileSync('src/scripts/games/criptograma.js','utf8');
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
assert.ok(fs.readFileSync('src/scripts/games/forca.js','utf8').includes("aria-pressed"));
assert.ok(fs.readFileSync('src/scripts/games/criptograma.js','utf8').includes("aria-pressed"));
for(const page of ['index','recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma']){
 const doc=fs.readFileSync(page+'.html','utf8');
 assert.ok(doc.includes('class="mare-skip-link" href="#conteudo-principal"'),page+': atalho de teclado ausente');
 assert.ok(/<main\b[^>]*id="conteudo-principal"/.test(doc),page+': destino do atalho ausente');
}
assert.ok(fs.readFileSync('src/styles/shared/mare-brand.css','utf8').includes('.mare-skip-link:focus'));
assert.ok(fs.readFileSync('marujo.html','utf8').includes('Use as setas para navegar'));
assert.ok(fs.readFileSync('src/scripts/games/marujo.js','utf8').includes("addEventListener('keydown'"));
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
assert.ok(html.includes('<h1 class="recife-title-lockup">Recife</h1>'),'Título semântico da página Recife ausente');
const catalogCards=home.split('<article class="mar-game ').slice(1).map(x=>x.split('</article>')[0]);
assert.equal(catalogCards.length,12,'Catálogo precisa ter doze cards');
for(const [i,markup] of catalogCards.entries()){
 assert.equal(markup.split('<h2').length-1,1,'Título duplicado no card '+(i+1));
 assert.ok(markup.includes('<h2 class="recife-card-heading">'),'Card '+(i+1)+' não usa a classe do Recife');
 assert.ok(markup.indexOf('<h2 ')<markup.indexOf('mar-game-info'),'Título deve ficar acima da descrição');
 assert.ok(markup.includes('class="mar-cta"'),'Botão ausente no card '+(i+1));
}
assert.ok(home.includes('src/styles/shared/mare-brand.css?v=card-layout-3'),'CSS da home deve evitar cache antigo');
assert.ok(fs.existsSync('src/styles/shared/mare-brand.css'),'Arquivo físico do CSS versionado ausente');
const brandStyles=fs.readFileSync('src/styles/shared/mare-brand.css','utf8');
assert.ok(brandStyles.includes('white-space:nowrap!important'),'Títulos devem permanecer em linha única');
assert.ok(brandStyles.includes('mar-school,.mar-current'),'Regra de títulos longos ausente');
assert.ok(brandStyles.includes('body.mare-recife .recife-title-lockup'),'Título da página Recife ausente');
assert.equal((brandStyles.match(/\/\* Catálogo: título único/g)||[]).length,1,'Sessão de títulos duplicada');
const themeSource=fs.readFileSync('src/styles/shared/mare-3.css','utf8');
for(const [selector,scene] of [['mar-forca','naufrago'],['mar-criptograma','sinais']]){
 const marker='.mare-hub .mar-game.'+selector+'{background-image:';
 assert.equal(themeSource.split(marker).length-1,1,'Cenário duplicado no CSS: '+selector);
 assert.ok(themeSource.split(marker)[1].split('}')[0].includes('assets/backgrounds/'+scene+'.svg'),'Cenário incorreto: '+scene);
}
for(const game of ['perola','farol']){
 const page=fs.readFileSync(game+'.html','utf8');
 assert.ok(page.includes('data-game="'+game+'"'),'Novo jogo não identificado: '+game);
 assert.ok(page.includes('src="src/scripts/games/mares-duo.js"'),'Motor compartilhado ausente: '+game);
 assert.ok(page.includes('href="src/styles/games/mares-duo.css"'),'Estilo compartilhado ausente: '+game);
 assert.ok(page.includes('id="daily"')&&page.includes('id="free"'),'Modos ausentes: '+game);
 assert.ok(home.includes('href="'+game+'.html"'),'Card não encontrado: '+game);
}
const duoSource=fs.readFileSync('src/scripts/games/mares-duo.js','utf8');
new vm.Script(duoSource);
assert.ok(duoSource.includes("perola:[")&&duoSource.includes("farol:["),'Desafios dos jogos ausentes');
const signals=fs.readFileSync('src/scripts/games/criptograma.js','utf8');
assert.ok(signals.includes('crypto-correct'),'Sinais sem sinalização visual de letra certa');
assert.ok(signals.includes('Associação correta!'),'Sinais sem feedback imediato');
const finish=fs.readFileSync('src/scripts/shared/mare-finale.js','utf8');
new vm.Script(finish);
for(const page of ['index','recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma','perola','farol']){
 const source=fs.readFileSync(page+'.html','utf8');
 assert.ok(source.includes('src/scripts/shared/mare-finale.js')&&source.includes('src/styles/shared/mare-finale.css'),'Comemoração ausente: '+page);
}
assert.ok(fs.readFileSync('src/styles/shared/mare-finale.css','utf8').includes('prefers-reduced-motion'),'Efeito deve respeitar movimento reduzido');
for(const game of ['perola','farol']){
 const doc=fs.readFileSync(game+'.html','utf8');
 const symbol='assets/brand/'+game+'-mark.svg';
 const art=fs.readFileSync(symbol,'utf8');
 assert.ok(art.startsWith('<svg'),'Símbolo SVG ausente: '+game);
 assert.ok(home.includes('src="'+symbol+'"'),'Card sem símbolo exclusivo: '+game);
 assert.ok(doc.includes('src="'+symbol+'"'),'Página sem símbolo no cabeçalho: '+game);
 assert.ok(doc.includes('class="mare-game-nav__grid"'),'Rodapé sem navegação: '+game);
 assert.equal((doc.match(/aria-current="page"/g)||[]).length,1,'Item ativo duplicado: '+game);
 assert.ok(doc.includes('href="'+game+'.html" aria-current="page"'),'Jogo ativo incorreto: '+game);
 assert.equal((doc.match(/class="mare-game-nav__name"/g)||[]).length,12,'Rodapé precisa dos doze jogos: '+game);
}
for(const game of ['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo']){
 const mark='assets/brand/'+game+'-mark.svg';
 const svg=fs.readFileSync(mark,'utf8');
 const page=fs.readFileSync(game+'.html','utf8');
 assert.ok(svg.startsWith('<svg')&&svg.includes('viewBox'),'Símbolo inválido: '+game);
 assert.ok(home.includes('src="'+mark+'"'),'Símbolo ausente no card: '+game);
 assert.ok(page.includes('src="'+mark+'"'),'Símbolo ausente no jogo: '+game);
}
for(const [game,page] of [['naufrago','forca'],['sinais','criptograma']]){
 const symbol='assets/brand/'+game+'-mark.svg';
 assert.ok(fs.readFileSync(symbol,'utf8').includes('<svg'),'Emblema inválido: '+game);
 assert.ok(home.includes('src="'+symbol+'"'),'Card sem símbolo: '+game);
 assert.ok(fs.readFileSync(page+'.html','utf8').includes('src="'+symbol+'"'),'Cabeçalho sem símbolo: '+page);
}
const allSymbols=[...home.matchAll(/class="mar-game-symbol" src="([^"]+)"/g)];
assert.equal(allSymbols.length,12,'Os doze cards precisam de símbolos próprios');
assert.equal(new Set(allSymbols.map(x=>x[1])).size,12,'Cada jogo precisa de um símbolo exclusivo');
const unifiedCSS=fs.readFileSync('src/styles/shared/mare-brand.css','utf8');
assert.ok(unifiedCSS.includes('background-image:none!important'),'Cards não devem repetir artes de fundo');
assert.ok(unifiedCSS.includes('height:410px!important'),'Altura dos cards deve ser uniforme');
const motionCSS=fs.readFileSync('src/styles/shared/mare-brand.css','utf8');
for(const token of ['mare-ocean-swell','mare-bubbles-rise','pointer-events:none','prefers-reduced-motion:reduce']){
 assert.ok(motionCSS.includes(token),'Movimento oceânico sem '+token);
}
assert.ok(motionCSS.includes('body.mare-hub'),'Efeito da home ausente');
assert.ok(motionCSS.includes('body.mar-app'),'Efeito das páginas internas ausente');
console.log('PASS: sintaxe, integração, modos e '+words.length+' palavras');
