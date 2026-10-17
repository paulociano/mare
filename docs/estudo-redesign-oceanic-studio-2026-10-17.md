# MARÉ — Estudo completo de redesign Oceanic Studio
Data: 17/10/2026 | Fonte canônica: GitHub paulociano/mare, branch main anterior ao PR
Estado: auditoria de código + primeira etapa de implementação na homepage. Render e performance não homologados.

## 1. Diagnóstico e fontes
Inspecionados index.html, README, arquitetura, manifesto, camadas de estilos, scripts de descoberta/progresso, fluxos de build, workflow e auditorias anteriores. O endereço GitHub Pages não pôde ser inspecionado em navegador nesta sessão. Toda afirmação sobre aparência final, FPS, contraste, dispositivo ou Web Vitals é hipótese pendente de teste, e não medição.

Método do Arsenal: arsenal-router; stack improve-existing-web-app; especializações creative-web-engineering e shader-graphics-engineering. Princípio: preservar 12 jogos, URLs, regras de partidas, chaves de armazenamento e publicação estática.

## 2. Tese criativa e diferenciação
Oceanic Play Studio: oceano como linguagem, jogo como protagonista. O efeito assinatura é uma topografia batimétrica em movimento, não uma coleção de truques WebGL. Tipografia editorial, composição assimétrica na abertura, cards legíveis e microinterações orientadas a ações. Sem mascotes genéricos, gradientes multicoloridos, cursosres personalizados, motion em todo elemento ou canvas no lugar de interfaces reais.

A marca precisa comunicar: descoberta, profundidade, inteligência e ludicidade. A navegação deve ser orientada a entrar rapidamente num dos 12 jogos, não à rolagem de uma landing page longa.

## 3. Findings com gravidade e evidência
Severidade P0 alta, P1 relevante, P2 acabamento; C confirmado no código, H hipótese a validar em runtime.

| ID | Pri | Evidência e implicação | Estado | Correção |
| --- | --- | --- | --- | --- |
| MX-01 | P0 | mare-brand.css fixa cards em 410px e replica estrutura uniforme; longa escaneabilidade | C | reduzir altura fixa e reforçar percurso tag → nome → promessa → CTA |
| MX-02 | P0 | mare-system, mare-editorial, mare-v2, mare-3, mare-brand, mare-evolution e mare-explorer convivem com overrides e !important | C | extrair contratos e eliminar camadas gradualmente após screenshots de regressão |
| MX-03 | P1 | marca oceânica existe, porém falta elemento gráfico único na entrada | C estrutural, H perceptivo | assinatura de batimetria apenas no hero |
| MX-04 | P1 | meta, ícone, título e CTA concorrem nos cards | C estrutural, H legibilidade | dar hierarquia distinta e reduzir ruído |
| MX-05 | P0 | doze páginas têm shells e CSS específicos sobre camadas partilhadas | C | unificar header, ajuda, HUD, feedback, estados e acessibilidade sem mudar gameplay |
| MX-06 | P1 | toolbar, recomendações, onboarding, diário e continuar entram dinamicamente | C | ordenar por intenção e preservar acesso aos jogos |
| MX-07 | P1 | localStorage controla registros/retomada; fallback existe | C | preservar falhas não bloqueantes e não equiparar partidas registradas com vitórias |
| MX-08 | P0 | não há provas anexadas de inspeção visual do novo layout em browser nesta execução | C escopo | capturas mobile/desktop/foco/partidas |
| MX-09 | P1 | media queries e dimensões entre jogos não formam contrato único | C | validar 320/375/390/768/1024/1440, zoom 200%, overflow |
| MX-10 | P1 | Three.js pode elevar bytes e uso de GPU em site estático | Risco | import condicional, DPR/FPS contidos, pausa, fallback, comparação de custo |
| MX-11 | P1 | contraste calculado, leitor de tela e tempo de resposta não mensurados | H | aplicar QA WCAG 2.2 AA e Core Web Vitals no runtime |

## 4. Sistema de design e composição
Paleta proposta: Abyss #06141F; Surface #0D2632; Bioluminescence #A1F3D9; Text #F1F8F5; Muted #AEC7CB; Sand #E9C88B; Edge rgba(142,217,210,.21).
Título em Outfit 700, letter-spacing apertado somente no display; interface em DM Sans/system sans. Radius de 12 a 28px por função e motion entre 180 a 350ms somente em transform/opacity. Contraste deve ser medido no fundo renderizado composto, não inferido por tokens.

Desktop: cabeçalho com marca, hero em duas colunas e uma cena gráfica discreta à direita, catálogo em 3 colunas e diário após o catálogo. Tablet: 2 colunas, typographic scale menor. Mobile: entrada compacta, ilustração de baixa ênfase, uma coluna no grid compacto. Todos os jogos continuam acessíveis por links HTML.

Foco visível, entrada por teclado, textos descritivos, 44px de alvo interativo onde prático, controle sem hover obrigatório e ícones próprios de cada jogo. A oferta de retomada só aparece quando há registro correspondente.

## 5. Contrato da cena Three.js / GLSL
Uma cena tridimensional decorativa com plano subdividido, vertex shader de ondas e fragment shader de linhas topográficas. O texto, a navegação, o catálogo e toda lógica dos jogos permanecem no DOM. O shader não controla estado do produto.

Implementação fase A: Three.js ESM fixado por versão e carregado dinamicamente via CDN; geometria simples sem texturas, um ShaderMaterial, sem pós-processamento; até 30 fps, DPR até 1.5, parada quando offscreen ou aba oculta, limpeza na saída, fallback CSS se WebGL, import ou shader falharem. Mobile até 720px, reduced motion e save-data evitam import da biblioteca.

Trade-off: a dependência externa é custo e ponto de falha, mesmo não bloqueando o conteúdo. Se a cena se mantiver um plano único, testar alternativa WebGL2 puro com download menor; se confiabilidade offline for prioridade, considerar bundle local. Versão real do CDN, compile GLSL, pintura e consumo de GPU continuam UNKNOWN.

## 6. Redesign jogo a jogo (escopo futuro)
| Jogo | Proposta | Status neste PR |
| --- | --- | --- |
| Recife | Grade + teclado centrais, modos visíveis, estados de letras legíveis | Sem mudanças |
| Abismo | Melhor palpite persistente, input destacado, ranking econômico | Sem mudanças |
| Cardume | 16 tiles legíveis no mobile, seleção inequívoca e erros visíveis | Sem mudanças |
| Corrente | Resumo verbal das pistas e entrada mais importante que histórico | Sem mudanças |
| Concha | Roda dominante, palavra sendo formada, score subordinado | Sem mudanças |
| Trilha | Caminho atual e validação imediatamente junto da grade | Sem mudanças |
| Enigma | Pista ativa próxima ao tabuleiro e navegação de teclado previsível | Sem mudanças |
| Marujo | Grid legível, palavras encontradas separadas de controle | Sem mudanças |
| Náufrago | Letras e tentativas em primeiro plano, estados sem cor exclusiva | Sem mudanças |
| Sinais | Código, frase e hipótese contextualizados | Sem mudanças |
| Pérola | Anagrama como elemento central, opção touch/keyboard | Sem mudanças |
| Farol | Reconstrução de expressão com controles de ordenar acessíveis | Sem mudanças |

Jornadas a preservar: primeiro acesso sem cadastro; filtrar famílias; entrar no jogo; voltar ao convés; continuar partida quando disponível; concluir e compartilhar opcionalmente. Diários de progresso não devem sugerir vitórias inexistentes.

## 7. Fases recomendadas
A. Este PR: hero autoral, homepage editorial, card system localizado, shader opcional, fallback e documento de decisão.
B. Consolidar tokens e retirar CSS anterior com comparação por screenshots, mantendo contratos GameShell, CTA, HUD e Modal.
C. Priorizar Recife, Cardume, Abismo, Corrente e depois demais 8 jogos, em PRs pequenos para conter regressões.
D. Feedback de vitória/erro, ajuda e motion consistente de interface; nunca modal desnecessário a cada ação.
E. Auditoria visual e funcional em navegador, performance, segurança, acessibilidade e revalidação do Pages.

## 8. Critérios de aceite e QA
| Gate | Critério | Situação |
| --- | --- | --- |
| Funcionalidade | Todos os links e modos dos 12 jogos preservados | Fonte HTML mantida; clique real UNKNOWN |
| Semântica | Um H1 no hub, H2 no catálogo, HTML selecionável e acessível | Conferido no novo markup |
| Resiliência | Sem dependência de WebGL para jogar; fallback gráfico permanece | Implementado por design, runtime UNKNOWN |
| Acessibilidade | WCAG 2.2 AA aplicável, teclado, foco, status, leitor de tela, 200% zoom | UNKNOWN |
| Layout | 320, 375, 390, 768, 1024 e 1440px sem overflow nem CTA truncado | UNKNOWN |
| Movimento | reduced motion, save-data, visibilidade e aba em background | Previstos no código, runtime UNKNOWN |
| Web Vitals | LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 (p75 do tráfego real) | Metas, não resultados |
| Render GPU | Shader compila, mantém frame budget e não bloqueia jogo | UNKNOWN |
| Build | npm run check e CI em pull request | Pendente de execução e consulta |
| Produção | GitHub Pages exibe versão esperada após merge | Não implantado |

Screenshots mandatórios: 1440 e 1024 desktop, 768 tablet, 390/320 mobile, zoom 200%, card com foco, filtro ativo, retomada disponível/indisponível, cena WebGL e fallback com CDN bloqueado, um tabuleiro de cada família em jogo e vitória. Usar testes em dispositivo modesto para o efeito.

## 9. Riscos, observabilidade, rollback
A primeira fase acrescenta uma folha específica de homepage em vez de reescrever toda a cascata legada; isso limita blast radius mas não resolve a dívida técnica. Um próximo PR deve consolidar com diff visual antes de apagar estilos. A versão de Three via CDN requer verificação de carregamento e licenciamento. Se o frame rate, legibilidade ou Core Web Vitals piorarem, remover/disable apenas a camada gráfica, preservando cards e navegação.

Rollback: reverter a branch via PR ou retirar referência de mare-studio.css/mare-ocean.js e o hero do index.html. Dados salvos, roteamento, puzzles e partidas não foram modificados.

Critério principal de sucesso: escolher um jogo com facilidade, reconhecer a personalidade oceânica da marca e continuar jogando rapidamente em desktop e mobile.