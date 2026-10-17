'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/scripts/shared/mare-progress.js','utf8');
const ui=fs.readFileSync('src/scripts/shared/mare-voyage.js','utf8');
const diary=fs.readFileSync('src/scripts/shared/mare-explorer.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/styles/shared/mare-voyage.css','utf8');
new vm.Script(source);new vm.Script(ui);new vm.Script(diary);
const map=new Map(),window={};
const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
vm.runInNewContext(source,{window,localStorage:storage,Date,Intl,Set,Math,JSON});
const api=window.MareProgress;
const at=(iso,game,outcome='win',id=game+iso)=>({id:game+':'+id,game,outcome,at:iso});
const save=rounds=>map.set('mare-verified-results-v1',JSON.stringify(rounds));
const t17=new Date('2026-10-18T02:40:00.000Z'); // 17 Oct 23:40 São Paulo
const t18=new Date('2026-10-18T03:20:00.000Z'); // 18 Oct 00:20 São Paulo
const t19=new Date('2026-10-19T12:00:00.000Z');
const t20=new Date('2026-10-20T12:00:00.000Z');
assert.equal(api.streak(t17).current,0);
assert.equal(api.dailyChallenge(t17).day,'2026-10-17');
assert.equal(api.dailyChallenge(t18).day,'2026-10-18');
const c17=api.dailyChallenge(t17),c18=api.dailyChallenge(t18);
assert.notEqual(c17.game,c18.game,'Daily spotlight must rotate every day');
assert.equal(c17.game,api.dailyChallenge(t17).game,'Deterministic challenge game');
assert.equal(c17.completed,false);
save([at('2026-10-17T22:00:00.000Z',c17.game,'loss','day17'),
 at('2026-10-18T03:05:00.000Z',c18.game,'win','day18')]);
assert.equal(api.dailyChallenge(t17).completed,true,'Verified defeat completes daily participation');
assert.equal(api.dailyChallenge(t17).won,false);
assert.equal(api.dailyChallenge(t18).completed,true);
assert.equal(api.dailyChallenge(t18).won,true,'Verified win earns daily treasure');
assert.equal(api.streak(t18).current,2);
assert.equal(api.streak(t18).longest,2);
assert.equal(api.streak(t18).daysActive,2);
assert.equal(api.streak(t18).playedToday,true);
assert.equal(api.streak(t19).current,2,'Yesterday retains streak without forcing morning check-in');
assert.equal(api.streak(t20).current,0,'Streak becomes inactive after a missed complete day');
assert.equal(api.streak(t20).longest,2,'Record persists when streak breaks');
assert.equal(api.streak(t19).week.length,7);
assert.equal(api.missions(t18)[0].value,1);
assert.equal(api.missions(t19)[0].value,0,'Daily mission rolls over at Sao Paulo midnight');
assert.equal(api.missions(t19)[2].value,0,'Weekly mission rolls over Monday');
assert.equal(api.stats().wins,1);assert.equal(api.stats().xp,120);
assert.equal(api.recent(t18).length,2);
assert.equal(api.recent(t18)[0].day,'2026-10-18');
assert.ok(api.achievements(t18).find(x=>x.id==='daily-voyage').earned);
assert.ok(api.achievements(t18).find(x=>x.id==='daily-treasure').earned);
assert.ok(api.achievements(t18).find(x=>x.id==='first-dive').earned);
assert.ok(!api.achievements(t18).find(x=>x.id==='five-wins').earned);
assert.ok(api.achievements(t18).every(x=>typeof x.detail==='string'&&Number.isFinite(x.progress)&&x.target>0));
const before=map.get('mare-verified-results-v1');
api.dailyChallenge(t18);api.streak(t18);api.achievements(t18);api.recent(t18);
assert.equal(map.get('mare-verified-results-v1'),before,'Read-only milestones cannot change saved outcomes');
// Chronological streak and achievements across a controlled longer history.
const fixtures=[];
for(let i=0;i<8;i++){
 const stamp=new Date(Date.UTC(2026,9,1+i,16));
 fixtures.push(at(stamp.toISOString(),['recife','abismo','cardume','corrente'][i%4],
   'win','streak-'+i));
}
save(fixtures);
const t=new Date('2026-10-09T12:00:00.000Z');
const a=api.achievements(t);
for(const name of ['five-wins','three-games','three-streak','seven-streak','seven-days','ten-rounds']){
 const row=a.find(x=>x.id===name);
 assert.equal(row.earned,name!=='ten-rounds','Milestone '+name);
}
assert.equal(api.streak(t).longest,8);
assert.equal(a.find(x=>x.id==='seven-streak').earnedAt,'2026-10-07');
assert.equal(api.stats().xp,800,'Existing 100XP win values remain unchanged');
assert.ok(api.recent(t,3).length===3);
save([at('2999-01-01T12:00:00Z','recife','win','future')]);
assert.equal(api.dailyChallenge(t18).completed,false,'Future timestamp must never complete daily challenge');
assert.equal(api.streak(t18).daysActive,0);
assert.equal(api.achievements(t18).find(x=>x.id==='first-win').earned,false,
 'Future-dated forged ledger items must not award achievements');
assert.equal(html.indexOf('src="src/scripts/shared/mare-progress.js"')<html.indexOf('src="src/scripts/shared/mare-explorer.js"'),true);
assert.ok(html.indexOf('src="src/scripts/shared/mare-explorer.js"')<html.indexOf('src="src/scripts/shared/mare-voyage.js"'));
assert.ok(html.includes('href="src/styles/shared/mare-voyage.css"'));
assert.ok(!/localStorage\.setItem/.test(ui),'New voyage UI is read-only');
assert.ok(ui.includes('api.dailyChallenge()')&&ui.includes('api.streak()')&&ui.includes('api.recent('));
assert.ok(css.includes('prefers-reduced-motion:reduce')&&css.includes(':focus-visible'));
console.log('PASS: Phase7 deterministic 12-game daily rotation, Sao Paulo boundaries, rollover, participation streaks, verified awards, future guard, UI privacy');
