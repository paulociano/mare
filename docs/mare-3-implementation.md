# MARÉ 3.0 — Implementação inicial (2026-10-16)

## Objetivo
Aplicar o estudo `docs/estudo-redesign-mare-3.md` com foco em jogar antes de ler/rolar, identidade contemporânea e preservação de regras.

## Entregue
- `mare-3.css`: tokens de design e uma camada de componentes compartilhada para as nove páginas.
- Home: cards mais compactos e diferenciados cromaticamente por jogo, sem banner; quatro colunas no desktop, três no tablet amplo, duas em mobile e uma em telas muito estreitas.
- Home: seção e link Continuar ocultos sem progresso; exibidos de forma condicional pelo `hub.js`.
- Jogos: cabeçalhos compactos, painéis menos decorados e tabuleiros proeminentes.
- Retiradas sombras e ornamentos redundantes de superfícies relevantes; foco visível e respeito a movimento reduzido.
- Regras, chaves de armazenamento, JavaScript específico dos jogos e URLs preservados.

## Motivo para manter CSS legado temporariamente
Os jogos dependem de nomes de classes e estados próprios. O novo arquivo fica por último na cascata, isolando a implementação inicial. A remoção dos arquivos legados deve ser incremental, após inspeção visual/QA, para não eliminar estilos funcionais usados pelo JS.

## Verificação desta etapa
PASS — nove páginas referenciam `mare-3.css`; oito cartões presentes; banner removido; jogo mantém IDs principais; função de resume por progresso; chaves de CSS equilibradas.
UNKNOWN — render real em navegador, mobile/desktop, performance e contraste calculado, teclado/leitor de tela, vitória/retomada ponta a ponta.

## Próximas fatias
1. Capturas comparativas com Chrome/Firefox a 320/390/768/1440 e zoom 200%.
2. Separar CSS/JS embutido do Recife com teste de regressão do tabuleiro.
3. Migrar modo, HUD, painéis e botões para componentes reutilizáveis sem classes duplicadas.
4. Testar partidas completas e remover CSS obsoleto depois que a equivalência visual/funcional estiver comprovada.
