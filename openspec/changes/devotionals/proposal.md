## Why

Além do versículo do dia, igrejas produzem conteúdo espiritual estruturado: estudos bíblicos, séries temáticas, reflexões semanais. Atualmente não há onde publicar esse tipo de conteúdo dentro do app. Pastores e líderes precisam de um canal para compartilhar séries com capítulos, mantendo os membros engajados entre os cultos.

## What Changes

- Pastor ou administrador pode criar devocionais com título, descrição e capítulos em `/admin`.
- Cada devocional tem múltiplos capítulos com título, texto e referência bíblica opcional.
- Membros acessam a lista de devocionais em `/content/devotionals` e leem os capítulos sequencialmente.
- O progresso de leitura (último capítulo lido) é salvo por usuário no banco.

## Capabilities

### New Capabilities

- `devotionals`: Criação e leitura de devocionais com múltiplos capítulos, progresso individual por membro.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Models `Devotional { id, title, description, publishedAt, crunchId, authorId }` e `DevotionalChapter { id, title, content, bibleRef?, order, devotionalId }` e `DevotionalProgress { userId, devotionalId, lastChapterId, updatedAt }`; migration; endpoints CRUD para devocionais (admin) e leitura (membros); adapter e route.
- **Frontend (web)**: Composable `useDevotionals.ts`; página `pages/content/devotionals.vue` com lista de séries; página `pages/content/devotionals/[id].vue` com lista de capítulos e leitor; form de criação em `pages/admin.vue`.
- **Banco de dados**: Nova migration com os três models acima.
