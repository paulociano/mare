# Ferramentas de desenvolvimento

Não fazem parte do build nem do `npm run check`. Dependem de pacotes que o
projeto não declara, para manter o site sem `npm install`:

```
npm install --no-save postcss postcss-selector-parser playwright-core
```

## Poda de CSS com prova

Usadas em novembro de 2026 para remover CSS sem alterar a aparência.

- `css-prune-dead.cjs <raiz> [--apply]`: remove seletores que exigem uma classe
  ou id que não existe em nenhum HTML nem script do projeto (nem como prefixo
  montado em código).
- `css-prune-shadowed.cjs <raiz> [--apply] [--sample]`: remove declarações
  sobrepostas, em todas as páginas que carregam o arquivo, por uma regra
  posterior com **o mesmo seletor**, mesmo contexto (`@media` etc.) e
  importância igual ou maior. Seletores idênticos têm a mesma especificidade,
  então a ordem decide em qualquer estado da página. Regras em `@layer` ficam
  de fora, e valores que alguns navegadores descartam (`dvh`, `color-mix`,
  prefixos) nunca contam como substitutos.
- `css-compare-computed.cjs <build A> <build B>`: compara o estilo computado de
  todos os elementos (e `::before`/`::after`) entre dois builds, nas 13 rotas,
  em três larguras e com ajuda aberta, texto ampliado, alto contraste e modo
  foco.

O que estas ferramentas **não** resolvem: declarações sobrepostas por seletores
*diferentes* (a maior parte dos `!important`). Decidir se essas são seguras de
remover depende de quais elementos existem em cada estado do jogo, e pede
revisão visual, jogo a jogo.
