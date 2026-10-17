# Organização e publicação de assets

## Princípios

- **HTML de origem:** as 13 páginas ficam na raiz para manter URLs públicas existentes.
- **CSS de origem:** camadas específicas por jogo e camadas compartilhadas permanecem separadas enquanto os testes e contratos dependerem delas.
- **CSS publicado:** `scripts/build-site.cjs` lê os `<link rel="stylesheet">` na ordem do HTML, consolida por sequência de camadas, extrai os `@import` para o início, corrige caminhos relativos e produz `_site/styles/mare-<hash>.css`.
- **JavaScript:** mantido em arquivos especializados. Concatená-los sem auditar escopo, ordem de execução e contratos poderia introduzir regressões.
- **Dados e imagens:** preservados pelos manifests, referências reais e checagem de artefato.
- **Histórico:** versões anteriores e decisões antigas pertencem ao Git, não a cópias soltas na raiz. A exclusão do arquivo atual não apaga commits anteriores.
- **Offline:** CSS gerado entra no precache do service worker, cujo hash deriva do conteúdo. Nenhuma alteração automática de versão ou migração destrutiva do armazenamento local.

## Estrutura

```text
.github/workflows/   CI, publicação e manutenção
assets/              marca, ilustrações e cenários
config/              catálogo e arquivos necessários para publicação
data/                bancos de palavras e enigmas
docs/                arquitetura, auditorias e histórico editorial
scripts/             build, validação e geração de dados
tests/               testes de integração e contratos
styles/              gerado dentro de _site/ (não versionado)
*.html               rotas públicas mantidas na raiz
*.css                fontes por contexto; consolidado apenas no build
*.js                 módulos e jogos com ordem explícita
```

## Verificação

```sh
npm run check
```

O comando valida a estrutura, sintaxe, testes, build, referências locais e que cada página publicada usa **um** CSS com fingerprint. A auditoria de comportamento visual, offline e acessibilidade ocorre no workflow de qualidade com Chromium e Playwright.

## Pendências técnicas

Uma eventual reorganização física de JS/CSS de origem depende de atualizar testes, caminhos relativos, registros de cache e referências em documentação em um único incremento verificável. Não eliminar `mare-v2.css`, `mare-3.css` ou camadas de fase por rótulo: versões no nome não provam obsolescência. Para removê-las, medir regras efetivamente utilizadas e equivalência visual, inclusive mobile, teclado, preferências de acessibilidade e offline.
