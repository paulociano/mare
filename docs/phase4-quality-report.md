# MARÉ | Fase 4: Contrato de qualidade verificável
Data: 17/10/2026 · Branch: feat/mare-phase4-quality-gates-20261017

## Objetivo e abordagem
A Fase 4 reforça estabilidade da experiência, sem acrescentar efeitos decorativos ao jogo. O escopo cobre jogabilidade real em navegador, acessibilidade automatizada WCAG 2.2, reflow em telas estreitas, toque emulado e sinais de desempenho de laboratório. Metodologia do Skill Arsenal: application-build-audit-loop + software-testing-engineering + web-quality-audit + runtime-ui-verification.

## Baseline auditado e achados
| ID | Superfície | Evidência de código/runtime | Severidade | Correção | Aceite |
| --- | --- | --- | --- | --- | --- |
| F4-01 | Recife em todos os modos | E2E venceu a rodada, mas MareProgress.read() não tinha resultado: modos.js sobrescrevia type() sem record | 4 | Gravar resultado real no controlador após salvar a partida | Vitória/derrota registrada exatamente uma vez, restaurável após reload |
| F4-02 | Recife: semântica de grade | axe aria-required-children critical em #board contendo seções, não linhas | 3 | Contêiner externo role=group; grades internas mantêm role=grid | Nenhuma violação aria-required-children |
| F4-03 | Enigma: casas bloqueadas | axe button-name critical em botões disabled sem nome | 3 | Adicionar nome acessível Casa bloqueada | Nenhuma violação button-name |
| F4-04 | Farol: regiões de montagem | axe aria-prohibited-attr serious em #chosen com aria-label sem role | 3 | Adicionar role=group nos contêineres selecionados e disponíveis | Nenhuma violação aria-prohibited-attr |
| F4-05 | Concha: 320px | Overflow horizontal observado em Chromium: scrollWidth 324, clientWidth 320 | 3 | Controles flex-wrap e roda ajustada em até 360px | Sem overflow além de tolerância 3px nos 13 documentos |

## Gates reproduzíveis
1. scripts/check-phase4-e2e.py: 12 vitórias em jogos individuais, quatro derrotas legítimas (Cardume, Náufrago, Pérola e Farol), vitória nos modos Dueto e Quarteto e derrota no modo Clássico, total de **19 cenários de partida**. As respostas são obtidas lendo dados determinísticos existentes; as jogadas são feitas por ações reais de interface. Assertivas sobre MareProgress.read, resumo e persistência após reload; nunca escrever o resultado diretamente no storage.
2. scripts/check-phase4-quality.py: axe-core 4.10.3 com regras WCAG 2.2 A/AA automatizáveis sobre 13 páginas em mobile emulado 390px e desktop 1280px (26 avaliações). Violações serious/critical bloqueiam o CI; moderadas/minor e resultados inconclusivos continuam no JSON para revisão humana.
3. Reflow: 13 páginas × 320px/640px = 26 verificações; o segundo caso simula o espaço CSS disponível em 200% de zoom partindo de 1280px, não substitui um navegador realmente ampliado.
4. Toque emulado por Chromium em 12 jogos; não equivale a testar iOS/Android físicos.
5. Laboratório: coleta DCL, transferSize reportado pelo browser, Largest Contentful Paint (quando o navegador emite amostras) e Cumulative Layout Shift em execução controlada. Sem métricas de campo, percentis p75 ou INP. Ausência de entrada LCP é null, nunca zero excelente.
6. Gate prévio: scripts/check-play-runtime.py mantém 24 renders responsivos e regressões básicas da Fase 2; scripts/check-phase3-runtime.py mantém uma interação por jogo. npm run check mantém testes estáticos e build.

## Cobertura de gameplay
Vitória: Recife, Abismo, Cardume, Corrente, Concha, Trilha, Enigma, Marujo, Náufrago, Sinais, Pérola, Farol. Derrota natural: Cardume, Náufrago, Pérola, Farol. Recife Clássico derrota e Dueto/Quarteto vitórias. Jogos abertos ou sem tentativa máxima não têm derrota fabricada só para satisfazer uma métrica.

## Critérios ainda não provados
- WCAG 2.2 AA completo, voz/leitor de tela, navegação de todos os estados ocultos: UNKNOWN até avaliação especializada.
- Zoom real do browser em 200% e 400%: UNKNOWN; o gate mede a largura equivalente de layout, não o mecanismo de zoom.
- Dispositivos físicos e gestos específicos de sistema operacional: UNKNOWN.
- Core Web Vitals de campo (LCP/CLS/INP p75) e análise longitudinal: UNKNOWN.
- Performance GPU do shader da homepage: não otimizada nem modificada nesta fase.

## Evidências e rollback
Os artifacts JSON e screenshots dos workflows de validação pertencem ao PR e são a evidência de execução. Reverter o PR remove gates e correções localizadas, sem tocar no formato de localStorage, histórico ou coleção de jogos. Não reduzir regras de auditoria para forçar aprovação.
