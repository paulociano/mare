'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const manifest=require('../config/site-manifest.json');
const games=manifest.pages.filter(p=>p!=='index');
const progress=fs.readFileSync('mare-progress.js','utf8');
const finale=fs.readFileSync('mare-finale.js','utf8');
const finesse=fs.readFileSync('mare-finesse.js','utf8');
const style=fs.readFileSync('mare-finesse.css','utf8');
for(const [file,source] of [['mare-progress.js',progress],['mare-finale.js',finale],['mare-finesse.js',finesse]]){
 new vm.Script(source,{filename:file});
}
for(const name of games){
 const page=fs.readFileSync(name+'.html','utf8');
 for(const asset of ['mare-finesse.css','mare-finesse.js']){
  assert.equal(page.split(asset).length-1,1,name+': missing/duplicate '+asset);
 }
 assert.ok(page.indexOf('src="mare-progress.js"')<page.indexOf('src="mare-finale.js"'),name+': progress loaded too late');
 assert.ok(page.indexOf('src="mare-finale.js"')<page.indexOf('src="mare-finesse.js"'),name+': finale loaded too late');
}
assert.ok(!fs.readFileSync('index.html','utf8').includes('mare-finesse.css'),'Homepage must not pay for game polish');
for(const name of games){
 const marker=name==='recife'? 'body.mare-recife' : 'body.mare-'+name;
 assert.ok(style.includes(marker),name+': missing individual board treatment');
}
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.handlers={};this.dataset={};this.className='';this.classList={toggle:()=>{}};this.hidden=false;this.textContent='';}
 setAttribute(k,v){this.attrs[k]=v}
 append(...children){this.children.push(...children)}
 addEventListener(k,fn){this.handlers[k]=fn}
 click(){this.handlers.click?.()}
}
const listeners={};
const emitted=[];
const storage=new Map();
const window={
 addEventListener:(type,fn)=>{listeners[type]=fn},
 removeEventListener:()=>{},
 dispatchEvent:e=>{emitted.push(e);listeners[e.type]?.(e)},
};
const document={
 body:{matches:()=>true,append:()=>{}},
 createElement:tag=>new Node(tag)
};
let panel;
document.body.append=el=>{panel=el};
class CustomEvent{constructor(type,init){this.type=type;this.detail=init.detail}}
const localStorage={
 getItem:key=>storage.get(key)||null,
 setItem:(key,value)=>storage.set(key,value)
};
const context={window,document,CustomEvent,localStorage,JSON,Set,Date,Intl,Number,Math,Array,Object};
vm.runInNewContext(progress,context,{filename:'mare-progress.js'});
vm.runInNewContext(finale,context,{filename:'mare-finale.js'});
const api=window.MareProgress;
assert.equal(api.record('recife','win','test-round-1'),true);
assert.equal(emitted.length,1,'A real persisted result must emit exactly one event');
assert.equal(emitted[0].detail.game,'recife');
assert.equal(panel?.hidden,false,'A new result must render the persistent result card');
assert.equal(panel?.dataset.outcome,'win','Win result must render successful styling');
assert.ok(panel.children.some(node=>node.className==='mare-finale__summary'),'Summary is visible and labelled');
const actions=panel.children.find(node=>node.className==='mare-finale__actions');
assert.ok(actions,'Navigation actions are rendered');
assert.equal(actions.children[0].href,'abismo.html','Next game maps to real next route');
assert.equal(actions.children[1].href,'./','Hub route is real');
assert.equal(api.record('recife','win','test-round-1'),false,'Duplicate must be rejected');
assert.equal(emitted.length,1,'Duplicate must not announce a second finish');
const close=panel.children.find(node=>node.className==='mare-finale__close');
close.click();assert.equal(panel.hidden,true,'Dismiss works');
assert.equal(api.record('forca','loss','test-round-2'),true);
assert.equal(panel.hidden,false,'Subsequent loss reopens the summary');
assert.equal(panel.dataset.outcome,'loss','Loss variant is distinct');
assert.equal(actions.children[0].href,'criptograma.html','Náufrago points to Sinais');
assert.equal(api.record('recife','not-win','test-round-3'),false,'No inferred outcomes');
console.log('PASS: 12 individual treatments, verified event, no duplicate, result close/reopen and real navigation');
