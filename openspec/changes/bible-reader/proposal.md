## Why

Membros que querem acompanhar a leitura bíblica durante o culto ou no dia a dia precisam sair do app para abrir o YouVersion ou outro leitor. O AppQuadrangular já tem uma aba "Conteúdo" — integrar a Bíblia mantém o usuário no contexto do app e agrega valor espiritual diário sem custo de backend próprio.

## What Changes

- Nova página `/content/bible` com seletor de versão (ACF, NVI, ARA, NTLH), navegador de livros e capítulos.
- A leitura consome a API pública `bible-api.com` (sem autenticação, gratuita para uso pessoal).
- O último livro/capítulo lido é salvo em `localStorage` para continuar de onde parou.
- Versão selecionada também persiste em `localStorage`.

## Capabilities

### New Capabilities

- `bible-reader`: Leitura bíblica com seleção de versão e navegação por livro e capítulo, consumindo API externa.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Nenhum — toda a leitura é via API externa (bible-api.com). Sem model, sem migration, sem endpoint próprio.
- **Frontend (web)**: Composable `useBible.ts` encapsulando as chamadas à API externa; página `pages/content/bible.vue` com seletor de versão (`v-select`), seletor de livro, seletor de capítulo e renderização dos versículos; persistência em `localStorage`.
- **Banco de dados**: Sem migration.
