#!/usr/bin/env python3
"""Phase 6: real browser offline PWA lifecycle and verified diary smoke tests."""
from __future__ import annotations
import http.server,json,re,threading,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"_site"
ART=ROOT/"playwright-artifacts"
GAMES=["index","recife","abismo","cardume","corrente","concha","trilha","enigma",
       "marujo","forca","criptograma","perola","farol"]
class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*args):pass

def main():
    assert (SITE/"sw.js").is_file()
    ART.mkdir(exist_ok=True)
    server=http.server.ThreadingHTTPServer(("127.0.0.1",0),Quiet)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    report={"scope":None,"precache":0,"pages":[],"ledger":None,"update":None,"findings":[]}
    try:
      with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
        context=browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce",
                                    locale="pt-BR",service_workers="allow")
        context.set_default_timeout(16000)
        page=context.new_page()
        url=f"http://127.0.0.1:{server.server_port}/"
        try:
          page.goto(url+"index.html",wait_until="domcontentloaded")
          page.wait_for_function("""() => !!navigator.serviceWorker.controller""",timeout=25000)
          page.wait_for_function("""async () => {
            const r=await navigator.serviceWorker.getRegistration();
            return r?.active?.state==='activated' && (await caches.keys()).some(k=>k.startsWith('mare-shell-'));
          }""",timeout=25000)
          state=page.evaluate("""async()=>({
            scope:(await navigator.serviceWorker.getRegistration()).scope,
            names:await caches.keys(),
            cached:(await (await caches.open((await caches.keys()).find(k=>k.startsWith('mare-shell-')))).keys()).map(r=>r.url)
          })""")
          report["scope"]=state["scope"]
          report["precache"]=len(state["cached"])
          assert report["precache"]>=70,f"Offline shell unexpectedly small: {report['precache']}"
          assert state["scope"]==url,f"Scope escapes root: {state['scope']}"
          assert all(any("/"+g+".html" in x for x in state["cached"]) for g in GAMES)
          # Complete an actual free-mode Pérola game and preserve the canonical ledger.
          page.goto(url+"perola.html",wait_until="domcontentloaded")
          page.get_by_role("button",name="Modo livre").click()
          page.locator("#entry").fill("CORAL")
          page.locator("#submit").click()
          entry=page.evaluate("""() => window.MareProgress.read().filter(e=>e.game==='perola'&&e.outcome==='win')""")
          assert len(entry)==1,"Pérola victory not recorded before going offline"
          report["ledger"]="real win persisted online"
          # Site must not need the network after installation. All 13 routes and
          # precomputed game data are from the same versioned offline shell.
          context.set_offline(True)
          for game in GAMES:
            response=page.goto(url+game+".html",wait_until="domcontentloaded",timeout=20000)
            assert response and response.status==200,game+": offline navigation failed"
            page.locator("main").wait_for(timeout=7000)
            assert page.evaluate("!!navigator.serviceWorker.controller"),game+": no controller offline"
            assert page.locator(".mare-diagnostics").count()==0,"Diagnostics should remain off by default"
            report["pages"].append(game)
          assert len(report["pages"])==13
          persisted=page.evaluate("""() => window.localStorage.getItem('mare-verified-results-v1')""")
          assert any(e.get("game")=="perola" and e.get("outcome")=="win" for e in json.loads(persisted))
          page.goto(url+"index.html",wait_until="domcontentloaded")
          diary=page.locator("#diario-de-bordo")
          diary.wait_for()
          assert "Sua jornada pelo oceano" in diary.inner_text()
          assert "Pérola" in diary.inner_text()
          assert diary.locator(".mare-logbook__destination.has-win").count()==1
          assert diary.locator(".mare-logbook__stat-value").first.inner_text()=="1"
          assert diary.locator(".mare-logbook__missions").count()==0 or diary.locator(".mare-explorer__missions").count()==1
          page.screenshot(path=str(ART/"phase6-diary-mobile.png"),full_page=True)
          # Update cycle: new worker must remain waiting until the user clicks
          # Update; then activate, remove old shell and preserve local results.
          context.set_offline(False)
          path=SITE/"sw.js"
          original=path.read_text(encoding="utf8")
          marker=re.search(r"const CACHE='mare-shell-([0-9a-f]{18})';",original)
          assert marker,"Could not identify deterministic SW cache version"
          old_cache="mare-shell-"+marker.group(1)
          new_suffix="abcdef0123456789ab" if marker.group(1)!="abcdef0123456789ab" else "abcdef0123456789ac"
          try:
            path.write_text(original.replace(marker.group(1),new_suffix,1),encoding="utf8")
            page.evaluate("""async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()}""")
            page.wait_for_function("""async()=>!!(await navigator.serviceWorker.getRegistration())?.waiting""",timeout=25000)
            assert page.get_by_role("button",name="Atualizar aplicativo").is_visible()
            before=page.evaluate("""async()=>({
              old: (await caches.keys()).some(k=>k.startsWith('mare-shell-')&&!k.endsWith('abcdef0123456789ab')&&!k.endsWith('abcdef0123456789ac')),
              waiting:!!(await navigator.serviceWorker.getRegistration()).waiting
            })""")
            assert before["waiting"] and before["old"],"Old version must survive until explicit upgrade"
            page.get_by_role("button",name="Atualizar aplicativo").click()
            page.wait_for_function("""async()=>!(await caches.keys()).some(k=>k.startsWith('mare-shell-')&&k!=='mare-shell-'+window.__newCache)""",
              timeout=25000) if False else None
            page.wait_for_function("""async expected=>{
              const list=await caches.keys();
              const registration=await navigator.serviceWorker.getRegistration();
              return list.includes(expected)&&!registration.waiting&&list.filter(k=>k.startsWith('mare-shell-')).length===1;
            }""","mare-shell-"+new_suffix,timeout=25000)
            assert page.evaluate("""()=>JSON.parse(localStorage.getItem('mare-verified-results-v1')||'[]').some(e=>e.game==='perola'&&e.outcome==='win')""")
            report["update"]={"waitedForConsent":True,"previousCacheRemoved":True,"ledgerKept":True}
          finally:
            path.write_text(original,encoding="utf8")
        except Exception as exc:
          report["findings"].append(str(exc))
          try:page.screenshot(path=str(ART/"phase6-failure.png"),full_page=True)
          except Exception:pass
        finally:
          context.close();browser.close()
    finally:server.shutdown();server.server_close()
    (ART/"phase6-pwa.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf8")
    print("Phase6 PWA:",len(report["pages"]),"/13 offline pages, cache",report["precache"],
          "update",bool(report["update"]),"blockers",len(report["findings"]),flush=True)
    for finding in report["findings"]:print("BLOCK",finding,flush=True)
    if report["findings"]:raise SystemExit(1)
if __name__=="__main__":main()
