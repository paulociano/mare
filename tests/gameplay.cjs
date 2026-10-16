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
console.log('PASS: inicialização, navegação livre e persistência de identidade dos desafios Náufrago/Sinais');
