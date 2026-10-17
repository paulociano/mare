# MARÉ | Fase 9 · Desafios entre amigos e cartões locais

Data: 17/10/2026. Fonte: \`paulociano/mare\`, PR de Fase 9.
Metodologias selecionadas no GitHub canônico do Skill Arsenal: **Application Build & Audit Loop**, **Game Development Cycle**, **Web Quality Audit**, **Secure Code & Privacy Review**.

## Contrato da experiência

O MARÉ permanece estático e jogável sem autenticação, servidor, comunidade obrigatória nem cookies.

1. **Convite diário de 12 jogos:** na home, escolha Recife, Abismo, Cardume, Corrente, Concha, Trilha, Enigma, Marujo, Náufrago, Sinais, Pérola ou Farol. O link contém apenas \`#mare9=1.<jogo>.<data>.<resultado>\`, onde o resultado é \`p\` (convite), \`w\` (vitória declarada), \`l\` (derrota declarada). Os parâmetros estão no **fragmento** da URL: o site não envia os dados de participação ao servidor. O puzzle enviado é **a edição diária da data de São Paulo**, não uma expedição livre cuja preferência de dificuldade pode variar.
2. **Desafio com validade explícita:** convites são válidos somente no dia indicado, conforme \`America/Sao_Paulo\`. O site explica convites expirados ou inválidos e oferece o desafio de hoje, sem alegar que a edição antiga pode ser reproduzida. Recife passa a usar o calendário de São Paulo para a edição diária, compatível com leitores em outros fusos.
3. **Abismo:** o jogo tinha apenas expedições progressivas. Quando a página recebe um convite válido para Abismo, o alvo é calculado deterministicamente por dia e isolado na chave \`mare-semantico-challenge-AAAA-MM-DD\`, sem sobrescrever as rodadas normais \`mare-semantico-<índice>\`. Só um resultado realmente concluído nessa edição especial é considerado para comparação.
4. **Comparação voluntária:** resultado próprio só é mostrado a partir do **ledger persistido** por \`MareProgress.record\`, filtrado por game, modalidade diária, data e timestamp válido, sem confundir modo livre e diário. Resultado recebido pelo link é rotulado **autodeclarado**, não é certificado pelo MARÉ. Quando ambos possuem resultado, mostrar empate / você venceu / amigo venceu apenas por vitória ou derrota. Não usar nomes, placares falsos nem ranking global.
5. **Cartões PNG** locais: prévia na home, download de imagem 1200×675 com jogo, edição e resultado local. Quando disponível, compartilhamento nativo do arquivo por ação explícita, com fallback de download. O PNG não contém identificador, timestamp exato, histórico bruto, localização nem dados do dispositivo. O link para desafio é copiado apenas quando a pessoa aciona o botão.
6. **PWA e teclado:** cartões, convites e resultados funcionam sem rede após instalação do pacote estático. Botões, seleção e links têm rótulos, focos visíveis, estados/feedback; \`prefers-reduced-motion\` respeitado.

## Limites de confiança e privacidade

**Atenção:** sem backend e autenticação, *não há como verificar a afirmação feita por outro jogador*. O fragmento é pequeno, estritamente validado por versão, allowlist de 12 jogos, data-calendário real e resultado dentre \`p/w/l\`. O fragmento pode ser alterado por qualquer pessoa. Esta funcionalidade é uma comparação recreativa entre conhecidos, nunca prova de vitória nem ranking competitivo.

**Fluxos de dados:**
- Fonte local: \`MareProgress.read()\`; dados brutos continuam no localStorage do navegador.
- Saída explícita: código curto \`game/day/claim\`, texto básico de resultado, PNG sem dados identificadores. Sem POST, beacon, analytics, armazenamento social novo, push ou cookies.
- Entrada: fragmento URL limitado a 90 caracteres; nenhum valor dinâmico vai para \`innerHTML\`. URLs de navegação geradas somente de uma allowlist de páginas conhecidas; ignorar convites inválidos e futuros/expirados.
- O sistema **não possui ranking global ou perfis públicos**. Não estimular o envio de dados sensíveis ou inferir integridade antifraude da ledger no cliente.
- O compartilhamento via navegador/OS é uma ação voluntária; depois de escolher outro aplicativo, aplica-se a política desse destinatário.

## Gates

- \`tests/phase9-social.cjs\`: formato da URL, calendários, allowlist, invalidação/expiração, prova de jogo diário versus modo livre, participação Abismo isolada, validação de campos e privacidade, carregamento em 13 páginas.
- \`scripts/check-phase9-social.py\`: duas sessões de navegador isoladas, link de convite, partida **real** vencida em Cardume, confirmação do registro diário, comparação recebida win/loss, links inválidos e antigos, alvo compartilhado no Abismo, vitória real, PNG gerado e baixado, auditoria axe-core, 320/390/1280 CSS px e retorno offline.
- Gates herdados: 19 jornadas completas, 26 scans WCAG automatizados, 26 reflows, 26 testes de teclado/reflow, 13 páginas offline e 12 interações offline com upgrade PWA user-driven, fase 7/8 e suite Node completa.

## Não objetivos e pendências manuais

Não há ranking global, autenticação, anti-cheat, mensagens entre pessoas ou desafio histórico reproduzível após o dia corrente. Não afirmar multiplayer em tempo real: o modelo é **assíncrono por convite**. O resultado recebido é autodeclarado; as jogadas locais provêm de ações realmente registradas pelo cliente, mas localStorage pode ser editado manualmente por usuários.

Testes NVDA/VoiceOver/TalkBack, instalações físicas de PWA e zoom real permanecem pendentes; uma varredura automatizada não constitui certificação WCAG.

## Rollback

Reverter os scripts e estilos sociais, referências nas 13 páginas, alterações de calendário Recife e a chave isolada de Abismo por PR. A ledger e os salvamentos normais permanecem intactos. Convites antigos deixarão de ser interpretados, mas não quebrarão a abertura dos jogos. Para o PWA, realizar atualização normal do service worker depois da publicação do rollback, sem recarregar uma partida em andamento.
