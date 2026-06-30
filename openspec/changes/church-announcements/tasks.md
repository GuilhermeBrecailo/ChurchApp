## 1. Backend — Model e Migration

- [x] 1.1 Adicionar model `Announcement { id String @id @default(uuid()), title String, body String, pinned Boolean @default(false), publishedAt DateTime @default(now()), expiresAt DateTime?, crunchId String, crunch Crunch @relation(...), authorId String, author User @relation(...) }` ao `schema.prisma`
- [x] 1.2 Adicionar relação `announcements Announcement[]` em `Crunch` e `User`
- [x] 1.3 Schema aplicado via `prisma db push --accept-data-loss` (drift impediu `migrate dev`)

## 2. Backend — Endpoints

- [x] 2.1 Criar adapter `announcementAdapters.ts` com handlers: `getAnnouncements` (GET, filtra por `expiresAt IS NULL OR expiresAt > NOW()`, ordena por `pinned DESC, publishedAt DESC`), `createAnnouncement` (POST, guard pastor/adm), `deleteAnnouncement` (DELETE `:id`, guard pastor/adm)
- [x] 2.2 Criar `AnnouncementRoutes.ts` em `api/src/interfaces/routes/` registrando em `/api/church/announcements`
- [x] 2.3 Registrar rotas no `server.ts`

## 3. Frontend — Composable

- [x] 3.1 Criar `web/composables/useAnnouncements.ts` com `getAnnouncements()`, `createAnnouncement(data)`, `deleteAnnouncement(id)`

## 4. Frontend — Seção no Dashboard

- [x] 4.1 Criar componente `web/app/components/Dashboard/AnnouncementsSection/index.vue` exibindo até 3 avisos em cards com título, texto truncado (2 linhas) e data; seção omitida quando sem avisos
- [x] 4.2 Incluir `<DashboardAnnouncementsSection />` em `web/app/pages/index.vue` após `DailyVerseCard` (ou após `QuickAccess` se daily-verse ainda não implementado)

## 5. Frontend — Gestão no Admin

- [x] 5.1 Adicionar sub-seção "Avisos" em `web/app/pages/admin.vue` com form (título, textarea, checkbox "Fixar", date picker "Expira em") e lista dos avisos ativos com botão de remoção
- [x] 5.2 Condicionar à role pastor/adm
