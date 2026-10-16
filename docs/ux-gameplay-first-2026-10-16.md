# MARÉ · Estudo UI/frontend: gameplay-first (2026-10-16)

## Tese
Em um portal de minijogos, a primeira decisão é escolher o jogo; dentro de cada jogo, a ação dominante é interagir com o tabuleiro/formulário. O layout anterior reservava altura excessiva a hero editorial, chamadas de expedição e textos instrucionais repetidos, atrasando o primeiro palpite.

## Diagnóstico por jornada
| Jornada | Padrão encontrado | Resposta |
|---|---|---|
| Hub | Hero alto, duas introduções, rodapé e seção decorativa | Reduzir hero, cabeçalho de catálogo e cartões; eliminar seção de sobre sem conteúdo |
| Recife | Painel lateral e respiros deslocavam tabuleiro em desktop | Comprimir sidebar e espaçamentos mantendo dicas e teclado |
| Abismo/Corrente | Títulos enormes e explicações antes da entrada | Uma frase útil, espaços menores, foco no formulário |
| Cardume | Cabeçalho e margens dispersavam a grade de 16 palavras | Cartas mais próximas do título e ações |
| Concha | Texto editorial e bloco de pontuação abaixo da lista | Preservar regras no modal, destacar roda e resultados |
| Trilha | Pistas e texto de instrução competem com grade | Concentrar orientação em uma frase e preservar dica |
| Enigma/Marujo | Introdução duplicava instruções do modal | Acesso mais rápido à grade e controles |

## Alterações
- Copy concisa nas páginas, sem eliminar estados, rótulos, avisos dinâmicos, modais ou botões de jogo.
- `mare-v2.css`: compactação progressiva de hero, seções, tabuleiros e ações com regras mobile.
- Preservação dos oito links do catálogo e das IDs funcionais usadas pelo JavaScript.

## Quality gates desta intervenção
- PASS (estático): CSS com chaves equilibradas; nove páginas continuam vinculadas ao estilo compartilhado; sete jogos com IDs de jogabilidade preservadas; catálogo preserva oito destinos.
- UNKNOWN: screenshots e visual em 320/390/768/1440px, zoom 200%, testes de teclado/leitores de tela, Web Vitals e regressão em navegador.
- O CSS existente ainda contém camadas históricas redundantes; a deduplicação exige QA visual para minimizar regressões.

## Critério de aceite final
Tabuleiro ou campo principal visível rapidamente no viewport sem perder informações operacionais de estado, acessibilidade ou interação. Validar screenshots e fluxo real antes de declarar pronto para produção certificada.
