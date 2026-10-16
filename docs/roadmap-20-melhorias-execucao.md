# MARÉ · Execução das 20 melhorias

## Lote 1 · Fundação de qualidade

Escopo implementado:
- #2: o deploy não mantém uma lista extensa de arquivos; `scripts/build-site.cjs` monta o site a partir das 11 páginas (home + 10 jogos), estilos/scripts vinculados e recursos locais usados pelo CSS.
- #5: `.github/workflows/quality.yml` executa smoke test e valida o pacote em PRs; `deploy-pages.yml` usa o mesmo empacotador.
- #17 (parcial): elimina renderização de vídeo pesado e instalação de dependências Python de um hero já removido, reduzindo etapas de deploy.

## Validação disponível
- PASS: sintaxe JavaScript do novo gerador por inspeção do script.
- PENDENTE: execução real dos workflows do GitHub, análise visual, partidas completas em navegadores.
- Não declarar #1, #3–4 ou #6–20 concluídos até que tenham entregas verificáveis.

## Próximos lotes recomendados
Lote 2: testes de estado/vitória/derrota para os dez jogos, verificações de navegação real e carga sem alterações no save atual (#1, #3, #4).
Lote 3: consolidar CSS, extrair JS do Recife e adotar componentes compartilhados (#6–10).
Lote 4: Náufrago/Sinais, progresso, acessibilidade, onboarding (#11–16).
Lote 5: medição performance, PWA opcional, sharing e monitoramento (#17–20).

## Política
Preservar URLs e chaves locais, manter assets SVG existentes e usar PRs com qualidade em vez de um merge monolítico sem QA.
