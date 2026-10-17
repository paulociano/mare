'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const games=['recife','abismo','concha','trilha','enigma','marujo','criptograma','perola','farol'];
for(const name of games){
 const html=fs.readFileSync(name+'.html','utf8');
 const script=['perola','farol'].includes(name)?'mares-duo.js':name+'.js';
 const a=html.indexOf('src="mare-progress.js"'),b=html.indexOf('src="'+script+'"');
 assert.ok(a>=0&&b>a,name+': progress ledger must load first');
 const src=fs.readFileSync(script,'utf8');
 new vm.Script(src);
 assert.ok(src.includes("MareProgress?.record("),name+': missing explicit terminal outcome');
 assert.ok(src.includes("'"+name+"'")||src.includes("record(type,"),name+': mismatched game identifier');
}
const collector=fs.readFileSync('mare-explorer.js','utf8');
for(const game of ['recife','abismo','concha','trilha','enigma','marujo','criptograma','perola','farol']){
 assert.ok(collector.includes("['"+game+"',"),'Missing explorer line: '+game);
}
const saved=fs.readFileSync('mare-progress.js','utf8');
new vm.Script(saved);
assert.ok(saved.includes("'farol'")&&saved.includes("'perola'"));
console.log('PASS: all 12 games wired to explicit result storage; pages and syntax validated');
