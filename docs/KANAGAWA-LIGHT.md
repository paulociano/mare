# MARÉ Kanagawa Light · Design System 2026

## Direção visual

**Tese:** um ateliê de jogos de palavras tratado como uma coleção de gravuras marítimas contemporâneas: luminoso, calmo e tátil, com ondas de azul prussiano em papel claro.

A referência cromática/compositiva é *Under the Wave off Kanagawa* (c. 1830–1832), de Katsushika Hokusai. A observação do Metropolitan Museum of Art sobre a combinação de azul da Prússia e índigo fundamenta o par tonal principal, sem reproduzir a obra literalmente: https://www.metmuseum.org/en/about-the-met/conservation-and-scientific-research/conservation-stories/2020/hokusai-great-wave

A ilustração \`assets/backgrounds/kanagawa-wave.svg\` é **um desenho vetorial original**: crista marítima sinuosa, espuma estilizada, linhas gravadas, horizonte e montanha distante. A arte pertence à camada decorativa, sem competir com a jogabilidade.

## Autoridade do código

- \`src/styles/shared/mare-kanagawa.css\`: **camada final** de apresentação em todas as 13 páginas.
- \`src/styles/shared/mare-studio.css\`: estrutura da homepage, herdada.
- \`src/styles/shared/mare-play.css\`: shell dos 12 jogos, herdado.
- \`src/styles/games/*.css\`: layout e feedback de gameplay específicos.
- \`src/scripts/shared/mare-ocean.js\`: efeito WebGL antigo, desativado para o tema Kanagawa mas preservado de forma reversível.
- \`docs/ARCHITECTURE.md\`: rotas, build e limites de refatoração.

O build consolida o CSS em um bundle fingerprintado por página; a folha de autoria não gera uma solicitação adicional.

## Cor

| Token | Valor | Papel |
|---|---|---|
| \`--kan-paper\` | \`#F8F3E8\` | Tela de papel claro |
| \`--kan-white\` | \`#FFFDF7\` | Placas e cartões |
| \`--kan-mist\` | \`#E8F1F1\` | Painéis secundários |
| \`--kan-sky\` | \`#D9EBEE\` | Seleções suaves |
| \`--kan-blue\` | \`#315F87\` | Realces e bordas |
| \`--kan-indigo\` | \`#174B6A\` | CTA primário |
| \`--kan-deep\` / \`--kan-ink\` | \`#173E5E\` | Conteúdo principal |
| \`--kan-secondary\` | \`#446578\` | Texto auxiliar |
| \`--kan-focus\` | \`#AB6A17\` | Anel de foco em fundo claro |

Os pares principais de texto/fundo têm razão de contraste calculada de pelo menos 4,5:1; isso não substitui uma inspeção de **todas** as combinações herdadas, estados e overlays.

## Gramática de interface

- **Homepage:** hero editorial assimétrico, serif em títulos, arte no lado direito, conteúdo e CTA semanticamente acessíveis no lado esquerdo.
- **Cartões:** borda de gravura, papel com leve nuance azul, hierarquia de título e CTA com estados visíveis; filtro \`[hidden]\` preservado.
- **Jogos:** fundo claro, painel semelhante a papel, título serifado; cores de erro/acerto e leitura do tabuleiro preservadas por regras específicas.
- **Diário/recorrência/social:** utilitários em superfícies com tinta azul, sem luz néon ou painéis opacos.
- **Movimento:** leve deslocamento de cartão apenas quando hover existe; nenhuma animação decorativa essencial. O fundo SVG é estático.
- **Mobile:** hero em fluxo vertical com imagem como painel independente, cartões em coluna única na menor largura, alvos interativos de 44 px ou mais.
- **Tipografia:** Georgia nos títulos editoriais, DM Sans/system nos controles. Fallbacks sem dependência remota adicional.
- **Alto contraste e foco:** prevalecem sobre a arte. Sem alterar chaves persistidas ou opções já salvas.

## Verificações

\`npm run check\`, \`tests/kanagawa.cjs\`, o workflow de Chromium, testes de acessibilidade, navegação e PWA. Capturas de tela geradas pelo GitHub Actions devem ser revisadas como evidência adicional de estética, não como substituto de contratos funcionais.

## Rollback

Desfazer a introdução do último \`<link>\` Kanagawa e da classe \`mare-kanagawa\` nas 13 páginas restaura a camada anterior sem mudar dados dos usuários. \`assets/backgrounds/kanagawa-wave.svg\` pode ser removido depois de retirar suas referências. Não usar reset do \`localStorage\`.


## Revisão de consistência visual (17/10/2026)

A auditoria após o primeiro lançamento encontrou elementos com fundos e gradientes remanescentes do tema noturno. A correção foi feita por **componente** no final de \`mare-kanagawa.css\`, protegida por \`:root:not([data-mare-contrast="high"])\` para não interferir nas preferências de acessibilidade.

| Superfície | Direção refinada |
|---|---|
| Primeiro cartão do catálogo | Papel claro e azul-acizentado em vez de degradê noturno |
| Diário, missões e jornadas | Cartões papel, badges e metas em azul discreto e verde de conclusão |
| Recife | Painéis focados, teclado, modalidades e blocos de progresso claros |
| Concha | Letras neutras claras, letra central índigo, descobertas em cartões suaves |
| Enigma | Grade papel com bloqueios azulados e seleção índigo |
| Cardume, Corrente, Abismo | Peças neutras, tentativas e listas em superfícies claras |
| Trilha, Marujo | Grades e células neutras claras, feedback de seleção preservado |
| Forca, Criptograma, Pérola, Farol | Teclas, blocos de código e instruções com contraste adequado |
| Social | PNG compartilhável redesenhado em marfim/índigo com ondas vetoriais no canvas |

O inventário está em \`scripts/audit-kanagawa-surfaces.py\`, executado no CI para **26 combinações de rota e viewport**. O script impede a reintrodução de painéis escuros de área elevada no tema claro e salva capturas mobile/desktop para revisão. Botões de ação primária, células ativas ou feedbacks específicos podem usar cores mais profundas intencionalmente.

### Contratos de preservação

- Não substituir cores de vitória, derrota e progresso por uma única cor.
- Não alterar armazenamento dos jogos, navegação ou rotas estáticas.
- Alto contraste continua sendo uma preferência **autônoma** e tem prioridade sobre o tema claro.
- Testes automatizados por rota, fluxo offline e acessibilidade complementam, mas não substituem a avaliação estética humana.
