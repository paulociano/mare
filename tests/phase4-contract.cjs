'use strict';
/* Static anti-regression contract: all material Phase 4 accessibility fixes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const modes=fs.readFileSync('modos.js','utf8');
const enigma=fs.readFileSync('enigma.js','utf8');
const farol=fs.readFileSync('farol.html','utf8');
const css=fs.readFileSync('mare-finesse.css','utf8');
const e2e=fs.readFileSync('scripts/check-phase4-e2e.py','utf8');
const quality=fs.readFileSync('scripts/check-phase4-quality.py','utf8');
new vm.Script(modes);
new vm.Script(enigma);
assert.ok(modes.includes("window.MareProgress?.record('recife',victory?'win':'loss',key)"),'Recife controller must register both outcomes');
assert.ok(modes.includes("boardEl.setAttribute('role','group')"),'Recife composite must not pretend to be a grid');
assert.ok(enigma.includes("b.setAttribute('aria-label','Casa bloqueada')"),'Blank crossword cells need accessible names');
for(const id of ['chosen','tiles']){
 const section=new RegExp('<div id="'+id+'"[^>]*role="group"[^>]*aria-label=');
 assert.match(farol,section,'Farol selected/available regions must use valid accessible role: '+id);
}
assert.ok(css.includes('body.mare-concha .concha-controls{flex-wrap:wrap}'),'Concha responsive controls missing');
assert.ok(e2e.includes("for game,expected,recife_mode in scenarios:"),'Recife multi-mode contract must be covered');
assert.ok(e2e.includes("recife\",\"win\",\"quartet\""),'Quartet must complete');
assert.ok(quality.includes("axe.run(document"),'Auditor must execute axe against DOM');
assert.ok(quality.includes("context.add_init_script('('+BOOTSTRAP+')()')"),'Performance observer must be executed, not merely declared');
console.log('PASS: Phase 4 source guards, true results, ARIA semantics and laboratory signal setup');
