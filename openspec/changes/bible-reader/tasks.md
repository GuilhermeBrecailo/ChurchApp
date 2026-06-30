## 1. Frontend — Composable useBible

- [x] 1.1 Criado `web/composables/useBible.ts` com:
  - Constante `BIBLE_VERSIONS` com ACF, NVI, ARA, KJV
  - Constante `BIBLE_BOOKS` com 66 livros em português mapeados para slug em inglês
  - `ref` para `selectedVersion`, `selectedBookIndex`, `selectedChapter`, `verses`, `loading`, `error`
  - Função `fetchChapter()` chamando `https://bible-api.com/{book}+{chapter}?translation={version}` via `$fetch`
  - Persistência em `localStorage` via `restoreState()` e `saveState()` chamado após fetch bem-sucedido

## 2. Frontend — Página /content/bible

- [x] 2.1 Criado `web/app/pages/content/bible.vue` com layout:
  - Header com título "Leitura Bíblica" e botão voltar
  - Grid de seletores: versão, livro (cascata de bookIndex), capítulo
  - Referência atual exibida com chip da versão
  - Área de versículos com `<sup>` numerado e texto
  - Estado de loading via `v-skeleton-loader` e de erro via `v-alert` com retry
  - Botões "Anterior" e "Próximo capítulo" navegando entre livros automaticamente
- [x] 2.2 `restoreState()` chamado ao montar; `fetchChapter` disparado nas mudanças via `@update:model-value`
- [x] 2.3 Estilo de leitura: `font-size: 1rem`, `line-height: 1.85`, `max-width: 680px`
