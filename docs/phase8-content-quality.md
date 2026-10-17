# MARÉ | Fase 8: Curadoria, Variedade e Dificuldade

Data: 17/10/2026. Métodos do Skill Arsenal: `application-build-audit-loop`, `game-development-cycle`, `game-development-engineering` e `web-quality-audit`.

## Produto e contrato de compatibilidade

A Fase 8 amplia a variedade de desafios e dá ao usuário uma escolha **explícita** de intensidade nas expedições livres. Não altera XP, conquistas, `MareProgress.record()`, o Diário de Bordo nem o modo offline. O site permanece estático, publicado no GitHub Pages.

- **Original:** seleção e ordem anteriores, sem modificação quando a preferência não existe; padrão de todas as pessoas.
- **Maré calma:** o primeiro terço do banco, ordenado por característica mensurável do puzzle.
- **Maré viva:** o terço intermediário.
- **Maré funda:** o terço com maiores medidas de complexidade.
- As faixas são **heurísticas transparentes de conteúdo**, não dificuldades psicométricas validadas com jogadores. Comprimento da palavra, variedade de letras, número de palavras numa expressão e carga lexical são *proxies* que variam por modalidade.
- Configuração muda o **próximo desafio livre**. Ao clicar em Aplicar, o MARÉ ativa o modo livre/uma próxima expedição e conserva desafios diários fora da seleção.
- Preferência armazenada exclusivamente em `mare-difficulty-v1`; valores desconhecidos são ignorados. Não há login, cookie, telemetria ou rede.
- No Recife, as três dificuldades jogáveis já existentes (**Clássico**, **Dueto**, **Quarteto**) são preservadas. Não inventar um controle paralelo que não altere o jogo.
- No Abismo, que possui uma sequência de expedições, a preferência se aplica à **próxima expedição** e não substitui o objetivo da rodada já iniciada.

## Ampliação e curadoria

| Jogo | Revisão/novidade | Validação |
| --- | --- | --- |
| Recife | Vocabulário português existente com mais de oito mil entradas, modos 1/2/4 preservados | comprimento e unicidade |
| Abismo | Remoção de associações duplicadas; seleção por extensão do alvo | alvo e associações válidas |
| Cardume | 6 novos tabuleiros, total 18 (16 palavras / 4 grupos) | unicidade no mesmo tabuleiro, categorias e grupo solucionáveis |
| Corrente | Ampliação da lista, níveis por tamanho da resposta | palavras entre 3 e 10 letras |
| Concha | 6 novas combinações de 7 letras distintas | letra central, seleção válida e listas de respostas |
| Trilha | 8 novas palavras com pistas | resposta com até 16 casas, caminho contínuo de quatro direções |
| Enigma | 5 novos conjuntos de palavras cruzadas | pistas, integridade das palavras e posicionamento real pelo gerador |
| Marujo | 4 novos temas com 7 palavras cada | unicidade e busca real na grade 10×10 |
| Náufrago | 12 palavras temáticas adicionais | alfabeto válido, conjunto de caracteres e categorias |
| Sinais | 10 frases adicionais | caracteres suportados, criptograma reversível |
| Pérola | 8 novas palavras com pistas | normalização acentuada e unicidade |
| Farol | 8 novas expressões/provérbios | normalização, reconstrução em blocos e resposta definida |

**Compatibilidade diária no lançamento:** para o dia 17/10/2026, os jogos cuja lista cresceu preservam o tamanho do catálogo usado para selecionar o desafio do dia. Os novos itens entram no ciclo diário a partir de 18/10/2026. Isso evita mudar a solução de uma edição que já estava em andamento durante a publicação.

Não há geração por IA em tempo real, nem respostas automaticamente inventadas. Os desafios adicionais são entradas editoriais estáticas e versionadas. As verificações automáticas cobrem formato, variedade estrutural, unicidade, geração e casos de solvabilidade simuláveis, mas não substituem revisão humana de ambiguidades culturais e linguísticas.

## Fonte única e qualidade

- `tests/phase8-content.cjs`: checagem dos 12 bancos, palavras normalizadas duplicadas, restrições por modalidade, 18 quadros Cardume, faixas de intensidade, compatibilidade Original, presença e ordem dos scripts.
- `scripts/check-phase8-runtime.py`: seleção manual real nos 11 jogos aplicáveis, persistência, retorno ao modo original, 33 verificações de reflow em 320/390/1280, testes de construção de palavras cruzadas e caça-palavras e checagens axe WCAG amostrais.
- Gates herdados: 19 jornadas E2E completas da Fase 4, 13 páginas PWA offline e 12 interações offline, 26 scans axe/reflow, 26 teclado/reflow, testes de histórico, XP, dias e missões.
- Uma mudança de banco só deve ser aprovada quando passes observáveis de jogabilidade e consistência do resultado forem preservados.
- Para rollback, reverter o PR mantendo os dados locais. Como o schema dos saves é preservado, nenhuma migração destrutiva é necessária. O PWA avisa sobre a versão e atualiza por confirmação.

## Limites

Sem teste de jogadores reais, não afirmar que a Maré funda é subjetivamente mais difícil, nem que a ampliação aumenta retenção. Leitores de tela físicos, iOS/Android físicos, zoom de navegador real e métricas CWV populacionais permanecem em homologação manual.
