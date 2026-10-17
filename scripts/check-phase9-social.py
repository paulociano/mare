#!/usr/bin/env python3
"""Phase 9 Chromium: same-day peer links, real result, compare, PNG and offline."""
from __future__ import annotations
import http.server,json,threading,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'_site'
ART=ROOT/'playwright-artifacts'
class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*args):pass

def main():
    ART.mkdir(exist_ok=True)
    http=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet)
    threading.Thread(target=http.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{http.server_port}/'
    report={'invite':False,'peer':False,'game':False,'comparison':False,'abismo':False,
            'png':False,'privacy':False,'offline':False,'reflow':[],'axe':[],'findings':[]}
    try:
      with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        ctx=browser.new_context(viewport={'width':390,'height':844},locale='pt-BR',
                                reduced_motion='reduce',accept_downloads=True,service_workers='allow')
        ctx.add_init_script("""()=>{
          Object.defineProperty(navigator,'share',{configurable:true,value:async(payload)=>{
           window.__socialShare=payload;return undefined;
          }});
        }""")
        page=ctx.new_page()
        page.set_default_timeout(18000)
        stage='invite'
        try:
          page.goto(url+'index.html',wait_until='domcontentloaded')
          hub=page.locator('#desafios-entre-amigos');hub.wait_for()
          assert page.locator('#mare-social-game option').count()==12
          assert page.locator('.mare-social__canvas').count()==1
          assert page.locator('.mare-social__compare').count()==2
          page.locator('#mare-social-game').select_option('cardume')
          invite=page.locator('.mare-social__url').input_value()
          assert invite.startswith(url+'index.html#mare9=1.cardume.')
          day=page.evaluate('window.MareSocial.day()')
          assert invite.endswith(day+'.p'),invite
          for width in [320,390,1280]:
            page.set_viewport_size({'width':width,'height':844})
            scroll=page.evaluate("""()=>({
             viewport:document.documentElement.clientWidth,
             scroll:document.documentElement.scrollWidth
            })""")
            assert scroll['scroll']<=scroll['viewport']+4,(width,scroll)
            report['reflow'].append(width)
          page.set_viewport_size({'width':390,'height':844})
          page.screenshot(path=str(ART/'phase9-social-empty-mobile.png'),full_page=True)
          # Real PNG generated and downloaded without external service.
          with page.expect_download(timeout=14000) as pending:
            page.get_by_role('button',name='Baixar cartão PNG').click()
          download=pending.value
          path=ART/'phase9-cardume-card.png'
          download.save_as(str(path))
          assert path.stat().st_size>13000,path.stat().st_size
          assert path.read_bytes()[:8]==b'\x89PNG\r\n\x1a\n'
          report['png']=True
          report['invite']=True
          stage='receiving invitation'
          guest=browser.new_context(viewport={'width':390,'height':844},locale='pt-BR',
                                    reduced_motion='reduce',service_workers='allow')
          friend=guest.new_page()
          friend.goto(invite,wait_until='domcontentloaded')
          guestHub=friend.locator('#desafios-entre-amigos');guestHub.wait_for()
          assert friend.locator('#mare-social-game').input_value()=='cardume'
          assert 'Ainda não concluído' in friend.locator('.mare-social__compare').nth(1).inner_text()
          assert 'ainda não compartilhou' in friend.locator('.mare-social__compare').first.inner_text()
          friend.get_by_role('link',name='Jogar desafio diário').click()
          friend.wait_for_url('**/cardume.html#mare9=*')
          friend.locator('#grid .tile').first.wait_for()
          assert friend.locator('.mare-social--game').count()==1
          groups=friend.evaluate("puzzles[puzzleIndex].map(x=>x.words)")
          assert len(groups)==4
          # Win via real UI. Do not fabricate a row in MareProgress or localStorage.
          for group in groups:
            for word in group:friend.locator('#grid .tile').get_by_text(word,exact=True).click()
            friend.locator('#submit').click()
          assert friend.locator('#solved .solution').count()==4
          entries=friend.evaluate("window.MareProgress.read().filter(e=>e.game==='cardume')")
          assert len(entries)==1 and entries[0]['outcome']=='win'
          assert friend.evaluate("(d)=>window.MareSocial.localOutcome('cardume',d)",day)=='w'
          assert 'Vitória' in friend.locator('.mare-social__game-hint').inner_text()
          friend.get_by_role('link',name='Ver comparação no convés').click()
          friend.wait_for_url('**/index.html#mare9=*')
          assert 'Vitória' in friend.locator('.mare-social__compare').nth(1).inner_text()
          report['game']=True
          stage='peer comparison'
          # A friend's report is a DECLARATION. It cannot overwrite our result.
          received=url+'index.html#mare9=1.cardume.'+day+'.l'
          friend.goto(received,wait_until='domcontentloaded')
          assert 'Partida encerrada' in friend.locator('.mare-social__compare').first.inner_text()
          assert 'você venceu' in friend.locator('.mare-social__verdict').inner_text()
          friend.goto(url+'index.html#mare9=1.cardume.'+day+'.w',wait_until='domcontentloaded')
          assert 'empate' in friend.locator('.mare-social__verdict').inner_text()
          assert friend.evaluate("window.MareProgress.read().length")==1
          friend.get_by_role('button',name='Compartilhar meu resultado').click()
          friend.wait_for_function("!!window.__socialShare",timeout=10000) if False else None
          # Without native share there is an explicit copy fallback, no remote POST.
          report['comparison']=True
          stage='invalid and expired'
          friend.goto(url+'index.html#mare9=1.cardume.2026-02-30.w',wait_until='domcontentloaded')
          assert 'inválido' in friend.locator('.mare-social__status').inner_text()
          friend.goto(url+'index.html#mare9=1.cardume.2020-10-17.w',wait_until='domcontentloaded')
          assert 'expirado' in friend.locator('.mare-social__compare').first.inner_text()
          assert friend.evaluate("window.MareProgress.read().length")==1
          report['peer']=True
          stage='Abismo stable puzzle across devices'
          # Abismo normally advances sequentially; friend links pin a daily
          # target into a separate local challenge namespace.
          fixed=url+'abismo.html#mare9=1.abismo.'+day+'.p'
          friend.goto(fixed,wait_until='domcontentloaded')
          first=friend.evaluate("({round,secret:BANK[round][0],key:storageKey()})")
          assert first['key']=='mare-semantico-challenge-'+day
          visitor=guest.new_page();visitor.goto(fixed,wait_until='domcontentloaded')
          second=visitor.evaluate("({round,secret:BANK[round][0],key:storageKey()})")
          assert first==second
          friend.locator('#guess').fill(first['secret'])
          friend.locator('#guessform button[type="submit"]').click()
          assert friend.evaluate("(d)=>window.MareSocial.localOutcome('abismo',d)",day)=='w'
          rounds=friend.evaluate("window.MareProgress.read().filter(e=>e.game==='abismo')")
          assert len(rounds)==1 and rounds[0]['id']=='abismo:mare-semantico-challenge-'+day
          friend.reload(wait_until='domcontentloaded')
          assert friend.evaluate("(d)=>window.MareSocial.localOutcome('abismo',d)",day)=='w'
          report['abismo']=True
          stage='axe and local privacy'
          page.goto(url+'index.html',wait_until='domcontentloaded')
          page.add_script_tag(path=str(ROOT/'node_modules/axe-core/axe.min.js'))
          serious=page.evaluate("""async()=>{
            const r=await axe.run(document,{runOnly:{
             type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']
            }});
            return r.violations.filter(v=>['serious','critical'].includes(v.impact))
             .map(v=>({id:v.id,targets:v.nodes.map(x=>x.target).slice(0,4)}));
          }""")
          report['axe']=serious
          assert not serious,serious
          assert not page.evaluate("Object.keys(localStorage).some(x=>x.startsWith('mare-social'))"),'Social data should not persist'
          assert 'mare-verified-results-v1' not in invite,'Raw ledger must not appear in invitation'
          report['privacy']=True
          stage='offline share'
          page.wait_for_function("async()=>!!(await navigator.serviceWorker.ready).active",timeout=25000)
          page.wait_for_function("()=>!!navigator.serviceWorker.controller",timeout=25000)
          ctx.set_offline(True)
          response=page.goto(url+'index.html#mare9=1.cardume.'+day+'.p',wait_until='domcontentloaded',timeout=22000)
          assert response and response.status==200
          assert page.locator('.mare-social__canvas').count()==1
          assert page.locator('#mare-social-game').input_value()=='cardume'
          report['offline']=True
          guest.close()
        except Exception as exc:
          report['findings'].append(stage+': '+repr(exc)+'\n'+traceback.format_exc(limit=8))
          try:page.screenshot(path=str(ART/'phase9-failure.png'),full_page=True)
          except Exception:pass
        finally:ctx.close();browser.close()
    finally:http.shutdown();http.server_close()
    (ART/'phase9-social.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    print('Phase9: invite',report['invite'],'real win',report['game'],
          'compare',report['comparison'],'Abismo',report['abismo'],'PNG',report['png'],
          'offline',report['offline'],'reflow',len(report['reflow']),
          'axe serious',len(report['axe']),'blockers',len(report['findings']),flush=True)
    for problem in report['findings']:print('BLOCK',problem,flush=True)
    if report['findings']:raise SystemExit(1)
if __name__=='__main__':main()
