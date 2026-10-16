'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const realDate=Date;
function runGame(file,seedStorage={}){
 const store=new Map(Object.entries(seedStorage));const els=new Map();
 function el(id){if(!els.has(id)){const e={id,textContent:'',value:'',disabled:false,open:false,style:{},dataset:{},children:[],handlers:{},setAttribute(k,v){this[k]=v},addEventListener(k,fn){this.handlers[k]=fn},replaceChildren(...x){this.children=x},focus(){},showModal(){this.open=true},close(){this.open=false},querySelector(k){return this.children.find(x=>x.selector===k)||{textContent:''}}};els.set(id,e)}return els.get(id)}
 const document={getElementById:el,activeElement:{tagName:'BODY'},handlers:{},addEventListener(k,f){this.handlers[k]=f},querySelectorAll(k){if(k==='[data-part]')return Array.from({length:6},(_,i)=>({dataset:{part:String(i+1)},style:{}}));return []},createDocumentFragment(){return {children:[],append(v){this.children.push(v)}}},createElement(tag){const x=el('created-'+Math.random());return {...x,tagName:tag,children:[],querySelector(k){let v={textContent:''};this.children.push(v);return v}}}};
 const storage={getItem(k){return store.get(k)??null},setItem(k,v){store.set(k,String(v))},key(i){return [...store.keys()][i]},get length(){return store.size}};
 const context={document,localStorage:storage,Date:realDate,Intl,Math,Set,Number,JSON,String,Object,Array,RegExp,navigator:{clipboard:{writeText:async()=>{}}},console};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});
 return {el,store,document,storage};
}
const n=runGame('forca.js');
assert.equal(n.el('edition').textContent,'DESAFIO DIÁRIO');
assert.equal(n.el('remaining').textContent,'6 erros disponíveis');
n.el('free').onclick();n.el('next').onclick();
const nkey=[...n.store.keys()].find(k=>k.startsWith('mare-forca-free-')&&k!=='mare-forca-free-round');assert.ok(nkey);
const saved=JSON.parse(n.store.get(nkey));assert.ok(Number.isInteger(saved.seed));
const nReload=runGame('forca.js',Object.fromEntries(n.store));nReload.el('free').onclick();
assert.equal(JSON.parse(nReload.store.get(nkey)).seed,saved.seed);
const s=runGame('criptograma.js');assert.equal(s.el('edition').textContent,'DESAFIO DIÁRIO');
s.el('next').onclick();const skey=[...s.store.keys()].find(k=>k.startsWith('mare-criptograma-free-')&&k!=='mare-criptograma-free-round');assert.ok(skey);
const phrase=JSON.parse(s.store.get(skey));assert.ok(Number.isInteger(phrase.index));
const sReload=runGame('criptograma.js',Object.fromEntries(s.store));sReload.el('free').onclick();
assert.equal(JSON.parse(sReload.store.get(skey)).index,phrase.index);

// Cenários de resultado: simula jogos já próximos do desfecho, sem navegador externo.
const forcaSource=fs.readFileSync('forca.js','utf8');
const words=vm.runInNewContext(forcaSource.match(/const puzzles=(\[[^;]+\]);/)[1]).map(x=>x[0]);
const day=Math.floor((Date.parse(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())+'T12:00:00Z')-Date.UTC(2025,0,1))/86400000);
const word=words[((day%words.length)+words.length)%words.length];
const letters=[...new Set(word)];
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const forcaKey='mare-forca-daily-'+today;
const nearlyWon=runGame('forca.js',{[forcaKey]:JSON.stringify({used:letters.slice(1),misses:0,won:false,lost:false})});
const last=nearlyWon.el('keyboard').children.find(x=>x.textContent===letters[0]);
assert.ok(last && !last.disabled,'Última letra está disponível');
last.handlers.click();
assert.equal(JSON.parse(nearlyWon.store.get(forcaKey)).won,true,'Náufrago deve declarar vitória');
assert.equal(nearlyWon.el('share').disabled,false,'Compartilhar é liberado ao vencer');
const wrong=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(x=>!word.includes(x)).slice(0,6);
const losing=runGame('forca.js',{[forcaKey]:JSON.stringify({used:wrong.slice(0,5),misses:5,won:false,lost:false})});
const end=losing.el('keyboard').children.find(x=>x.textContent===wrong[5]);end.handlers.click();
assert.equal(JSON.parse(losing.store.get(forcaKey)).lost,true,'Náufrago deve declarar derrota no sexto erro');
assert.equal(losing.el('hint').disabled,true,'Não é possível pedir dica após derrota');
const hinted=runGame('forca.js',{[forcaKey]:JSON.stringify({used:[],misses:0,won:false,lost:false})});
hinted.el('hint').onclick();
const h=JSON.parse(hinted.store.get(forcaKey));
assert.equal(h.misses,1,'Dica deve custar um erro');
assert.ok(h.used.length===1 && word.includes(h.used[0]),'Dica revela letra da resposta');
const badSaved=runGame('forca.js',{[forcaKey]:JSON.stringify({used:['?',42],misses:999,won:false,lost:false})});
assert.equal(badSaved.el('remaining').textContent,'6 erros disponíveis','Save inválido deve ser ignorado');

// Sinais: dica preenche uma correspondência única e salva o estado.
const sinaisHint=runGame('criptograma.js');
sinaisHint.el('hint').onclick();
const signsKey=[...sinaisHint.store.keys()].find(k=>k.startsWith('mare-criptograma-daily-'));
assert.ok(signsKey,'Sinais deve salvar o desafio diário');
const signsSaved=JSON.parse(sinaisHint.store.get(signsKey));
assert.equal(signsSaved.hints,1,'A dica em Sinais deve ser contabilizada');
assert.equal(Object.keys(signsSaved.map).length,1,'A dica deve revelar uma correspondência');
const signsReload=runGame('criptograma.js',Object.fromEntries(sinaisHint.store));
assert.ok(signsReload.el('progress').textContent.startsWith('1 de '),'A dica deve persistir após recarregar');
const signsBroken=runGame('criptograma.js',{[signsKey]:JSON.stringify({map:{'99':'INVALIDA'},done:true,hints:-1})});
assert.equal(signsBroken.el('progress').textContent.startsWith('0 de '),true,'Sinais deve ignorar salvamento inválido');
console.log('PASS: inicialização, vitória, derrota, dica, validação de saves e persistência dos desafios Náufrago/Sinais');
