// Computed-style parity between two builds: every element, every property, plus ::before/::after.
const {chromium}=require('playwright-core');
// Uso: node scripts/dev/css-compare-computed.cjs http://localhost:8125/ http://localhost:8124/
// (dois builds servidos lado a lado). CHROME aponta para o executável do navegador.
const pages=['index','recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma','perola','farol'];
const [A,B]=[process.argv[2],process.argv[3]];
const dump=()=>{const out=[];const els=[document.documentElement,...document.querySelectorAll('body, body *')];for(const el of els){for(const pseudo of [null,'::before','::after']){const cs=getComputedStyle(el,pseudo);if(pseudo&&(cs.content==='none'||cs.content==='normal'))continue;const parts=[];for(let i=0;i<cs.length;i++){const p=cs[i];parts.push(p+':'+cs.getPropertyValue(p).split(location.origin).join(''))}parts.sort();const s=parts.join(';;');out.push([el.tagName+(el.id?'#'+el.id:'')+'.'+String(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className).slice(0,40)+(pseudo||''),s])}}return out};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox']});let bad=0,total=0;
const states=[['default',null],['alto-contraste',{scale:'extra',contrast:true,motion:true,focus:false}],['foco',{scale:'large',contrast:false,motion:false,focus:true}],['ajuda',null]];
for(const [vn,vp,mobile] of [['m',{width:390,height:844},true],['d',{width:1440,height:900},false],['t',{width:820,height:1100},true]]){
 for(const p of pages)for(const [state,prefs] of states){
  if(state==='ajuda'&&(p==='index'||vn==='t'))continue; if((state==='alto-contraste'||state==='foco')&&vn==='t')continue;if(state==='foco'&&vn==='d')continue;
  const res=[];
  for(const base of [A,B]){const ctx=await b.newContext({viewport:vp,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',reducedMotion:'reduce'});const pg=await ctx.newPage();
   await pg.clock.install({time:new Date('2026-11-14T15:00:00Z')});
   if(prefs)await pg.addInitScript(v=>{try{localStorage.setItem('mare-accessibility-v1',JSON.stringify(v))}catch{}},prefs);
   await pg.addInitScript(()=>{try{localStorage.setItem('mare-ajuda-vista-v1',JSON.stringify(['recife','abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma','perola','farol']))}catch{}});
   await pg.goto(base+(p==='index'?'':p+'.html'),{waitUntil:'load'});await pg.waitForTimeout(600);
   if(state==='ajuda'){const h=pg.locator('#help');if(await h.count()){await h.first().click({force:true}).catch(()=>{});await pg.waitForTimeout(250)}}
   await pg.waitForLoadState('networkidle').catch(()=>{});await pg.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
   res.push(await pg.evaluate(dump));await ctx.close()}
  const [x,y]=res;total++;let diffs=[];
  if(x.length!==y.length)diffs.push('element count '+x.length+' vs '+y.length);
  else for(let i=0;i<x.length;i++){if(x[i][1]!==y[i][1]){const pa=new Map(x[i][1].split(';;').map(v=>[v.split(':')[0],v])),pb=new Map(y[i][1].split(';;').map(v=>[v.split(':')[0],v]));const props=[...new Set([...pa.keys(),...pb.keys()])].filter(k=>pa.get(k)!==pb.get(k)).slice(0,4).map(k=>(pa.get(k)||k+':(ausente)')+' -> '+(pb.get(k)||'(ausente)').split(':').slice(1).join(':'));diffs.push(x[i][0]+' {'+props.join(' | ')+'}')}}
  // ignore the invite URL field, which contains the port
  diffs=diffs.filter(d=>!/INPUT.*mare-social/.test(d)&&!/^DIV\.bubble/.test(d));
  if(diffs.length){bad++;console.log(vn,p,state,'DIFF',diffs.length,'\n   '+diffs.slice(0,4).join('\n   ').slice(0,900))}
 }}
console.log('contexts compared:',total,'with differences:',bad);await b.close()})().catch(e=>{console.error('FAIL',e);process.exit(1)});
