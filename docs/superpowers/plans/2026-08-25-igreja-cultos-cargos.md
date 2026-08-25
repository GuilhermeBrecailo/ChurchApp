# Igreja, Cultos Manuais e Cargos Granulares Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar uma area Igreja na navegacao, transformar cultos em entidades manuais com foto e separar permissoes de culto nos cargos.

**Architecture:** Mudanca vertical em API e web. O backend estende `ServiceOccurrence` de forma aditiva e preserva compatibilidade com ocorrencias antigas ligadas a `ServiceTime`; o frontend passa a tratar culto manual como fluxo principal.

**Tech Stack:** Fastify, TypeScript, Prisma, Jest, Nuxt 4, Vue 3, Vuetify, Tailwind, lucide-vue-next.

**Spec:** `docs/superpowers/specs/2026-08-25-igreja-cultos-cargos-design.md`

## Global Constraints

- Nao remover `ServiceTime` nesta etapa.
- Foto de culto deve reutilizar `/api/church/uploads/image`.
- Novas permissoes de culto sao `CULT_CREATE`, `CULT_EDIT`, `CULT_DELETE`, `CULT_ATTENDANCE_MANAGE`.
- Nao fazer commit sem pedido explicito do usuario.
- Nao executar reset de banco.

---

### Task 1: Backend contrato de cultos manuais

**Files:**
- Modify: `api/src/domain/permissions.ts`
- Modify: `api/src/infrastructure/database/prisma/schema.prisma`
- Create: `api/src/infrastructure/database/prisma/migrations/20260825150000_manual_cults/migration.sql`
- Modify: `api/src/interfaces/adapters/serviceOccurrenceAdapters.ts`
- Test: `api/tests/serviceOccurrenceAdapters.test.ts`

**Interfaces:**
- Produces: `ServiceOccurrenceAdapters.createManual`, `update`, `remove` through existing REST route class; `ServiceOccurrence` responses include `title`, `time`, `description`, `imageUrl`, `imageKey`.
- Consumes: existing `resolveActiveChurchContext`, `isPrivilegedRole`, Prisma client, existing upload-image endpoint.

- [ ] Add failing Jest tests for manual cult create/update/delete and `CULT_ATTENDANCE_MANAGE`.
- [ ] Extend permission source of truth with cult permissions.
- [ ] Extend Prisma schema and hand-written migration.
- [ ] Update adapter and routes.
- [ ] Run targeted Jest test.

### Task 2: Frontend permissions mirror and Igreja hub

**Files:**
- Modify: `web/composables/usePermissions.ts`
- Modify: `web/app/components/layouts/bottomNavigation/index.vue`
- Create: `web/app/pages/igreja.vue`

**Interfaces:**
- Consumes: permission keys from Task 1.
- Produces: `/igreja` route and nav entry.

- [ ] Add frontend permission module `cultos`.
- [ ] Replace middle nav item with `Igreja` and cross icon.
- [ ] Create `/igreja` with cards for Cultos, Ministerios, Membros/Rol, Conteudo/Avisos when relevant.

### Task 3: Frontend cultos list, create/edit and detail

**Files:**
- Modify: `web/composables/useServiceOccurrences.ts`
- Modify: `web/app/pages/cultos/index.vue`
- Modify: `web/app/pages/cultos/[id].vue`

**Interfaces:**
- Consumes: API contract from Task 1.
- Produces: manual cult creation UI and image-card list/detail.

- [ ] Extend composable with create/update/delete.
- [ ] Redesign `/cultos` as image card list with new cult form.
- [ ] Redesign `/cultos/:id` with photo header, info card, escala CTA and presence management.
- [ ] Ensure actions respect `CULT_CREATE`, `CULT_EDIT`, `CULT_DELETE`, `CULT_ATTENDANCE_MANAGE`.

### Task 4: Verification

**Files:**
- No production edits expected.

- [ ] Run `npm run api:typecheck`.
- [ ] Run `npm run api:test`.
- [ ] Run `npm run web:build`.
- [ ] If `npm run validate` still fails because of tracked/broken `api/node_modules`, report exact blocker.

