#!/usr/bin/env python3
"""Phase 8: active difficulty selection, browser solvability sampling and mobile WCAG."""
from __future__ import annotations
import http.server,json,threading,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"_site"
ART=ROOT/"playwright-artifacts"
GAMES=['abismo','cardume','corrente','concha','trilha','enigma','marujo','forca','criptograma','perola','farol']
class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(SITE),**kw)
    def log_message(self,*a):pass

def main():
    assert (SITE/'index.html').exists()
    ART.mkdir(exist_ok=True)
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    report={'games':[],'viewportChecks':0,'enigma':[],'marujo':[],'axe':[],'findings':[]}
    try:
      with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        ctx=browser.new_context(viewport={'width':390,'height':844},locale='pt-BR',reduced_motion='reduce')
        page=ctx.new_page()
        page.set_default_timeout(17000)
        base=f'http://127.0.0.1:{server.server_port}/'
        try:
          for game in GAMES:
            stage=game
            page.goto(base+game+'.html',wait_until='domcontentloaded')
            section=page.locator('.mare-content-control')
            section.wait_for()
            # The setting is a collapsed disclosure below the board; open it like a player.
            section.locator('summary').click()
            assert section.evaluate('e=>e.open'),game+': disclosure did not open'
            # Async lexical/data banks must be ready before free-play actions.
            if game=='cardume':page.locator('#grid .tile').first.wait_for(timeout=14000)
            elif game=='concha':page.locator('#wheel button').first.wait_for(timeout=14000)
            elif game=='marujo':page.locator('#board .marujo-cell').first.wait_for(timeout=14000)
            elif game!='abismo':
              page.wait_for_function("""() => !!document.getElementById('edition')?.textContent?.trim()""",timeout=14000)
            assert page.evaluate('!!window.MareContent'),game+': missing engine'
            assert page.locator('#mare-intensity option').count()==4
            assert page.locator('#mare-intensity').input_value()==''
            # Read original daily identifier before triggering a new free round.
            before=page.locator('#edition').inner_text() if page.locator('#edition').count() else ''
            assert any(t in before for t in ['DIÁRI','DIARIO','EXPEDIÇÃO','DESAFIO']) or game=='abismo',repr((game,before))
            selector=page.locator('#mare-intensity')
            # User explicitly selects a difficulty, no silent daily mutation.
            selector.select_option('intensa')
            assert page.evaluate("localStorage.getItem('mare-difficulty-v1')") is None
            page.get_by_role('button',name='Aplicar ao modo livre').click()
            assert page.evaluate("localStorage.getItem('mare-difficulty-v1')")=='intensa'
            assert 'aplicada' in page.locator('.mare-content-control__status').inner_text()
            if game=='cardume':
              assert 'LIVRE' in page.locator('#edition').inner_text(),game+': not in free mode'
            elif game=='concha':
              assert 'active' in (page.locator('#free').get_attribute('class') or ''),game+': not in free mode'
            elif game!='abismo':
              assert page.locator('#free').get_attribute('aria-pressed')=='true',game+': not in free mode'
            for width in [320,390,1280]:
              page.set_viewport_size({'width':width,'height':844})
              dimensions=page.evaluate("""()=>({page:document.documentElement.scrollWidth,
                 viewport:document.documentElement.clientWidth})""")
              assert dimensions['page']<=dimensions['viewport']+4,(game,width,dimensions)
              report['viewportChecks']+=1
            page.set_viewport_size({'width':390,'height':844})
            page.reload(wait_until='domcontentloaded')
            page.locator('.mare-content-control summary').click()
            assert 'Maré funda' in page.locator('.mare-content-control summary').inner_text(),game+': summary does not reflect saved intensity'
            assert page.locator('#mare-intensity').input_value()=='intensa'
            # One route at least per difficulty on real UI.
            selector=page.locator('#mare-intensity')
            selector.select_option('leve')
            page.get_by_role('button',name='Aplicar ao modo livre').click()
            assert page.evaluate("localStorage.getItem('mare-difficulty-v1')")=='leve'
            # Restore the legacy selection and ensure mode remains playable.
            selector.select_option('')
            page.get_by_role('button',name='Aplicar ao modo livre').click()
            assert page.evaluate("localStorage.getItem('mare-difficulty-v1')") is None
            report['games'].append(game)
            if game=='enigma':
              report['enigma']=page.evaluate("""()=>{
                return PUZZLES.map((p,i)=>({index:i,total:p.length,
                  placed:place(p).placed.length,valid:place(p).placed.every(e=>
                    e.cells.every((cell,k)=>place(p).grid[cell]===e.word[k]))}));
              }""")
              assert all(x['valid'] and x['placed']>=3 for x in report['enigma']),'Some crossword sets are not adequately placeable'
            if game=='marujo':
              report['marujo']=page.evaluate("""()=>TOPICS.map((t,i)=>{
                const made=build(t[1],hash('free|'+i+'|marulho'));
                return {name:t[0],words:t[1].length,placed:made.placements.length,
                  valid:made.placements.every(p=>p.cells.every((id,k)=>made.board[id]===p.word[k]))}
              })""")
              assert all(x['valid'] and x['placed']>=5 for x in report['marujo']),'Unsolvable search boards'
            if game in ['corrente','enigma','perola']:
              if game=='corrente':page.screenshot(path=str(ART/'phase8-difficulty-corrente-mobile.png'),full_page=True)
              if game=='enigma':page.screenshot(path=str(ART/'phase8-difficulty-enigma-mobile.png'),full_page=True)
              # Accessible actual controls and expanded hint/board.
              axe=ROOT/'node_modules/axe-core/axe.min.js'
              assert axe.exists(),'axe core absent from quality job'
              page.add_script_tag(path=str(axe))
              serious=page.evaluate("""async()=>{
                const results=await axe.run(document,{
                 runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
                return results.violations.filter(v=>['serious','critical'].includes(v.impact))
                  .map(v=>({id:v.id,targets:v.nodes.map(n=>n.target).slice(0,4)}));
              }""")
              assert not serious,game+': '+repr(serious)
              report['axe'].append(game)
          stage='recife mode regression'
          page.goto(base+'recife.html',wait_until='domcontentloaded')
          assert page.locator('.mare-modes [data-m]').count()==3,'Recife three inherent modes missing'
          assert page.locator('.mare-content-control').count()==0,'Recife must not fake a second difficulty system'
        except Exception as error:
          report['findings'].append(stage+': '+repr(error)+'\n'+traceback.format_exc(limit=7))
          try:page.screenshot(path=str(ART/'phase8-failure.png'),full_page=True)
          except Exception:pass
        finally:
          ctx.close();browser.close()
    finally:server.shutdown();server.server_close()
    (ART/'phase8-content.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    print('Phase8 browser: '+str(len(report['games']))+'/11 active difficulty games, '+
       str(report['viewportChecks'])+'/33 reflows, '+str(len(report['axe']))+
       '/3 audited, '+str(len(report['findings']))+' blockers',flush=True)
    for item in report['findings']:print('BLOCK',item,flush=True)
    if report['findings']:raise SystemExit(1)
if __name__=='__main__':main()
