'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('mare-explorer.js','utf8');
new vm.Script(source);
const html=fs.readFileSync('index.html','utf8');
assert.ok(html.includes('src="mare-explorer.js"')&&html.includes('href="mare-explorer.css"'));
function element(tag){return {tag,children:[],attrs:{},style:{},className:'',textContent:'',classList:{add(){}},append(...items){this.children.push(...items)},setAttribute(k,v){this.attrs[k]=v},before(el){this.inserted=el}}}
function run(keys,blocked=false){
 const catalog=element('section'),body=element('body');
 const document={body,getElementById:id=>id==='jogos'?catalog:null,createElement:element};
 const localStorage={get length(){if(blocked)throw Error('storage blocked');return keys.length},key(i){return keys[i]}};
 vm.runInNewContext(source,{document,localStorage});
 return catalog.inserted;
}
const blank=run([]);assert.equal(blank.children[1].children[0].attrs['aria-valuenow'],'0');
const populated=run(['mare-solo-2026-10-17','mare-cardume-daily-2026-10-17','mare-cardume-free-1']);
assert.equal(populated.children[1].children[0].attrs['aria-valuenow'],'2','duplicate rounds count as one game');
const denied=run([],true);assert.ok(denied.children[0].children[2].textContent.includes('não permite'));
console.log('PASS: explorer diary, unique game counting and storage-blocked fallback');
