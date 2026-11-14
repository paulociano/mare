// Shadowed-declaration finder. A declaration is provably dead, in every state,
// when on EVERY page that loads its file a LATER rule with the IDENTICAL selector
// and the same (or no) conditional context sets the same property with equal or
// higher importance. Identical selectors have identical specificity, so source
// order alone decides, whatever classes or states the element has at runtime.
const fs=require('fs'),path=require('path'),postcss=require('postcss');
const root=process.argv[2],apply=process.argv.includes('--apply');
const pages=JSON.parse(fs.readFileSync(path.join(root,'config/site-manifest.json'),'utf8')).pages;
const order=new Map();
for(const p of pages){const h=fs.readFileSync(path.join(root,p+'.html'),'utf8');order.set(p,[...h.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"'?#]+\.css)/g)].map(m=>m[1]))}
const files=[...new Set([...order.values()].flat())];
const COVERS={background:/^background-/,border:/^border-(?!radius|collapse|spacing)/,'border-top':/^border-top-(width|style|color)$/,'border-right':/^border-right-(width|style|color)$/,'border-bottom':/^border-bottom-(width|style|color)$/,'border-left':/^border-left-(width|style|color)$/,'border-color':/^border-(top|right|bottom|left)-color$/,'border-width':/^border-(top|right|bottom|left)-width$/,'border-style':/^border-(top|right|bottom|left)-style$/,'border-radius':/^border-(top|bottom)-(left|right)-radius$/,margin:/^margin-(top|right|bottom|left)$/,padding:/^padding-(top|right|bottom|left)$/,inset:/^(top|right|bottom|left)$/,font:/^(font-(size|family|weight|style|variant|stretch)|line-height)$/,outline:/^outline-(width|style|color)$/,transition:/^transition-/,animation:/^animation-/,flex:/^flex-(grow|shrink|basis)$/,gap:/^(row|column)-gap$/,overflow:/^overflow-(x|y)$/,'text-decoration':/^text-decoration-/,'list-style':/^list-style-/,'place-items':/^(align|justify)-items$/,'place-content':/^(align|justify)-content$/,'grid-template':/^grid-template-(rows|columns|areas)$/,'grid-area':/^grid-(row|column)(-start|-end)?$/,'grid-column':/^grid-column-(start|end)$/,'grid-row':/^grid-row-(start|end)$/};
const covers=(later,earlier)=>later===earlier||later==='all'||(COVERS[later]&&COVERS[later].test(earlier));
const FRAGILE=/\b\d*\.?\d+(dvh|svh|lvh|dvw|svw|lvw|cqw|cqh|cqi)\b|color-mix|oklch|oklab|\blch\(|\blab\(|light-dark|-webkit-|-moz-|-ms-|image-set|anchor\(/;
const norm=s=>s.replace(/\s+/g,' ').replace(/\s*([>+~,])\s*/g,'$1').trim();
// index declarations
const asts=new Map();const decls=[];
for(const f of files){const css=fs.readFileSync(path.join(root,f),'utf8');const ast=postcss.parse(css);asts.set(f,{ast,css});let seq=0;
 ast.walkRules(rule=>{
  const chain=[];let layered=false,skip=false;
  for(let p=rule.parent;p&&p.type!=='root';p=p.parent){if(p.type==='atrule'){if(/keyframes$/i.test(p.name)||/^(font-face|page|property)$/i.test(p.name))skip=true;if(p.name==='layer')layered=true;chain.unshift('@'+p.name+' '+norm(p.params))}else if(p.type==='rule')skip=true}
  if(skip)return;
  const sels=rule.selectors.map(norm);const ctx=chain.join('|');
  rule.each(node=>{if(node.type!=='decl')return;decls.push({file:f,seq:seq++,rule,node,sels,ctx,layered,prop:node.prop.toLowerCase(),imp:!!node.important,value:node.value})});
 })}
// per (selector) index
const bySel=new Map();for(const d of decls)for(const s of d.sels){if(!bySel.has(s))bySel.set(s,[]);bySel.get(s).push(d)}
const pagesOf=f=>pages.filter(p=>order.get(p).includes(f));
function shadowedOn(d,sel,page){
 const list=order.get(page),at=list.indexOf(d.file);
 return bySel.get(sel).some(o=>{
  if(o===d||o.layered||o.rule===d.rule)return false;
  if(!(o.ctx===d.ctx||o.ctx===''))return false;
  if(o.imp<d.imp)return false;
  if(!covers(o.prop,d.prop))return false;
  if(FRAGILE.test(o.value))return false;
  const oat=list.indexOf(o.file);if(oat<0)return false;
  return oat>at||(oat===at&&o.seq>d.seq);
 });
}
let dead=[];
for(const d of decls){if(d.layered)continue;const ps=pagesOf(d.file);if(!ps.length)continue;
 if(d.sels.every(sel=>ps.every(p=>shadowedOn(d,sel,p))))dead.push(d)}
const stat={decls:decls.length,dead:dead.length,deadImportant:dead.filter(d=>d.imp).length,byFile:{}};
for(const d of dead)stat.byFile[path.basename(d.file)]=(stat.byFile[path.basename(d.file)]||0)+1;
if(apply){for(const d of dead)d.node.remove();
 for(const [f,{ast,css}] of asts){ast.walkRules(r=>{if(r.nodes.length===0)r.remove()});let ch=true;while(ch){ch=false;ast.walkAtRules(a=>{if(a.nodes&&a.nodes.length===0&&!/^(font-face|layer|view-transition|property)$/i.test(a.name)){a.remove();ch=true}})}
  const out=ast.toString();if(out!==css)fs.writeFileSync(path.join(root,f),out)}}
let before=0,after=0;for(const f of files){before+=asts.get(f).css.length;after+=asts.get(f).ast.toString().length}
stat.bytesBefore=before;if(apply)stat.bytesAfter=after;
console.log(JSON.stringify(stat,null,0));
if(process.argv.includes('--sample'))for(const d of dead.slice(0,12))console.log(path.basename(d.file),'|',d.sels.join(',').slice(0,70),'{',d.prop+':'+d.value.slice(0,40)+(d.imp?' !important':''),'}');
