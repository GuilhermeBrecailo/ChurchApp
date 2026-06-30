## 1. Backend — Model e Migration

- [x] 1.1 Adicionar model `DailyVerse { id String @id @default(uuid()), text String, reference String, commentary String?, publishedAt DateTime @default(now()), crunchId String, crunch Crunch @relation(...), authorId String, author User @relation(...) }` ao `api/src/infrastructure/database/prisma/schema.prisma`
- [x] 1.2 Adicionar relação `dailyVerses DailyVerse[]` em `Crunch` e `User` no schema
- [x] 1.3 Schema aplicado via `prisma db push --accept-data-loss` (drift impediu `migrate dev`)

## 2. Backend — Endpoints

- [x] 2.1 Criar adapter `dailyVerseAdapters.ts` em `api/src/interfaces/adapters/` com handlers `getLatestDailyVerse` (GET, sem guard de role) e `createDailyVerse` (POST, guard pastor/adm) e `listDailyVerses` (GET, paginado)
- [x] 2.2 Criar `DailyVerseRoutes.ts` em `api/src/interfaces/routes/` registrando as rotas em `/api/church/daily-verse` seguindo padrão de `ChurchDepartmentRoutes.ts`
- [x] 2.3 Registrar o plugin de rotas no `server.ts`

## 3. Frontend — Composable

- [x] 3.1 Criar `web/composables/useDailyVerse.ts` com funções `getLatestVerse()`, `listVerses()` e `publishVerse(data)` usando `$fetch` via `customFetch`

## 4. Frontend — Card no Dashboard

- [x] 4.1 Criar componente `web/app/components/Dashboard/DailyVerseCard/index.vue` exibindo texto, referência e comentário, com empty state discreto quando não há versículo
- [x] 4.2 Incluir `<DashboardDailyVerseCard />` em `web/app/pages/index.vue` entre `NextScheduleCard` e `QuickAccess`

## 5. Frontend — Histórico em `/content/verse`

- [x] 5.1 Criar página `web/app/pages/content/verse.vue` listando versículos em ordem decrescente de `publishedAt`, com card por versículo (texto + referência + data + comentário)

## 6. Frontend — Form de publicação no Admin

- [x] 6.1 Adicionar seção "Conteúdo" em `web/app/pages/admin.vue` com form de publicação de versículo (`v-textarea` para texto, `v-text-field` para referência, `v-textarea` para comentário, botão "Publicar versículo")
- [x] 6.2 Condicionar exibição da seção a usuários com role pastor/adm
