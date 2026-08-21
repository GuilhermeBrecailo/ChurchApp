## Why

`post-service-messaging` (shipped in a prior change) only lets a pastor message a whole status bucket (visitors / members / everyone) and only fires automatic rules off a fixed clock offset from a service's *scheduled* start time, notifying birthdays at a hardcoded 8am for every church. In practice a pastor sometimes wants to reach specific people (not a whole bucket), wants to know at a glance how big the roster actually is, wants birthday pings at a time that fits their own routine, and runs services that don't start/end exactly on schedule — so a fixed offset from the scheduled time is often wrong. This change closes those four gaps without touching the messaging infrastructure (templates, send loop, `WhatsAppServiceClient`) that's already working and was just hardened this session (phone number normalization).

## What Changes

- Add a **selected-recipients** send mode: pick individual visitors and/or members from the roster (not just a status bucket) and send a manual message to exactly that list.
- Add a **roster composition report**: a read-only count of active roster members by status (visitors vs. members) for the church, visible in the existing Relatórios page.
- Add a **configurable birthday notification time**: replace the hardcoded 8am check with a per-church time (`HH:MM`), alongside the existing on/off toggle, editable from the Aniversariantes tab.
- Add a **manual "finalizar culto" trigger**: a button that records the real end time of today's occurrence of a `ServiceTime`. When present, an active `MessageRule` for that service fires `offsetMinutes` after the *recorded* end time instead of the *scheduled* time, for that day only.

## Capabilities

### New Capabilities
- `selected-recipient-messaging`: manual WhatsApp send to an explicitly chosen set of roster members (mixing visitors and members), as an alternative to the existing status-bucket audiences.
- `roster-composition-report`: read-only, church-scoped count of roster members by status, surfaced in the admin Relatórios page.
- `manual-service-end-trigger`: recording the actual end time of today's occurrence of a `ServiceTime`, and using it (when present) as the base time `MessageRule`s fire from instead of the scheduled time.

### Modified Capabilities
- `post-service-messaging`: **(unsynced — see design.md's Open Questions)** the "Manual send to a chosen audience" requirement gains a `SELECTED` audience option backed by explicit recipient IDs; the "Recurring automatic message rules" requirement gains an actual-end-time override to `computeTargetFireTime`, when `manual-service-end-trigger` has recorded one for today; birthday notifications move from a hardcoded 8am to a per-church configurable time.

## Impact

- **Database**: `RosterMember` counts already exist (no new table for the report — it's a `groupBy` query). `BirthdayMessageSetting` gains a `notifyTime` column. `ServiceAttendance` gains an `endedAt` column (see design.md's Decisions for why this table rather than a new one). `MessageLog`/`MessageRule`'s `audience` string gains a `SELECTED` value plus a new join table (or JSON column — decided in design.md) for the explicit recipient list on `SELECTED` sends.
- **API**: `messageAdapters.ts` — extend `sendNowSchema` + `dispatchMessageSend`'s recipient resolution for `SELECTED`; new `GET /api/church/roster/report` (or extend an existing roster endpoint) for the composition counts; `birthdayAdapters.ts` — extend the setting update endpoint with `notifyTime`; `attendanceAdapters.ts` (or wherever `ServiceAttendance` is written) — new/extended endpoint to stamp `endedAt` for today's occurrence; `messageRuleScheduler.ts`'s `computeTargetFireTime` gains the actual-end-time branch; `birthdayScheduler.ts`'s `checkBirthdays` moves its `NOTIFY_HOUR` gate from a single global constant to a per-church comparison inside the existing per-church loop.
- **Frontend**: `web/app/pages/admin/mensagens.vue` — a recipient multi-select in the Enviar agora tab (reusing `useRoster().listRosterMembers`), a time input next to the existing Aniversariantes toggle; `web/app/pages/admin/relatorios.vue` — two new `AdminStatCard` tiles (or a small card) for the roster composition counts; wherever "Registrar presença" already lives (also `relatorios.vue`, per this session's `ServiceAttendance` work) — a "Finalizar culto" action alongside it. `web/composables/useMessages.ts`, `useBirthdays.ts`, `useAttendance.ts` gain the corresponding client calls/types.
- **No changes** to `WhatsAppServiceClient`, message templates, the send/pacing loop, or existing status-bucket audiences (`VISITOR`/`MEMBER`/`ALL` keep working exactly as today) — this is additive on top of all of it.
