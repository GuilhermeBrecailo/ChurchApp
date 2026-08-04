## 1. Database

- [x] 1.1 Add `status String @default("PENDING")`, `reviewedBy String?`, `reviewedAt DateTime?`, `rejectionReason String?` to `PrayerRequest` in `api/src/infrastructure/database/prisma/schema.prisma`
- [x] 1.2 Run `npm run prisma:migrate` (from `api/`) to generate the migration; hand-edit the generated SQL to add a backfill `UPDATE "PrayerRequest" SET status = 'APPROVED' WHERE status = 'PENDING'` after the `ALTER TABLE`, so pre-existing requests stay visible
- [x] 1.3 Run `npm run api:prisma:generate` to regenerate the Prisma client

## 2. API — moderation logic

- [x] 2.1 In `api/src/interfaces/adapters/prayerAdapters.ts`, add a private `isPastor(user)` helper (`role === "PASTOR"` only, distinct from the existing `isManager`)
- [x] 2.2 Update `createPrayerRequest` to persist `status: "PENDING"` explicitly
- [x] 2.3 Update `listPrayerRequests` to filter `where: { crunchId, status: "APPROVED" }`
- [x] 2.4 Add `listPendingPrayerRequests`: `isPastor` guard, returns `PrayerRequest` rows for `crunchId` with `status: "PENDING"`, newest first, same masked-author shape as `listPrayerRequests`
- [x] 2.5 Add `approvePrayerRequest`: `isPastor` guard, `updateMany`/conditional update with `where: { id, crunchId, status: "PENDING" }` setting `status: "APPROVED"`, `reviewedBy: user.id`, `reviewedAt: new Date()`; throw `DomainError("Pedido já foi revisado")` if the conditional update affects zero rows
- [x] 2.6 Add `rejectPrayerRequest`: same guard/pattern as 2.5, setting `status: "REJECTED"`, `rejectionReason` from `request.body.reason` (optional)

## 3. API — pastor notification

- [x] 3.1 In `createPrayerRequest`, after the DB insert, query active `PASTOR` `ChurchMembership` rows for `user.crunchId` (`select: { userId: true }`)
- [x] 3.2 If the list is non-empty, call `pushNotificationService.sendToUsers(pastorUserIds, { title, body, url: "/prayer?tab=pending", type: "prayer_request_pending" })`; if empty, `console.warn` with the `crunchId`
- [x] 3.3 Import `pushNotificationService` from `../../infrastructure/notifications/PushNotificationService` in `prayerAdapters.ts`

## 4. API — routes

- [x] 4.1 In `api/src/interfaces/routes/PrayerRoutes.ts`, add `GET /api/church/prayer-requests/pending` → `listPendingPrayerRequests`
- [x] 4.2 Add `PATCH /api/church/prayer-requests/:id/approve` → `approvePrayerRequest`
- [x] 4.3 Add `PATCH /api/church/prayer-requests/:id/reject` → `rejectPrayerRequest`

## 5. Web — composable

- [x] 5.1 In `web/composables/usePrayerRequests.ts`, extend `PrayerRequest` type with `status: "PENDING" | "APPROVED" | "REJECTED"` and optional `rejectionReason`
- [x] 5.2 Add `getPendingPrayerRequests(page = 1)` calling `GET /api/church/prayer-requests/pending`
- [x] 5.3 Add `approvePrayerRequest(id)` calling `PATCH /api/church/prayer-requests/:id/approve`
- [x] 5.4 Add `rejectPrayerRequest(id, reason?)` calling `PATCH /api/church/prayer-requests/:id/reject`

## 6. Web — pastor review UI

- [x] 6.1 In `web/app/pages/prayer.vue`, add a tab/segmented control ("Comunidade" / "Pendentes") visible only when `isChurchManager`, following existing tab patterns in the app
- [x] 6.2 Wire the "Pendentes" tab to `getPendingPrayerRequests`, rendering the same card layout with Approve/Reject actions instead of "mark answered"
- [x] 6.3 Reject action opens a small dialog for an optional reason (reuse the `decline-reason-input` dialog pattern), then calls `rejectPrayerRequest`
- [x] 6.4 Approve action calls `approvePrayerRequest` and removes the item from the pending list on success
- [x] 6.5 On mount, read a `tab` query param (`?tab=pending`) and auto-select the "Pendentes" tab so the pastor's notification deep link lands in the right place
- [x] 6.6 Update the empty-state copy on the "Comunidade" tab if needed (no behavior change, just make sure it still makes sense now that new requests don't appear immediately)

## 7. Verification

- [x] 7.1 `npm run api:lint` and `npm run api:typecheck`
- [x] 7.2 `npm run api:test` (add/adjust Jest coverage in `api/tests` for: pending creation, visibility filtering, pastor-only guards, approve/reject state transitions, double-review rejection)
- [ ] 7.3 Manual check via `docker compose up --build`: submit a prayer request as a member, confirm it's absent from the member list, confirm the pastor account receives the in-app notification, approve it, confirm it now appears; repeat for reject and confirm it never appears — **BLOCKED: Docker Desktop's WSL2 engine failed to start in this environment (bootstrap error) even after a fresh launch; needs to be run locally by the user once Docker is healthy**
- [x] 7.4 `npm run validate` before merge
