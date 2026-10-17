#!/usr/bin/env python3
"""Kanagawa Light visual acceptance on the real built HTML, not mocked markup."""
import http.server
import json
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"_site"
OUT=ROOT/"playwright-artifacts"
PAGES=["index","recife","abismo","cardume","corrente","concha","trilha","enigma","marujo","forca","criptograma","perola","farol"]

class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*args): pass

def run():
    assert (SITE/"index.html").is_file(),"Run the build before Kanagawa QA"
    OUT.mkdir(exist_ok=True)
    server=http.server.ThreadingHTTPServer(("127.0.0.1",0),Quiet)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    errors=[]
    verified=[]
    try:
      with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
        for device,width,height in [("mobile",390,844),("desktop",1440,900)]:
          context=browser.new_context(viewport={"width":width,"height":height},locale="pt-BR",reduced_motion="reduce")
          for route in PAGES:
            page=context.new_page()
            runtime_errors=[]
            page.on("pageerror",lambda error:runtime_errors.append(str(error)))
            try:
              response=page.goto(f"http://127.0.0.1:{server.server_port}/{route}.html",wait_until="domcontentloaded",timeout=20000)
              assert response and response.status==200,route+": non-200"
              page.locator("main").wait_for()
              result=page.evaluate("""async () => {
                const stylesheet=[...document.querySelectorAll('link[rel="stylesheet"]')].find(x=>x.href.includes('/styles/mare-'));
                const sheet=stylesheet?await (await fetch(stylesheet.href)).text():'';
                const body=getComputedStyle(document.body);
                const head=document.querySelector('h1');
                const main=document.querySelector('main');
                const hero=document.querySelector('.mare-studio-hero__visual');
                const btn=document.querySelector('.mar-catalog .mar-cta');
                return {
                  theme:document.body.classList.contains('mare-kanagawa'),
                  bundle:sheet.includes('Source: src/styles/shared/mare-kanagawa.css'),
                  background:body.backgroundColor,
                  color:body.color,
                  scheme:body.colorScheme,
                  overflow:document.documentElement.scrollWidth>innerWidth+3,
                  heading:!!head&&head.getBoundingClientRect().width>0,
                  landmark:!!main,
                  heroArt:hero?getComputedStyle(hero).backgroundImage.includes('kanagawa-wave.svg'):null,
                  cards:document.querySelectorAll('.mar-catalog article.mar-game').length,
                  cardSurface:btn?getComputedStyle(btn.closest('article')).backgroundColor:null
                };
              }""")
              assert result["theme"],route+": design class absent"
              assert result["bundle"],route+": css layer absent from deployed bundle"
              assert result["scheme"]=="light",route+": wrong color scheme"
              assert result["heading"] and result["landmark"],route+": h1/main missing"
              assert not result["overflow"],route+": horizontal overflow"
              assert not runtime_errors,route+": JS error: "+str(runtime_errors[:2])
              if route=="index":
                assert result["heroArt"],"Home's Great Wave engraving was not loaded"
                assert result["cards"]==12,"Game catalog changed unexpectedly"
                page.screenshot(path=str(OUT/f"kanagawa-home-{device}.png"),full_page=True,animations="disabled")
              verified.append({"route":route,"device":device,"bg":result["background"],"color":result["color"]})
            except Exception as exc:
              errors.append(f"{device} {route}: {exc}")
            finally:
              page.close()
          context.close()
        browser.close()
    finally:
      server.shutdown()
      server.server_close()
    (OUT/"kanagawa-report.json").write_text(json.dumps({"verified":verified,"errors":errors},ensure_ascii=False,indent=2),encoding="utf8")
    print("Kanagawa UI: "+str(len(verified))+"/"+str(len(PAGES)*2)+" viewports; "+str(len(errors))+" findings")
    for error in errors:print("FAIL:",error)
    if errors:raise SystemExit(1)

if __name__=="__main__":
    run()
