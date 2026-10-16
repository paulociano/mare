# Fontes e curadoria lexical do MARÉ

## Referências de consulta

- [VOLP, Academia Brasileira de Letras](https://www.academia.org.br/nossa-lingua/busca-no-vocabulario): referência ortográfica brasileira, especialmente para grafia, acentuação e classes de palavras.
- [Dicionário Priberam da Língua Portuguesa](https://dicionario.priberam.org/): consulta complementar de sentidos, exemplos e variantes do português brasileiro/europeu.
- [Dicionários Infopédia, Porto Editora](https://www.infopedia.pt/dicionarios/pesquisa/dicionario-online): referência complementar para vocabulário e expressões.
- [pythonprobr/palavras](https://github.com/pythonprobr/palavras): fonte histórica do vocabulário normalizado de cinco letras do Recife, sob as atribuições já registradas no README.

As referências acima **não autorizam copiar ou redistribuir integralmente bases de terceiros**. Os novos itens desta mudança foram escritos diretamente como conteúdos de jogo e não são um download integral de nenhuma dessas fontes.

## Regras editoriais

1. Preservar português do Brasil e acentuação na exibição. Quando o jogo exige equivalência sem acentos, fazer normalização apenas na comparação.
2. Não tratar todas as entradas ortográficas como boas respostas jogáveis: priorizar vocabulário comum e pistas que não induzam a ambiguidade.
3. Evitar respostas duplicadas dentro de um banco e frases atribuídas incorretamente a autores conhecidos.
4. Distinguir *vocabulário aceito* de *respostas possíveis* em jogos de adivinhação.
5. Ao ampliar conteúdo, manter as chaves e a política de desafios diários para preservar partidas salvas ou introduzir versionamento explícito quando mudar a seleção.
6. Validar pistas, comprimento, acentos e estados de vitória/derrota no runtime, além do smoke test.

## Escopo implementado neste lote

- Sinais: banco de 15 para 30 frases, sem retirar as frases anteriores.
- Náufrago: 20 para 41 palavras, mantendo os primeiros 20 desafios.
- Pérola: banco de 10 para 17 anagramas.
- Farol: banco de 10 para 15 expressões.
- Recife: já utiliza uma lista normalizada de milhares de palavras de cinco letras.

**Pendente:** curadoria/ampliação individual dos bancos de Abismo, Cardume, Corrente, Concha, Trilha, Enigma e Marujo, com avaliação do formato e regras de cada jogo. Não substituir esses bancos por listas genéricas: cada mecânica exige dados próprios.
