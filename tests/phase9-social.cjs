'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const social=read('mare-social.js');
new vm.Script(social);
const registry=['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma','perola','farol'];
const day='2026-10-17',today=new Date('2026-10-17T18:00:00Z');
const empty={read:()=>[]},window={MareProgress:empty};
vm.runInNewContext(social,{window,document:undefined,location:{hash:'#not-mare'},Intl,Date,URL,Set,Map,Math,JSON,Number});
const api=window.MareSocial;
assert.ok(Object.isFrozen(api));assert.equal(api.games.length,12);
assert.equal(api.day(today),day);
assert.equal(api.day(new Date('2026-10-18T02:59:59Z')),day);
assert.equal(api.day(new Date('2026-10-18T03:00:00Z')),'2026-10-18');
assert.equal(api.dayIndex(day),20743);
assert.equal(api.dayIndex('2026-02-30'),null);
assert.equal(api.dayIndex('2026-13-15'),null);
assert.equal(api.dayIndex('garbage'),null);
for(const game of registry){
 const invite=api.code(game,day);
 assert.equal(invite,'#mare9=1.'+game+'.'+day+'.p');
 assert.equal(api.parse(invite).game,game);
 assert.equal(api.parse(api.code(game,day,'w')).claim,'w');
 assert.ok(api.current(api.parse(invite),today));
 assert.ok(!api.current(api.parse(invite),new Date('2026-10-18T14:00Z')));
 assert.equal(api.gameChallenge(game,invite,today).game,game);
 assert.equal(api.gameChallenge(game,invite,new Date('2026-10-18T14:00Z')),null);
 assert.equal(api.gameChallenge('recife',api.code(game,day,'w'),today)?.game,game==='recife'?'recife':undefined);
}
for(const bad of [
 '#mare9=1.inexistente.2026-10-17.w',
 '#mare9=1.cardume.2026-02-30.w',
 '#mare9=1.cardume.2026-10-17.x',
 '#mare9=1.cardume.2026-10-17.w#foo',
 '#mare9=1.cardume.2026-10-17.w%0D',
 '#mare9=1.cardume.2026-10-17.w<script>',
 '#mare9=1.cardume.2026-10-17.w/../../x',
 'https://evil.example/#mare9=1.cardume.2026-10-17.p'
])assert.equal(api.parse(bad),null,'Untrusted fragment must be rejected: '+bad);
assert.equal(api.code('invalid',day),null);
assert.equal(api.code('recife','notdate'),null);
assert.equal(api.code('recife',day,'evil'),null);
assert.equal(api.compare('w','w'),'empate');
assert.equal(api.compare('w','l'),'você venceu');
assert.equal(api.compare('l','w'),'amigo venceu');
assert.equal(api.compare(null,'w'),null);
assert.equal(api.compare('w','p'),null);
const now=new Date('2026-10-17T20:00:00Z'),at='2026-10-17T15:05:00.000Z';
const samples={
 recife:'mare-solo-20261017',
 abismo:'mare-semantico-challenge-'+day,
 cardume:'mare-cardume-daily-4-'+day,
 corrente:'mare-corrente-daily-'+day,
 concha:'mare-concha-daily-'+day,
 trilha:'mare-trilha-daily-'+day,
 enigma:'mare-enigma-daily-'+day,
 marujo:'mare-marujo-daily-'+day,
 forca:'daily:'+day,
 criptograma:'mare-criptograma-daily-'+day,
 perola:'daily:'+day,farol:'daily:'+day
};
for(const game of registry){
 const item={game,id:game+':'+samples[game],outcome:'win',at};
 assert.ok(api.belongs(item,game,day,now),game+' daily identifier must be comparable');
 window.MareProgress={read:()=>[item]};
 assert.equal(api.localOutcome(game,day,now),'w');
 assert.equal(api.localOutcome(game,'2026-10-16',now),null);
 assert.ok(!api.belongs({...item,at:'2050-01-01T00:00:00Z'},game,day,now),'Future-dated round');
 assert.ok(!api.belongs({...item,outcome:'unknown'},game,day,now));
 assert.ok(!api.belongs({...item,id:game+':free:10'},game,day,now),'Free mode cannot count as daily');
 assert.equal(api.localOutcome('other',day,now),null);
}
window.MareProgress={read:()=>[{game:'perola',id:'perola:free:2',outcome:'win',at}]};
assert.equal(api.localOutcome('perola',day,now),null,'Free-game results must not masquerade as same-day challenge');
window.MareProgress={read:()=>[{game:'forca',id:'forca:daily:'+day,outcome:'loss',at}]};
assert.equal(api.localOutcome('forca',day,now),'l');
assert.equal(api.abismoIndex(day,48),api.abismoIndex(day,48));
assert.equal(api.abismoIndex('invalid',48),null);
assert.equal(api.abismoIndex(day,0),null);
assert.equal(api.gameChallenge('abismo',api.code('abismo',day),today).index,api.abismoIndex(day,48));
assert.ok(!/fetch\s*\(|sendBeacon|XMLHttpRequest|indexedDB|localStorage\.setItem/.test(social),
 'Social layer must not fetch, transmit or write personal progression');
assert.ok(!/innerHTML\s*=/.test(social),'Untrusted input must not be rendered as HTML');
for(const page of ['index',...registry]){
 const html=read(page+'.html');
 assert.ok(html.includes('href="mare-social.css"'),page+' missing style');
 assert.ok(html.includes('src="mare-social.js"'),page+' missing script');
 assert.ok(html.indexOf('src="mare-progress.js"')<html.indexOf('src="mare-social.js"'),page+' wrong ledger order');
 if(page==='abismo')assert.ok(html.indexOf('src="mare-social.js"')<html.indexOf('src="abismo.js"'),'Abismo deep link init order');
}
assert.ok(read('index.html').includes('href="#desafios-entre-amigos"'),'Social section navigation missing');
assert.ok(read('abismo.js').includes('mare-semantico-challenge-'),'Abismo same-puzzle social state needs daily isolation');
assert.ok(read('recife.js').includes("timeZone:'America/Sao_Paulo'"),'Recife must use shared challenge timezone');
const css=read('mare-social.css');
assert.ok(css.includes('prefers-reduced-motion:reduce')&&css.includes(':focus-visible'));
console.log('PASS Phase9: 12 game links, same-day contract, validation, honest comparisons, privacy, cards and 13-page integration');
