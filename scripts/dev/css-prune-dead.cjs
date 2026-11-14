// Dead-rule finder: a selector is dead when it requires a class or id that
// exists nowhere in the project's HTML or JavaScript (not even as a dynamic prefix).
const fs=require('fs'),path=require('path'),postcss=require('postcss'),sp=require('postcss-selector-parser');
const root=process.argv[2],apply=process.argv[3]==='--apply';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const sources=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')).map(f=>path.join(root,f)),...walk(path.join(root,'src/scripts')),...walk(path.join(root,'assets')).filter(f=>/\.(svg|html|js)$/.test(f)&&!/vendor/.test(f))];
const text=sources.map(f=>fs.readFileSync(f,'utf8')).join('\n');
// every identifier-like word that appears anywhere in the sources
const words=new Set(text.match(/[A-Za-z_][A-Za-z0-9_-]*/g));
// dynamic prefixes: a string literal ending in a separator that is concatenated or interpolated
const prefixes=new Set();
// Only where a class name is being built: className / classList / class= / setAttribute('class'
const classy=[...text.matchAll(/(?:className|classList\s*\.\s*(?:add|remove|toggle|contains|replace)|class\s*=|setAttribute\(\s*['"]class['"])[^;\n]{0,260}/g)].map(m=>m[0]).join('\n');
for(const m of classy.matchAll(/['"`\s]([A-Za-z][A-Za-z0-9_-]*[-_])['"`]\s*\+/g))prefixes.add(m[1]);
for(const m of classy.matchAll(/([A-Za-z][A-Za-z0-9_-]*[-_])\$\{/g))prefixes.add(m[1]);
for(const m of classy.matchAll(/\+\s*['"`]([-_][A-Za-z0-9_-]+)['"`]/g))prefixes.add('*'+m[1]); // suffix
const alive=tok=>words.has(tok)||[...prefixes].some(p=>p[0]==='*'?tok.endsWith(p.slice(1)):tok.startsWith(p));
const SKIP=new Set([':not',':is',':where',':has',':matches',':-webkit-any',':-moz-any']);
function missing(selector){ // tokens this selector REQUIRES that do not exist
  const miss=[];
  sp(rootNode=>{rootNode.walk(node=>{
    if(node.type!=='class'&&node.type!=='id')return;
    for(let p=node.parent;p;p=p.parent)if(p.type==='pseudo'&&SKIP.has(p.value.toLowerCase()))return;
    if(!alive(node.value))miss.push((node.type==='class'?'.':'#')+node.value);
  })}).processSync(selector);
  return miss;
}
let stats={files:0,rules:0,deadRules:0,deadSelectors:0,bytesBefore:0,bytesAfter:0,importantBefore:0,importantAfter:0};const tokens=new Map();
for(const dir of ['src/styles/shared','src/styles/games'])for(const f of fs.readdirSync(path.join(root,dir))){
  const file=path.join(root,dir,f),css=fs.readFileSync(file,'utf8');const ast=postcss.parse(css);stats.files++;stats.bytesBefore+=css.length;stats.importantBefore+=(css.match(/!important/g)||[]).length;
  ast.walkRules(rule=>{
    if(rule.parent&&rule.parent.type==='atrule'&&/keyframes$/i.test(rule.parent.name))return;
    stats.rules++;
    let keep;try{keep=rule.selectors.filter(sel=>{const miss=missing(sel);if(miss.length){stats.deadSelectors++;for(const t of miss)tokens.set(t,(tokens.get(t)||0)+1);return false}return true})}catch(e){return}
    if(keep.length===rule.selectors.length)return;
    if(!keep.length){stats.deadRules++;rule.remove()}else rule.selectors=keep;
  });
  // drop at-rules left empty
  let changed=true;while(changed){changed=false;ast.walkAtRules(at=>{if(at.nodes&&at.nodes.length===0&&!/^(font-face|layer|view-transition|property)$/i.test(at.name)){at.remove();changed=true}})}
  const out=ast.toString();stats.bytesAfter+=out.length;stats.importantAfter+=(out.match(/!important/g)||[]).length;
  if(apply&&out!==css)fs.writeFileSync(file,out);
}
console.log(JSON.stringify(stats));
console.log('prefixes:',[...prefixes].slice(0,60).join(' '));
console.log('top missing tokens:',[...tokens].sort((a,b)=>b[1]-a[1]).slice(0,70).map(([t,n])=>t+'×'+n).join('  '));
