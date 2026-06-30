## Why

O dashboard do app é quase inteiramente operacional (escalas, eventos). Pastores e líderes não têm canal direto dentro do app para compartilhar conteúdo espiritual com os membros. Comunicados bíblicos são feitos via WhatsApp, fora do contexto da plataforma, sem registro ou alcance garantido.

## What Changes

- Pastor ou administrador pode publicar um versículo com referência bíblica e comentário opcional pelo painel `/admin`.
- O versículo mais recente aparece como card no dashboard (`/`) de todos os membros da igreja.
- O card também é acessível em `/content/verse` com histórico dos versículos anteriores.
- Apenas um versículo é considerado "do dia" por vez — o publicado mais recentemente.

## Capabilities

### New Capabilities

- `daily-verse`: Criação, armazenamento e exibição do versículo do dia com referência e comentário.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Novo model `DailyVerse` no schema Prisma; migration; endpoints `GET /api/church/daily-verse` (membros) e `POST /api/church/daily-verse` (pastor/adm); adapter e route seguindo padrão do projeto.
- **Frontend (web)**: Composable `useDailyVerse.ts`; componente `Dashboard/DailyVerseCard/index.vue`; card incluído em `pages/index.vue`; form de publicação na seção de conteúdo de `pages/admin.vue`; página `/content/verse` com histórico.
- **Banco de dados**: Nova migration com `DailyVerse { id, text, reference, commentary?, publishedAt, crunchId, authorId }`.
