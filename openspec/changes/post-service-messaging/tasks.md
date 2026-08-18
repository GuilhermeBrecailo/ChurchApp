## 1. Database

- [x] 1.1 Add `MessageTemplate`, `MessageRule`, `MessageAudience` (enum), `MessageLogStatus` (enum), `MessageLog` models to `api/src/infrastructure/database/prisma/schema.prisma`, with relations to `Crunch` and `ServiceTime`/`MessageTemplate` as designed
- [x] 1.2 Hand-write the migration SQL under `api/src/infrastructure/database/prisma/migrations/<timestamp>_add_post_service_messaging/migration.sql` (follow the `RosterMember` migration's style — additive only, explicit FKs/indexes)
- [x] 1.3 Apply via `prisma migrate deploy` locally and confirm `npm run api:prisma:generate` picks up the new client types

## 2. WhatsApp send capability

- [x] 2.1 Add `sendText(tenantId, number, text)` to `api/src/infrastructure/whatsapp/WhatsAppServiceClient.ts`, calling `POST /api/v1/message/send-text` with `{session_id: tenantId, number, text}`, same header/auth pattern as `connect`/`isConnected`/`disconnect`

## 3. Backend — templates, rules, send, logs

- [x] 3.1 Create `api/src/interfaces/adapters/messageAdapters.ts` (direct-adapter pattern, mirroring `rosterAdapters.ts`): `getCurrentUser`, `assertCanManageMessages` (reuse `isPrivilegedRole`)
- [x] 3.2 Implement template CRUD methods (`listTemplates`, `createTemplate`, `updateTemplate`, `deleteTemplate`) with zod validation
- [x] 3.3 Implement audience resolution helper: given `crunchId` + audience enum, return matching `RosterMember` rows (VISITOR / MEMBER / ALL = VISITOR+MEMBER, never FORMER) with name + phone
- [x] 3.4 Implement the paced background send function: creates `MessageLog` (status `PROCESSING`), iterates recipients with ~1.5s delay, substitutes `{nome}`, calls `WhatsAppServiceClient.sendText`, updates `successCount`/`failedCount` as it goes, sets `DONE` + `finishedAt` when complete; counts missing-phone recipients as failures without attempting a send
- [x] 3.5 Implement `sendNow(templateId, audience)`: checks `WhatsAppServiceClient.isConnected`, throws `DomainError` if not connected, otherwise kicks off the background send function (not awaited) and returns the created log row immediately
- [x] 3.6 Implement rule CRUD methods (`listRules`, `createRule`, `updateRule`, `deleteRule`) with zod validation, validating the referenced `ServiceTime` belongs to the same church
- [x] 3.7 Implement `listLogs()` (church-scoped, most recent first)
- [x] 3.8 Create `api/src/interfaces/routes/MessageRoutes.ts` wiring `/api/church/messages/templates` (GET/POST, PATCH/DELETE `:id`), `/api/church/messages/rules` (GET/POST, PATCH/DELETE `:id`), `/api/church/messages/logs` (GET), `/api/church/messages/send` (POST)
- [x] 3.9 Register `MessageRoutes` in `api/server.ts`

## 4. Automatic scheduler

- [x] 4.1 Create `api/src/infrastructure/whatsapp/messageRuleScheduler.ts` (or similar): a `setInterval`-based checker (60s tick) that loads active `MessageRule`s with their `ServiceTime`, computes today's target fire time (`serviceTime.time + offsetMinutes`), and fires the send function when `now` crosses that target and `lastFiredAt` isn't within the current week's occurrence
- [x] 4.2 On fire, update the rule's `lastFiredAt` and reuse the same background send path as manual sends (with `ruleId` set on the log)
- [x] 4.3 Start the scheduler once from `api/server.ts` after routes are registered

## 5. Frontend — composable

- [x] 5.1 Create `web/composables/useMessages.ts` following `useRoster.ts`'s pattern: `listTemplates`, `createTemplate`, `updateTemplate`, `deleteTemplate`, `listRules`, `createRule`, `updateRule`, `deleteRule`, `listLogs`, `sendNow` — `authHeaders()` for POST/PATCH with body, `authHeadersNoBody()` for GET/DELETE

## 6. Frontend — Mensagens tab

- [x] 6.1 Add a "Mensagens" tab to `web/app/pages/admin.vue`, next to "Rol", gated on `isChurchWideManager`
- [x] 6.2 Build the **Modelos** section: `.member-card`-style list of templates, create/edit dialog (name + body textarea with a visible hint that `{nome}` gets substituted), delete action
- [x] 6.3 Build the **Enviar agora** section: template select, audience select (Visitantes/Membros/Todos), "Enviar agora" button; show a blocking warning (reusing `useWhatsApp().getWhatsAppStatus()`) when WhatsApp isn't connected
- [x] 6.4 Build the **Regras automáticas** section: `.member-card`-style list of rules, create/edit dialog (ServiceTime select, offset-minutes input, template select, audience select, active toggle), delete action
- [x] 6.5 Build the **Histórico** section: read-only list of `MessageLog` entries (date, template name, audience, success/failure counts), most recent first

## 7. Testing and verification

- [~] 7.1 Local click-through: create a template, send now to a test audience, confirm the roster's test recipients would receive the rendered `{nome}` substitution (verify via microservice logs or a real test WhatsApp number) — **substituted by automated coverage** (`tests/messageAdapters.test.ts`: `{nome}` substitution, audience resolution) since no test church has a connected WhatsApp session locally; a real click-through with a connected number is still pending on the user
- [~] 7.2 Local click-through: create a rule with a near-future offset, confirm the scheduler fires it once and does not double-fire — **substituted by automated coverage** (`tests/messageRuleScheduler.test.ts`: fires at target+offset, skips before target, no double-fire within the week, fires again after a week, skips inactive ServiceTime); live click-through still pending on the user
- [x] 7.3 Confirm history log shows correct counts for both manual and automatic sends, including a recipient with no phone number counted as a failure — covered by `tests/messageAdapters.test.ts` and `tests/messageRuleScheduler.test.ts` (missing-phone-as-failure, mixed success/failure counts, no-op DONE log when disconnected)
- [x] 7.4 Confirm non-privileged users are rejected on every new endpoint — covered by `tests/messageAdapters.test.ts` (`it.each` over all 10 adapter methods with a MEMBRO role)
- [x] 7.5 Run `npm run validate` (lint + typecheck + test + web build) before considering the change ready to deploy — passes clean (474/474 tests, lint, typecheck, web build all green)
