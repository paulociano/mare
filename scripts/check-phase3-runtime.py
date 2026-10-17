#!/usr/bin/env python3
"""Phase 3 browser quality: real game interactions and verified-result UI.
No user account or external history: fresh browser context per game.
Synthetic ledger event is *only* a contract test for the result card; it
does not pretend to prove the entire game can be completed by a player.
"""
from __future__ import annotations
import http.server, json, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"_site"
PAGES=["recife","abismo","cardume","corrente","concha","trilha","enigma","marujo","forca","criptograma","perola","farol"]
OUT=ROOT/"playwright-artifacts"
class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*args): pass

def run_action(page,game):
    if game=="recife":
        page.locator("#keyboard button").filter(has_text="A").first.click()
        assert page.locator("#board .tile.filled").count()>0,"Keyboard must fill a board tile"
    elif game=="abismo":
        page.locator("#guess").fill("oceano")
        page.locator("#guessform button[type=submit]").click()
        assert "1 palpite" in page.locator("#attempts").inner_text(),"A valid guess must register"
    elif game=="cardume":
        cards=page.locator("#grid .tile")
        cards.first.wait_for(timeout=12000)
        cards.first.click()
        assert page.locator("#grid .tile[aria-pressed=true]").count()==1,"Selection must persist"
        page.locator("#clear").click()
        assert page.locator("#grid .tile[aria-pressed=true]").count()==0,"Clear must undo selection"
    elif game=="corrente":
        page.locator("#word").fill("MAR")
        page.locator("#go").click()
        assert "1 tentativas" in page.locator("#attempts").inner_text(),"Guess must count"
    elif game=="concha":
        key=page.locator("#wheel button")
        key.first.wait_for(timeout=12000)
        key.first.click()
        assert len(page.locator("#guess").input_value())==1,"Wheel must enter a letter"
    elif game=="trilha":
        button=page.locator("#grid button").first
        button.click()
        assert page.locator("#grid button[aria-pressed=true]").count()==1,"Path selection must persist"
    elif game=="enigma":
        tile=page.locator("#board .enigma-cell:not(.blank)").first
        tile.click()
        assert page.locator("#board .enigma-cell.selected").count()==1,"Active clue should select a cell"
    elif game=="marujo":
        tile=page.locator("#board .marujo-cell").first
        tile.click()
        assert page.locator("#board .marujo-cell.selected").count()>=1,"Word start must be marked"
    elif game=="forca":
        key=page.locator("#keyboard button").first
        letter=key.inner_text()
        key.click()
        assert page.locator("#keyboard button[disabled]").count()>=1,"Guessed letter must become disabled"
    elif game=="criptograma":
        first=page.locator("#cipher .crypto-tile").first
        first.click()
        assert page.locator("#cipher .crypto-tile.selected").count()>=1,"Symbol selection must persist"
    elif game=="perola":
        page.locator("#entry").fill("MAR")
        assert page.locator("#entry").input_value()=="MAR","Anagram input should accept text"
    elif game=="farol":
        button=page.locator("#tiles button").first
        button.wait_for(timeout=10000)
        button.click()
        assert page.locator("#chosen button").count()>=1,"Word must move into chosen order"
    else: raise AssertionError("Unknown game: "+game)

def main():
    assert (SITE/"index.html").is_file(),"Build the static site first"
    OUT.mkdir(exist_ok=True)
    server=http.server.ThreadingHTTPServer(("127.0.0.1",0),Quiet)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    results=[]
    issues=[]
    try:
      with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
        for game in PAGES:
          ctx=browser.new_context(viewport={"width":390,"height":844},locale="pt-BR",reduced_motion="reduce")
          page=ctx.new_page()
          errors=[]
          page.on("pageerror",lambda error:errors.append(str(error)))
          try:
            response=page.goto(f"http://127.0.0.1:{server.server_port}/{game}.html",wait_until="domcontentloaded",timeout=20000)
            assert response and response.ok,game+": route unavailable"
            page.locator("main").wait_for()
            assert page.evaluate("""async () => {
                const sheets=[...document.querySelectorAll('link[rel="stylesheet"]')];
                return (await Promise.all(sheets.map(async el =>
                    el.href.endsWith('/mare-finesse.css') ||
                    (el.href.includes('/styles/mare-') && (await (await fetch(el.href)).text()).includes('/* Source: mare-finesse.css */'))
                ))).some(Boolean);
            }"""),game+": finesse CSS absent"
            assert page.locator(".mare-finale:visible").count()==0,game+": unearned result visible"
            run_action(page,game)
            # One actual user action; then trigger a synthetic isolated ledger event
            # to test rendering from the true persistence contract, not copy heuristics.
            recorded=page.evaluate("""g => window.MareProgress.record(g,'win','qa-phase3-contract-1')""",game)
            assert recorded,game+": test-only outcome was not saved"
            finale=page.locator(".mare-finale")
            assert finale.is_visible(),game+": persisted outcome did not show summary"
            assert finale.get_attribute("data-outcome")=="win",game+": wrong outcome state"
            assert finale.locator(".mare-finale__actions a").count()==2,game+": missing navigation"
            before=page.evaluate("() => window.MareProgress.stats().wins")
            duplicate=page.evaluate("""g => window.MareProgress.record(g,'win','qa-phase3-contract-1')""",game)
            after=page.evaluate("() => window.MareProgress.stats().wins")
            assert duplicate is False and before==after,game+": duplicated recorded round"
            finale.locator(".mare-finale__close").click()
            assert finale.is_hidden(),game+": close did not dismiss summary"
            # Layout and feedback after actual interaction, not just pristine first render.
            measured=page.evaluate("""() => ({scroll:document.documentElement.scrollWidth,viewport:innerWidth})""")
            assert measured["scroll"]<=measured["viewport"]+3,game+": interaction overflow"
            assert not errors,game+": "+str(errors[:2])
            results.append({"game":game,"action":"pass","outcome":"pass","jsErrors":0,"horizontalOverflow":False})
          except Exception as error:
            issues.append(game+": "+str(error))
            results.append({"game":game,"error":str(error)})
          finally: ctx.close()
        browser.close()
    finally:
      server.shutdown();server.server_close()
    report={"executed":len(results),"target":len(PAGES),"issues":issues,"tests":results,
            "limitations":"12 one-action smoke checks + synthetic isolated ledger/summary contract; not E2E wins, WCAG or Core Web Vitals."}
    (OUT/"phase3-report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding="utf8")
    for problem in issues: print("FAIL",problem)
    print("Phase 3: "+str(len(results)-len(issues))+"/"+str(len(PAGES))+" game interactions; "+str(len(issues))+" findings")
    if issues:raise SystemExit(1)
if __name__=="__main__":main()
