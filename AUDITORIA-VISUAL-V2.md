# MARÉ — Reauditoria UX/UI, arquitetura visual e plano de otimização

Data: 16/10/2026 · Fonte: GitHub `paulociano/mare` / branch `main`

## Escopo, limites e método
Inspeção do HTML/CSS atual de `index.html`, `modos.css`, `visual-v3.css`, `abismo.html/css`, `cardume.html/css` e `corrente.html/css`. Considera modos Clássico, Dueto e Quarteto na homepage. O site público não pôde ser inspecionado por captura/DOM no navegador nesta sessão (tentativas de acesso público falharam). A pontuação não representa Lighthouse, pesquisa com usuários ou testes de dispositivo.

Arsenal: `improve-existing-web-app` e `design-principles-audit`; critérios de `web-quality-audit` e `runtime-ui-verification`.

Escala: severidade 4 = bloqueio; 3 = importante; 2 = moderada; 1 = cosmética. `CONFIRMADO` significa diretamente visível no código; `HIPÓTESE` exige execução visual.

## Diagnóstico de direção
O conceito “expedição abissal” é coerente: azul profundo, turquesa bioluminescente e interfaces instrumentais. O produto, porém, virou um hub de seis experiências; a arquitetura de navegação continua priorizando a antiga página única de jogo.

**Princípio de design:** uma marca, seis jogos, um sistema visual consistente, cada mecânica com sinais específicos. O tabuleiro deve ocupar a hierarquia dominante durante uma partida.

## Findings

| ID | Severidade | Superfície / evidência | Impacto / mecanismo | Correção | Validação | Estado |
| --- | ---: | --- | --- | --- | --- | --- |
| MUI-01 | 3 | Homepage: três blocos `.semantic-banner` consecutivos antes do `header.topbar` em `index.html` | Navegação sem hierarquia; principal jogo inicia abaixo de anúncios | Transformar a home em hub com grade de jogos; levar cabeçalho para topo, CTA “Continuar”, cards para Clássico, Dueto, Quarteto, Abismo, Cardume, Corrente | 375px: usuário encontra cada jogo e seu CTA sem rolagem excessiva; desktop: catálogo escaneável | CONFIRMADO |
| MUI-02 | 3 | Páginas `abismo.html`, `cardume.html`, `corrente.html` têm headers, containers e CSS próprios; `visual-v3.css` modifica só os modos de letras | Marca parece composta por produtos diferentes e mudanças precisam ser repetidas | Design tokens globais e componentes compartilhados: header, card, CTA, focus, status, modal, footer, breadcrumbs | Capturas lado a lado: espaçamentos/tipografia/tokens comuns e mecânica específica intacta | CONFIRMADO |
| MUI-03 | 3 | `index.html` tem estilos inline + `modos.css` + `visual-v3.css`; muitas propriedades reescritas na cascata | Regressões difíceis de prever; inconsistência e custo de manutenção | Extrair `base.css`, `components.css`, `game-letters.css`; eliminar regras mortas somente após baseline de tela | Diff CSS + snapshots desktop/mobile idênticos nos comportamentos preservados | CONFIRMADO |
| MUI-04 | 3 | Breakpoints distintos: letras 540/650/850/1050, Cardume 520, Corrente 560, Abismo 550 | Comportamento e densidade variam arbitrariamente entre jogos | Escala responsive por conteúdo, container queries onde útil; validar 320/375/430/768/1280/1440px | Sem overflow horizontal, CTAs clicáveis e tipografia legível a 200% de zoom | CONFIRMADO no código; resultado visual UNKNOWN |
| MUI-05 | 3 | `cardume.css` usa `font-size:clamp(9px,2.7vw,13px)` em palavras mobile | Palavras longas (ex: FISIOTERAPEUTA) podem ficar pequenas demais, quebrar ou exigir releitura | Tiles com texto >= 12–14px, expansão de célula por linhas/altura adaptativa; destaque selecionado redundante à cor | 320px: todas 16 palavras legíveis, 4 colunas, texto sem truncar; seleção por toque/teclado | CONFIRMADO tamanho definido, problema visual HIPÓTESE |
| MUI-06 | 2 | `corrente.css`: `.letter` min-width 25px em mobile; estados de links dependem de `:after` visual | Relação entre letras pode ser difícil de entender com leitura assistiva/baixo contraste | Legenda com exemplo real, síntese textual “N letras presentes, X pares consecutivos”; manter ARIA por letra | Leitor de tela anuncia score e pares; zoom 200% | HIPÓTESE |
| MUI-07 | 2 | `abismo.html`: controle de palpite antes de lista potencialmente extensa; CSS não define limite/âncora de resultados | Em rodadas longas, melhores palpites e novo palpite podem ficar distantes; posição do usuário no histórico é pouco expressiva | Exibir melhor tentativa persistente, barra de proximidade e histórico com agrupamento; botão “Ir ao palpite” | 50 palpites: adicionar palavra e identificar melhor posição em segundos | HIPÓTESE |
| MUI-08 | 3 | Quatro páginas possuem linguagem visual decorativa intensa (`background:cover fixed`, sombras, blur e diversas gradientes) | Potencial custo de paint e texto competir com arte | Asset responsivo com overlay sólido atrás de texto; simplificar efeitos mobile após medição | LCP/INP/CLS e long tasks antes/depois em dispositivos reais | CONFIRMADO estilos; impacto perf UNKNOWN |
| MUI-09 | 2 | `index.html` possui `.leftPanel` com explicação longa e `main` que serve ao jogo inicial; mobile oculta painel | Informações de onboarding e jogo ficam assimétricas nas diferentes telas | Guias rápidos contextuais por jogo, ‘Como jogar’ reutilizável e descoberta progressiva | Primeiro uso em mobile identifica objetivos e regras sem depender de hover | CONFIRMADO ocultação; impacto HIPÓTESE |
| MUI-10 | 2 | `abismo.html` tem textão explicativo sobre modelo na janela de ajuda; rodapé varia entre jogos | Mensagens de transparência competem com objetivo primário; assinatura irregular | Resumir regras no modal, mover detalhes técnicos ao link “Sobre o motor”; footer padrão | Usuário entende ação em até uma leitura curta; detalhes técnicos permanecem acessíveis | CONFIRMADO |
| MUI-11 | 2 | Menus `Voltar aos jogos`, `Voltar aos modos de letras`, `Todos os jogos` diferem nas subpáginas | Linguagem de navegação inconsistente | Usar “Todos os jogos” consistentemente, logo clicável e título do jogo no mesmo local | Teste de navegação ida-volta por teclado | CONFIRMADO |
| MUI-12 | 2 | Páginas usam `@import` independente de Google Fonts, tipografia DM Sans + Outfit em estilos duplicados | Recursos repetidos e cascatas longas aumentam fragilidade e tornam tuning trabalhoso | Carregamento comum de fontes com fallbacks, `font-display:swap` e políticas de pré-conexão; medir antes de otimizar | Comparar transferência, render e FOUT/CLS | CONFIRMADO imports; impacto de rede UNKNOWN |
| MUI-13 | 2 | Componentes do jogo têm estados específicos, mas não há documentação de design tokens, interação e captura referência de estados | Evoluções visuais podem alterar vitória, derrota e foco sem percepção | Criar inventário de componentes + story states e snapshots | baseline aprovado de default/selected/won/lost/modal/mobile/reduced-motion | CONFIRMADO ausência de baseline identificado |

## Plano de melhorias

### P0 — Descoberta e legibilidade (maior ganho para usuário)
1. Remodelar home como hub: cabeçalho, “Continuar jogando”, cards de jogos por mecânica. Evitar três faixas consecutivas.
2. Corrigir Cardume em 320px: fonte 12–14px, altura fluida e quebras adequadas em termos longos; seleção clara.
3. Padronizar header, CTAs e retorno para todos os jogos, estados de foco e semântica.
4. Adicionar onboarding contextual de uma linha + mini legenda sempre visível em mobile.

### P1 — Unificação de sistema (estabilidade)
5. Publicar tokens compartilhados: `--ocean-bg`, `--surface`, `--border`, `--text`, `--muted`, `--success`, `--warning`, escala de espaçamento, raio, fontes, alturas mínimas de toque.
6. Consolidar sobreposições e CSS duplicado gradualmente: base/common + específico por jogo, sem alterar lógica.
7. Criar biblioteca de estados: progress/loading/empty/error/win/loss, modais, selected, disabled.

### P2 — Feedback e polimento
8. Abismo: melhor palpite fixado, ranking legível, estado de loading dos embeddings e histórico com resultados perceptíveis.
9. Corrente: reforçar a visualização de sequências e um resumo textual de cada sondagem.
10. Refinar microinterações de vitória e erro, sob `prefers-reduced-motion`.
11. Ajustar fundos, sombras e camadas decorativas por viewport, após medir impacto de performance.

### P3 — Evidência e manutenção
12. Automatizar screenshots Playwright em 320/375/430/768/1280/1440, Chrome + Firefox/WebKit quando possível.
13. Rodar axe-core e Lighthouse com limites definidos após baseline; testar foco/teclado/zoom 200%, fluxo do modal, mensagens e teclado virtual.
14. Adicionar `docs/DESIGN-SYSTEM.md` e checklist de PRs para impedir divergência entre jogos.

## Contrato visual proposto

**Brand:** oceanográfico, não cyberpunk: fundos abissais discretos; cor bioluminescente exclusivamente para ações/progresso; dourado para alerta e descoberta parcial; tiles de resultado com redundância textual além da cor.

**Tipografia:** Outfit para marca/número/títulos de resultado; DM Sans para UI; corpo 14–16px e controle/tile 12–16px conforme espaço, sem sacrificar legibilidade para manter 4 colunas.

**Grid:** home catálogo em 1 coluna (mobile), 2 (tablet) e 3 (desktop); em jogo, painel principal centralizado com área de toque de referência de 44px quando tecnicamente viável.

**Layout:** navbar no topo; cards de modos e jogo abaixo; rodapé fora da área de jogabilidade. No desktop, a arte oceânica apoia a marca; no mobile, simplificar imagem, sombras e textos.

## Critérios de aceite gerais

- Zero overflow horizontal a 320, 375, 430, 768 e 1280px.
- Tipografia operacional legível; nenhum tile de palavra precisa cair abaixo de 12px no mobile.
- Navegação completa por teclado, indicação de foco visível, fechamento de diálogo e retorno de foco corretos.
- Estados de início, meio, sucesso, erro, encerramento, retomada e carregamento revisados.
- Evitar animações não essenciais quando o usuário pedir movimento reduzido.
- LCP / INP / CLS e WCAG dependem de medições reais: **UNKNOWN** nesta auditoria.
- Nenhuma mudança de lógica dos seis modos sem teste de regressão.

## Status de verificação

- Inspeção estrutural no GitHub: **PASS**.
- Acesso ao site público por ferramenta de leitura web: **UNAVAILABLE**.
- Capturas efetivas a 320/375/430/768/1280: **UNKNOWN**.
- Teste real de foco, contraste, teclado, zoom e uso em mobile: **UNKNOWN**.
- Lighthouse/Core Web Vitals: **UNKNOWN**.

Esta entrega é um diagnóstico e roadmap, não um redesign implementado. Próximo passo é obter baseline de navegador, implementar P0 e repetir a mesma inspeção.
