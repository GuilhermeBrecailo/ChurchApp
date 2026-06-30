## Why

A comunicação interna da igreja (avisos de reuniões, eventos especiais, mudanças de horário) acontece fora do app — WhatsApp, email ou verbalmente. Não há registro centralizado, membros perdem informações e a liderança não tem visibilidade de quem recebeu a mensagem.

## What Changes

- Pastor ou administrador pode criar avisos com título, texto e data de expiração opcional em `/admin`.
- Avisos ativos aparecem como seção no dashboard (`/`) de todos os membros da igreja.
- Avisos expirados somem automaticamente do dashboard (filtro por `expiresAt`).
- Aviso pode ser fixado (`pinned: true`) para ficar no topo mesmo após novos avisos.

## Capabilities

### New Capabilities

- `church-announcements`: Criação, armazenamento, exibição e expiração automática de avisos da igreja.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Novo model `Announcement` no schema Prisma; migration; endpoints `GET /api/church/announcements` (membros) e `POST /api/church/announcements` + `DELETE /api/church/announcements/:id` (pastor/adm); adapter e route.
- **Frontend (web)**: Composable `useAnnouncements.ts`; componente `Dashboard/AnnouncementsSection/index.vue`; seção incluída em `pages/index.vue`; form de criação/remoção em `pages/admin.vue`.
- **Banco de dados**: Nova migration com `Announcement { id, title, body, pinned, publishedAt, expiresAt?, crunchId, authorId }`.
