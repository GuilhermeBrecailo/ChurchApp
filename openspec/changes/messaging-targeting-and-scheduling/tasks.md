## 1. Database

- [ ] 1.1 Add `notifyTime String @default("08:00")` to `BirthdayMessageSetting` in `api/src/infrastructure/database/prisma/schema.prisma`
- [ ] 1.2 Add `endedAt DateTime?` to `ServiceAttendance` in the same schema file
- [ ] 1.3 Add `MessageLogRecipient` model (`id`, `messageLogId` FK → `MessageLog` `onDelete: Cascade`, `rosterMemberId` FK → `RosterMember` `onDelete: Cascade`, `@@index([messageLogId])`), and add the `SELECTED` value as a documented allowed string for `MessageLog.audience` / `MessageRule` is NOT extended (see design.md's Non-Goals — `SELECTED` is manual-send-only, `MessageRule.audience` keeps its existing 3 values)
- [ ] 1.4 Hand-write the migration SQL under `api/src/infrastructure/database/prisma/migrations/<timestamp>_add_messaging_targeting_and_scheduling/migration.sql` (additive only, following `RosterMember`'s/`post-service-messaging`'s migration style)
- [ ] 1.5 Apply via `prisma migrate deploy` locally and confirm `npm run api:prisma:generate` picks up the new client types

## 2. Backend — selected-recipient sends

- [ ] 2.1 Extend `sendNowSchema` in `api/src/interfaces/adapters/messageAdapters.ts`: add `"SELECTED"` to the audience enum, add optional `recipientIds: z.array(z.string()).optional()`, `.refine()` requiring a non-empty array when `audience === "SELECTED"`
- [ ] 2.2 In `dispatchMessageSend`, branch recipient resolution: for `SELECTED`, look up `RosterMember` rows by `id: { in: recipientIds }` AND `crunchId: params.crunchId` (never trust an ID without the church filter) instead of `statusesForAudience`; reject if any requested ID doesn't resolve to a roster member of the caller's church
- [ ] 2.3 In `createLogAndDispatch`, when building a `SELECTED` log, also create the `MessageLogRecipient` rows for the resolved recipients (one insert per recipient, or a single `createMany`)
- [ ] 2.4 Update `sendNow` on `MessageAdapters` to pass `recipientIds` through from the validated body

## 3. Backend — roster composition report

- [ ] 3.1 Add a `getRosterReport` method (direct-adapter pattern, mirroring existing `rosterAdapters.ts` methods) that runs `$prismaClient.rosterMember.groupBy({ by: ["status"], where: { crunchId, status: { in: ["VISITOR", "MEMBER"] } }, _count: true })` and shapes the result as `{ visitors: number, members: number }`
- [ ] 3.2 Add `GET /api/church/roster/report` in `api/src/interfaces/routes/RosterRoutes.ts`, gated the same way existing roster endpoints are

## 4. Backend — configurable birthday notify time

- [ ] 4.1 Extend the birthday setting update schema/method in `api/src/interfaces/adapters/birthdayAdapters.ts` to accept `notifyTime` (`"HH:MM"` string, validate with a regex matching `ServiceTime.time`'s existing validation if any) alongside the existing `isActive`/`templateId`
- [ ] 4.2 In `api/src/infrastructure/whatsapp/birthdayScheduler.ts`'s `checkBirthdays`, remove the single global `if (now.getHours() < NOTIFY_HOUR) return` early gate; move the equivalent per-church check to inside the per-church loop, after the `setting` upsert, comparing `now`'s `HH:MM` against `setting.notifyTime` (parse the same way `messageRuleScheduler.ts`'s `computeTargetFireTime` parses `ServiceTime.time`)
- [ ] 4.3 Keep the existing `lastNotifiedAt`-based same-day dedupe exactly as is — it composes with the new time check unchanged

## 5. Backend — manual service end trigger

- [ ] 5.1 Add a method to record `endedAt` for today's `ServiceAttendance` row (in whichever adapter currently owns "Registrar presença" — check `api/src/interfaces/adapters/attendanceAdapters.ts` if it exists, else the adapter that handles `ServiceAttendance`), upserting on `@@unique([serviceTimeId, date])` with today's date, setting `endedAt: new Date()` and leaving `visitorCount`/`memberCount` untouched if the row already exists, defaulting them to `0` if creating fresh
- [ ] 5.2 Add the corresponding route (e.g. `POST /api/church/attendance/:serviceTimeId/finalize` or extend the existing attendance route) — same privilege gate as "Registrar presença"
- [ ] 5.3 In `api/src/infrastructure/whatsapp/messageRuleScheduler.ts`'s `computeTargetFireTime` (or its caller `checkRules`), before falling back to `serviceTime.time + offsetMinutes`, query today's `ServiceAttendance` for `{ serviceTimeId: rule.serviceTimeId, date: <today> }`; if found and `endedAt` is set, use `endedAt + offsetMinutes` as the target fire time instead

## 6. Frontend — composables

- [ ] 6.1 `web/composables/useMessages.ts`: extend `MessageAudience` type to include `"SELECTED"`, extend `sendNow`'s signature to accept an optional `recipientIds: string[]`
- [ ] 6.2 `web/composables/useRoster.ts`: confirm `listRosterMembers` already returns everything the recipient picker needs (name, id, status, phone) — no new endpoint expected here, reuse as-is
- [ ] 6.3 New composable method (or extend `useRoster.ts`) `getRosterReport(): Promise<ApiResponse<{ visitors: number; members: number }>>` calling `GET /api/church/roster/report`
- [ ] 6.4 `web/composables/useBirthdays.ts`: extend `BirthdayMessageSetting`/`BirthdaySettingFormDTO` interfaces with `notifyTime: string`
- [ ] 6.5 `web/composables/useAttendance.ts` (or wherever `ServiceAttendance` calls live): add a `finalizeService(serviceTimeId: string)` call and extend the attendance type with `endedAt: string | null`

## 7. Frontend — Enviar agora recipient picker

- [ ] 7.1 In `web/app/pages/admin/mensagens.vue`'s "Enviar agora" section, add a 4th `audienceOptions` entry ("Selecionar pessoas") that reveals a roster multi-select (reuse the `.member-card`/checkbox pattern from `pessoas.vue`'s Rol tab) when chosen
- [ ] 7.2 Wire selection state to `handleSendNow`, passing `recipientIds` when `audience === "SELECTED"`; disable the send button when that mode is active and zero recipients are selected (client-side mirror of the server's `.refine()`)

## 8. Frontend — roster composition report

- [ ] 8.1 In `web/app/pages/admin/relatorios.vue`, add two `AdminStatCard` tiles (or a small card, matching the page's existing KPI grid pattern) showing visitor/member counts from `getRosterReport()`, loaded alongside the page's other KPIs in `onMounted`

## 9. Frontend — birthday notify time

- [ ] 9.1 In `web/app/pages/admin/mensagens.vue`'s Aniversariantes tab, add a time input next to the existing "Envio automático" switch, bound to `birthdaySetting.notifyTime`, saving via the extended `updateBirthdaySetting` call
- [ ] 9.2 Default the input to `"08:00"` when a church has no setting yet, matching the backend default

## 10. Frontend — finalizar culto

- [ ] 10.1 In `web/app/pages/admin/relatorios.vue`, add a "Finalizar culto" button next to "Registrar presença" for each `ServiceTime`, calling `finalizeService(serviceTimeId)`
- [ ] 10.2 Show the recorded `endedAt` time (formatted) next to the button once set, so a pastor can see the tap registered

## 11. Testing and verification

- [ ] 11.1 `api/tests/messageAdapters.test.ts`: `SELECTED` audience resolves exactly the given roster member IDs, rejects an ID from another church, rejects an empty list, counts a phone-less selected recipient as a failure same as bucket audiences
- [ ] 11.2 New/extended test for the roster report `groupBy` — correct counts, `FORMER` excluded, church-scoped
- [ ] 11.3 `api/tests/birthdayScheduler.test.ts`: extend to cover a church-specific `notifyTime` (fires at the configured time, not before; a church with no setting still fires at 8am; two churches with different times both fire correctly at their own time on the same tick)
- [ ] 11.4 New/extended test for the attendance finalize endpoint: first tap creates the row with `endedAt` set, second same-day tap overwrites it, headcount fields untouched
- [ ] 11.5 `api/tests/messageRuleScheduler.test.ts`: extend to cover firing off a recorded `endedAt` instead of the scheduled time when present, and falling back to scheduled-time behavior when absent (regression-check the existing scenarios still pass unchanged)
- [ ] 11.6 Run `npm run validate` (lint + typecheck + test + web build) before considering the change ready to deploy
- [ ] 11.7 Manual click-through with a connected WhatsApp session (per this session's established pattern): send to a hand-picked selection, confirm the roster report numbers match reality, set a custom birthday notify time and confirm the push/WhatsApp fires at that time, tap "Finalizar culto" and confirm an active rule on that service fires relative to the recorded time
