# MARÉ | Fase 7: Rota do Dia e Progressão Verificada

Data de implementação: 17/10/2026. Fonte oficial: GitHub \`paulociano/mare\`. Métodos: Skill Arsenal \`application-build-audit-loop\` + \`product-management-cycle\` + \`web-quality-audit\`.

## Contrato de produto

**Objetivo:** aprofundar o valor do retorno ao MARÉ sem introduzir check-in artificial, cadastros, rastreamento remoto ou incentivo punitivo. Jogar por vontade própria deve gerar progresso visível, mas nunca uma contagem de vitórias que não ocorreram.

Implementações:

1. **Desafio diário rotativo integrado.** Um jogo em destaque por dia entre os 12, com algoritmo estável \`(diaDesdeEpoch + 4) % 12\`. Todas as pessoas no mesmo dia-calendário de São Paulo veem o mesmo destino, mesmo offline. O jogador é levado ao jogo real pela CTA, sem sessão paralela ou puzzle artificial. Uma partida efetivamente concluída no jogo destacado no dia registra conclusão (vitória ou derrota), sem exigir vitória.
2. **Sequências de participação.** Somente dias únicos com pelo menos um resultado de partida verificado em \`mare-verified-results-v1\`. Dias diferentes no mesmo fuso são agrupados; a sequência atual persiste durante o dia seguinte à última participação, sem induzir obrigação matinal. A sequência mais longa não desaparece após um intervalo.
3. **Calendário semanal visual.** Segunda a domingo, baseado no fuso \`America/Sao_Paulo\`. Dias futuros são diferenciados e não simulam progresso.
4. **Conquistas detalhadas.** Quatro conquistas originais preservadas e oito marcos adicionais (12 no total). Cada marco exibe critério, progresso e, quando obtido por resultados verificáveis, data de obtenção. Expandir com \`details/summary\` funciona por teclado e não exige JavaScript extra.
5. **Histórico recente, sem identificadores.** Até seis partidas verificadas exibidas por jogo, resultado e dia, derivadas em memória da mesma ledger local. Identificadores internos e histórico completo nunca aparecem nem são compartilhados.
6. **Missões diárias/semanais existentes preservadas.** \`Mergulho do dia\`, \`Tesouro de hoje\`, \`Rota da semana\` e \`Três destinos\` seguem vinculadas aos registros existentes. A seção de progressão fica dentro do Diário de Bordo 2.0 e no shell PWA offline.

**Não objetivos:** rankings globais, login, push, recompensas de XP extras e sincronização multi-dispositivo. O XP atual permanece 100 por vitória e 20 por derrota, sem duplicação por abrir o catálogo ou clicar em desafio. Não existem novos endpoints, localStorage keys ou permissão de notificação.

## Confiabilidade e privacidade

- Fonte única de resultados: \`MareProgress.record\`; retorno de \`read()\` limitado aos últimos 200 resultados persistidos (histórico mais antigo pode não contar para sequência/conquistas após truncamento).
- Desafios e conquistas **derivam de dados já existentes**, sem escrever histórico retroativo.
- Entradas com data inválida ou futura são ignoradas no calendário e nas novas conquistas. O contador legado de XP mantém sua compatibilidade; a ledger continua local e, por isso, **não é antifraude** contra edição manual do navegador ou relógio.
- Sem identificadores, URLs completas ou timestamps exportados na interface; dias e totais permanecem no dispositivo.
- Registros existentes permanecem preservados após deploy e atualização de service worker. Fonte de verdade é o localStorage, nunca Cache Storage.

## Critérios de aceite e evidências

| Critério | Gate |
| --- | --- |
| Um destino estável por dia e alternância no dia seguinte | \`tests/phase7-contract.cjs\` |
| Meia-noite São Paulo, mudança de semana e sequência de participação | \`tests/phase7-contract.cjs\` |
| Vitórias/derrotas verificadas, deduplicação e XP intacto | Testes \`progress\`, \`xp\`, \`missions\`, \`phase7-contract\` |
| Empty state, CTA, conquista expandida por teclado e progressão após jogo real | \`scripts/check-phase7-runtime.py\` |
| UI com registros reais + axe WCAG de gravidade séria/crítica | \`scripts/check-phase7-runtime.py\` |
| Mobile e desktop sem overflow | \`scripts/check-phase7-runtime.py\` + 26 gates Fase 4 |
| Retorno ao catálogo offline com conclusão diária preservada | \`scripts/check-phase7-runtime.py\` e gate PWA da Fase 6 |
| Sem regressões de gameplay / 19 vitórias e derrotas reais | \`scripts/check-phase4-e2e.py\` |
| Instalabilidade PWA e atualização segura | Gate Fase 6, sem mudar SW manualmente |

**Limites:** Chromium automatizado, viewport simulada e varredura axe não certificam WCAG 2.2 AA nem substituem NVDA/VoiceOver/TalkBack ou testes físicos. Métricas de campo (retenção D1/D7, sessões recorrentes, p75 CWV) continuam desconhecidas sem uma política de telemetria consentida.

## Decisões e métricas futuras

Hipótese de produto: desafio diário visível e metas compreensíveis incentivam retorno voluntário. Sem RUM agregado, não é possível alegar aumento real de retenção. Indicadores potenciais quando medíveis, mediante política de privacidade e consentimento: percentual de pessoas que concluem a rota em sessões opt-in, recorrência voluntária e acessibilidade percebida. Guardrails: tempo de carregamento, taxa de erro das 12 partidas, teclado, offline e ausência de notificações coercitivas.

## Rollback

Reverter a mudança de \`mare-progress.js\`, \`mare-explorer.js\`, \`mare-voyage.js/css\` e referências do \`index.html\`. A ledger \`mare-verified-results-v1\` não precisa de migração, pois a Fase 7 não altera seu esquema. Atualizar o PWA por seu fluxo normal de confirmação, sem forçar reload durante partidas.
