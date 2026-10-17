#!/usr/bin/env python3
"""MARÉ Phase 4: browser axe-core, responsive reflow, touch and laboratory signals.

Accessibility scans are automated WCAG tests, not certification. "Zoom 200%"
is approximated by 640 CSS px for a 1280 CSS px design, not real browser zoom.
LCP and CLS are lab-only observations; INP requires meaningful user data.
"""
from __future__ import annotations
import http.server,json,statistics,threading,time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"_site"
ART=ROOT/"playwright-artifacts"
PAGES=["index","recife","abismo","cardume","corrente","concha","trilha",
       "enigma","marujo","forca","criptograma","perola","farol"]
AXE=ROOT/"node_modules/axe-core/axe.min.js"

class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*args):pass

BOOTSTRAP="""() => {
 window.__mareLab={lcp:0,cls:0};
 try {
  new PerformanceObserver(list=>{
   for(const entry of list.getEntries())window.__mareLab.lcp=Math.max(window.__mareLab.lcp,entry.startTime);
  }).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(list=>{
   for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__mareLab.cls+=entry.value;
  }).observe({type:'layout-shift',buffered:true});
 }catch{}
}"""

def scan(page,axe_file):
    page.add_script_tag(path=str(axe_file))
    return page.evaluate("""async () => {
      const r=await axe.run(document,{
       runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}
      });
      return {violations:r.violations.map(v=>({
        id:v.id,impact:v.impact,help:v.help,helpUrl:v.helpUrl,
        nodes:v.nodes.slice(0,8).map(n=>{
          const el=document.querySelector(n.target[0]);const style=el?getComputedStyle(el):null;
          const parent=el?.parentElement?getComputedStyle(el.parentElement):null;
          return {target:n.target,summary:n.failureSummary,
                  computed:style?{color:style.color,bg:style.backgroundColor,opacity:style.opacity,parentBg:parent?.backgroundColor}:null};
        })
      })),incomplete:r.incomplete.map(v=>v.id),passes:r.passes.length};
    }""")

def main():
    assert (SITE/"index.html").is_file(),"Build output missing"
    assert AXE.is_file(),"Pin and install axe-core@4.10.3 in CI before running audit"
    ART.mkdir(exist_ok=True)
    server=http.server.ThreadingHTTPServer(("127.0.0.1",0),Quiet)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    rows=[];blocking=[];summary=[]
    try:
      with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
        for kind,width,has_touch in [("desktop",1280,False),("mobile",390,True)]:
          context=browser.new_context(viewport={"width":width,"height":820},device_scale_factor=1,
                                      is_mobile=has_touch,has_touch=has_touch,
                                      reduced_motion="reduce",locale="pt-BR")
          context.add_init_script('('+BOOTSTRAP+')()')
          for name in PAGES:
            page=context.new_page()
            page.set_default_timeout(12000)
            local_errors=[];missing=[]
            page.on("pageerror",lambda e:local_errors.append(str(e)))
            page.on("response",lambda r:missing.append(r.url) if
                r.status>=400 and r.url.startswith("http://127.0.0.1:") else None)
            try:
              response=page.goto(f"http://127.0.0.1:{server.server_port}/{name}.html",
                                 wait_until="load",timeout=25000)
              assert response and response.ok,name+" unavailable"
              page.wait_for_timeout(300)
              axe=scan(page,AXE)
              perf=page.evaluate("""() => ({
                lcp:window.__mareLab?.lcp?Math.round(window.__mareLab.lcp):null,
                cls:Math.round((window.__mareLab?.cls||0)*1000)/1000,
                dcl:Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd||0),
                transfer:performance.getEntriesByType('resource').reduce((sum,r)=>sum+(r.transferSize||0),0)
              })""")
              horizontal=page.evaluate("""() => ({
                actual:document.documentElement.scrollWidth,
                allowed:document.documentElement.clientWidth
              })""")
              if horizontal["actual"]>horizontal["allowed"]+3:
                  blocking.append(kind+"/"+name+": horizontal overflow at "+str(width)+"px")
              if missing:blocking.append(kind+"/"+name+": missing local assets "+repr(missing[:3]))
              if local_errors:blocking.append(kind+"/"+name+": JS exceptions "+repr(local_errors[:2]))
              for violation in axe["violations"]:
                if violation["impact"] in ("critical","serious"):
                  blocking.append(kind+"/"+name+": "+violation["id"]+
                                  " ("+violation["impact"]+") "+str(violation["nodes"][0]["target"] if violation["nodes"] else ""))
              # Browser-executed touch action (real pointer emulation).
              if has_touch and name!="index":
                touch=page.locator("main button:not([disabled])").first
                if touch.count():
                  touch.tap(timeout=8000)
              rows.append({"page":name,"device":kind,"cssWidth":width,
                           "axe":axe,"performanceLab":perf,"reflow":horizontal,
                           "missingAssets":missing,"pageErrors":local_errors})
            except Exception as exc:
              blocking.append(kind+"/"+name+": "+str(exc))
              rows.append({"page":name,"device":kind,"error":str(exc)})
            finally:page.close()
          context.close()
        # 320px narrow reflow and 640px 200%-equivalent CSS viewport.
        for width in (320,640):
          context=browser.new_context(viewport={"width":width,"height":820},reduced_motion="reduce")
          for name in PAGES:
            page=context.new_page()
            try:
              page.goto(f"http://127.0.0.1:{server.server_port}/{name}.html",
                        wait_until="domcontentloaded",timeout=20000)
              page.locator("main").wait_for(timeout=10000)
              rect=page.evaluate("""() => ({
                scroll:document.documentElement.scrollWidth,
                width:document.documentElement.clientWidth
              })""")
              if rect["scroll"]>rect["width"]+3:
                blocking.append(f"reflow/{name}/{width}px: overflow {rect}")
              summary.append({"page":name,"viewport":width,"reflow":rect})
            except Exception as exc:blocking.append(f"reflow/{name}/{width}px: {exc}")
            finally:page.close()
          context.close()
        browser.close()
    finally:
      server.shutdown();server.server_close()
    violations=[{"page":x["page"],"device":x["device"],"items":x["axe"]["violations"]}
                for x in rows if "axe" in x and x["axe"]["violations"]]
    report={"tested":len(rows),"reflows":len(summary),"blocking":blocking,
            "violations":violations,"pages":rows,"reflowChecks":summary,
            "scope":"Chromium axe 4.10.3 WCAG 2.2 automated rules, responsive reflow and touch emulation",
            "limitations":"No manual screen-reader or actual 200% browser zoom; Core Web Vitals reported as single-run lab diagnostics, no INP field/p75."}
    (ART/"phase4-quality.json").write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding="utf8")
    for item in blocking:print("BLOCK",item,flush=True)
    if blocking:
      for row in rows:
        for violation in row.get("axe",{}).get("violations",[]):
          if violation.get("impact") in ("critical","serious"):
            print("DETAIL",row["device"]+"/"+row["page"],violation["id"],
                  [(n["target"],n.get("computed")) for n in violation["nodes"][:8]],flush=True)
    print(f"Phase4 quality: {len(rows)}/26 scans, {len(summary)}/26 reflow checks, "
          f"{len(violations)} scans with WCAG findings, {len(blocking)} blockers",flush=True)
    print("Lab samples (ms, CLS):",[(x["page"],x["performanceLab"]["lcp"],
                                  x["performanceLab"]["cls"]) for x in rows if x.get("device")=="desktop" and "performanceLab" in x][:5],flush=True)
    if blocking:raise SystemExit(1)

if __name__=="__main__":main()
