'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
/* vm contexts create their own Object/Array; compare plain copies. */
const plain=value=>JSON.parse(JSON.stringify(value));
const source=read('src/scripts/shared/mare-selos.js');
new vm.Script(source);
const manifest=require('../config/site-manifest.json');
const registry=['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma','perola','farol'];

function boot({rounds=[],earned=[],failWrites=false,raw}={}){
 const store=new Map();
 if(raw!==undefined)store.set('mare-selos-v1',raw);
 const state={rounds,earned};
 const storage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>{if(failWrites)throw new Error('quota');store.set(k,v)}
 };
 const window={MareProgress:{read:()=>state.rounds,achievements:()=>state.earned}};
 vm.runInNewContext(source,{window,localStorage:storage,Intl,Date,URL,Set,Map,Math,JSON,Number,Object,Array,String},{filename:'mare-selos.js'});
 return {api:window.MareSelos,store,state};
}
const win=(game,at)=>({id:game+':x'+at,game,outcome:'win',at});
const many=(game,count,start='2026-10-01')=>Array.from({length:count},(_,i)=>win(game,new Date(Date.parse(start+'T15:00:00Z')+i*3600000).toISOString()));
const NOW=new Date('2026-10-28T15:00:00Z');

/* ---- API shape and constants ---- */
{
 const {api}=boot();
 assert.ok(Object.isFrozen(api));
 assert.equal(api.games.length,12);
 assert.deepEqual(plain(api.games.map(g=>g[0])),registry);
 assert.deepEqual(plain(api.levels.map(l=>l.wins)),[1,5,15]);
 assert.equal(api.specials.length,3);
 assert.equal(api.maxPoints,39);
 assert.equal(api.sealSvg('inexistente',1),null);
}

/* ---- Levels come from verified wins only ---- */
{
 const {api}=boot();
 const level=(count,extra=[])=>api.derive([...many('forca',count),...extra],[],NOW).games.forca;
 assert.equal(level(0),0);assert.equal(level(1),1);assert.equal(level(4),1);
 assert.equal(level(5),2);assert.equal(level(14),2);assert.equal(level(15),3);assert.equal(level(40),3);
 const losses=Array.from({length:30},(_,i)=>({id:'forca:l'+i,game:'forca',outcome:'loss',at:'2026-10-02T12:00:00Z'}));
 assert.equal(level(0,losses),0,'losses never earn seals');
 assert.equal(api.derive([win('desconhecido','2026-10-02T12:00:00Z')],[],NOW).games.forca,0);
 assert.equal(api.derive([win('forca','2099-01-01T00:00:00Z')],[],NOW).games.forca,0,'future rounds are ignored');
 assert.equal(api.derive([{game:'forca',outcome:'win',at:'not a date'}],[],NOW).games.forca,0);
 assert.equal(api.derive(null,null,NOW).games.forca,0);
 const dated=api.derive(many('forca',5,'2026-10-10'),[],NOW);
 assert.equal(dated.dates['forca:1'],'2026-10-10');
 assert.equal(dated.dates['forca:2'],'2026-10-10','date is the day of the Nth win, in São Paulo time');
 const midnight=api.derive([win('forca','2026-10-11T02:30:00Z')],[],NOW);
 assert.equal(midnight.dates['forca:1'],'2026-10-10','02:30Z is still the previous day in São Paulo');
 const specials=api.derive([],[{id:'seven-streak',earnedAt:'2026-10-20'},{id:'nao-existe'}],NOW);
 assert.equal(specials.specials['seven-streak'],true);
 assert.equal(specials.dates['seven-streak'],'2026-10-20');
 assert.equal(specials.specials['all-games'],false);
}

/* ---- Claim: seals are kept after the 200-round ledger rolls over ---- */
{
 const {api,store,state}=boot({rounds:many('recife',15)});
 const first=api.claim(NOW);
 assert.equal(first.collection.games.recife,3);
 assert.equal(first.fresh.length,1,'one announcement per game, at its highest new level');
 assert.equal(first.fresh[0].levelName,'Grande Onda');
 const saved=JSON.parse(store.get('mare-selos-v1'));
 assert.equal(saved.v,1);assert.equal(saved.g.recife,3);
 assert.equal(api.claim(NOW).fresh.length,0,'no repeated announcement');
 state.rounds=[];
 const afterTrim=boot({rounds:[]});
 afterTrim.store.set('mare-selos-v1',store.get('mare-selos-v1'));
 const again=boot({rounds:[],raw:store.get('mare-selos-v1')});
 assert.equal(again.api.claim(NOW).collection.games.recife,3,'level survives an empty ledger');
 assert.equal(again.api.claim(NOW).fresh.length,0);
}

/* ---- Claim: announcements on a real new level only ---- */
{
 const {api,state}=boot({rounds:many('forca',4)});
 assert.equal(api.claim(NOW).fresh.length,1);
 state.rounds=many('forca',5);
 const next=api.claim(NOW);
 assert.equal(next.fresh.length,1);
 assert.equal(next.fresh[0].level,2);assert.equal(next.fresh[0].levelName,'Onda');
 state.rounds=many('forca',5);
 state.earned=[{id:'daily-treasure',earned:true,earnedAt:'2026-10-27'}];
 const special=api.claim(NOW);
 assert.equal(special.fresh.length,1);assert.equal(special.fresh[0].kind,'special');
 assert.equal(special.collection.specials['daily-treasure'],true);
}

/* ---- Storage failure and corrupt data never break the game ---- */
{
 const {api,state}=boot({rounds:many('forca',1),failWrites:true});
 assert.doesNotThrow(()=>api.claim(NOW));
 assert.equal(api.claim(NOW).fresh.length,0,'in-memory memo stops repeats when storage is unavailable');
 state.rounds=many('forca',5);
 assert.equal(api.claim(NOW).fresh.length,1);
}
for(const raw of ['{broken','null','[]','{"v":2,"g":{"recife":3}}','{"v":1,"g":{"recife":99,"__proto__":3,"forca":-1,"x":2},"s":"all","d":{"recife:9":"2026-01-01","forca:1":"<img>"}}']){
 const {api}=boot({raw});
 const result=api.claim(NOW);
 assert.equal(api.score(result.collection).points,0,'untrusted storage is ignored: '+raw);
}

/* ---- Share fragment ---- */
{
 const {api}=boot();
 const empty=api.derive([],[],NOW);
 assert.equal(api.encode(empty),'000000000000000');
 const mixed=api.derive([...many('recife',15),...many('forca',5),...many('farol',1)],[{id:'all-games'}],NOW);
 const code=api.code(mixed);
 /* recife 3, forca 2, farol 1 (registry order), then only "all-games" among the specials */
 assert.equal(code,'#mare10=1.300000002001001');
 const parsed=api.parse(code);
 assert.deepEqual(plain(parsed.games),plain(mixed.games));assert.deepEqual(plain(parsed.specials),plain(mixed.specials));
 assert.equal(api.score(parsed).points,3+2+1+1);
 assert.equal(api.url(mixed,'https://paulociano.github.io/mare/index.html'),'https://paulociano.github.io/mare/index.html'+code);
 for(const bad of [
  '','#mare10=1.',null,undefined,42,{},
  '#mare10=1.00000000000000','#mare10=1.0000000000000000',
  '#mare10=1.400000000000000','#mare10=1.000000000000002',
  '#mare10=2.000000000000000','#mare9=1.000000000000000',
  '#mare10=1.00000000000000a','#mare10=1.000000000000000#x',
  '#mare10=1.000000000000000<script>','#mare10=1.000000000000000\n',
  'https://evil.example/#mare10=1.000000000000000',' #mare10=1.000000000000000'
 ])assert.equal(api.parse(bad),null,'rejects '+JSON.stringify(bad));
 assert.equal(api.parse('#mare10=1.'+'3'.repeat(12)+'111').games.forca,3);
}

/* ---- Comparison ---- */
{
 const {api}=boot();
 const mine=api.derive([...many('recife',5),...many('forca',1)],[{id:'seven-streak'}],NOW);
 const theirs=api.derive([...many('recife',1),...many('abismo',5)],[],NOW);
 const diff=api.compare(mine,theirs);
 assert.deepEqual(plain(diff.ahead),['Recife · Onda','Náufrago · Espuma','Maré de sete dias']);
 assert.deepEqual(plain(diff.behind),['Abismo · Onda']);
 assert.deepEqual(plain(api.compare(mine,mine)),{ahead:[],behind:[]});
}

/* ---- SVG: well formed, escaped, no active content ---- */
function assertWellFormed(svg,label){
 const stack=[];
 for(const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>/g)){
  if(m[4])continue;
  if(m[1]){assert.equal(stack.pop(),m[2],label+': unbalanced </'+m[2]+'>')}else stack.push(m[2]);
 }
 assert.deepEqual(stack,[],label+': unclosed tags');
 const stripped=svg.replace(/<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>/g,'');
 assert.ok(!/[<>]/.test(stripped),label+': stray angle bracket outside tags');
 assert.ok(!/&(?!(?:amp|lt|gt|quot|#39);)/.test(svg),label+': unescaped ampersand');
 assert.ok(!/<script|javascript:|onload=|onclick=|<foreignObject|href=/i.test(svg),label+': active content');
}
{
 const {api}=boot();
 for(const [game] of api.games)for(const level of [0,1,2,3]){
  const svg=api.sealSvg(game,level);assertWellFormed(svg,game+level);
  assert.ok(svg.includes('viewBox="0 0 120 120"'));
  assert.ok(svg.includes('aria-label='),game+level+': named for assistive tech');
  assert.equal((svg.match(/<path d="M46 /g)||[]).length,level,game+level+': one wave per level');
 }
 for(const special of api.specials)for(const level of [0,1]){
  const svg=api.sealSvg(special.id,level);assertWellFormed(svg,special.id+level);
 }
 assert.ok(api.sealSvg('forca',2,{decorative:true}).includes('aria-hidden="true"'));
 assert.ok(!api.sealSvg('forca',2,{decorative:true}).includes('role="img"'));
 assert.ok(api.labelFor('forca',2).includes('Onda'));
 assert.ok(api.labelFor('forca',0).includes('não conquistado'));
 const full=api.derive([...many('recife',15),...many('forca',5)],[{id:'all-games'}],NOW);
 const card=api.cardSvg(full,{level:3,xp:1250});
 assertWellFormed(card,'card');
 assert.ok(card.includes('width="1200"')&&card.includes('height="675"'));
 for(const [,name] of api.games)assert.ok(card.includes('>'+name+'<'),'card lists '+name);
 assert.equal((card.match(/<g transform=/g)||[]).length,15,'12 game seals + 3 special seals');
 assert.ok(card.includes('>6<')||card.includes('>6 <'),'card shows points');
 assert.ok(card.includes('de 39 selos'));
 assert.ok(card.includes('Nível 3 · 1250 XP'));
 assert.ok(!api.cardSvg(full).includes('Nível'),'level line is optional');
 assert.ok(card.includes('Sem ranking público'));
 for(const rect of card.matchAll(/translate\((-?\d+) (-?\d+)\) scale\(([\d.]+)\)/g)){
  const [,x,y,s]=rect.map(Number);
  assert.ok(x>=0&&y>=0&&x+120*s<=1200&&y+120*s<=675,'seal inside card bounds: '+rect[0]);
 }
}

/* ---- Privacy and safety of the source ---- */
for(const forbidden of ['fetch(','XMLHttpRequest','sendBeacon','document.cookie','innerHTML','outerHTML','insertAdjacentHTML','eval(','new Function','WebSocket','indexedDB'])
 assert.ok(!source.includes(forbidden),'selos must not use '+forbidden);
/* The SVG xmlns is a namespace identifier, never fetched; any other URL would be a network host. */
assert.ok(!/https?:\/\/(?!paulociano\.github\.io\/mare|www\.w3\.org\/2000\/svg)/.test(source),'no foreign hosts');
assert.ok(!/localStorage\.(?:setItem|getItem)\((?!KEY)/.test(source),'only the documented storage key is touched');
assert.ok(source.includes("const KEY='mare-selos-v1'"));
assert.ok(/saved\.v!==1/.test(source),'stored data is versioned and validated');

/* ---- Wiring: every page, same order, published ---- */
assert.ok(manifest.requiredFiles.includes('src/scripts/shared/mare-selos.js'));
assert.ok(fs.existsSync('src/styles/shared/mare-selos.css'));
for(const page of manifest.pages){
 const html=read(page+'.html');
 const scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
 const selos=scripts.indexOf('src/scripts/shared/mare-selos.js');
 assert.ok(selos>=0,page+': selos script missing');
 assert.equal(scripts.filter(s=>s.endsWith('mare-selos.js')).length,1,page+': loaded once');
 assert.ok(scripts.indexOf('src/scripts/shared/mare-progress.js')<selos,page+': progress must load first');
 assert.ok(scripts.indexOf('src/scripts/shared/mare-finale.js')<selos,page+': finale must load first');
 const styles=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(styles.filter(s=>s.endsWith('mare-selos.css')).length,1,page+': stylesheet once');
 assert.ok(styles.indexOf('src/styles/shared/mare-selos.css')<styles.indexOf('src/styles/shared/mare-kanagawa.css'),page+': selos css before the Kanagawa layer');
}
assert.ok(read('index.html').includes('<a href="#colecao-de-selos">Selos</a>'));
console.log('PASS: Selos do Mar — levels, persistence, share links, SVG and wiring');
