'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
for(const game of ['cardume','corrente']){
 const html=fs.readFileSync(game+'.html','utf8');
 assert.ok(html.indexOf('src="src/scripts/shared/mare-progress.js"')>=0);
 assert.ok(html.indexOf('src="src/scripts/shared/mare-progress.js"')<html.indexOf('src="'+game+'.js"'));
 const js=fs.readFileSync(game+'.js','utf8');
 new vm.Script(js);
 assert.ok(js.includes("MareProgress?.record('"+game+"'"),game+': missing explicit progress call');
}
assert.ok(fs.readFileSync('src/scripts/games/cardume.js','utf8').includes("record('cardume','loss'"),'Cardume loss missing');
assert.ok(fs.readFileSync('src/scripts/games/corrente.js','utf8').includes("record('corrente','win'"),'Corrente win missing');
const explorer=fs.readFileSync('src/scripts/shared/mare-explorer.js','utf8');
assert.ok(explorer.includes("['cardume','Cardume']")&&explorer.includes("['corrente','Corrente']"));
console.log('PASS: Cardume and Corrente explicit outcomes and load order');
