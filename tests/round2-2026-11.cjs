'use strict';
/* Rodada de novembro de 2026: conteúdo, diário sem repetição, resumo da partida e primeira visita. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');

// Bancos maiores: pelo menos um mês de diário sem repetir.
const cardume=JSON.parse(read('data/cardume-puzzles.json'));
assert.ok(cardume.length>=32,'Cardume: '+cardume.length+' tabuleiros');
const enigmaSrc=read('src/scripts/games/enigma.js');
{
 const sandbox={};
 vm.runInNewContext(enigmaSrc.slice(enigmaSrc.indexOf('const PUZZLES='),enigmaSrc.indexOf('function store()'))+';this.PUZZLES=PUZZLES;this.place=place;',sandbox);
 assert.ok(sandbox.PUZZLES.length>=32,'Enigma: '+sandbox.PUZZLES.length+' grades');
 assert.equal(new Set(sandbox.PUZZLES.map(p=>p.map(x=>x[0]).sort().join())).size,sandbox.PUZZLES.length,'Enigma: grade repetida');
 for(const puzzle of sandbox.PUZZLES)assert.equal(sandbox.place(puzzle).placed.length,6,'Enigma: pista fora da grade em '+puzzle[0][0]);
}
const concha=read('src/scripts/games/concha.js');
const seeds=vm.runInNewContext(concha.match(/const SEEDS=(\[[\s\S]*?\]);/)[1]);
assert.ok(seeds.length>=48,'Concha: '+seeds.length+' sementes');
{
 // Toda semente rende um jogo de verdade: pelo menos 12 respostas no vocabulário.
 const lexicon=read('palavras-ptbr-5.txt').split(/\s+/).filter(w=>/^[A-Z]{5}$/.test(w));
 for(const seed of seeds){
  const letters=[...new Set(seed)],center=letters[Math.floor(letters.length/2)];
  const answers=lexicon.filter(w=>w.includes(center)&&[...w].every(ch=>letters.includes(ch))).length;
  assert.ok(answers>=12,'Concha: semente fraca '+seed+' ('+answers+')');
 }
}

// Diário em rodízio: cada desafio uma vez antes de qualquer repetição.
const content=read('src/scripts/shared/mare-content.js');
{
 const sandbox={window:{},localStorage:{getItem:()=>null}};
 vm.runInNewContext(content,sandbox);
 const daily=sandbox.window.MareContent.daily;
 for(const count of [18,23,25,32,48,7,1]){
  const seen=new Set();
  for(let i=0;i<count;i++)seen.add(daily(new Date(Date.UTC(2026,10,14+i)).toISOString().slice(0,10),count));
  assert.equal(seen.size,count,'Rodízio repetiu dentro de '+count+' dias');
  assert.ok([...seen].every(index=>Number.isInteger(index)&&index>=0&&index<count));
 }
 assert.equal(daily('data inválida',10),0);
}
for(const [file,token] of [['cardume','MareContent?.daily?.(day,puzzles.length)'],['concha','MareContent?.daily?.(day,SEEDS.length)'],['mares-duo','MareContent?.daily?.(day,bank.length)']])
 assert.ok(read('src/scripts/games/'+file+'.js').includes(token),file+': diário ainda sorteado por hash');

// Resumo da partida com números do jogo e próximo destino ainda não jogado hoje.
const finale=read('src/scripts/shared/mare-finale.js');
for(const token of ["'mare-finale__stats'","function untilTomorrow()","'novo diário em '","if(!playedToday.has(candidate[0]))","'Primeira vitória registrada no seu diário.'"])assert.ok(finale.includes(token),'Resumo sem: '+token);

// Primeira visita: destaque que não bloqueia e some na primeira jogada.
const finesse=read('src/scripts/shared/mare-finesse.js'),shell=read('src/styles/shared/mare-shell.css');
for(const token of ["'mare-ajuda-vista-v1'","tip.className='mare-help-tip'","help.setAttribute('aria-describedby','mare-help-tip')"])assert.ok(finesse.includes(token),'Primeira visita sem: '+token);
assert.ok(!/showModal\(\)/.test(finesse.slice(finesse.indexOf('mare-ajuda-vista-v1')-600)),'A ajuda não deve abrir sozinha');
assert.match(shell,/\.mare-help-tip\{[^}]*pointer-events:none/,'O aviso não pode interceptar toques');
assert.match(shell,/\.mare-help-tip\{[^}]*left:8px;right:8px;margin-inline:auto;width:fit-content/,'O aviso é centralizado por CSS para nunca alargar a página');
console.log('PASS: rodada 2 — bancos de Cardume, Enigma e Concha, diário em rodízio, resumo com números e primeira visita');
