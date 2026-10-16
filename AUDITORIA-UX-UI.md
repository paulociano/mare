# Auditoria UX/UI e Design do MARÉ — 16/10/2026

## Escopo e método
Revisão estática de `index.html`, `modos.js` e `modos.css` na branch main. Skills do Arsenal: `design-principles-audit`, `design-direction`, `runtime-ui-verification` (critérios de verificação). A URL pública não pôde ser inspecionada visualmente nesta execução. Portanto, hipóteses de layout não são rotuladas como falhas reproduzidas no navegador.

**Tarefa primária:** adivinhar uma, duas ou quatro palavras de 5 letras com teclado, entender feedback por estado, consultar regras e compartilhar desempenho.

## Tese visual
**“Expedição oceanográfica de alta legibilidade”:** o tabuleiro é o instrumento central; profundidade, luz e bioluminescência reforçam orientação e conquista sem competir com as letras.

## Achados priorizados

| ID | Severidade 0–4 | Superfície / evidência em código | Impacto/hipótese | Correção proposta | Aceite | Estado |
|---|---:|---|---|---|---|---|
| UX-01 | 3 | `modos.css` / `.mare-pane-head{font-size:7px}` abaixo de 540px; `.mare-modes button small{font-size:8px}` | Rótulos e informações de navegação podem ficar ilegíveis em celulares | Garantir fontes legíveis, retirar textos secundários se necessário; layout adaptativo | Capturas a 320/375/430px + zoom 200% sem corte e rótulos legíveis | Achado de código; validação visual pendente |
| UX-02 | 3 | `modos.css`: Quarteto em duas colunas, peças de 21–30px em mobile | Atingir e ler quadrículas pode exigir esforço; quatro grades extensas reduzem área do teclado | Alternar visão geral e tabuleiro ampliado por foco, ou grade de duas colunas com zoom acessível | Jogador lê e acompanha quatro palavras em 320px sem zoom obrigatório | Hipótese |
| UX-03 | 3 | `index.html`: modal `role=dialog`, `aria-modal=true`; `openModal`/ `closeModal` não aprisionam nem restauram foco | Teclado pode alcançar controles fora do modal e perder posição ao fechar | Focus trap, retorno ao disparador, `aria-labelledby`, scroll controlado | Tab percorre só modal aberto, Esc fecha e foco volta ao acionador | Falha identificável no código |
| UX-04 | 2 | `index.html` `.leftPanel{display:none}` em <=650px; regras somem da página | Primeiro uso no celular perde legenda de cores/contexto | Resumo compacto de legenda acima/abaixo das grades ou ajuda contextual | Sem acessar Ajuda, usuário entende o significado das três cores | Hipótese |
| UX-05 | 2 | `modos.js` atualiza `statusEl` a cada `render()`; teclado físico e virtual reconstroem DOM | Mensagens transitórias/feedback e foco de teclas virtuais podem se perder | Separar mensagem de status e contagem; atualizar botões sem perder foco | Mensagem permanece durante período definido; foco previsível | Hipótese |
| UX-06 | 2 | `modos.js` sinaliza concluído com texto e borda, mas tabuleiro exibe tentativas subsequentes em estados iguais | Dificuldade de identificar rapidamente quais palavras ainda estão ativas | Destaque de concluído + contador de progresso e contraste entre ativo/inativo | Em 2s usuário identifica grade ativa e progresso em Quarteto | Hipótese |
| UX-07 | 2 | `index.html` possui CSS original e segunda camada de overrides “Oceanographic design system v2” e `modos.css` | Manutenção de tokens, consistência e responsividade torna-se difícil | Consolidar tokens, tipografia, breakpoints e estados em arquivos editáveis | Sem declarações divergentes principais e regressão visual | Confirmado no código |
| UX-08 | 2 | `index.html` teclado colorido, sem legenda textual permanente no próprio tabuleiro | Estado depende fortemente de cor | Adicionar padrão/ícone acessível no feedback e instrução persistente | Simulação escala de cinza e leitor de tela preservam compreensão | Parcial; ARIA existe, verificar leitura real |
| UX-09 | 2 | `index.html` fontes externas, bolhas e luzes, muitos gradientes/backdrop filters | Custo de renderização pode afetar celular básico | Perf/paint profiling antes de simplificar; respeitar reduced-motion | Sem jank nos aparelhos-alvo; avaliação mensurada | Não medido |
| UX-10 | 2 | Modos têm 6/7/9 tentativas e estado local separado; modais estatísticos existem | Mudança de modo não deixa evidente retomada da partida e regras de cada modalidade | Mostrar progresso, retomada salva e microcopy contextual no seletor | Usuário troca entre modos sem perder orientação | Hipótese |

## Direção de design recomendada
- **Paleta:** azul abissal para fundo, verde bioluminescente para acerto, dourado para letra deslocada, slate claro para ausência; confirmar contraste por componente.
- **Tipografia:** Outfit para marca e números, DM Sans para instruções e ações; mínimo operacional confortável, especialmente em 320px.
- **Composição:** menos espaço para legendas decorativas no mobile, mais espaço para o jogo; indicador de progresso por modo.
- **Grid:** Clássico central; Dueto duas sondas equilibradas; Quarteto visão panorâmica + possibilidade de ampliar uma sonda.
- **Motion:** animação curta de preenchimento/resultado, redução de movimento respeitada; sem movimento ornamental competindo com leitura.
- **Estados:** texto de status distinto de erros, sucesso e número de tentativas; foco visível, instrução contextual e mensagem de conclusão clara.

## Verificação
- Leitura estática: PASS.
- Navegação real em desktop/mobile: UNKNOWN.
- Capturas em 320, 375, 430, 768, 1280px: UNKNOWN.
- Zoom 200%, foco e modal no navegador: UNKNOWN.
- Contraste calculado por token/superfície: UNKNOWN.
- Lighthouse/LCP/INP/CLS: UNKNOWN.

## Roadmap
**Agora:** UX-03, UX-01, UX-04, UX-05.
**Próximo:** UX-02, UX-06, UX-08, UX-10.
**Depois de teste real:** UX-07 e UX-09 com baseline visual/performance.

Critérios: preservar gameplay em todos os modos, sem redesign de marca; rodar reteste de teclado e mobile após mudanças. Este documento é auditoria, não declaração de correções executadas.


## Implementação de melhorias — 16/10/2026

Alterações incorporadas em `modos.js` e `modos.css`:

- UX-01: fontes de navegação e legenda ampliadas em telas pequenas — **IMPLEMENTADO NO CÓDIGO; visual pendente**.
- UX-02: Quarteto recebe seleção de sonda com tabuleiro ampliado em mobile — **IMPLEMENTADO NO CÓDIGO; teste de dispositivos pendente**.
- UX-03: diálogo com ciclo de foco, Tab limitado ao modal, retorno ao acionador e bloqueio de rolagem — **IMPLEMENTADO NO CÓDIGO; leitor de tela pendente**.
- UX-04: legenda persistente e compacta disponível também em mobile — **IMPLEMENTADO NO CÓDIGO**.
- UX-05: preservação de foco no teclado virtual e mensagens temporárias protegidas de novos renders — **IMPLEMENTADO NO CÓDIGO**.
- UX-06: progresso (palavras descobertas/tentativas), sonda resolvida destacada e seleção ativa — **IMPLEMENTADO NO CÓDIGO**.
- UX-07: tokens e estilos originais ainda permanecem em camadas; consolidação estrutural é **PENDENTE** para evitar regressão visual sem baseline real.
- UX-08: legenda usa texto e símbolos (✓, ↔, ×), evitando depender somente da cor — **IMPLEMENTADO NO CÓDIGO; simulação assistiva pendente**.
- UX-09: redução de bolhas e filtros no mobile e respeito a reduced-motion — **IMPLEMENTADO NO CÓDIGO; ganho de performance não medido**.
- UX-10: progresso persistido e aviso de retomada de partida ao trocar modo — **IMPLEMENTADO NO CÓDIGO**.

### Gate de validação

- JS parsing: **PASS** na verificação de sintaxe via JavaScript.
- Arquivos e integração referenciados: **PASS**.
- Renderização em navegadores, 320/375/430px, zoom e leitores de tela: **UNKNOWN**.
- Contraste calculado, Lighthouse e métricas móveis: **UNKNOWN**.
- Consistência visual após mudança: **UNKNOWN** sem captura real.

Conclusão: implementação de UI entregue em código para 9 de 10 itens; a consolidação final do CSS e a comprovação visual estão pendentes. Não interpretar como auditoria visual final aprovada.

**Complemento UX-07:** tokens de cores duplicados em `:root` foram consolidados em um único bloco no `index.html`; refatoração completa dos overrides visuais continua sujeita a baseline de navegador para preservar a aparência.
