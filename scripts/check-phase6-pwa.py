#!/usr/bin/env python3
"""Phase 6: real browser offline PWA lifecycle and verified diary smoke tests."""
from __future__ import annotations
import http.server,json,re,runpy,threading,time,traceback
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
    report={"scope":None,"precache":0,"pages":[],"offlineActions":[],"ledger":None,"update":None,"findings":[]}
    try:
      with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
        context=browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce",
                                    locale="pt-BR",service_workers="allow")
        context.set_default_timeout(16000)
        page=context.new_page()
        url=f"http://127.0.0.1:{server.server_port}/"
        stage="registration"
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
          stage="winning round"
          # Complete an actual free-mode Pérola game and preserve the canonical ledger.
          page.goto(url+"perola.html",wait_until="domcontentloaded")
          page.locator("#free").click()
          page.locator("#entry").fill("CORAL")
          page.locator("#submit").click()
          entry=page.evaluate("""() => window.MareProgress.read().filter(e=>e.game==='perola'&&e.outcome==='win')""")
          assert len(entry)==1,"Pérola victory not recorded before going offline"
          report["ledger"]="real win persisted online"
          # Site must not need the network after installation. All 13 routes and
          # precomputed game data are from the same versioned offline shell.
          stage="offline navigations"
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
          stage="offline diary"
          page.goto(url+"index.html",wait_until="domcontentloaded")
          diary=page.locator("#diario-de-bordo")
          diary.wait_for()
          assert "Sua jornada pelo oceano" in diary.inner_text()
          assert "Pérola" in diary.inner_text()
          assert diary.locator(".mare-logbook__destination.has-win").count()==1,"Verified fleet row missing (Pérola)"
          assert diary.locator(".mare-logbook__stat-value").first.inner_text()=="1","Dashboard verified win count incorrect"
          assert diary.locator(".mare-explorer__missions").count()==1,"Mission panel missing"
          page.screenshot(path=str(ART/"phase6-diary-mobile.png"),full_page=True)
          stage="populated diary accessibility"
          axe_file=ROOT/"node_modules/axe-core/axe.min.js"
          assert axe_file.is_file(),"axe-core unavailable for populated Diary WCAG audit"
          page.add_script_tag(path=str(axe_file))
          serious=page.evaluate("""async () => {
            const r=await axe.run(document,{runOnly:{
              type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']
            }});
            return r.violations.filter(v=>v.impact==='critical'||v.impact==='serious')
              .map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target).slice(0,5)}));
          }""")
          report["populatedDiaryA11y"]={"seriousAndCritical":serious}
          assert not serious,"Populated Diary WCAG failures: "+json.dumps(serious,ensure_ascii=False)
          stage="offline gameplay"
          # Reuse the Phase 3 real-action oracles with the browser disconnected,
          # proving that the cached game scripts/data drive user interactions.
          run_action=runpy.run_path(str(ROOT/"scripts/check-phase3-runtime.py"))["run_action"]
          for game in GAMES[1:]:
            page.goto(url+game+".html",wait_until="domcontentloaded",timeout=20000)
            run_action(page,game)
            report["offlineActions"].append(game)
          page.goto(url+"index.html",wait_until="domcontentloaded")
          stage="update flow"
          print("Phase6 offline diary:",page.locator("#diario-de-bordo").inner_text()[:450].replace("\n"," "),flush=True)
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
            # The registration waiting state and application UI update across
            # independent browser tasks. Wait for the visible consequence, not
            # a same-tick DOM snapshot that can misreport a correct update.
            page.evaluate("window.dispatchEvent(new Event('focus'))")
            page.get_by_role("button",name="Atualizar aplicativo").wait_for(state="visible",timeout=10000)
            before=page.evaluate("""async()=>({
              old: (await caches.keys()).some(k=>k.startsWith('mare-shell-')&&!k.endsWith('abcdef0123456789ab')&&!k.endsWith('abcdef0123456789ac')),
              waiting:!!(await navigator.serviceWorker.getRegistration()).waiting
            })""")
            assert before["waiting"] and before["old"],"Old version must survive until explicit upgrade"
            # The application intentionally reloads on controllerchange.
            # Synchronize on that navigation before touching the new JS context.
            with page.expect_navigation(wait_until="domcontentloaded",timeout=25000):
              page.get_by_role("button",name="Atualizar aplicativo").click()
            page.wait_for_function("""async expected=>{
              const list=await caches.keys();
              const registration=await navigator.serviceWorker.getRegistration();
              return list.includes(expected)&&!registration.waiting&&list.filter(k=>k.startsWith('mare-shell-')).length===1;
            }""",arg="mare-shell-"+new_suffix,timeout=25000)
            assert page.evaluate("""()=>JSON.parse(localStorage.getItem('mare-verified-results-v1')||'[]').some(e=>e.game==='perola'&&e.outcome==='win')""")
            report["update"]={"waitedForConsent":True,"previousCacheRemoved":True,"ledgerKept":True}
          finally:
            path.write_text(original,encoding="utf8")
        except Exception as exc:
          report["findings"].append(stage+": "+repr(exc)+"\n"+traceback.format_exc(limit=7))
          try:page.screenshot(path=str(ART/"phase6-failure.png"),full_page=True)
          except Exception:pass
        finally:
          context.close();browser.close()
    finally:server.shutdown();server.server_close()
    (ART/"phase6-pwa.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf8")
    print("Phase6 PWA:",len(report["pages"]),"/13 offline pages, cache",report["precache"],
          "offline actions",len(report["offlineActions"]),"/12 update",bool(report["update"]),"blockers",len(report["findings"]),flush=True)
    for finding in report["findings"]:print("BLOCK",finding,flush=True)
    if report["findings"]:raise SystemExit(1)
if __name__=="__main__":main()
