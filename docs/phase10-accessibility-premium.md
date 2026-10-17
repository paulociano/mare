# MARÉ | Fase 10: experiência premium e acessibilidade

Data: 17/10/2026. Fonte: `paulociano/mare` (GitHub). Métodos do Skill Arsenal: `application-build-audit-loop`, `game-ui-accessibility-engineering`, `runtime-ui-verification`, `web-quality-audit` e `verify-before-claim`.

## Contrato de produto

A Fase 10 reforça conforto, descobribilidade, foco, teclado, legibilidade e adaptação sensorial **sem alterar a dificuldade dos jogos nem suas pontuações**. Implementa uma área nativa de preferências em todas as 13 páginas, com apresentação consistente. Os ajustes não exigem conta, não são enviados à rede e não afetam a ledger.

- **Tamanho de leitura:** Padrão, Ampliado e Muito ampliado. Ajusta a base `rem` e as legendas/ações relevantes da interface. Não significa zoom de navegador real.
- **Contraste reforçado:** planos escuros, texto legível, bordas e indicadores de foco mais destacados, sem depender apenas de cores para estados essenciais.
- **Reduzir movimentos:** desliga animações/transições decorativas, além de respeitar automaticamente `prefers-reduced-motion`. A cena WebGL do mar evita importação da biblioteca quando movimento reduzido/concentração já estão ativos e interrompe a animação quando a preferência muda.
- **Modo concentração:** esconde efeitos decorativos de fundo, sem esconder instruções, controles, pontuações ou resultados. É separado da dificuldade e do modo livre.
- **Preferências locais e reversíveis:** uma chave `mare-accessibility-v1` (escala, contraste, movimento e foco) com allowlist de valores, fallback seguro, botão de restauração e sincronização entre abas. Nunca modifica saves, progresso, pontuações ou links sociais.
- **Teclado Trilha:** setas/Home/End movimentam o foco na grade de 4×4; Enter/Espaço selecionam através dos botões nativos. Marujo já possuía navegação por setas; essa jornada recebe teste específico de regressão.

## Critérios de aceite

| Superfície | Condição verificável |
| --- | --- |
| 13 rotas | Preferências presentes, opções sem escrever dados ao carregar |
| Preferência alterada | Ação por controle nativo, estado DOM atualizado e um único armazenamento local |
| Teclado | Disclosure nativo Enter, controles com foco visível, Trilha e Marujo com navegação por setas |
| Zoom de texto / reflow | 320, 390 e 1280 CSS px para todas as 13 páginas com escala extra: 39 checagens; sem scroll horizontal |
| Contraste | Axe-core da página com preferências abertas para 13 rotas, sem problemas automáticos graves/críticos |
| Redução de movimento | Oceanic scene desliga/evita a animação decorativa sem perda de funcionalidade |
| Offline | Abrir outra rota após desligar conexão preserva ajustes e a PWA continua operante |
| Integridade | XP, Diário, resultados e desafios sociais inalterados; todos os gates anteriores Fases 4–9 executados |
| Rollback | Reversível por revert dos arquivos de UI/handlers, sem migração de histórico |

## Privacidade e arquitetura

Nenhuma telemetria nova, nenhuma dependência externa, nenhuma autorização de dispositivo. O pacote CSS/JS permanece sob o orçamento de cache existente da PWA. O script aplica a preferência cedo, antes da animação decorativa, mas a interface não depende dela para jogar.

## Limites de homologação

**Não certificado WCAG.** O escopo automático inclui axe-core, teclas de navegação, estado real do DOM, layouts de larguras equivalentes ao reflow com zoom e alto contraste. Ainda é necessário testar manualmente:
- NVDA + Chrome em Windows, VoiceOver em macOS/iOS e TalkBack no Android;
- zoom nativo de navegador a 200%/400%, reflow em aparelhos reais, alto contraste do sistema operacional;
- PWA instalada em Android e iOS físicos;
- eventuais comandos de voz/gamepad quando existirem requisitos reais desses dispositivos.

Não relatar retenção, acessibilidade percebida ou Core Web Vitals p75 de campo a partir de testes de laboratório. Qualquer problema manual deve entrar em um issue rastreável e bloqueia alegações de conformidade integral.

## Recuperação e rollback

Os scripts dos jogos permanecem sem mudança de storage, exceto a navegação por teclado da Trilha. Reverter `mare-accessibility.js/css`, referências nas 13 páginas, o novo listener do Ocean e o teclado da Trilha; a chave de apresentação pode ser ignorada por versões antigas sem afetar histórico. O fluxo PWA continua usando atualização explícita após finalizar partidas.
