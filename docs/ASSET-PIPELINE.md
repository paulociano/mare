# Pipeline de assets e unificação de CSS

## Princípios

- **Fontes:** `src/scripts/games`, `src/scripts/shared`, `src/styles/games` e `src/styles/shared`.
- **HTML:** 13 documentos na raiz para preservar rotas de usuários e links existentes.
- **CSS de autoria:** módulos CSS pequenos por responsabilidade, mantidos separados para revisão e testes.
- **CSS de produção:** um único stylesheet com hash de conteúdo por página, gerado em `_site/styles/mare-<hash>.css`. Sequências iguais de estilos produzem o mesmo bundle. A ordem declarada nos HTMLs permanece.
- **CSS-fonte não é republicado:** o build descarta folhas originais após gerar os bundles. A única exceção é `src/styles/shared/mare-diagnostics.css`, carregado dinamicamente.
- **JavaScript:** preserva o carregamento e os escopos explícitos dos arquivos por página, sem concatenação insegura de scripts com `defer` ou estados globais.
- **Cache:** o manifest da PWA usa hash dos arquivos gerados; não altera saves ou forçadamente recarrega partidas.
- **Dados, imagens e dicionários:** conservados conforme o manifesto e as referências dos jogos.

## Estrutura

```text
src/
  scripts/
    games/        # 12 jogos e modos
    shared/       # módulos transversais
  styles/
    games/        # CSS específico de tabuleiros e jogos
    shared/       # identidade, camadas e componentes
_site/            # gerado, não versionado
  styles/mare-<hash>.css
```

## Reescrita de URLs

Quando os CSS-fontes estão em `src/styles/shared`, um asset referenciado como `../../../assets/brand/...` é normalizado pelo bundler para `../assets/brand/...` dentro de `_site/styles`. Imports remotos de fontes são preservados no topo do CSS final. Não criar caminhos absolutos específicos de domínio, para manter o GitHub Pages funcional em subdiretórios.

## Quality gates

```bash
npm run check
```

Além do CI com Chromium, o `check-build.cjs` valida presença do bundle, camadas centrais, URLs internas, imagens CSS e service worker. O `check-sources.cjs` rejeita folhas órfãs, incluindo a exceção de CSS carregado dinamicamente. O CI deve proteger o inventário completo de 13 páginas/12 jogos e a política de atualização do cache offline.

## Política de versionamento

Git é a fonte de versões de código; não manter cópias `v2`, `v3` de páginas ou relatórios por precaução. Se um arquivo nomeado `mare-v2` ainda estiver referenciado, ele é uma camada ativa, não um backup. Remover apenas com cobertura de referência e regressão visual, nunca por nomenclatura.
