# MARÉ 3.0 — Estudo de redesign completo
Data: 2026-10-16
Status: proposta de design baseada em inspeção estática, não implementação.

## Diagnóstico
- Home: catálogo direto com oito cards, mas cards repetitivos e ornamentação superficial.
- CSS: mare-system.css (~10 KB), mare-v2.css (~29 KB), mare-editorial.css e estilos individuais criam cascata de overrides difícil de manter.
- Recife: recife.html (~79 KB) embute regras CSS e markup/lógica, dificultando consistência.
- Jogos: HUD, painéis, grades, estados e controles são inconsistentes entre as oito páginas.
- Fundos: vetores legados, gradientes e pseudo-elementos superpostos introduzem ruído.
- Problemas de densidade: muito espaço acima de algumas grades; modo de ajuda e ações podem ser mais próximos do tabuleiro.
- Não executar redesign por novas camadas de !important.

## Tese visual
Oceanic Play Studio: oceanografia abstrata, menos clipart, maior clareza de interação. Fundo escuro neutro #071923; painel #133442; ação #87dfcf; atenção #efca82; texto #f3faf7. Tipografia funcional com Outfit em títulos, DM Sans em controles e números tabulares para cronômetros.

## Arquitetura de informação
Home: cabeçalho fino / 'Escolha um jogo' / 8 cards de altura controlada / 'Continuar' somente se houver partida a retomar / rodapé mínimo.
Jogo: cabeçalho compacto / nome + seletor diário/livre / tabuleiro ou campo principal / controles primários / progresso / ajuda contextual / recursos secundários.
Desktop: tabuleiro dominante, sidebar até 280 px; mobile: controles e tabuleiro antes dos blocos de ajuda; não ocultar funcionalidade.

## Componentes a estabelecer
GameShell, GameHeader, ModeSwitch, GameBoard, GameTile, GameHUD, ProgressMeter, PrimaryAction, SecondaryAction, GameResult, HelpDialog, Toast/LiveStatus, ResumeCard.
Estados: default, hover quando aplicável, focus-visible, selected, correct, partial, absent, disabled, loading, win, loss.

## Jogos
Recife: grande tabuleiro e teclado, regras em ajuda, lateral simplificada.
Abismo: form de palpite dominante e lista de ranking densa.
Cardume: 16 tiles com seleção evidente e contador de erros permanente.
Corrente: input em primeiro plano e histórico de relações semânticas legível, sem decoração invasiva.
Concha: roda de letras principal, score e descobertas em segundo plano.
Trilha: pista junto do grid, percurso e ação verificar imediatamente abaixo.
Enigma: grade e pista ativa próximas, navegação teclado e pistas acessíveis.
Marujo: grade adaptável sem células minúsculas e chips de palavras encontradas legíveis.

## Roadmap de implementação
P0: baseline screenshots/testes, inventário de seletores, tokens e remoção cautelosa de duplicidade.
P1: home e sistema de cards; shell de jogo; componentes base.
P2: Recife, Corrente, Cardume e Abismo.
P3: Concha, Trilha, Enigma, Marujo.
P4: estados de vitória, som opcional, motion reduzido, auditoria WCAG e performance.

## Gates objetivos
A: documentação de tokens e layouts mobile/desktop.
B: cada modo e funcionalidade preservados; estados e persistência.
C: mobile 320/390/768 e desktop 1280/1440; zoom 200%; sem overflow.
D: teclado/foco, leitor de tela, prefers-reduced-motion, contraste WCAG aplicável, testes de primeira jogada/vitória/retomada.
E: Lighthouse/Web Vitals medidos e rollback documentado.
Nenhum gate de runtime é considerado PASS sem execução real.

## Não fazer
Não copiar o design de outros jogos, não substituir HTML semântico por WebGL, não acrescentar novos overlays opacos, não instalar framework apenas por estética, não editar regras ou chaves de storage durante redesign.
