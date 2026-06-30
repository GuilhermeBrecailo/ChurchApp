## 1. Backend — Models e Migration

- [x] 1.1 Adicionar ao `schema.prisma`:
  ```
  model Devotional {
    id          String   @id @default(uuid())
    title       String
    description String?
    publishedAt DateTime @default(now())
    crunchId    String
    crunch      Crunch   @relation(...)
    authorId    String
    author      User     @relation(...)
    chapters    DevotionalChapter[]
    progresses  DevotionalProgress[]
  }
  model DevotionalChapter {
    id          String @id @default(uuid())
    title       String
    content     String
    bibleRef    String?
    order       Int
    devotionalId String
    devotional   Devotional @relation(...)
    progresses   DevotionalProgress[]
  }
  model DevotionalProgress {
    id              String   @id @default(uuid())
    updatedAt       DateTime @updatedAt
    userId          String
    user            User     @relation(...)
    devotionalId    String
    devotional      Devotional @relation(...)
    lastChapterId   String
    lastChapter     DevotionalChapter @relation(...)
    @@unique([userId, devotionalId])
  }
  ```
- [x] 1.2 Adicionar relações `devotionals Devotional[]` e `devotionalProgresses DevotionalProgress[]` em `Crunch` e `User`
- [x] 1.3 Schema aplicado via `prisma db push --accept-data-loss` (drift impediu `migrate dev`)

## 2. Backend — Endpoints

- [x] 2.1 Criar adapter `devotionalAdapters.ts` com handlers:
  - `listDevotionals` (GET `/api/church/devotionals`): retorna lista com `_count: { chapters: true }` e progresso do usuário autenticado
  - `getDevotional` (GET `/api/church/devotionals/:id`): retorna devocional com capítulos ordenados por `order` e progresso do usuário
  - `createDevotional` (POST, guard pastor/adm): cria devocional com capítulos em transação
  - `deleteDevotional` (DELETE `:id`, guard pastor/adm)
  - `updateProgress` (PATCH `/api/church/devotionals/:id/progress`): upsert de `DevotionalProgress`
- [x] 2.2 Criar `DevotionalRoutes.ts` e registrar rotas
- [x] 2.3 Registrar no `server.ts`

## 3. Frontend — Composable

- [x] 3.1 Criar `web/composables/useDevotionals.ts` com `listDevotionals()`, `getDevotional(id)`, `updateProgress(devotionalId, chapterId)`, `createDevotional(data)`

## 4. Frontend — Página de Lista

- [x] 4.1 Criar `web/app/pages/content/devotionals.vue` com grade de cards (título, descrição, N capítulos, progresso visual via `v-progress-linear`)
- [x] 4.2 Empty state com `Heart` icon quando não há devocionais publicados

## 5. Frontend — Página de Leitura

- [x] 5.1 Criar `web/app/pages/content/devotionals/[id].vue` com:
  - Header com título do devocional e subtítulo (descrição)
  - Lista de capítulos em sidebar/tabs com ícone de check no último lido
  - Área de conteúdo com título do capítulo, referência bíblica (se houver) e texto
  - Botões "Capítulo anterior" / "Próximo capítulo"
- [x] 5.2 Chamar `updateProgress()` ao abrir cada capítulo

## 6. Frontend — Gestão no Admin

- [x] 6.1 Adicionar sub-seção "Devocionais" em `web/app/pages/admin.vue` com form de criação (título, descrição, lista de capítulos dinâmica com `v-btn` "Adicionar capítulo") e lista dos devocionais com botão de remoção
- [x] 6.2 Condicionar à role pastor/adm
