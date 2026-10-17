#!/usr/bin/env python3
"""Phase 5: keyboard-first navigation, zoom proxy, and opt-in diagnostics contract.

The real web-vitals implementation is loaded by a pinned CDN in production.
This browser suite intercepts that CDN only to assert UI wiring, local storage
and privacy deterministically. It does not claim to validate actual INP/LCP.
"""
from __future__ import annotations
import http.server
import json
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"_site"
OUT=ROOT/"playwright-artifacts"
GAMES=["index","recife","abismo","cardume","corrente","concha","trilha","enigma","marujo",
       "forca","criptograma","perola","farol"]
CDN="https://cdn.jsdelivr.net/npm/web-vitals@6.2.3/dist/web-vitals.js"
MOCK="""export const onLCP=(cb)=>cb({name:'LCP',value:2200});
export const onCLS=(cb)=>cb({name:'CLS',value:0.08});
export const onINP=(cb)=>cb({name:'INP',value:180});
export const onFCP=(cb)=>cb({name:'FCP',value:880});
export const onTTFB=(cb)=>cb({name:'TTFB',value:130});"""

class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*args):pass

def diagnostics(browser,root):
    context=browser.new_context(viewport={"width":390,"height":844},locale="pt-BR",
                                accept_downloads=True,reduced_motion="reduce")
    external=[]
    def cdn(route):
        external.append(route.request.url)
        route.fulfill(status=200,body=MOCK,content_type="application/javascript",
                      headers={"access-control-allow-origin":"*","cache-control":"no-store"})
    context.route(CDN,cdn)
    page=context.new_page()
    page.goto(root+"index.html",wait_until="domcontentloaded")
    assert page.locator(".mare-diagnostics").count()==0,"No overlay without explicit opt-in"
    assert not external,"Default browsing must not fetch Web Vitals CDN"
    page.goto(root+"index.html?diagnostico=1",wait_until="domcontentloaded")
    details=page.locator(".mare-diagnostics details")
    details.locator("summary").click()
    page.locator(".mare-diagnostics__status").get_by_text("Medição ativa",exact=False).wait_for(timeout=16000)
    assert len(external)==1,"CDN must load only after activation"
    assert "2200 ms" in page.locator(".mare-diagnostics__grid").inner_text()
    assert "0.080" in page.locator(".mare-diagnostics__grid").inner_text()
    assert "180 ms" in page.locator(".mare-diagnostics__grid").inner_text()
    save=page.get_by_role("button",name="Salvar amostra local")
    save.click()
    assert "1 amostras" in page.locator(".mare-diagnostics__note").last.inner_text() or "1 amostras" in page.locator("body").inner_text()
    with page.expect_download() as transfer:
        page.get_by_role("button",name="Exportar JSON").click()
    downloaded=transfer.value
    obj=json.loads(Path(downloaded.path()).read_text(encoding="utf8"))
    assert obj["schema"]=="mare-local-vitals-v1"
    assert obj["page"]=="index"
    assert len(obj["samples"])==1
    metric=obj["samples"][0]["metrics"]
    assert metric["LCP"]==2200 and metric["INP"]==180 and metric["CLS"]==0.08
    assert set(obj["samples"][0])=={"version","page","day","metrics"},"Export must omit identifiers"
    # Navigation must retain explicit diagnostics opt-in.
    url=page.locator('a[href*="recife.html?diagnostico=1"]').first.get_attribute("href")
    assert url and "diagnostico=1" in url
    page.goto(root+"recife.html?diagnostico=1",wait_until="domcontentloaded")
    assert page.locator(".mare-diagnostics").count()==1
    page.locator(".mare-diagnostics summary").click()
    page.get_by_role("button",name="Limpar amostras").click()
    assert page.evaluate("localStorage.getItem('mare-local-vitals-v1')") is None
    page.goto(root+"recife.html",wait_until="domcontentloaded")
    assert page.locator(".mare-diagnostics").count()==0,"Closing mode stops diagnostics"
    context.close()
    return {"mode":"opt-in","metrics":5,"samples":1,"thirdPartyOnlyAfterOptIn":True,
            "transport":"none (CDN JS mock is not telemetry)"}

def keyboard_and_zoom(browser,root):
    results=[]
    blockers=[]
    for game in GAMES:
        page=browser.new_page(viewport={"width":1280,"height":860},reduced_motion="reduce")
        try:
            response=page.goto(root+game+".html",wait_until="domcontentloaded",timeout=20000)
            assert response and response.ok
            # Keyboard-only: first Tab should expose the jump link, Enter must land on main.
            page.keyboard.press("Tab")
            focus=page.evaluate("""() => ({
              className:document.activeElement?.className||'',
              top:document.activeElement?.getBoundingClientRect().top ?? -999,
              name:document.activeElement?.textContent?.trim()||''
            })""")
            assert "mare-skip-link" in str(focus["className"]),game+": first tab must focus skip link"
            assert focus["top"]>=-1,game+": skip link clipped while focused"
            page.keyboard.press("Enter")
            destination=page.evaluate("""() => ({
              id:document.activeElement?.id,
              hash:location.hash,
              target:!!document.querySelector('#conteudo-principal')
            })""")
            assert destination["target"],game+": main landmark missing"
            assert destination["hash"]=="#conteudo-principal",game+": skip link does not navigate"
            # Responsive-width equivalent to 200% and 400% desktop zoom.
            # CSS zoom on the root is misleading: media queries do not react
            # as they do to actual browser Page Zoom. Keep this explicitly
            # labeled a width proxy, never claim native zoom verification.
            for scale,width in [(2,640),(4,320)]:
                page.set_viewport_size({"width":width,"height":860})
                metric=page.evaluate("""() => ({
                  sw:document.documentElement.scrollWidth,
                  cw:document.documentElement.clientWidth
                })""")
                results.append({"page":game,"zoomEquivalent":scale,"cssViewport":width,
                                "scroll":metric["sw"],"client":metric["cw"]})
                if metric["sw"]>metric["cw"]+3:
                    blockers.append(game+f": reflow at {width}px, equivalent x{scale}, produced horizontal scroll {metric}")
        except Exception as e:
            blockers.append(game+": "+str(e))
        finally:page.close()
    return results,blockers

def main():
    assert (SITE/"index.html").is_file()
    OUT.mkdir(exist_ok=True)
    server=http.server.ThreadingHTTPServer(("127.0.0.1",0),Quiet)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    report={"keyboard":[],"diagnostics":{},"blockers":[],"limits":"CSS zoom is not OS/browser native zoom; no human screen reader or physical device run."}
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
            base=f"http://127.0.0.1:{server.server_port}/"
            try:report["diagnostics"]=diagnostics(browser,base)
            except Exception as error:report["blockers"].append("diagnostics: "+str(error))
            data,issues=keyboard_and_zoom(browser,base)
            report["keyboard"]=data
            report["blockers"]+=issues
            browser.close()
    finally:
        server.shutdown();server.server_close()
    (OUT/"phase5-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf8")
    for issue in report["blockers"]:print("BLOCK",issue,flush=True)
    print("Phase 5: keyboard/reflow",len(report["keyboard"]),"of 26; opt-in",bool(report["diagnostics"]),
          "; blockers",len(report["blockers"]),flush=True)
    if report["blockers"]:raise SystemExit(1)

if __name__=="__main__":main()
