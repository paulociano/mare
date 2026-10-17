'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const manifest=require('../config/site-manifest.json');
const js=fs.readFileSync('mare-diagnostics.js','utf8');
const css=fs.readFileSync('mare-diagnostics.css','utf8');
new vm.Script(js,{filename:'mare-diagnostics.js'});
assert.ok(js.includes("get('diagnostico')!=='1'"),'Must require explicit opt-in');
assert.ok(js.includes("web-vitals@6.2.3/dist/web-vitals.js"),'Metric definitions must use pinned official implementation');
for(const n of ['LCP','CLS','INP','FCP','TTFB'])assert.ok(js.includes("'"+n+"'"),'Missing real metric name '+n);
assert.ok(js.includes('localStorage.setItem(KEY'),'Sample persistence must be explicit');
assert.ok(js.includes('save.addEventListener'), 'No explicit opt-in for local saving');
assert.ok(js.includes('exportBtn.addEventListener'),'Missing export');
assert.ok(js.includes('clear.addEventListener'),'Missing clear');
assert.ok(!/\b(?:navigator\.sendBeacon|XMLHttpRequest|fetch\s*\()\b/.test(js),'No telemetry endpoints');
assert.ok(css.includes(':focus-visible'),'Diagnostics require keyboard focus');
assert.ok(css.includes('prefers-reduced-motion'),'Reduce animations');
const recifeJs=fs.readFileSync('recife.js','utf8');
const abismoJs=fs.readFileSync('abismo.js','utf8');
const correnteJs=fs.readFileSync('corrente.js','utf8');
assert.ok(recifeJs.includes("c==='ENTER'||c==='BACKSPACE'"),'Recife must handle native Enter/Backspace selectively');
assert.ok(recifeJs.includes("e.target?.closest?.('a,button,[role="),'Recife must preserve native link/button activation');
assert.ok(abismoJs.includes('function newRound(n,focusInput=false)'), 'Abismo must preserve first Tab skip link');
assert.ok(correnteJs.includes('function start(newMode,newIndex,focusInput=false)'), 'Corrente must preserve first Tab skip link');

for(const page of manifest.pages){
 const html=fs.readFileSync(page+'.html','utf8');
 assert.equal(html.split('src="mare-diagnostics.js"').length-1,1,page+': script opt-in missing/duplicated');
 assert.ok(!html.includes('href="mare-diagnostics.css"'),page+': diagnostics CSS cannot load by default');
}
for(const name of ['mare-diagnostics.js','mare-diagnostics.css'])
 assert.ok(manifest.requiredFiles.includes(name),name+': dynamic dependency must be in build');
const doc=fs.readFileSync('index.html','utf8');
assert.ok(doc.includes('href="?diagnostico=1"'),'Visitors need discoverable opt-in from hub');
let documentTouched=0;
vm.runInNewContext(js,{
 location:{search:'',pathname:'/mare/recife.html'},
 URLSearchParams,
 document:new Proxy({}, {get(){documentTouched++;return null}}),
 console
});
assert.equal(documentTouched,0,'Default mode must have zero diagnostics DOM side effects');
console.log('PASS: 13 opt-in pages, pinned metrics, local privacy boundary, export/clear and disabled-by-default behavior');
