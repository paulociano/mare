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
