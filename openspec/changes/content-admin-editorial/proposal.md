## Why

As telas de cadastro de conteúdo (aba Conteúdo do admin) usavam a paleta padrão do Vuetify (roxo, fundo branco), destoando da página pública recém-redesenhada. O pastor pediu que o cadastro tivesse a mesma cara da página pública, sem perder a paleta. Esta é a Fase 3: dar às telas de cadastro o tratamento editorial da landing.

## What Changes

- A aba **Conteúdo** do admin (versículo/palavra, avisos, devocionais, publicações) adota o visual editorial da página pública: fundo "papel" creme, títulos em Fraunces, cartões com borda fina e o realce na **cor da igreja** (accentColor) no lugar do roxo do Vuetify.
- O realce (botões, campos em foco, chips, ícones dos cartões) passa a usar a cor escolhida pela igreja, deixando o cadastro coerente com o que o visitante vê.
- Mudança puramente visual e escopada à aba Conteúdo — sem alterar comportamento, dados ou as outras abas do admin.

## Capabilities

### New Capabilities

- `content-admin-editorial`: Tratamento visual editorial (papel + cor da igreja + Fraunces) da aba de cadastro de conteúdo do admin.

### Modified Capabilities

<!-- Nenhuma spec arquivada em openspec/specs; nada a modificar em nível de spec. -->

## Impact

- **Frontend (web)**: `admin.vue` ganha um `churchAccent` (cor da igreja) e um wrapper `.editorial-surface` na seção da aba Conteúdo, com CSS scoped usando `:deep` para reestilizar cartões, cabeçalhos e o realce (Vuetify roxo → cor da igreja), com suporte a dark mode. Ícones dos cartões passam a usar a cor da igreja.
- **Backend**: nenhuma mudança.
