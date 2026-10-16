# MARÉ 2.1 · Redesign das interfaces de jogo

## Objetivo
Aplicar uma direção de arte consistente aos oito jogos sem modificar regras, dados salvos, URLs ou lógica JavaScript.

## Superfícies redesenhadas
- **Enigma:** grade, casas selecionadas, pistas horizontais e verticais, ações e HUD.
- **Trilha:** letras, percurso ativo, pista, painel lateral e ações.
- **Marujo:** grade de caça-palavras, palavras encontradas, painel lateral e controles.
- **Cardume:** cartas de agrupamento, estados selecionados, grupos descobertos.
- **Corrente:** histórico de tentativas, letras, placar e painel.
- **Abismo:** palavras tentadas, progresso e painel.
- **Concha:** roda de letras, centro obrigatório, palavras descobertas e ações.
- **Recife:** continua usando os tokens globais do MARÉ 2.0; reconstrução própria ainda pendente.

## Direção
Tipografia fluida, profundidade em superfícies, tabuleiros como elementos principais, estados ativos contrastantes, feedback tátil e cantos orgânicos. Regras responsivas em 840px e 450px, sem esconder controles; respeito a movimento reduzido.

## Verificação
- PASS (estática): CSS adicionado ao arquivo já referenciado nas nove páginas; declaração de fonte corrigida; contagem de chaves CSS equilibrada.
- UNKNOWN: render real nos breakpoints; contraste WCAG medido; navegação completa por teclado e leitor de tela; fluxo vitória/derrota e retomada; ausência de regressões em todos os jogos.
- Critério de encerramento: capturas reais e smoke tests por jogo; medir overflow a 320px/390px, zoom 200%, foco, estados de partida, tempo de carregamento e mobile touch.

## Arquitetura
Nesta etapa, a modernização é via arquivo `mare-v2.css` carregado após os estilos legados. A simplificação e deduplicação do CSS antigo deve ser feita apenas após QA visual, para evitar quebra de jogabilidade.
