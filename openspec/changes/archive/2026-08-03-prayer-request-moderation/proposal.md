## Why

Today any `PrayerRequest` a member submits (`PrayerAdapters.createPrayerRequest`) is immediately visible to the whole church via `listPrayerRequests` — there is no review step. A pastor has no way to catch inappropriate, sensitive, or misdirected prayer requests before the congregation sees them. The pastor also isn't notified that a new request exists, so moderation today would require actively polling the list. This change adds a pastor approval gate: new requests start hidden, the church's pastor(s) get notified (in-app + push, reusing the existing `pushNotificationService`), and the request only becomes visible to the church once a pastor authorizes it. Rejected requests never appear.

## What Changes

- `PrayerRequest` gains a moderation status (pending / approved / rejected) instead of being visible as soon as it's created. **BREAKING**: `listPrayerRequests` (member-facing) now excludes pending/rejected requests by default — previously it returned every request in the church regardless of review state.
- `createPrayerRequest` now creates the request in `PENDING` status and, on success, notifies every `PASTOR`-role member of the church via `pushNotificationService.sendToUsers` (in-app `AppNotification` + web push), the same mechanism `announcementAdapters` and `churchDepartmentAdapters` already use.
- New pastor-only endpoints to review pending requests: list pending requests for the church, approve a request, reject a request (with an optional reason, following the existing `decline-reason-input` UX precedent used elsewhere in the app).
- `listPrayerRequests` (existing member-facing endpoint) is scoped to `APPROVED` requests only; pastors additionally get a separate "pending" view/tab so review doesn't require a different screen paradigm than moderation-adjacent features already in the app.
- Web: `usePrayerRequests.ts` gains `getPendingPrayerRequests`, `approvePrayerRequest`, `rejectPrayerRequest`; `prayer.vue` gets a pastor-only "Pendentes" tab with approve/reject actions; tapping the notification routes the pastor straight to that tab (`url` field on the `AppNotification`, same pattern as other notification types).

## Capabilities

### New Capabilities
- `prayer-request-moderation`: pastor review workflow for prayer requests — pending/approved/rejected status, pastor notification on submission, approve/reject actions, visibility gating for the member-facing list.

### Modified Capabilities
(none — prayer requests have no existing `openspec/specs/` capability entry to modify; this proposal introduces the capability fresh)

## Impact

- **API**: `api/src/interfaces/adapters/prayerAdapters.ts`, `api/src/interfaces/routes/PrayerRoutes.ts`.
- **DB**: `PrayerRequest` model in `api/src/infrastructure/database/prisma/schema.prisma` (new `status` field + migration), replacing/extending the implicit "always visible" behavior.
- **Notifications**: reuses `api/src/infrastructure/notifications/PushNotificationService.ts` (`sendToUsers`), no changes needed there.
- **Web**: `web/composables/usePrayerRequests.ts`, `web/app/pages/prayer.vue`.
- **No changes** to auth, tenancy, or other domains — the church's pastors are resolved via the existing `ChurchMembership` (`role: "PASTOR"`) records for the requester's `crunchId`.
