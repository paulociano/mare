#!/usr/bin/env python3
"""Inspect visible legacy dark surfaces in Kanagawa Light without changing UI.
Outputs per-page actionable top offenders. Not an accessibility certificate."""
from __future__ import annotations
import http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"_site"
OUT=ROOT/"playwright-artifacts"
PAGES="index recife abismo cardume corrente concha trilha enigma marujo forca criptograma perola farol".split()
class Server(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(SITE),**kw)
 def log_message(self,*args):pass
SCRIPT=r"""() => {
  const lum=(c)=>{
    let nums=(c||'').match(/[\d.]+/g);
    if(!nums||nums.length<3)return 1;
    const rgb=nums.slice(0,3).map(n=>Number(n)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
    return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
  };
  const backgrounds=[];
  const all=[...document.body.querySelectorAll('*')];
  for(const el of all){
    if(backgrounds.length>4500)break;
    const s=getComputedStyle(el), r=el.getBoundingClientRect();
    if(r.width<32||r.height<17||r.bottom<0||r.top>document.documentElement.scrollHeight ||
       s.display==='none'||s.visibility!=='visible'||Number(s.opacity)<.35)continue;
    const dark=lum(s.backgroundColor)<.12&&s.backgroundColor!=='rgba(0, 0, 0, 0)';
    const darkGrad=/linear-gradient|radial-gradient/.test(s.backgroundImage)&&
      /#0[0-9a-f]{5}|rgb\([ ]?(?:0|1[0-9]|2[0-9]|3[0-9])[, ]/i.test(s.backgroundImage);
    if(!dark&&!darkGrad)continue;
    const p=el.parentElement, ps=p?getComputedStyle(p):null;
    const sameParent=ps?.backgroundColor===s.backgroundColor&&ps?.backgroundImage===s.backgroundImage;
    if(sameParent)continue;
    let selector=el.tagName.toLowerCase();
    if(el.id)selector+='#'+el.id;
    if(el.classList.length)selector+='.'+[...el.classList].slice(0,3).join('.');
    backgrounds.push({selector,bg:s.backgroundColor,fg:s.color,grad:darkGrad?
       s.backgroundImage.slice(0,125):undefined,area:Math.round(r.width*r.height),
       size:[Math.round(r.width),Math.round(r.height)],position:[Math.round(r.left),Math.round(r.top)]});
  }
  const stats={count:backgrounds.length,dark:backgrounds.filter(x=>!x.grad).length,
    gradient:backgrounds.filter(x=>!!x.grad).length};
  return {stats,top:backgrounds.sort((a,b)=>b.area-a.area).slice(0,16)};
}"""
def main():
 assert (SITE/"index.html").exists(),"Build _site first"
 OUT.mkdir(exist_ok=True)
 server=http.server.ThreadingHTTPServer(("127.0.0.1",0),Server)
 threading.Thread(target=server.serve_forever,daemon=True).start()
 rows=[]
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
   for width,label in [(1440,"desktop"),(390,"mobile")]:
    context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
    for name in PAGES:
     page=context.new_page()
     try:
      page.goto(f"http://127.0.0.1:{server.server_port}/{name}.html",wait_until="domcontentloaded")
      page.locator("main").wait_for()
      page.wait_for_timeout(220)
      row=page.evaluate(SCRIPT)
      row.update(route=name,device=label)
      rows.append(row)
      print('SURFACES',label,name,'dark',row["stats"]["count"],json.dumps(row["top"][:10],ensure_ascii=False),flush=True)
     finally:page.close()
    context.close()
   browser.close()
 finally:server.shutdown();server.server_close()
 (OUT/'kanagawa-surface-inventory.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False),encoding='utf8')
 print("SURFACE SUMMARY",len(rows),sum(x['stats']['count'] for x in rows),flush=True)
if __name__=='__main__':main()
