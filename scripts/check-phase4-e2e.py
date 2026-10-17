#!/usr/bin/env python3
"""MARÉ Phase 4: complete UI-driven rounds in a real Chromium browser.

Expected outcome is read from the real persistent game ledger, never written
to it by this test. Reading the game's deterministic challenge data is allowed
to generate inputs; only pointer/keyboard/input events may change game state.
Includes real loss paths for games where a loss is possible.
"""
from __future__ import annotations
import http.server
import json
import re
import threading
import time
from datetime import date as CalendarDate
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"_site"
OUT=ROOT/"playwright-artifacts"
GAMES=["recife","abismo","cardume","corrente","concha","trilha","enigma",
       "marujo","forca","criptograma","perola","farol"]
LOSSES=["cardume","forca","perola","farol"]

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*args):pass

def outcome(page,game,value):
    entries=page.evaluate("window.MareProgress.read()")
    matches=[e for e in entries if e["game"]==game and e["outcome"]==value]
    assert len(matches)==1,f"{game} expected a single {value} ledger entry, got {matches}"
    summary=page.locator(".mare-finale")
    assert summary.is_visible(),game+": completed game must show its summary"
    assert summary.get_attribute("data-outcome")==value,game+": summary has incorrect outcome"
    assert summary.locator("a").count()==2,game+": navigation missing"
    # Persistence + idempotent result contract.
    page.reload(wait_until="domcontentloaded")
    again=page.evaluate("(g)=>window.MareProgress.read().filter(e=>e.game===g)",game)
    assert len(again)==1 and again[0]["outcome"]==value,game+": result lost after reload"
    return {"game":game,"outcome":value,"record":again[0]["id"],"status":"PASS"}

def forca_solution(page):
    source=(SITE/"forca.js").read_text(encoding="utf8").split("const puzzles=")[1].split("];",1)[0]
    words=re.findall(r"\['([A-Z]+)','[^']+'\]",source)
    assert len(words)>=30,"Forca fixture source schema changed"
    today=page.evaluate("""() => new Intl.DateTimeFormat('en-CA',{
       timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'
    }).format(new Date())""")
    day=(CalendarDate.fromisoformat(today)-CalendarDate(2025,1,1)).days
    return words[day%(40 if today=='2026-10-17' else len(words))]

def recife_targets(page,mode):
    return page.evaluate("""mode => {
      const idx=((day%WORDS.length)+WORDS.length)%WORDS.length;
      const seed=mode==='solo'?0:mode==='duo'?7:17;
      const count=mode==='solo'?1:mode==='duo'?2:4;
      const used=new Set(),out=[];
      for(let i=0;out.length<count && i<WORDS.length;i++){
       const candidate=WORDS[(idx+seed+i*11)%WORDS.length];
       if(!used.has(candidate)){used.add(candidate);out.push(candidate)}
      }
      return out;
    }""",mode)

def solve(page,game,recife_mode="solo"):
    if game=="recife":
        if recife_mode!="solo":
            page.locator('.mare-modes [data-m="'+recife_mode+'"]').click()
            assert page.locator("#board").evaluate("(el)=>document.activeElement===el"),"Mode switch must focus game board"
        targets=recife_targets(page,recife_mode)
        for answer in targets:
            page.keyboard.type(answer,delay=9)
            page.keyboard.press("Enter")
        assert page.locator(".mare-pane.solved").count()==len(targets)
    elif game=="abismo":
        word=page.evaluate("BANK[round][0]")
        page.locator("#guess").fill(word)
        page.locator('#guessform button[type="submit"]').click()
        assert "Tesouro encontrado" in page.locator("#message").inner_text()
    elif game=="cardume":
        page.locator("#grid .tile").first.wait_for(timeout=15000)
        groups=page.evaluate("puzzles[puzzleIndex].map(g=>g.words)")
        assert len(groups)==4
        for group in groups:
            for word in group:
                page.locator("#grid .tile").get_by_text(word,exact=True).click()
            page.locator("#submit").click()
        assert page.locator("#solved .solution").count()==4
    elif game=="corrente":
        page.locator("#free").click()
        secret=page.evaluate("secret")
        page.locator("#word").fill(secret)
        page.locator("#go").click()
        assert "TESOURO ENCONTRADO" in page.locator("#best").inner_text()
    elif game=="concha":
        page.wait_for_function("answers.length>0",timeout=16000)
        words=page.evaluate("answers.slice()")
        assert 0<len(words)<1000,f"Unexpected Concha challenge size: {len(words)}"
        for word in words:
            page.locator("#guess").fill(word)
            page.locator("#form button[type=submit]").click()
        remaining=page.evaluate("({all:answers.length,found:found.length})")
        assert remaining["all"]==remaining["found"],f"Concha did not accept all valid words: {remaining}"
    elif game=="trilha":
        indices=page.evaluate("""() => {
          const n=hash(mode+'|'+index)%4;
          return basePath.slice(0,answer.length).map(i=>rotate(i,n));
        }""")
        for idx in indices:
            page.locator("#grid button").nth(idx).click()
        page.locator("#check").click()
        assert "Palavra descoberta" in page.locator("#notice").inner_text()
    elif game=="enigma":
        items=page.evaluate("entries.map(e=>({clue:e.clue,word:e.word,dir:e.dir}))")
        assert len(items)>=1
        for item in items:
            area=page.locator("#across" if item["dir"]=="across" else "#down")
            area.get_by_role("button",name=re.compile(re.escape(item["clue"]))).click()
            for char in item["word"]:
                page.keyboard.press(char)
        assert "Expedição concluída" in page.locator("#notice").inner_text()
    elif game=="marujo":
        placements=page.evaluate("placements.map(p=>({word:p.word,cells:p.cells.slice()}))")
        assert len(placements)>=1
        for item in placements:
            first,last=item["cells"][0],item["cells"][-1]
            page.locator(f'#board [data-id="{first}"]').click()
            page.locator(f'#board [data-id="{last}"]').click()
        assert "Todas as palavras encontradas" in page.locator("#notice").inner_text()
    elif game=="forca":
        word=forca_solution(page)
        for letter in dict.fromkeys(word):
            page.get_by_role("button",name="Tentar letra "+letter).click()
        assert "Você venceu" in page.locator("#notice").inner_text()
    elif game=="criptograma":
        # Exercita as dicas reais, sem inspecionar closures nem alterar estado.
        for _ in range(27):
            progress=page.locator("#progress").inner_text()
            values=re.findall(r"\d+",progress)
            if len(values)>=2 and values[0]==values[1]:break
            page.locator("#hint").click()
        else:raise AssertionError("Hint flow did not reveal the entire cipher")
        page.locator("#check").click()
        assert "Código resolvido" in page.locator("#notice").inner_text()
    elif game=="perola":
        page.locator("#free").click()
        page.locator("#entry").fill("CORAL")
        page.locator("#submit").click()
        assert "Você acertou" in page.locator("#feedback").inner_text()
    elif game=="farol":
        page.locator("#free").click()
        for word in ["NAVEGAR","É","PRECISO"]:
            page.get_by_role("button",name="Adicionar "+word,exact=True).click()
        page.locator("#submit").click()
        assert "Você acertou" in page.locator("#feedback").inner_text()
    else:raise AssertionError(game+" is unhandled")

def lose(page,game):
    if game=="recife":
        target=recife_targets(page,"solo")[0]
        candidates=page.evaluate("""t=>WORDS.filter(w=>w!==t&&DICTIONARY.has(w)).slice(0,6)""",target)
        assert len(candidates)==6
        for word in candidates:
            page.keyboard.type(word,delay=4)
            page.keyboard.press("Enter")
        assert "palavras eram" in page.locator("#status").inner_text().lower()
    elif game=="forca":
        word=forca_solution(page)
        wrong=[ch for ch in "ZXQJVKBYWPDMHFSRLTUCGAOINE" if ch not in word][:6]
        assert len(wrong)==6
        for ch in wrong:page.get_by_role("button",name="Tentar letra "+ch).click()
        assert "Fim de jogo" in page.locator("#notice").inner_text()
    elif game=="cardume":
        page.locator("#grid .tile").first.wait_for(timeout=16000)
        groups=page.evaluate("puzzles[puzzleIndex].map(g=>g.words)")
        wrong=[g[0] for g in groups]
        for _ in range(4):
            for word in wrong:page.locator("#grid .tile").get_by_text(word,exact=True).click()
            page.locator("#submit").click()
        assert "Fim da expedição" in page.locator("#notice").inner_text()
    elif game=="perola":
        page.locator("#free").click()
        for _ in range(3):
            page.locator("#entry").fill("ZZZZZZ")
            page.locator("#submit").click()
        assert "Fim da rodada" in page.locator("#feedback").inner_text()
    elif game=="farol":
        page.locator("#free").click()
        page.locator("#tiles button").first.click()
        for _ in range(3):page.locator("#submit").click()
        assert "Fim da rodada" in page.locator("#feedback").inner_text()
    else:raise AssertionError("No loss mechanism for "+game)

def main():
    assert (SITE/"index.html").is_file(),"Run npm run build first"
    OUT.mkdir(exist_ok=True)
    srv=http.server.ThreadingHTTPServer(("127.0.0.1",0),Handler)
    threading.Thread(target=srv.serve_forever,daemon=True).start()
    results=[];errors=[]
    start=time.monotonic()
    try:
      with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
        scenarios=[(g,"win","solo") for g in GAMES]+[(g,"loss","solo") for g in LOSSES]
        scenarios += [("recife","win","duo"),("recife","win","quartet"),("recife","loss","solo")]
        for game,expected,recife_mode in scenarios:
          ctx=browser.new_context(viewport={"width":390,"height":844},
                                  reduced_motion="reduce",locale="pt-BR")
          ctx.set_default_timeout(9000)
          page=ctx.new_page()
          js_errors=[]
          page.on("pageerror",lambda error:js_errors.append(str(error)))
          try:
            url=f"http://127.0.0.1:{srv.server_port}/{game}.html"
            response=page.goto(url,wait_until="domcontentloaded",timeout=20000)
            assert response and response.ok
            if expected=="win":solve(page,game,recife_mode)
            else:lose(page,game)
            entry=outcome(page,game,expected)
            assert not js_errors,game+": runtime JS "+repr(js_errors[:3])
            entry["seconds"]=round(time.monotonic()-start,2)
            if game=="recife":entry["mode"]=recife_mode
            results.append(entry)
            print("PASS",game,expected,flush=True)
          except Exception as exc:
            errors.append(game+"/"+expected+": "+str(exc))
            results.append({"game":game,"outcome":expected,"status":"FAIL","error":str(exc)})
            try:page.screenshot(path=str(OUT/f"phase4-{game}-{expected}-failure.png"))
            except Exception:pass
          finally:
            ctx.close()
        browser.close()
    finally:
      srv.shutdown();srv.server_close()
    report={"target":len(GAMES)+len(LOSSES)+3,"passed":len(results)-len(errors),
            "seconds":round(time.monotonic()-start,2),"results":results,"failures":errors,
            "method":"Input events through Chromium UI; model data read-only to derive answers; persisted outcomes observed before and after reload."}
    (OUT/"phase4-e2e.json").write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding="utf8")
    for error in errors:print("FAIL",error,flush=True)
    print("Phase4 E2E:",report["passed"],"/",report["target"],flush=True)
    if errors:raise SystemExit(1)
if __name__=="__main__":main()
