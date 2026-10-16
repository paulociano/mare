# Auditoria técnica MARÉ · 16/10/2026

## Escopo
Revisão de código do jogo estático (Clássico, Dueto, Quarteto), dicionário PT-BR, persistência local, estilos, integração e workflow GitHub Pages. Não houve inspeção visual em navegador, Lighthouse nem teste real em dispositivos.

## Arquitetura observada
- index.html: estrutura, estilos principais, léxico embutido, lógica clássica e persistência.
- modos.js: sobrepõe renderização e entrada para Dueto/Quarteto.
- modos.css: regras responsivas multi-tabuleiro.
- palavras-ptbr-5.txt: 8.611 formas normalizadas de cinco letras.
- GitHub Actions: publicação estática do site no Pages.

## Findings e ações
| ID | Severidade | Evidência | Efeito | Correção | Estado |
|---|---|---|---|---|---|
| MAR-01 | Crítica | Workflow copiava apenas index.html | Modos.js e modos.css ausentes no Pages | Incluir ambos assets no artefato | Corrigido no código; deploy pendente |
| MAR-02 | Alta | CI publicava sem teste do app | Regressões de sintaxe/assets poderiam chegar à produção | Smoke test Node antes do deploy | Implementado; execução CI pendente |
| MAR-03 | Média | Estado local era mesclado sem verificar tipos/integridade | Salvamentos inconsistentes poderiam quebrar renderização | Filtrar palpites, normalizar campo atual, recomputar término | Corrigido no código |
| MAR-04 | Média | Grade multi-tabuleiro sem semântica role=grid/row/gridcell | Estrutura insuficiente para leitores de tela | Atribuir roles e labels | Corrigido no código; testes assistivos pendentes |
| MAR-05 | Média | Lógica original e sobrescritas em modos.js coexistem | Acoplamento e possível regressão em futuras mudanças | Refatorar para controlador único e testes puros | Pendente |
| MAR-06 | Média | Dicionário está duplicado no HTML e TXT | Manutenção custosa e possível divergência | Gerar HTML/dicionário a partir de uma fonte em build | Pendente |
| MAR-07 | Média | Palavras diárias dependem do fuso local do jogador | Jogadores em fusos diferentes podem obter desafios distintos | Definir calendário de referência explícito | Pendente; requer decisão de produto |
| MAR-08 | Média | Dicionário contém termos raros; ACCEPT inclui termos legados inconsistentes | Palpites podem parecer arbitrários | Curadoria e teste lexicográfico de palavras aceitas/respostas | Pendente |
| MAR-09 | Baixa | Interface usa Google Fonts e animações | Dependência de rede para fontes e custo visual | Medir métricas e cache antes de otimizar | Não medido |
| MAR-10 | Média | Ausência de testes end-to-end mobile e leitor de tela | Layouts e jornadas não verificadas em runtime | Playwright, axe e inspeção manual | Pendente |

## Quality gates
- Sintaxe JavaScript: PASS (parse de scripts e modos.js sem erro).
- Referências CSS/JS e dicionário no código: PASS.
- Presença de 8.611 entradas de cinco letras: PASS.
- Smoke CI executado no GitHub: PENDENTE (workflow ainda em execução/fila).
- Publicação em GitHub Pages: UNKNOWN; não comprovada.
- Navegação real e layout mobile: UNKNOWN.
- Contraste real / leitores de tela / Lighthouse: UNKNOWN.
- Segurança: sem backend, credenciais ou entrada HTML livre observados na jornada principal; não equivale a pentest.

## Próximas ações recomendadas
1. Confirmar resultado da Action e abrir Pages desktop/mobile.
2. Fazer testes funcionais reais de conclusão e derrota para 1, 2 e 4 tabuleiros, troca de modo, reinício e persistência.
3. Consolidar código em módulo único, sem redefinições globais de funções.
4. Implementar conjunto de testes unitários para avaliação com letras repetidas, seleção determinística e saves.
5. Medir performance, acessibilidade e layout mobile antes de alterar efeitos visuais.
