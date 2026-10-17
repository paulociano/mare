#!/usr/bin/env python3
"""MARÉ phase 7 browser E2E: actual daily spotlight win, streak, diary and offline."""
from __future__ import annotations
import http.server,json,runpy,threading,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"_site"
ART=ROOT/"playwright-artifacts"
class Server(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(SITE),**kw)
    def log_message(self,*a):pass

def main():
    ART.mkdir(exist_ok=True)
    assert (SITE/"index.html").is_file()
    server=http.server.ThreadingHTTPServer(("127.0.0.1",0),Server)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    report={"default":False,"won":False,"offline":False,"screens":[],"accessibility":[],"blockers":[]}
    try:
      with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
        context=browser.new_context(viewport={"width":390,"height":844},locale="pt-BR",
                                    reduced_motion="reduce",service_workers="allow")
        page=context.new_page()
        page.set_default_timeout(16000)
        url=f"http://127.0.0.1:{server.server_port}/"
        stage="home"
        try:
          page.goto(url+"index.html",wait_until="domcontentloaded")
          panel=page.locator("#diario-de-bordo")
          panel.wait_for()
          spotlight=page.locator(".mare-voyage__spotlight")
          spotlight.wait_for()
          assert panel.locator(".mare-logbook__stat-value").first.inner_text()=="0"
          assert page.locator(".mare-voyage__streak-metrics strong").first.inner_text()=="0"
          assert page.locator(".mare-voyage__history-empty").count()==1
          details=page.locator(".mare-logbook__collection")
          assert details.locator("summary").count()==1
          assert not details.evaluate("(el)=>el.open")
          details.locator("summary").focus()
          page.keyboard.press("Enter")
          assert details.evaluate("(el)=>el.open"),"Native keyboard disclosure broken"
          assert page.locator(".mare-logbook__award").count()==12
          challenge=page.evaluate("window.MareProgress.dailyChallenge()")
          assert spotlight.locator("a").get_attribute("href")==challenge["page"]
          assert challenge["completed"] is False
          report["default"]=True
          for width in [390,1280]:
            page.set_viewport_size({"width":width,"height":844})
            page.screenshot(path=str(ART/f"phase7-diary-empty-{width}.png"),full_page=True)
            metrics=page.evaluate("""()=>({
              total:document.documentElement.scrollWidth,
              viewport:document.documentElement.clientWidth
            })""")
            assert metrics["total"]<=metrics["viewport"]+3,repr(metrics)
            report["screens"].append(width)
          stage="real daily win"
          # Click the actual featured game CTA, then solve it using its genuine
          # gameplay UI. Never insert fake results into localStorage.
          page.set_viewport_size({"width":390,"height":844})
          spotlight.locator("a").click()
          page.wait_for_url("**/"+challenge["page"])
          solve=runpy.run_path(str(ROOT/"scripts/check-phase4-e2e.py"))["solve"]
          solve(page,challenge["game"])
          rounds=page.evaluate("window.MareProgress.read()")
          assert len(rounds)==1 and rounds[0]["game"]==challenge["game"] and rounds[0]["outcome"]=="win"
          page.goto(url+"index.html",wait_until="domcontentloaded")
          completed=page.evaluate("window.MareProgress.dailyChallenge()")
          assert completed["completed"] and completed["won"]
          assert page.locator(".mare-voyage__spotlight.is-complete").count()==1
          assert "Vitória registrada hoje" in page.locator(".mare-voyage__state").inner_text()
          assert page.locator(".mare-voyage__streak-metrics strong").first.inner_text()=="1"
          assert page.locator(".mare-voyage__history-item").count()==1
          assert page.locator(".mare-logbook__stat-value").first.inner_text()=="1"
          assert page.locator(".mare-logbook__collection summary").inner_text().startswith("Ver conquistas")
          assert page.locator(".mare-logbook__collection summary").inner_text()!="Ver conquistas · 0 de 12 desbloqueadas"
          report["won"]=True
          page.screenshot(path=str(ART/"phase7-diary-verified-mobile.png"),full_page=True)
          stage="populated accessibility"
          axe=ROOT/"node_modules/axe-core/axe.min.js"
          assert axe.exists(),"axe-core not installed by quality workflow"
          page.add_script_tag(path=str(axe))
          findings=page.evaluate("""async()=>{
            const r=await axe.run(document,{
              runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}
            });
            return r.violations.filter(v=>['critical','serious'].includes(v.impact))
              .map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(x=>x.target).slice(0,4)}));
          }""")
          report["accessibility"]=findings
          assert not findings,repr(findings)
          stage="offline retention"
          # Await SW activation before disconnecting, so the same build's HTML
          # and assets are available offline in the existing browser profile.
          page.wait_for_function("async()=>!!(await navigator.serviceWorker.ready).active",timeout=25000)
          page.wait_for_function("()=>!!navigator.serviceWorker.controller",timeout=25000)
          context.set_offline(True)
          response=page.goto(url+"index.html",wait_until="domcontentloaded",timeout=22000)
          assert response and response.status==200
          assert page.evaluate("window.MareProgress.dailyChallenge().won")
          assert "Vitória registrada hoje" in page.locator(".mare-voyage__state").inner_text()
          assert page.locator(".mare-voyage__history-item").count()==1
          report["offline"]=True
        except Exception as exc:
          report["blockers"].append(stage+": "+repr(exc)+"\n"+traceback.format_exc(limit=8))
          try:page.screenshot(path=str(ART/"phase7-failure.png"),full_page=True)
          except Exception:pass
        finally:
          context.close();browser.close()
    finally:
      server.shutdown();server.server_close()
    (ART/"phase7-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf8")
    print("Phase7: real daily win",report["won"],"offline",report["offline"],
          "responsive",len(report["screens"]),"/2 serious WCAG",len(report["accessibility"]),
          "blockers",len(report["blockers"]),flush=True)
    for issue in report["blockers"]:print("BLOCK",issue,flush=True)
    if report["blockers"]:raise SystemExit(1)

if __name__=="__main__":main()
