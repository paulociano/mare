# Auditoria de design, UX, jogabilidade e motion · outubro de 2026

Revisão dos 13 roteiros (hub + 12 jogos) renderizados em Chromium a 1440×900 e 390×844, com axe-core, as 12 suítes de navegador do projeto e partidas reais em Recife, Cardume, Náufrago, Sinais, Trilha, Concha e Marujo. Todas as suítes já passavam antes; os problemas abaixo eram visíveis na tela, mas escapavam aos testes automáticos.

## Correções

| Área | Problema encontrado | Correção |
| --- | --- | --- |
| Hub | Títulos de Cardume, Corrente, Náufrago e Sinais invisíveis (tinta quase branca sobre cartão claro) e em outra fonte | Tinta Kanagawa e a mesma voz serifada nos 12 cartões |
| Hub | Sombra do link "Pular para o jogo" vazando no canto superior esquerdo | Link oculto sem sombra até receber foco |
| Hub (celular) | Menu quebrando "Diário de Bordo" em três linhas | Linha única rolável, alvos de 44 px |
| Hub | "Preparado para jogar offline" em verde-menta sobre creme (≈1,4:1) | Texto secundário com contraste AA |
| Abismo | Mar escuro legado atrás da tinta escura: título e introdução ilegíveis | Fundo papel compartilhado |
| 11 jogos | "Curadoria das marés" inserida acima do jogo (empurrava o tabuleiro para fora da tela no celular) ou ocupando a coluna lateral (escondia "Mapa de descobertas", pistas e lista de palavras no desktop) | Painel recolhível abaixo do tabuleiro, com o modo atual no resumo |
| Recife (celular) | Teclado virtual abaixo da dobra; "ENTER"/"APAGAR" cortados | Topo compactado e tabuleiro dimensionado pela altura; ícones ↵ e ⌫ com nomes acessíveis |
| Recife | Barra de progresso decorativa (parecia 1/3 completa com 0 palpites); "0 de 1 palavras" | Barra reflete tentativas usadas e palavras resolvidas; concordância de número |
| Recife | Moldura "SONDA 01" e foco em volta do único tabuleiro do modo Clássico | Removidos no modo Clássico; mantidos em Dueto e Quarteto |
| Recife | Cartão de resultado sobre o diálogo de vitória (dois modais empilhados) | Cartão fica sob os diálogos do jogo |
| Diálogos | Botão de fechar escuro com "×" escuro (≈1,3:1) | Botão papel com borda |
| Cardume | Palpite errado limpava a seleção, inclusive no "Faltou uma!" | Seleção mantida para ajustar uma palavra |
| Cardume | Repetir a mesma combinação errada custava outro erro | Aviso "Você já tentou essa combinação." sem penalidade |
| Cardume | Deslocamento de layout ao carregar o tabuleiro (CLS 0,25) | Espaço da grade reservado (CLS 0) |
| Sinais | Palavras quebradas no meio entre linhas | Casas agrupadas por palavra |
| Marujo | Arrastar não mostrava o caminho e a rolagem cancelava o gesto | Rastro ao vivo durante o arraste |
| Pérola / Farol | Rótulo "Sua resposta" colado ao campo | Rótulo acima, campo em largura total |
| Todos os jogos | Gravura de onda pintava um retângulo de papel com bordas duras atrás da coluna | Ornamento esmaecido em vinheta, sem caixa |
| Todos os jogos | Blocos "Desafio entre amigos" e "Acessibilidade" mais largos que a coluna do jogo | Mesma largura da coluna de cada jogo |
| Todos os jogos | Botões indisponíveis pareciam botões primários cinza | Estado tracejado, claramente indisponível |
| Acessibilidade | Títulos de Concha, Trilha, Enigma, Marujo e Recife fora de landmarks (axe `region`) | Regiões rotuladas |

## Desempenho e offline

- **Fontes auto-hospedadas** (DM Sans e Outfit variáveis, latin + latin-ext, OFL 1.1 em `assets/fonts/`). Antes, cada página fazia duas requisições ao Google Fonts com pesos diferentes, e o PWA offline caía na fonte do sistema.
- **GSAP auto-hospedado** em `assets/vendor/`, publicado e pré-cacheado pelo service worker. Antes vinha do jsDelivr e o motion não existia offline.
- CLS em laboratório (Chromium, 820 px de altura): Cardume 0,25 → 0; Corrente 0,096 → 0,024; Abismo 0,063 → 0,013; Recife 0,03 → 0,001.

## Motion

Curvas e durações compartilhadas (`--mare-ease-out`, `--mare-t-fast/base/slow`). Todo movimento fica atrás de `prefers-reduced-motion: no-preference` e é cancelado pela preferência do próprio MARÉ (`data-mare-motion="reduce"`). No JavaScript, o Recife consulta as duas antes de adiar cores.

- **Recife**: letra digitada "salta"; ao enviar, as casas viram em sequência e a cor aparece no meio do giro; o teclado só muda de cor depois que a fileira termina; palavra inválida faz a fileira tremer; na vitória, a fileira sobe como uma crista de onda antes do diálogo.
- **Cardume**: o grupo errado treme no lugar; o grupo encontrado emerge.
- **Marujo**: as letras da palavra encontrada assentam em sequência.
- **Geral**: retorno tátil ao pressionar (`scale(.965)`), elevação suave nos cartões do hub e na navegação entre jogos, entrada de diálogos e do cartão de resultado, e abertura da curadoria.

## Testes

- `tests/audit-2026.cjs` protege as correções (fontes e GSAP locais, posição da curadoria, regras do Cardume, Sinais por palavra, progresso do Recife, motion acessível, landmarks).
- `scripts/check-phase8-runtime.py` abre a curadoria como um jogador antes de usá-la.
- `scripts/check-phase4-e2e.py` usa quatro conjuntos errados distintos no Cardume (repetir não penaliza mais).

## Recomendações para a próxima rodada

1. **Consolidar o CSS.** São 19 folhas compartilhadas empilhadas por fase (`mare-v2` → `mare-3` → `brand` → `finesse` → `kanagawa`) e mais de 1.100 `!important` disputando especificidade; as regressões de cor desta auditoria vieram daí. O caminho é migrar tokens e componentes para uma base única e aposentar as camadas antigas jogo a jogo.
2. **Serifa auto-hospedada.** Os títulos usam Georgia, que não existe no Android (cai para a serifa do sistema). Uma serifa variável com licença OFL daria a mesma voz em todas as plataformas.
3. **Three.js do hub** ainda vem de CDN (`mare-ocean.js`). Vale auto-hospedar pelo mesmo motivo do GSAP.
4. **Renderização incremental.** Recife, Cardume, Marujo e Sinais reconstroem o DOM inteiro a cada toque; atualizar só as casas alteradas simplificaria o motion e o foco do teclado.
