# MARÉ 2.0 — repaginação visual

## Objetivo
Substituir o tratamento visual fragmentado por uma identidade coerente de jogos de palavras, mantendo os oito jogos, suas URLs, regras e persistência.

## Direção de arte
- Oceanic editorial premium: azul abissal, verde-mar, luz pálida e ouro suave.
- Tipografia: Outfit em títulos, DM Sans nas interfaces.
- Catálogo com cards assimétricos, cantos orgânicos, áreas clicáveis explícitas e foco visível.
- Game UI com superfícies de maior profundidade, bordas e estados controlados; responsividade prioritária em 320–390px.
- Animações pequenas e respeitando prefers-reduced-motion.

## Escopo desta implementação
- Novo arquivo `mare-v2.css` sobre a base CSS atual, carregado pelas nove páginas do projeto.
- Catálogo, hero, cartões, ações de navegação, cards e botões das experiências, grades de Trilha e Enigma.
- Sem alterações nas regras dos jogos, JavaScript, dados salvos ou estrutura do DOM.

## QA
- PASS: verificações estáticas da presença de link para `mare-v2.css` nas nove páginas.
- UNKNOWN: screenshots reais pós-publicação, navegação por teclado, overflow a 320px, contrastes WCAG, fluxo completo dos oito jogos e performance.
- Requer teste em Chromium e celular antes de classificação READY_VERIFIED.

## Evolução posterior
Reestruturar markup e templates de cada jogo para desacoplar CSS legado, criar tokens por jogo, ilustrar cards com arte licenciada, validar estados de vitória e feedback, medir LCP/CLS/INP e remover CSS redundante quando o novo visual estiver estabilizado.

## Design board
Higgsfield Canvas: https://higgsfield.ai/canvas/12fbf380-fec4-4e71-a2fa-82f548e805f7
