'use strict';
/* Fase 4 do plano de otimização (novembro de 2026): som, vibração e conteúdo. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const manifest=JSON.parse(read('config/site-manifest.json'));

// Som e vibração: opcionais, desligados por padrão, sem arquivos nem rede.
const feel=read('src/scripts/shared/mare-feel.js');
new vm.Script(feel,{filename:'mare-feel.js'});
for(const page of manifest.pages)assert.ok(read(page+'.html').includes('<script src="src/scripts/shared/mare-accessibility.js"></script><script src="src/scripts/shared/mare-feel.js"></script>'),page+': mare-feel.js ausente');
assert.ok(feel.includes("const defaults=Object.freeze({sound:false,haptics:false});"),'Som e vibração começam desligados');
assert.ok(!/fetch\(|new Audio\(|\.mp3|\.ogg|\.wav|https?:\/\//.test(feel),'Sons são sintetizados: sem arquivos e sem rede');
assert.ok(feel.includes("if(!settings.sound&&!settings.haptics)return false;"),'Desligado, nada toca nem cria contexto de áudio');
for(const token of ["'mare-shake'","'mare:round-finished'","name='mare-feel-'+key","window.MareFeel=Object.freeze"])assert.ok(feel.includes(token),'mare-feel.js sem: '+token);
// Executa o módulo com o mínimo de ambiente: a API responde e respeita o padrão.
{
 const listeners={};
 const sandbox={localStorage:{getItem:()=>null,setItem(){},removeItem(){}},navigator:{},setTimeout,Date,Map,JSON,Object,
  document:{readyState:'complete',body:{classList:{contains:()=>false}},addEventListener(){},querySelector:()=>null,getElementById:()=>null},
  window:{addEventListener:(type,fn)=>{listeners[type]=fn}}};
 vm.runInNewContext(feel,sandbox);
 assert.equal(JSON.stringify(sandbox.window.MareFeel.read()),'{"sound":false,"haptics":false}');
 assert.equal(sandbox.window.MareFeel.play('win'),false,'Com tudo desligado, play() não faz nada');
 assert.equal([...sandbox.window.MareFeel.voices].sort().join(),'bad,flip,lose,ok,tap,win');
 assert.equal(typeof listeners['mare:round-finished'],'function');
}

// Enigma: toda grade encaixa as seis pistas (antes, de 1 a 3 ficavam de fora).
{
 const src=read('src/scripts/games/enigma.js');
 const start=src.indexOf('const PUZZLES='),end=src.indexOf('function store()');
 assert.ok(start>0&&end>start);
 const sandbox={};
 vm.runInNewContext(src.slice(start,end)+';this.PUZZLES=PUZZLES;this.place=place;',sandbox);
 for(const puzzle of sandbox.PUZZLES){
  const placed=sandbox.place(puzzle).placed.map(entry=>entry.word).sort();
  assert.equal(placed.join(),puzzle.map(item=>item[0]).sort().join(),'Enigma: pista fora da grade em '+puzzle.map(item=>item[0]).join(','));
 }
 assert.ok(src.includes('layout:2'),'Saves da grade antiga não podem ser lidos como letras da grade nova');
}

// Marujo: 31 temas, um mês de diário sem repetir.
{
 const src=read('src/scripts/games/marujo.js');
 const topics=vm.runInNewContext('('+src.slice(src.indexOf('const TOPICS=')+13,src.indexOf('];',src.indexOf('const TOPICS='))+1)+')');
 assert.ok(topics.length>=31,'Marujo precisa de pelo menos 31 temas: '+topics.length);
 assert.equal(new Set(topics.map(topic=>topic[0])).size,topics.length,'Temas repetidos');
}
console.log('PASS: fase 4 — som e vibração opcionais, Enigma com seis pistas, Marujo com 31 temas');
