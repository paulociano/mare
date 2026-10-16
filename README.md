# MARÉ 🌊

Jogo de adivinhação de palavras em português com identidade visual inspirada no fundo do mar.

## Como jogar

Abra o arquivo [index.html](./index.html) no navegador. Tente descobrir a palavra de cinco letras em até seis tentativas. As cores indicam letras corretas, letras presentes em outra posição e letras ausentes.

## Recursos

- Layout responsivo para desktop e celular
- Teclado virtual e teclado físico
- Desafio diário e estatísticas salvas no navegador
- Interface submarina com animações e efeitos de profundidade
- Arquivo HTML autônomo, sem compilação

## Executar localmente

Basta abrir `index.html`. Para servir via HTTP:

```bash
python -m http.server 8000
```

Acesse http://localhost:8000.

## Publicação

O projeto é compatível com hospedagem estática e GitHub Pages. É necessário habilitar o Pages nas configurações do repositório caso deseje uma URL pública.

## Observações

Projeto inspirado na mecânica de jogos de palavras de cinco letras, com identidade visual própria. O vocabulário e a experiência podem ser ampliados em versões futuras.

## Dicionário de palavras

O jogo inclui **8.611 formas únicas de cinco letras** extraídas e normalizadas de [pythonprobr/palavras](https://github.com/pythonprobr/palavras), que distribui uma base PT-BR derivada do corretor ortográfico LibreOffice sob licença **MPL-2.0**. Os acentos são removidos e o vocabulário é convertido para maiúsculas para combinar com o teclado do jogo. As palavras também são incorporadas ao `index.html` para funcionamento offline. O arquivo `palavras-ptbr-5.txt` preserva o conjunto filtrado.

**Cobertura:** trata-se de um léxico amplo, não literalmente todas as palavras existentes do português brasileiro. Flexões raras, neologismos, regionalismos e expressões podem estar ausentes. A lista de soluções diárias permanece curada e separada das palavras aceitas como palpite.

## Modos de jogo

| Modo | Palavras simultâneas | Tentativas compartilhadas | URL |
|---|---:|---:|---|
| Clássico | 1 | 6 | `?modo=solo` |
| Dueto | 2 | 7 | `?modo=duo` |
| Quarteto | 4 | 9 | `?modo=quartet` |

Cada palpite aparece nos tabuleiros ainda não resolvidos; todas as soluções precisam ser encontradas dentro do limite do modo. Respostas diárias determinísticas e diferentes por modo; progresso e estatísticas independentes no armazenamento local.

Os arquivos `modos.js` e `modos.css` adicionam estes modos sobre a interface existente. Para jogar localmente, sirva o diretório por HTTP, por exemplo com `python -m http.server 8000`, permitindo o carregamento de ambos os arquivos.

## Abismo (modo inspirado em Abismo)

Acesse `abismo.html` ou use o cartão na página principal. Digite palavras de qualquer tamanho e veja um indicador **aproximado** de proximidade semântica com o segredo. O jogo oferece dicas, persistência local e sucessivas partidas sem limite de palpites por rodada.

**Limitação transparente:** esta primeira edição usa 42 conjuntos temáticos de associações curadas, com posições heurísticas. Não consulta o Abismo original, não calcula embeddings ou distâncias semânticas de um modelo de IA, e após 12 expedições os conjuntos se repetem. Não equivale ao vocabulário ou ranqueamento completo do Abismo. Arquivos: `abismo.html`, `abismo.css`, `abismo.js`.

### Metodologia REA e motor semântico

A referência [morluto/rea](https://github.com/morluto/rea) é um utilitário MIT de investigação de sites/aplicativos, **não** um clone nem fonte do algoritmo Abismo. O MARÉ utiliza uma implementação própria: 42 temas e grafo de associações; palavras relacionadas pelo banco são classificadas antes das desconhecidas. Sem embeddings treinados, corpus amplo e ranking integral, resultados não são comparáveis aos do Abismo. Não foram executadas ferramentas REA MCP ou capturas de rede do site original nesta etapa.

## Rankings por embeddings (pipeline experimental)

O workflow [Gerar rankings semânticos](.github/workflows/semantic-ranks.yml) instala `sentence-transformers`, usa `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` e calcula similaridades vetoriais entre palavras do léxico do MARÉ. O resultado é `data/semantic-ranks.json`, gerado na infraestrutura do GitHub e publicado como arquivo estático pelo Pages. Assim, os dispositivos não precisam baixar o modelo.

**Ativação condicionada:** até o workflow gerar e confirmar o arquivo, o Abismo utiliza o grafo de associações curadas. O processo pode falhar por limites de rede, tempo ou dependências; a presença do código não comprova que o ranking vetorial já esteja publicado.

O vocabulário é limitado às palavras dos desafios mais o arquivo `palavras-ptbr-5.txt`; termos fora dele continuam recebendo pontuação heurística distante. Embeddings são aproximações de significado, não rankings originais do Abismo. A seleção de 42 soluções também continua limitada e cíclica. Para reproduzir uma experiência com cobertura comparável, ainda seria necessário expandir e revisar o léxico e testar empiricamente a qualidade das associações.

## Cardume

Novo jogo em `cardume.html`, de agrupamento de palavras: escolha quatro palavras relacionadas entre 16, encontre quatro categorias, com quatro erros possíveis, aviso de quase acerto, embaralhamento, compartilhamento e salvamento local. Há um desafio diário determinado pela data de Brasília e partidas extras. O conjunto inicial reúne **12 tabuleiros originais e curados** em `data/cardume-puzzles.json`. Depois desse conjunto, os desafios se repetem. Não reproduz os puzzles, a marca nem os dados do Cardume.

O workflow do GitHub Pages inclui `cardume.html`, `cardume.css`, `cardume.js` e os dados JSON. Os smoke tests verificam a integridade de 16 palavras exclusivas em cada puzzle.

## Corrente

O modo [Corrente](corrente.html) desafia o jogador a encontrar uma palavra de comprimento desconhecido, entre 3 e 10 letras. Cada palpite apresenta letras existentes e conexões entre pares consecutivos de letras, com tentativas ilimitadas, dica inicial, salvamento local e modalidades diária e livre. A lista de soluções foi selecionada para essa primeira versão; é um conjunto limitado que se repete.

O catálogo público do MARÉ usa somente os nomes próprios **Clássico**, **Dueto**, **Quarteto**, **Abismo**, **Cardume** e **Corrente**. Os arquivos publicados seguem os mesmos nomes, sem redirecionamentos antigos.

## Catálogo e Recife

A página inicial (`index.html`) apresenta o catálogo MARÉ. O jogo de cinco letras chama-se **Recife**, acessível em `recife.html`, com três modos: Clássico, Dueto e Quarteto. Abismo, Cardume e Corrente permanecem em suas próprias páginas. O CSS compartilhado `mare-system.css` consolida a identidade do catálogo e os ajustes do Recife; `hub.js` identifica uma expedição local para facilitar a retomada. URLs antigas de `letras.html` não são mais publicadas.

## Concha e fundo oceânico atualizado

O jogo **Concha** (`concha.html`) utiliza sete letras, uma central obrigatória, palavras de quatro ou mais letras, repetições permitidas, pontuação e bônus para palavra que use as sete letras. Conta com desafio diário, partidas livres e salvamento local. A versão inicial usa o léxico de cinco letras do projeto complementado por palavras curadas e palavras-semente, por isso não cobre todo o idioma.

O fundo vetorial `assets/ocean-depth.svg` foi atualizado com **submarino, feixes de luz e corais**, inspirados na direção visual aprovada. A arte raster gerada anteriormente não foi copiada para o GitHub nesta execução; esta entrega usa uma interpretação vetorial, compartilhada entre as telas, e preserva legibilidade com overlays.

## Fundos exclusivos WebP

O design system define `assets/backgrounds/{recife,abismo,cardume,corrente,concha}.webp` com overlay escuro e fundo vetorial SVG de reserva. O workflow de Pages publica os WebP quando estão presentes no repositório. **Os cinco WebP precisam ser enviados à pasta indicada**; enquanto não estiverem versionados no GitHub, a interface mantém somente o fundo vetorial. O pacote foi gerado nesta conversa para instalação.

## Trilha

**Trilha** (`trilha.html`) é um desafio autoral de conectar letras em um tabuleiro 4×4, descobrindo uma palavra por pista temática. Os movimentos são exclusivamente horizontais ou verticais, entre casas vizinhas, sem repetir casas; a primeira casa pode ser qualquer uma. Inclui cronômetro, tentativas ilimitadas, desafio diário por data de Brasília, jogo livre, dica da primeira letra, salvamento local e compartilhamento do resultado. O lançamento tem 16 pistas/soluções, que se repetem; não utiliza conteúdo de terceiros.

## Enigma

O jogo **Enigma** (`enigma.html`) oferece palavras cruzadas em uma grade 9×9, com pistas horizontais e verticais, seleção de casas, escrita por teclado, navegação por pistas, cronômetro, dicas de letra, salvamento local e desafios diários/livres. Os desafios originais são gerados a partir de seis conjuntos temáticos; a distribuição automática pode descartar palavras que não couberem nos cruzamentos. A base atual é reduzida e os desafios se repetem.
