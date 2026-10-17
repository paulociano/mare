'use strict';
/* Phase 10 contract: persistent presentation preferences never mutate saves. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const source=read('mare-accessibility.js'),style=read('mare-accessibility.css');
new vm.Script(source);new vm.Script(read('mare-ocean.js'));new vm.Script(read('trilha.js'));
const storage=new Map(),window={dispatchEvent(){}};
const root={dataset:{}};
const document={documentElement:root,readyState:'loading',addEventListener(){}};
const localStorage={
 getItem:k=>storage.get(k)??null,
 setItem:(k,v)=>storage.set(k,v),
 removeItem:k=>storage.delete(k)
};
vm.runInNewContext(source,{window,document,localStorage,Set,JSON,CustomEvent:function(type,data){this.type=type;this.detail=data}});
const api=window.MareAccessibility;
assert.ok(Object.isFrozen(api));
assert.equal(api.read().scale,'normal');
assert.equal(root.dataset.mareScale,'normal');
assert.equal(root.dataset.mareContrast,'normal');
assert.equal(root.dataset.mareMotion,'system');
assert.equal(root.dataset.mareFocus,'off');
assert.equal(storage.size,0,'Nothing saved by merely loading MARÉ');
storage.set('mare-accessibility-v1',JSON.stringify({scale:'extra',contrast:true,motion:true,focus:true}));
const settings=api.read();
assert.equal(settings.scale,'extra');
assert.ok(settings.contrast&&settings.motion&&settings.focus);
storage.set('mare-accessibility-v1','{broken json');
assert.equal(api.read().scale,'normal');
storage.set('mare-accessibility-v1',JSON.stringify({scale:'javascript:',contrast:'yes',motion:1,focus:null}));
const bad=api.read();assert.equal(bad.scale,'normal');assert.equal(bad.contrast,false);
assert.equal(bad.motion,false);assert.equal(bad.focus,false);
assert.ok(!/fetch\s*\(|sendBeacon|XMLHttpRequest|navigator\.share|localStorage\.clear/.test(source),
 'Reading preferences cannot exfiltrate or clear unrelated game data');
assert.ok(source.includes("localStorage.removeItem(KEY)"));
assert.ok(source.includes("localStorage.setItem(KEY,JSON.stringify(validSettings))"));
assert.ok(source.includes("window.addEventListener('storage'"));
assert.ok(source.includes("event.key!==KEY"));
assert.ok(source.includes('fieldset')&&source.includes('legend')&&source.includes('summary'));
assert.ok(source.includes("role','status"));
assert.ok(style.includes('[data-mare-scale="large"]')&&style.includes('[data-mare-scale="extra"]'));
assert.ok(style.includes('[data-mare-contrast="high"]')&&style.includes('[data-mare-focus="on"]'));
assert.ok(style.includes('[data-mare-motion="reduce"]'));
assert.ok(style.includes('prefers-reduced-motion:reduce')&&style.includes(':focus-visible'));
assert.ok(read('mare-ocean.js').includes("window.addEventListener('mare:accessibility',onMotion)"));
assert.ok(read('mare-ocean.js').includes("document.documentElement.dataset.mareMotion==='reduce'"));
assert.ok(read('trilha.js').includes("'ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'"));
for(const page of ['index','recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma','perola','farol']){
 const html=read(page+'.html');
 assert.ok(html.includes('href="mare-accessibility.css"'),page+' missing style');
 assert.ok(html.includes('src="mare-accessibility.js"'),page+' missing script');
 assert.ok(html.indexOf('src="mare-accessibility.js"')<html.indexOf('src="mare-ocean.js"')||page!=='index','Ocean animation should see saved preferences');
}
assert.ok(read('index.html').includes('href="#ajustes-de-leitura"'),'Preferences discoverability missing');
console.log('PASS Phase10: 13 routes, safe persisted accessibility preferences, contrast/scale/reduced-motion, Ocean control and Trilha keyboard');
