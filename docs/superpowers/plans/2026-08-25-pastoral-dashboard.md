# Pastoral Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pastor/admin dashboard with weekly pastoral overview, absent-member alerts, service summaries, and pastoral visit management.

**Architecture:** Add a focused `PastoralAdapters` API surface that aggregates existing church data and owns the new pastoral visit table. The frontend consumes this through `usePastoral` and renders role-specific dashboard sections, while the visit CRUD has its own `/pastoral/visitas` page.

**Tech Stack:** Fastify, TypeScript, Prisma, Jest, Nuxt 4, Vue 3, Vuetify, Tailwind, lucide-vue-next.

**Spec:** In-chat approved design from 2026-08-25: pastor/admin dashboard, absence detection from nominal cult attendance, service summaries, pastoral visits, role-specific home.

## Global Constraints

- Do not commit; the user commits manually.
- Do not run destructive database reset commands.
- Keep the MVP based on existing attendance data where possible.
- New pastoral visit data must be scoped by `crunchId`.
- Pastor/admin always have access; church role permission should allow delegation.

---

### Task 1: Pastoral API Contract

**Files:**
- Modify: `api/src/domain/permissions.ts`
- Modify: `web/composables/usePermissions.ts`
- Modify: `api/src/infrastructure/database/prisma/schema.prisma`
- Create: `api/src/infrastructure/database/prisma/migrations/20260825170000_pastoral_visits/migration.sql`

**Interfaces:**
- Produces permission `PASTORAL_CARE_MANAGE`.
- Produces Prisma model `PastoralVisit`.

- [ ] Add `PASTORAL_CARE_MANAGE` as a church permission.
- [ ] Add `PastoralVisit` with member, reason, priority, responsible, scheduled date, completed date, status, notes, and indexes.
- [ ] Generate a migration that only creates the table and indexes.

### Task 2: Pastoral Backend

**Files:**
- Create: `api/src/interfaces/adapters/pastoralAdapters.ts`
- Create: `api/src/interfaces/routes/PastoralRoutes.ts`
- Modify: `api/server.ts` or route registry file.
- Test: `api/tests/pastoralAdapters.test.ts`

**Interfaces:**
- Produces `GET /api/church/pastoral/dashboard`.
- Produces `GET /api/church/pastoral/visits`.
- Produces `POST /api/church/pastoral/visits`.
- Produces `PATCH /api/church/pastoral/visits/:id`.
- Produces `DELETE /api/church/pastoral/visits/:id`.

- [ ] Write tests for dashboard aggregation.
- [ ] Write tests for absence alerts from `ServiceOccurrenceAttendee`.
- [ ] Write tests for visit CRUD authorization and church scoping.
- [ ] Implement minimal adapter methods using existing `resolveActiveChurchContext`.
- [ ] Register routes.

### Task 3: Frontend Integration

**Files:**
- Create: `web/composables/usePastoral.ts`
- Create: `web/app/pages/pastoral/visitas.vue`
- Modify: `web/app/pages/index.vue`
- Modify: relevant navigation if a route list exists.

**Interfaces:**
- Consumes API endpoints from Task 2.
- Produces role-specific pastor dashboard cards and pastoral visits UI.

- [ ] Add typed composable for dashboard and visits.
- [ ] Add pastor/admin section to home dashboard.
- [ ] Add visits page with list/create/edit/complete/delete.
- [ ] Keep member dashboard path unchanged.

### Task 4: Verification

**Files:**
- No new files expected.

- [ ] Run `npm run api:typecheck`.
- [ ] Run `npm run api:test -- --runInBand tests/pastoralAdapters.test.ts`.
- [ ] Run `npm run api:test -- --runInBand`.
- [ ] Run `npm run web:build`.
- [ ] Run `npm run validate` if the local dependency state allows it.
