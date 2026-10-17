# MARÉ · Fase 6 | Anywhere + Diário de Bordo 2.0

Implementação em 17/10/2026. Stack do Arsenal: **Application Build & Audit Loop**; skills: **PWA Engineering** e **Web Quality Audit**. Repositório canônico: `paulociano/mare`.

## Contrato de produto
- Primeira visita exige conexão. Quando o service worker conclui o cache da release, **12 jogos e catálogo** podem ser reabertos offline no mesmo navegador/dispositivo.
- O site permanece utilizável sem Service Worker: progressive enhancement e estado de erro não bloqueante.
- Manifest com escopo `./` respeita GitHub Pages em `/mare/` e servidor local em `/`, `start_url: ./`, standalone e ícones PNG 192/512 (512 maskable). A instalação depende de suporte do navegador/OS; não forçar banners de permissão.
- Não cachear URLs externas, dados privados, postagens ou respostas arbitrárias. O cache só armazena **recursos da release** e nunca localStorage. Os registros do jogador são mantidos isoladamente na chave antiga `mare-verified-results-v1`.
- **Consistência atômica:** `scripts/build-site.cjs` calcula SHA-256 dos arquivos publicados e escreve `_site/sw.js` com `mare-shell-<hash>`. Instalação exige `cache.addAll` completo. Falha em asset aborta a instalação, apaga cache parcial e preserva worker antigo. Interceptação GET same-origin apenas de caminhos declarados.
- **Atualizações:** worker novo fica em `waiting` até jogador escolher **Atualizar aplicativo**. Só então `skipWaiting`, `clients.claim`, remoção de cache antigo e reload. Jamais recarregar uma rodada automaticamente no momento de vitória/derrota.
- **Consistência offline:** shell cache-first em recursos versionados, inclusive HTML, impede misturar HTML novo com JS antigo. A nova release chega pelo processo de atualização do service worker. O conteúdo externo do shader WebGL é decorativo e usa fallback CSS; os jogos não dependem dele. Diagnóstico Web Vitals opt-in pode ficar indisponível offline.
- **Budget:** até 12 MiB de recursos do shell; gate Node falha quando ultrapassado. A economia de rede de navegações warm é inerente ao cache, mas não equivale a alegar melhora de Core Web Vitals p75 de usuários reais.

## Diário de Bordo 2.0
- **Hero editorial** com estatísticas verificadas (vitórias, rodadas concluídas, jogos diferentes vencidos e nível).
- Barra de **XP** com limites calculados do `MareProgress.stats()` já existente, sem novo esquema de persistência.
- Conquistas ganhas e bloqueadas com diferenciação semântica, missões com progresso verificável, 12 destinos com vitórias confirmadas e links diretos, e ação de compartilhamento apenas de totais agregados.
- **Exploração não é vitória.** Barra de 12 jogos visitados baseada em salvamentos disponíveis, separada das vitórias que provêm exclusivamente de `MareProgress.read()`.
- **Zero resultados e storage bloqueado** têm textos de orientação, sem fingir conquistas. O diário apenas lê dados e não sobrescreve chaves anteriores.
- Responsividade em grids 4/3/2/1 colunas, foco visível, contraste, `prefers-reduced-motion`; a navegação do hub passa a ter link direto para a seção.

## Gates de validação
1. `npm run check`: integridade de 13 páginas, build reproducível, testes do diário legado e novo contrato PWA.
2. `scripts/check-phase6-pwa.py` no Chromium: registro real, cache e escopo, navegação offline 13/13, vitória real no Pérola antes de desconectar, diário contabiliza após retornar ao hub offline, e atualização simulada em `_site/sw.js` servida como nova versão (aguarda ação, limpa cache anterior, mantém o ledger).
3. Gates cumulativos: 19 percursos completos fase 4, 26 axe-core, 26 reflow, 26 teclado/reflow fase 5, 24 viewport screens e 12 interações.
4. Não afirmar teste nativo de instalação iOS/Android ou fidelidade de Core Web Vitals de campo com navegador emulado. A execução manual com VoiceOver/TalkBack e instalação real continua pendente.

## Rollback e riscos
- Reverter o PR remove registro de novo SW e a UI; versões que já instalaram o worker podem continuar cacheadas até futuras atualizações. Para desativar com segurança, distribuir **um SW de limpeza/retirada** na mesma URL `sw.js`, em vez de apagar o arquivo do servidor e deixar workers órfãos.
- Caches podem ser expulsos pelo navegador; comunicar offline após cache concluído não garante armazenamento permanente ou livre de expurgo. Dados locais também dependem das políticas do navegador.
- Para testar o deploy verdadeiro, abrir <https://paulociano.github.io/mare/> online, aguardar status de offline, desconectar, navegar nos 12 jogos, reconectar, e testar instalação conforme o navegador suportar.
