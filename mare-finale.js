'use strict';
/* Accessible, non-blocking end-of-round feedback shared by MARÉ games. */
(()=>{
 if(!('MutationObserver'in window))return;
 const panel=document.createElement('div');
 panel.className='mare-finale';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');
 panel.setAttribute('aria-atomic','true');panel.hidden=true;
 const title=document.createElement('strong'),detail=document.createElement('span');
 panel.append(title,detail);
 document.body.append(panel);
 const watched=['notice','feedback','message','status','result'];
 let last='',dismiss;
 const win=/parabéns|você venceu|você acertou|código resolvido|frase decifrada|acertou!|vitória|venceu!/i;
 const loss=/fim de jogo|fim da rodada|não foi dessa vez|tentativas esgotadas|você perdeu/i;
 function check(){
  const text=watched.map(id=>document.getElementById(id)?.textContent||'').find(x=>win.test(x)||loss.test(x));
  if(!text||text===last)return;
  last=text;const success=win.test(text);
  panel.classList.toggle('mare-finale-win',success);
  title.textContent=success?'✦ Desafio concluído!':'◌ Mergulho encerrado';
  detail.textContent=text;
  panel.hidden=false;
  clearTimeout(dismiss);
  dismiss=setTimeout(()=>{panel.hidden=true},5500);
 }
 const observer=new MutationObserver(check);
 for(const id of watched){const el=document.getElementById(id);if(el)observer.observe(el,{subtree:true,childList:true,characterData:true})}
 check();
})();
