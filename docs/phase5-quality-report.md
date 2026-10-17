# MARÉ | Fase 5: Observabilidade privada e acessibilidade aprofundada

Data: 17/10/2026. Fonte de implementação: GitHub `paulociano/mare`. Metodologia: Arsenal `application-build-audit-loop`, `web-quality-audit`, `runtime-ui-verification`.

## Objetivo

Sair de auditorias laboratoriais pontuais para um modo de diagnóstico **acionado pelo usuário** e expandir a cobertura de teclado e ampliação. A publicação continua estática no GitHub Pages: não existe backend, credencial ou coleta agregada de usuários. Não inventar dados de campo nem fabricar amostras.

## Entregas

- `mare-diagnostics.js` disponível em cada uma das 13 páginas, mas executa trabalho apenas quando `?diagnostico=1`. Link de ativação discreto no rodapé do catálogo. A CSS do painel também é carregada somente nesse modo.
- Métricas `LCP`, `CLS`, `INP`, `FCP`, `TTFB` pela biblioteca oficial `web-vitals@6.2.3`, importada dinamicamente **somente após ativação** via jsDelivr. Ver <https://www.npmjs.com/package/web-vitals>.
- Valores ausentes ficam como **Aguardando...**, nunca são tratados como zero. INP só aparece se o navegador registrar interações. Observação: o script do CDN é requisitado ao fornecedor; **não** há envio de medidas, contas, IPs através de uma API nossa ou histórico de jogo.
- `Salvar amostra local` é uma segunda escolha explícita; armazena até 120 medições com somente jogo/página, dia ISO e até cinco números. `Exportar JSON` usa Blob/download local; `Limpar amostras` apaga somente a chave `mare-local-vitals-v1`.
- p75 mostrado **somente por página e por métrica com pelo menos 20 amostras locais**. É uma distribuição da amostra de quem operou o diagnóstico; **não** corresponde aos Core Web Vitals p75 de usuários reais do site.
- Links internos preservam `diagnostico=1` na navegação quando o painel está ativo. Sair do modo removendo a query ou usando `Fechar diagnóstico`.
- `scripts/check-phase5-runtime.py` adiciona foco via Tab/Enter e reflow em larguras de viewport 640px/320px equivalentes ao espaço CSS de zoom 200%/400% em Chromium, e simula a interface do painel com um módulo Web Vitals de teste interceptado. Esse stub prova integração de UI e privacidade, não prova exatidão do algoritmo oficial de INP.

## Limites e política de dados

1. **Sem RUM populacional**: ausência de servidor, consentimento e ingestão agregada. Quando houver necessidade de p75 de usuários reais, decidir antes a base legal, aviso de privacidade, endpoint e retenção, amostragem e proteção contra abuso. Não instrumentar beacons por padrão.
2. **Métricas locais limitadas**: não armazenar URL completa, consulta, IDs, email, nomes, histórico de partidas, tempo de sessão ou dados de dispositivo. O JSON exportado pode ser compartilhado manualmente pelo usuário, sob escolha dele.
3. **Dependência de rede**: ativação do painel carrega script público pinned via jsDelivr. Sem acesso à CDN, painel continua funcional para limpar/exportar amostras, mas novas medições podem ficar indisponíveis.
4. Acessibilidade automatizada por axe-core da Fase 4 e testes de teclado em Chromium **não certificam WCAG 2.2 AA**. Leitores de tela e dispositivos físicos ainda exigem validação humana.

## Roteiro de homologação manual (ainda NÃO executado)

| Ambiente | Ação e prova exigida | Status |
| --- | --- | --- |
| NVDA + Chrome no Windows | Ler cabeçalho/H1, usar skip-link, navegar cards/tiles, abrir ajuda, sair por Escape, ouvir feedback de acerto e derrota sem duplicação | PENDENTE |
| VoiceOver + Safari no macOS | Navegação por títulos/landmarks, botões de tabuleiro, resumo de vitória, mover foco após fechar diálogo | PENDENTE |
| VoiceOver iPhone Safari | Explorar 12 jogos por rotor, ativar opções com toque assistivo, verificar feedback de seleção/estado | PENDENTE |
| TalkBack Android Chrome | Percorrer cada jogo em leitura linear, selecionar células/teclas, confirmar retorno ao catálogo | PENDENTE |
| Zoom real Chrome/Firefox 200% e 400% | 1280px desktop base, zoom via controle real do navegador, sem scroll horizontal no conteúdo crítico, foco não cortado | PENDENTE |
| Dispositivo Android e iPhone físico | Viewport, safe areas, touch targets, gestos do Marujo, zoom de texto e orientação | PENDENTE |
| Medição real de campo | p75 ≥28 dias, dispositivos com consentimento, LCP/INP/CLS agregados em fonte confiável (CrUX quando elegível ou serviço de RUM) | SEM BASE DE DADOS |

Não marcar esses itens como feitos a partir de Chromium emulado, imagens ou números de laboratório.

## Testes/gates

- `tests/phase5-contract.cjs`: 13 arquivos, nenhum carregamento por padrão, privacidade estática, dados mínimos e integração ao build.
- `scripts/check-phase5-runtime.py`: uma execução de navegador para a interface de diagnósticos, navegação de teclado em 13 páginas e 26 experiências de reflow por viewport de largura equivalente.
- `scripts/check-phase4-e2e.py`: 19 percursos completos, com vitórias/derrotas realmente gravadas por ações UI.
- `scripts/check-phase4-quality.py`: 26 varreduras axe WCAG e 26 reflows de largura equivalente, toque emulado e LCP/CLS laboratoriais.
- Evidências: artefato `mare-play-chromium-qa` associado ao GitHub Actions do PR da fase.

## Orçamento de qualidade e rollback

Respeitar Core Web Vitals: LCP bom até 2,5 s; INP bom até 200 ms; CLS bom até 0,1. Diagnósticos não devem criar rede, UI, localStorage ou observers na experiência padrão. Não exigir p75 real na CI onde não há amostras de produção.

Rollback: reverter o PR ou retirar `mare-diagnostics.js` das 13 páginas e as entradas no manifest. O painel pode ser removido sem migrar nem apagar o histórico `MareProgress`: ele usa chave isolada `mare-local-vitals-v1`.

## Correções descobertas pelo gate de teclado (F5)

- **Recife:** o tratador global de Enter/Backspace interceptava Enter em links e botões, bloqueando o skip link. Agora preserva a ativação nativa em controles interativos, sem afetar a entrada de letras com foco no corpo do jogo.
- **Abismo e Corrente:** o foco automático inicial no campo de palpite desviava o primeiro Tab da navegação de salto. Agora o foco automático acontece apenas após ações explícitas do usuário, como reiniciar a expedição; não na carga inicial.
- **Teste de zoom:** o experimento de aplicar CSS `zoom:4` no elemento raiz não modelava o zoom real do navegador porque media queries permaneciam em largura desktop. Substituído por reflow nos CSS viewports equivalentes de 640/320px, preservando a classificação de zoom nativo como PENDENTE.
