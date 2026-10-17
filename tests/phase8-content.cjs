'use strict';
/* Fase 8: validate all 12 game content pools and free-difficulty invariants. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const clean=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
function value(path,marker){
 const src=read(path),pos=src.indexOf(marker);
 assert.ok(pos>=0,path+': missing '+marker);
 let start=pos+marker.length;while(/\s/.test(src[start]))start++;
 const opening=Object.fromEntries([['[',']'],['{','}']]),stack=[];assert.ok(opening[src[start]]);
 let quote='',escaped=false,end=-1;
 for(let i=start;i<src.length;i++){
  const c=src[i];
  if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote='';continue}
  if(c==="'"||c==='"'){quote=c;continue}
  if(opening[c])stack.push(opening[c]);
  else if(c===']'||c==='}'){
   assert.equal(c,stack.pop(),path+': unbalanced bracket');
   if(!stack.length){end=i;break}
  }
 }
 assert.ok(end>start,path+': invalid array');
 return vm.runInNewContext('('+src.slice(start,end+1)+')',{});
}
const words=read('palavras-ptbr-5.txt').trim().split(/\s+/);
assert.ok(words.length>=8000);assert.ok(words.every(w=>/^[A-Z]{5}$/.test(w)));
assert.equal(new Set(words).size,words.length,'Recife duplicate dictionary entry');
const abyss=[...value('abismo.js','const BANK='),...value('abismo.js','BANK.push(...')];
assert.ok(abyss.length>=35);
assert.equal(new Set(abyss.map(c=>c[0])).size,abyss.length,'Abismo duplicate target');
assert.ok(abyss.every(c=>c.length>=10&&c.every(w=>/^[A-Z-]+$/.test(w))),'Abismo permits compounds such as GUARDA-CHUVA');
assert.ok(read('abismo.js').includes('const clean=[...new Set(cluster)]'));
const groups=JSON.parse(read('data/cardume-puzzles.json'));
assert.ok(groups.length>=18);
const signatures=new Set();
for(const [i,p] of groups.entries()){
 assert.equal(p.length,4,'Cardume '+i+' group count');
 assert.equal(new Set(p.map(g=>clean(g.name))).size,4);
 const items=p.flatMap(g=>{
  assert.equal(g.words.length,4,'Cardume '+i+' four words per group');
  return g.words.map(clean);
 });
 assert.equal(new Set(items).size,16,'Cardume '+i+' duplicate answer');
 assert.ok(items.every(w=>/^[A-Z -]+$/.test(w)&&w.length<=24&&w.length>=2));
 const signature=items.slice().sort().join('|');
 assert.ok(!signatures.has(signature),'Repeated Cardume board');signatures.add(signature);
}
const corrente=value('corrente.js','const WORDS=');
assert.ok(corrente.length>=50);assert.equal(new Set(corrente).size,corrente.length);
assert.ok(corrente.every(w=>/^[A-Z]{3,10}$/.test(w)));
const concha=value('concha.js','const SEEDS=');
assert.ok(concha.length>=18);assert.equal(new Set(concha).size,concha.length);
assert.ok(concha.every(w=>/^[A-Z]{7}$/.test(w)&&new Set(w).size===7));
const trilha=value('trilha.js','const CHALLENGES=');
assert.ok(trilha.length>=24);
assert.equal(new Set(trilha.map(c=>c[0])).size,trilha.length);
assert.ok(trilha.every(([w,hint])=>/^[A-Z]{4,16}$/.test(w)&&hint.length>=12));
const enigma=value('enigma.js','const PUZZLES=');
assert.ok(enigma.length>=11);
for(const [i,p] of enigma.entries()){
 assert.equal(p.length,6,'Enigma '+i+' must have six clues');
 assert.equal(new Set(p.map(x=>x[0])).size,6,'Enigma '+i+' duplicate word');
 assert.ok(p.every(([w,hint])=>/^[A-Z]{3,9}$/.test(w)&&hint.length>=9));
}
const marujo=value('marujo.js','const TOPICS=');
assert.ok(marujo.length>=10);assert.equal(new Set(marujo.map(t=>t[0])).size,marujo.length);
for(const [name,list] of marujo){
 assert.equal(list.length,7,name+' words');
 assert.equal(new Set(list).size,7,name+' duplicates');
 assert.ok(list.every(w=>/^[A-Z]{3,10}$/.test(w)));
}
const forca=value('forca.js','const puzzles=');
assert.ok(forca.length>=50);
assert.equal(new Set(forca.map(p=>p[0])).size,forca.length);
assert.ok(forca.every(([w,category])=>/^[A-Z]{3,15}$/.test(w)&&category.length>=3));
const phrases=value('criptograma.js','const phrases=');
assert.ok(phrases.length>=39);assert.equal(new Set(phrases).size,phrases.length);
assert.ok(phrases.every(s=>/^[A-Z ]+$/.test(s)&&new Set(s.replace(/ /g,'')).size>=8));
const duo=value('mares-duo.js','const puzzles=');
assert.equal(Object.keys(duo).sort().join('|'),'farol|perola');
for(const [type,pool] of Object.entries(duo)){
 assert.ok(pool.length>=23,type+' bank expansion');
 assert.equal(new Set(pool.map(p=>clean(p.answer))).size,pool.length,type+' duplicated answer');
 assert.ok(pool.every(p=>p.answer.length>=4&&p.hint.length>=10));
 if(type==='perola')assert.ok(pool.every(p=>/^[A-Z]+$/.test(clean(p.answer))));
 else assert.ok(pool.every(p=>clean(p.answer).split(/ +/).length>=3));
}
for(const game of ['abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma']){
 assert.ok(read(game+'.js').includes('MareContent?.pick'),game+': no real selected-tier logic');
}
assert.ok(read('mares-duo.js').includes('MareContent?.pick'));
for(const page of ['abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma','perola','farol']){
 const html=read(page+'.html');
 assert.ok(html.indexOf('src="mare-content.js"')>=0,page+': missing picker');
 assert.ok(html.indexOf('src="mare-content.js"')<html.indexOf('src="'+(['perola','farol'].includes(page)?'mares-duo':page)+'.js"'),page+': wrong script order');
 assert.ok(html.includes('href="mare-content.css"'));
}
const control=read('mare-content.js');new vm.Script(control);
const store=new Map(),window={};
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
vm.runInNewContext(control,{window,localStorage,document:undefined});
const engine=window.MareContent,scores=[3,10,4,9,5,7,8,6,11];
for(const n of [-2,-1,0,1,2,3,7,19])
 assert.equal(engine.pick('test',scores,n),((n%scores.length)+scores.length)%scores.length,'Original must be unchanged');
for(const level of ['leve','equilibrada','intensa']){
 store.set('mare-difficulty-v1',level);
 const chosen=new Set();
 for(let n=0;n<30;n++)chosen.add(engine.pick('test',scores,n));
 assert.equal(chosen.size,3,'Quantile tier must cycle through its three entries');
 if(level==='leve')assert.ok([...chosen].every(i=>scores[i]<=5));
 if(level==='intensa')assert.ok([...chosen].every(i=>scores[i]>=9));
}
store.set('mare-difficulty-v1','invalid');
assert.equal(engine.get(),null,'Unrecognized preference should not be applied');
console.log('PASS Phase8: 12 banks reviewed, Cardume 18 boards, 11 real free-tier integrations, no duplicate answers, legacy free selection unchanged');
