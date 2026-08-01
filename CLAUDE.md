# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AppChurch (`api/` + `web/`) — fullstack MVP for church/ministry management (members, ministries, service schedules "escalas", devotionals, prayer requests, announcements). Backend: Fastify + Prisma + PostgreSQL + Keycloak. Frontend: Nuxt 4 + Vue 3 + Vuetify + Tailwind. Local dev via Docker Compose (`docker-compose.yml`).

## Commands

Run from repo root unless noted.

```bash
npm run api:dev              # start API (tsx watch, api/server.ts)
npm run web:dev              # start web (nuxt dev)
npm run api:lint             # eslint api/
npm run api:typecheck        # prisma generate + tsc --noEmit
npm run api:test             # jest --runInBand (api/tests)
npm run api:prisma:generate  # regenerate Prisma client
npm run web:build            # nuxt build
npm run validate             # lint + typecheck + test + web build (pre-merge gate)
```

Single test (from `api/`): `npx jest tests/crunch.test.ts` or `npx jest -t "test name"`.

Docker: `docker compose up --build` starts web (3000), API (8000), Keycloak (8080), app Postgres (5433). First boot runs Prisma migrations + client generation automatically inside the API container. Keycloak realm/client (`clientA`) must be configured manually per README — auth will fail until that's done.

Prisma (from `api/`, schema at `src/infrastructure/database/prisma/schema.prisma`, also aliased via root `package.json` `prisma.schema`):
```bash
npm run prisma:migrate   # dev migration
npm run prisma:deploy    # apply migrations (used by Docker entrypoint)
npm run prisma:studio
npm run prisma:reset
```

Web has no lint/test script configured — don't assume `npm run web:lint`/`web:test` exist.

## Architecture

### API layering (`api/src/`)

`domain/` (entities, value objects, `DomainError`/`DomainToken`) → `application/use-cases` + `application/Services` → `infrastructure/repositories` (Prisma) → `interfaces/` (routes → adapters → controller handler).

Two coexisting patterns exist in the same codebase — match whichever the file you're editing already uses, don't silently convert one into the other:
- **Full clean-architecture path** (older core domain: `Crunch`/Church, `User`, `Department`): route → `*Adapters` class → `*UseCase`/`*Service` → `Repository` → domain entity (`Entity.create(...)`) with validated value objects (`Address`, `Document`).
- **Direct-adapter path** (most newer features: devotionals, prayer, announcements, daily verse, reports): route → `*Adapters` class that calls `$prismaClient` directly, no intermediate use-case/repository layer.

Routes are registered in `api/server.ts`, one file per resource under `interfaces/routes/`, each wired to a `*Adapters` class in `interfaces/adapters/`. All routes are wrapped in `controllerHandler` (`interfaces/controllers/Handler.ts`), which has a non-standard error contract:
- Success → `200 { data, status: 200 }`
- `DomainError` → **HTTP 200** with `{ error, status: 409 }` in the body (not a 409 status code)
- `DomainToken` → HTTP 403
- `ZodError` → HTTP 200 with `{ error, status: 409 }`
- anything else → HTTP 500, logged via `console.error`

Frontend code must check the body `status`/`error` field, not just the HTTP status, when calling most endpoints.

"Crunch" is the internal codename for "Church" (entity `Crunch`, field `crunchId`, `CrunchRoutes`, `useChurch.ts` etc. all refer to the church/tenant) — it's not a typo to fix, it's used consistently across DB schema, API, and frontend.

### Multi-tenancy / auth

`interfaces/plugins/TenantHandler.ts` is a global Fastify `preHandler` hook (registered before all routes in `server.ts`) that validates the JWT (`JwtValidationUseCase`), resolves the caller's active church via `resolveActiveChurchContext` (`interfaces/utils/churchContext.ts`), and attaches `request.user` + `request.churchContext` (including `tenant_id`/`role`). Routes/adapters read tenant scoping off `request.churchContext` — every Prisma query for tenant data should filter by `crunchId: user.crunchId`. Route paths starting with `/public` or listed in `publicRoutes` inside `TenantHandler.ts` skip auth entirely (used for the public church landing page and pastor signup/login).

Roles: `SUPER_ADMIN`/`ADMIN` (platform), `PASTOR` (owns a church), ministry `LIDER`/delegated manager, `MEMBRO`. A user can belong to multiple churches (`memberships`) with one marked active/primary — see `openspec/changes/multi-church-membership`.

### Frontend (`web/`)

Nuxt 4 app-dir layout: `app/pages` (file-based routing, includes public `app/pages/c/[slug]` landing pages that bypass auth), `app/components` (grouped by domain: `Admin`, `Ministery`, `Music`, `Scale`, `Public`, etc.), `app/middleware/auth.global.ts` (global route guard — handles SSR vs client auth differently, redirects to `/login`, `/onboarding`, or forces `/user` when `mustChangePassword` is set), root-level `composables/` (one `use<Domain>.ts` per API resource, e.g. `useAuth.ts`, `useChurch.ts`, `usePrayerRequests.ts` — these are the only place that should call the API). `composables` is added to Nuxt's auto-import dirs in `nuxt.config.ts`, so components consume them without explicit imports.

Auth flow: Keycloak login → API issues access token (in-memory `useState`) + refresh token (httpOnly cookie) → `useAuth.ts` handles session/refresh/`fetchMe`. New users created by a pastor get `mustChangePassword: true` and are forced to `/user` until they reset it.

### Uploads

PDF uploads (`POST /api/church/departments/:id/uploads/pdf`) are stored on local disk under `api/uploads/` and served from `/uploads/...` in dev (see `server.ts` `fastifyStatic` registration). The DB never stores the binary — only `url`/`key`/mime/size in a `MediaItem`'s `metadata`. Swapping to S3/R2/MinIO for production should preserve this same metadata contract.

## Spec workflow (OpenSpec)

This repo uses `openspec/` + the `opsx` slash commands (`.claude/commands/opsx/`, backed by skills in `.claude/skills/openspec-*`) for planned changes: `/opsx:propose` (create proposal/design/tasks), `/opsx:apply` (implement), `/opsx:archive`, `/opsx:sync`, `/opsx:explore`. Existing/past changes live in `openspec/changes/`; use them as precedent for scope and structure before starting new feature work of similar size.
