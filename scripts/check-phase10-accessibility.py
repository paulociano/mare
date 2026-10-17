#!/usr/bin/env python3
"""Phase 10 browser quality: native settings/keyboard, local privacy, 13-route
large-text & high-contrast accessibility, 39 reflow scenarios, offline prefs.
Zoom proxies do not constitute physical device or screen-reader certification.
"""
from __future__ import annotations
import http.server,json,threading,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'_site'
ART=ROOT/'playwright-artifacts'
PAGES=['index','recife','abismo','cardume','corrente','concha','trilha',
       'enigma','marujo','forca','criptograma','perola','farol']
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(SITE),**kw)
    def log_message(self,*a):pass

def main():
    ART.mkdir(exist_ok=True)
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    data={'pages':[],'reflow':[],'a11y':[],'arrow':[],'offline':False,
          'persist':False,'reset':False,'privacy':False,'blockers':[]}
    try:
      with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        ctx=browser.new_context(viewport={'width':390,'height':844},
          reduced_motion='no-preference',locale='pt-BR',service_workers='allow')
        page=ctx.new_page();page.set_default_timeout(16000)
        base=f'http://127.0.0.1:{server.server_port}/'
        stage='baseline'
        try:
          page.goto(base+'index.html',wait_until='domcontentloaded')
          panel=page.locator('#ajustes-de-leitura')
          panel.wait_for()
          assert page.locator('.mare-access__details').count()==1
          assert not page.locator('.mare-access__details').evaluate('(el)=>el.open')
          assert page.evaluate("localStorage.getItem('mare-accessibility-v1')")==None
          before=page.locator('.mare-social__intro').evaluate('(el)=>parseFloat(getComputedStyle(el).fontSize)')
          summary=page.locator('.mare-access__summary')
          summary.focus()
          page.keyboard.press('Enter')
          assert page.locator('.mare-access__details').evaluate('(el)=>el.open'),'Native summary keyboard action'
          # Real radio and checkbox interactions, not writes to localStorage
          page.get_by_label('Muito ampliado').check()
          page.get_by_label('Contraste reforçado').check()
          page.get_by_label('Reduzir movimentos').check()
          page.get_by_label('Modo concentração').check()
          assert page.evaluate("""()=>({
             ...document.documentElement.dataset,stored:JSON.parse(localStorage.getItem('mare-accessibility-v1'))
          })""")['stored']=={'scale':'extra','contrast':True,'motion':True,'focus':True}
          after=page.locator('.mare-social__intro').evaluate('(el)=>parseFloat(getComputedStyle(el).fontSize)')
          assert after>before*1.15,('Readable text did not scale',before,after)
          assert page.locator('[data-ocean-scene]').evaluate('(el)=>getComputedStyle(el).display')=='none'
          assert page.evaluate("""()=>getComputedStyle(document.body).backgroundColor""")=='rgb(2, 12, 19)'
          data['persist']=True
          for route in PAGES:
            stage='high contrast / enlarged '+route
            page.goto(base+route+'.html',wait_until='domcontentloaded')
            section=page.locator('#ajustes-de-leitura')
            section.wait_for()
            state=page.evaluate("""()=>({
               scale:document.documentElement.dataset.mareScale,
               contrast:document.documentElement.dataset.mareContrast,
               motion:document.documentElement.dataset.mareMotion,
               focus:document.documentElement.dataset.mareFocus
            })""")
            assert state=={'scale':'extra','contrast':'high','motion':'reduce','focus':'on'},(route,state)
            assert page.locator('.mare-access__details').count()==1
            for width in [320,390,1280]:
              page.set_viewport_size({'width':width,'height':844})
              dimensions=page.evaluate("""()=>({
                total:document.documentElement.scrollWidth,
                viewport:document.documentElement.clientWidth
              })""")
              assert dimensions['total']<=dimensions['viewport']+4,(route,width,dimensions)
              data['reflow'].append({'route':route,'width':width})
            page.set_viewport_size({'width':390,'height':844})
            if route in ('index','recife','trilha'):
              page.screenshot(path=str(ART/('phase10-'+route+'-extra-mobile.png')),full_page=True)
            # Check actual populated preference content, not only empty DOM.
            section.locator('summary').click()
            axe=ROOT/'node_modules/axe-core/axe.min.js'
            assert axe.is_file(),'axe-core missing'
            page.add_script_tag(path=str(axe))
            severe=page.evaluate("""async()=>{
              const r=await axe.run(document,{runOnly:{
               type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']
              }});
              return r.violations.filter(x=>['critical','serious'].includes(x.impact))
               .map(x=>({id:x.id,targets:x.nodes.map(n=>n.target).slice(0,6)}));
            }""")
            if severe:
              data['blockers'].append(stage+': '+repr(severe))
            data['a11y'].append(route)
            data['pages'].append(route)
            if route=='trilha':
              stage='Trilha arrow focus'
              grid=page.locator('#grid button')
              grid.first.wait_for()
              grid.nth(5).focus()
              page.keyboard.press('ArrowRight')
              assert grid.nth(6).evaluate('(el)=>document.activeElement===el'),'ArrowRight'
              page.keyboard.press('ArrowDown')
              assert grid.nth(10).evaluate('(el)=>document.activeElement===el'),'ArrowDown'
              page.keyboard.press('Home')
              assert grid.nth(8).evaluate('(el)=>document.activeElement===el'),'Home'
              data['arrow'].append('trilha')
            if route=='marujo':
              stage='Marujo existing arrow focus'
              grid=page.locator('#board [data-id]')
              grid.nth(11).focus()
              page.keyboard.press('ArrowRight')
              assert grid.nth(12).evaluate('(el)=>document.activeElement===el'),'Marujo arrow'
              data['arrow'].append('marujo')
          stage='reset/scope'
          page.goto(base+'index.html',wait_until='domcontentloaded')
          page.locator('.mare-access__summary').click()
          page.get_by_role('button',name='Restaurar apresentação padrão').click()
          assert page.evaluate("localStorage.getItem('mare-accessibility-v1')") is None
          assert page.evaluate("document.documentElement.dataset.mareScale")=='normal'
          assert page.evaluate("document.documentElement.dataset.mareContrast")=='normal'
          assert page.evaluate("document.documentElement.dataset.mareMotion")=='system'
          assert page.evaluate("document.documentElement.dataset.mareFocus")=='off'
          assert page.locator('.mare-access__status').inner_text().startswith('Apresentação padrão')
          data['reset']=True
          data['privacy']=not page.evaluate("""()=>Object.keys(localStorage).some(
           key=>key==='mare-accessibility-v1')""")
          stage='offline settings'
          # Make a preference offline without modifying game history.
          page.get_by_label('Contraste reforçado').check()
          page.wait_for_function("async()=>!!(await navigator.serviceWorker.ready).active",timeout=22000)
          page.wait_for_function("()=>!!navigator.serviceWorker.controller",timeout=22000)
          ctx.set_offline(True)
          response=page.goto(base+'recife.html',wait_until='domcontentloaded',timeout=23000)
          assert response and response.status==200
          assert page.evaluate("document.documentElement.dataset.mareContrast")=='high'
          assert page.locator('#ajustes-de-leitura').count()==1
          data['offline']=True
        except Exception as error:
          data['blockers'].append(stage+': '+repr(error)+'\n'+traceback.format_exc(limit=8))
          try:page.screenshot(path=str(ART/'phase10-failure.png'),full_page=True)
          except Exception:pass
        finally:
          ctx.close();browser.close()
    finally:server.shutdown();server.server_close()
    (ART/'phase10-accessibility.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
    print('Phase10 accessibility: '+str(len(data['pages']))+'/13 routes, '+
      str(len(data['reflow']))+'/39 reflows, axe '+str(len(data['a11y']))+
      '/13, keyboard '+str(len(data['arrow']))+'/2, offline '+str(data['offline'])+
      ', blockers '+str(len(data['blockers'])),flush=True)
    for x in data['blockers']:print('BLOCK',x,flush=True)
    if data['blockers']:raise SystemExit(1)
if __name__=='__main__':main()
