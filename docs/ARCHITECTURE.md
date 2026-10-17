# Arquitetura e organização do MARÉ

## Princípio
O site é estático, servido pelo GitHub Pages, sem roteador ou framework. **As 13 páginas HTML permanecem na raiz** para preservar URLs públicas e caminhos relativos. Não mover arquivos CSS/JS de jogos sem atualizar referências e testes na mesma alteração.

## Pastas
- `_site/styles/`: bundles CSS gerados por página, não versionados; preservam a ordem da cascata e usam hash de conteúdo. Consulte [pipeline de assets](ASSET-PIPELINE.md).
- `assets/brand/`: logotipos e favicon do MARÉ.
- `assets/backgrounds/`: ilustrações SVG/WebP dos jogos.
- `config/site-manifest.json`: fonte única da lista de páginas e arquivos obrigatórios para build.
- `data/`: bancos de puzzles e rankings.
- `docs/`: arquitetura, histórico de decisões e roadmap.
- `scripts/`: verificações de estrutura e empacotamento.
- `tests/`: testes estáticos e de comportamento simulado.
- `.github/workflows/`: validação de PR e deploy do GitHub Pages.

## Convenções de código
1. Preservar nomes de arquivos públicos e chaves de `localStorage` para não quebrar jogos em andamento.
2. Preferir módulos e funções com responsabilidades claras. Compartilhar regras **apenas quando houver duplicação real**, evitando abstrações sem uso.
3. Usar `const` por padrão; validar entradas e estados carregados; tratar falhas de armazenamento sem impedir o jogo.
4. Escapar conteúdo dinâmico e preferir `textContent` em vez de HTML gerado por string.
5. Manter acessibilidade (teclado, foco, estados ARIA) e movimento reduzido.
6. Alterar a camada de estilos compartilhada com cuidado: as folhas legadas permanecem até migração incremental e testes visuais.
7. Consolidar CSS na saída de publicação, mantendo as camadas-fonte separadas enquanto houver dependências e testes; alterar camadas requer regressão de navegador.
8. Não versionar artefatos gerados (`_site/`), dependências locais ou logs.

## Comandos
Requer Node.js 20+; não exige `npm install`.

- `npm test`: smoke + simulações dos jogos.
- `npm run build`: monta `_site/` com as dependências necessárias.
- `npm run check`: verifica estrutura, testa e gera o site.

## Gates de mudança
- Checagem estrutural e sintaxe antes de aprovar PR.
- Build completo, preservando as 13 rotas e os cenários.
- Para alterações de interface ou partidas, confirmar em navegador os estados relevantes.
- Antes de declarar deploy concluído, verificar o resultado real do GitHub Actions/Pages.

## Migração futura
Extrair gradualmente o JavaScript embutido de `recife.html` e reduzir o número de folhas CSS de sobreposição **em PRs separados**, com regressões e baseline visual. Não executar reorganização massiva de caminhos em uma única mudança.

## Recife: código extraído do HTML

O jogo Recife carrega `recife.js` antes de `modos.js`, mantendo a ordem original de inicialização e as mesmas chaves locais. `recife.html` define a interface, `recife.js` mantém as regras de jogo e eventos existentes, e `modos.js` adiciona os modos. A extração não modifica lógica, mas permite testar sintaxe separadamente e remover o JavaScript embutido da página.

Qualquer mudança futura nos modos deve manter esta ordem até que as dependências entre os scripts sejam eliminadas por refatoração acompanhada de testes funcionais em navegador.

## Dívida técnica ainda relevante

O histórico de auditorias pontuais foi removido por estar desatualizado. Permanecem como hipóteses e pendências para revisão antes de novas alterações:
- Verificar a coexistência entre o controlador de Recife em `recife.js` e os patches em `modos.js` antes de consolidá-los.
- Avaliar a duplicação do dicionário de Recife em `recife.js` e `palavras-ptbr-5.txt` e definir geração a partir de uma fonte única.
- Revisar consistência do desafio diário entre fusos horários e curadoria lexicográfica.
- Validar navegação real em desktop/mobile, leitor de tela, performance e GitHub Actions. Testes estáticos não substituem essas verificações.

Estas são **pendências**, não falhas reproduzidas nesta atualização. Git mantém o histórico dos relatórios antigos para consulta retrospectiva.

## Gates adicionais de código-fonte

`scripts/check-sources.cjs` confere os 13 documentos públicos e valida, sem dependências externas, sintaxe dos scripts `.js`, estilos referenciados sem duplicações, ordem da camada `mare-brand.css`, caminhos locais de imagens e estilos, e os cenários finais de Náufrago/Sinais. Ele roda no PR, no deploy e no comando `npm run check`.

As três folhas históricas `mare-system.css`, `mare-v2.css` e `mare-3.css` ainda são carregadas em cascata. Não movê-las nem eliminar seletores potencialmente usados sem baseline visual e inspeção de cada jogo. Próximo critério de conclusão: testes em navegador de layouts responsivos, tabuleiros e persistência, mais confirmação do workflow Pages. A checagem estática acrescentada é preventiva, não comprova equivalência visual.

O pacote final também é verificado por `scripts/check-build.cjs`, executado depois de `scripts/build-site.cjs`: confere as 13 páginas, navegação HTML e assets essenciais dentro de `_site/`. Isso evita o falso positivo em que fontes estão presentes no repositório, mas não são incluídas na publicação.
