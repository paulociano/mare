# Auditoria MARÉ — continuação (16/10/2026)

## Escopo e baseline
- Repositório: `paulociano/mare`; referência inicial desta etapa: `33d373aa915c4704d166e67e569b18be3595d965`.
- Jogos: Recife, Abismo, Cardume, Corrente, Concha, Trilha, Enigma e Marujo.
- Revisão de UI/UX, acessibilidade, jogabilidade, persistência e confiabilidade.
- Método: Skill Arsenal, `application-build-audit-loop` com `game-development-cycle`.

## Histórico da auditoria anterior
Conforme o histórico recuperado, foram verificadas nove páginas em três larguras, fluxos de vitória e retomada, toque, armazenamento bloqueado e os três modos do Recife. Também foram relatadas correções de overflow em 320px e revisão inicial de acessibilidade. **Essas evidências históricas não foram reexecutadas nesta etapa**.

## Correções já incorporadas diretamente à branch principal antes deste PR
- `304c161`: descoberta de progresso nos oito jogos e registro de último jogo aberto no hub.
- `33d373a`: exclusão de metadados de rodada do Abismo na detecção de progresso.

## Achados e resoluções desta etapa
| ID | Componente | Problema no código | Impacto | Correção | Estado |
|---|---|---|---|---|---|
| A11Y-01 | Enigma | Handler global capturava digitação e setas mesmo com outros controles em foco | Alto | Restringir atalhos à grade | Implementado; teste manual pendente |
| A11Y-02 | Enigma | Render recriava botões, removendo foco após seleção/digitação | Alto | Restaurar foco na casa selecionada | Implementado; teste manual pendente |
| A11Y-03 | Trilha | Render de seleção recriava grade e perdia o foco | Alto | Restaurar foco no botão selecionado | Implementado; teste manual pendente |
| UX-04 | Trilha | Enter global verificava palavra e podia impedir ativar botões | Alto | Remover captura global de Enter; Backspace restrito à grade | Implementado; teste manual pendente |
| UX-05 | Hub | Retomada não abrangia os oito jogos | Médio | Correção anterior em `hub.js` | Incorporado no baseline; teste manual pendente |

## Portões de verificação
| Critério | Resultado nesta etapa |
|---|---|
| Arquivos JS modificados passam no parser JavaScript | PASS |
| Inspeção estática das rotas de entrada e restauração de foco | PASS (estática) |
| Fluxos reais por teclado, toque, leitores de tela e mobile real | UNKNOWN |
| Teste de regressão dos oito jogos em navegador | UNKNOWN |
| Lighthouse/Core Web Vitals, FPS e performance de rede | UNKNOWN |
| Compatibilidade com armazenamento bloqueado após este PR | UNKNOWN |

**Classificação de entrega:** PARTIAL (código e registro concluídos; experiência real não certificada).

## Próximos testes manuais exigidos
1. Enigma: selecionar casa e pista; digitar; apagar; navegar com setas; alternar orientação; usar ajuda e botões; confirmar que atalhos não interferem fora da grade.
2. Trilha: percorrer casas por Tab; selecionar letras com Enter/Espaço; usar Backspace; acionar Verificar pela tecla Enter quando o botão tiver foco; desfazer, limpar, vencer e reiniciar.
3. Verificar 320px, 390px e desktop; zoom 200%; leitores de tela (NVDA/VoiceOver); `prefers-reduced-motion`.
4. Testar acesso sem `localStorage`, jogo salvo, retorno ao hub e retomada dos oito jogos.
5. Executar Lighthouse e revisar contraste, carregamento de mídia e tempo de resposta de entrada.

## Critério de encerramento
Aprovação definitiva só após reprodução e reteste de cada fluxo no navegador. Sem provas de execução, marcar UNKNOWN, jamais PASS.
