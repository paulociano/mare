# MARÉ Play Design System · Fase 2 (17/10/2026)

## Status e autoridade
Este documento descreve o contrato implementado em `mare-play.css` para os **12 jogos**. `mare-studio.css` governa apenas a homepage; `mare-evolution.css` foi preservado no hub, sem ser carregado nas partidas. Os estilos específicos de cada jogo permanecem responsáveis pelas grades, tabuleiros, puzzles, posicionamento dos elementos especiais e estados particulares.

Fonte oficial: código do repositório `paulociano/mare` na branch deste PR. Auditoria baseada em inspeção estática do código; não foi possível capturar o site público por navegador conectado neste ambiente. Não declarar aprovação de acessibilidade, FPS ou responsividade visual sem executar browser real.

## Direção: Oceanic Play System
Fundo abissal escuro, texto claro, painéis distintos sem blur, acento bioluminescente nas ações e destaque quente para foco. Marca sólida e navegação compacta; tabuleiro e controle principal recebem precedência visual sobre decoração. Sem Three.js nos 12 tabuleiros: o shader está restrito à homepage e não faz parte dos fluxos de partida.

## Tokens de uso
O CSS `mare-play.css` é a fonte operacional para `--play-*`:
- `--play-abyss` #06141f, fundo;
- `--play-layer` #0d2632, superfície;
- `--play-panel` #102d3b e `--play-panel-high` #153a48, elevação;
- `--play-ink` #f1f8f5, conteúdo;
- `--play-muted` #bed5d7, informação secundária;
- `--play-mint` #a1f3d9, ação/seleção;
- `--play-sand` #e9c88b, foco;
- `--play-stroke` rgba(142,217,210,.31), borda;
- `--play-radius` 20px e `--play-ease`, linguagem de superfície e motion.

**Observado, não alterado:** fontes de interface DM Sans e display Outfit, marca e símbolos originais. **Proposto/implementado neste PR:** alinhamento consistente do cabeçalho, H1 único por jogo, materiais de painel, estados de foco, ações primárias, seletor de modos, responsividade e orientação de ajuda. Tokens herdados `--m3-*` ainda existem em folhas legadas; não confundir com fonte final de verdade.

## Anatomia compartilhada
1. **GameHeader:** logotipo MARÉ que leva a `./`, link `← Todos os jogos`, separador suave. Recife conserva ajuda, estatística e configurações no topo.
2. **GameIntro:** símbolo exclusivo do jogo, H1 real, descrição curta e seletor de modo quando existente.
3. **GameSurface:** região de partida com borda, sombra leve e padding responsivo, mas sem prejudicar o tamanho de grade/teclado.
4. **GameHUD:** marcador da expedição, tentativas/tempo/score com numerais tabulares; não trocar contadores reais por métricas decorativas.
5. **ModeControls:** botões nativos com `aria-pressed` ou classe `active` conforme API existente, contraste claro na seleção.
6. **PrimaryAction:** confirmar/explorar com verde bioluminescente; secundárias azul-escuro e comportamento de disabled explícito.
7. **Status/Help:** status `role=status` / `aria-live` preservados, diálogos continuam nativos em jogos que os utilizam.
8. **VoyageNavigation:** links dos 12 jogos ao final das partidas com `aria-current=page`; não competir visualmente com tabuleiro.

## Escopo por jogo
| Jogo | Prioridade do campo de jogo | Mecânica preservada |
|---|---|---|
| Recife | Teclado e grade, título semântico e comandos de ajuda | Clássico/Dueto/Quarteto |
| Abismo | Campo de palpite e lista de proximidade | Rankings e tentativas |
| Cardume | 16 tiles legíveis e selecionados, botões confirmar/limpar | Grupos de quatro |
| Corrente | Entrada e feedback sequencial | Ligações de letras |
| Concha | Roda de letras e resposta | Pontuação e obrigatoriedade |
| Trilha | Tabuleiro + pista + ação verificar | Vizinhança de letras |
| Enigma | Grade, pista ativa e navegação | Cruzadas |
| Marujo | Grade, seleção e achados | Caça-palavras |
| Náufrago | Palavra, teclado e erros | Seis erros |
| Sinais | Código, campo de entrada e conferir | Substituição numérica |
| Pérola | Anagrama e ação confirmar | Três tentativas |
| Farol | Ordenação por palavras e confirmar | Expressões |

Os layouts de tabuleiros e seus scripts continuam sendo os que estavam no projeto. Só a camada compartilhada de visualização e a semântica da navegação foram modificadas.

## Acessibilidade e limites
- Elementos semânticos e teclado nativos preservados, foco visível com outline de 3px, labels, status e foco diferenciado.
- `[hidden]` sempre oculta, inclusive sob especificidade herdada.
- `prefers-reduced-motion` e `prefers-contrast:more` cobertos por CSS.
- Tiles do Cardume usam mínimo de 12px em viewport estreita e quebra de texto. Isso **não** comprova legibilidade em todos os dispositivos.
- A marca não é substituída por canvas. Efeitos de fundo fixos/animados do legado ficam desativados nas telas de jogo.
- Não se presume WCAG 2.2 AA apenas por esses ajustes. Testes de zoom 200%, interação por teclado, leitor de tela, render real e Web Vitals são gates pendentes.

## Checklist e status
| Critério | Status | Evidência |
|---|---|---|
| Todos os 12 documentos carregam `mare-play.css` | PASS após integração/teste de fontes | `tests/play-system.cjs` |
| Homepage mantém `mare-evolution.css` | PASS após integração/teste de fontes | `tests/evolution.cjs` |
| Um H1 e link ao hub por jogo | PASS após integração/teste de fontes | `tests/play-system.cjs` |
| Links, URLs e dados persistidos | Não modificados na camada de jogo; regressão pelo smoke | `npm run check` |
| Layout pixel-perfect desktop/mobile e 200% zoom | UNKNOWN | Browser/screenshots necessários |
| Foco e operação real por teclado | UNKNOWN | Teste humano ou browser assistido |
| Shader homepage e custo GPU | Fora do escopo desta rodada | Mantido como estava |
| LCP, INP, CLS de produção | UNKNOWN | Métricas reais necessárias |

## Rollback e dívida técnica
O CSS compartilhado dos jogos está isolado em `mare-play.css`. Para reverter, trocar seu link por `mare-evolution.css` nas 12 páginas e restaurar a versão anterior dos arquivos de markup; não alterar localStorage. O legado `mare-system.css`, `mare-v2.css`, `mare-3.css` e folhas individuais permanece em operação. A remoção de regras legadas só deve ocorrer após baselines renderizados com todos os 12 tabuleiros e seus estados (default, em progresso, vitória, derrota e ajuda) para evitar apagar regras funcionais por engano.

## Gate de release
Não confundir `npm run check` verde com aprovação de UX. Merge para `main` só depois de testes CI; em seguida verificar workflow Pages e, quando houver acesso a browser remoto, fazer revisão cruzada de viewport/touch/keyboard e aplicar correções adicionais.
