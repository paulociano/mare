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

## Abismo Semântico (modo inspirado em Contexto)

Acesse `contexto.html` ou use o cartão na página principal. Digite palavras de qualquer tamanho e veja um indicador **aproximado** de proximidade semântica com o segredo. O jogo oferece dicas, persistência local e sucessivas partidas sem limite de palpites por rodada.

**Limitação transparente:** esta primeira edição usa 42 conjuntos temáticos de associações curadas, com posições heurísticas. Não consulta o Contexto original, não calcula embeddings ou distâncias semânticas de um modelo de IA, e após 12 expedições os conjuntos se repetem. Não equivale ao vocabulário ou ranqueamento completo do Contexto. Arquivos: `contexto.html`, `contexto.css`, `contexto.js`.

### Metodologia REA e motor semântico

A referência [morluto/rea](https://github.com/morluto/rea) é um utilitário MIT de investigação de sites/aplicativos, **não** um clone nem fonte do algoritmo Contexto. O MARÉ utiliza uma implementação própria: 42 temas e grafo de associações; palavras relacionadas pelo banco são classificadas antes das desconhecidas. Sem embeddings treinados, corpus amplo e ranking integral, resultados não são comparáveis aos do Contexto. Não foram executadas ferramentas REA MCP ou capturas de rede do site original nesta etapa.

## Rankings por embeddings (pipeline experimental)

O workflow [Gerar rankings semânticos](.github/workflows/semantic-ranks.yml) instala `sentence-transformers`, usa `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` e calcula similaridades vetoriais entre palavras do léxico do MARÉ. O resultado é `data/semantic-ranks.json`, gerado na infraestrutura do GitHub e publicado como arquivo estático pelo Pages. Assim, os dispositivos não precisam baixar o modelo.

**Ativação condicionada:** até o workflow gerar e confirmar o arquivo, o Abismo Semântico utiliza o grafo de associações curadas. O processo pode falhar por limites de rede, tempo ou dependências; a presença do código não comprova que o ranking vetorial já esteja publicado.

O vocabulário é limitado às palavras dos desafios mais o arquivo `palavras-ptbr-5.txt`; termos fora dele continuam recebendo pontuação heurística distante. Embeddings são aproximações de significado, não rankings originais do Contexto. A seleção de 42 soluções também continua limitada e cíclica. Para reproduzir uma experiência com cobertura comparável, ainda seria necessário expandir e revisar o léxico e testar empiricamente a qualidade das associações.
