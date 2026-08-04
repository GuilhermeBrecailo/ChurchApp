## Context

`PrayerAdapters` (`api/src/interfaces/adapters/prayerAdapters.ts`) currently has no review concept: `createPrayerRequest` inserts a row and `listPrayerRequests` returns every row for the church, newest first, to any authenticated member — pastor, ministry leader, or ordinary `MEMBRO`. `prayer.vue` renders that single list for everyone, with an `isChurchManager` computed flag (`PASTOR`/`ADMIN`/`SUPER_ADMIN`) that only currently gates the "mark as answered" button.

The notification primitive already exists and is proven: `pushNotificationService.sendToUsers(userIds, payload)` (`api/src/infrastructure/notifications/PushNotificationService.ts`) writes an `AppNotification` row per user and best-effort fires a web-push if the recipient has a `PushSubscription`. `churchDepartmentAdapters.ts` already uses this exact call to notify assigned users; this change reuses it verbatim rather than building a second notification path.

Pastors are identified the same way `userAdapters.ts` and `churchRoleAdapters.ts` already do: `ChurchMembership` rows scoped to `crunchId` with `role: "PASTOR"` and `isActive: true`. A church can have more than one active `PASTOR` membership (see `multi-church-membership`); all of them should be notified and all of them should be able to approve/reject — there's no single "the" pastor at the data level.

## Goals / Non-Goals

**Goals:**
- New `PrayerRequest` rows are not visible to the church's members until a pastor approves them.
- Every active `PASTOR` member of the church gets notified (in-app + push) the moment a request is submitted.
- A pastor can approve or reject a pending request, optionally with a reason on rejection.
- Rejected requests are retrievable for audit (not hard-deleted) but never enter the member-facing list.
- Existing `isAnswered` / "mark as answered" flow is untouched and only applies to already-approved requests.

**Non-Goals:**
- No edit/resubmit flow for rejected requests in this change — the member simply sees it was declined (if we choose to surface that) or, at minimum, it just doesn't appear. Resubmission is a follow-up if requested.
- No configurable per-church toggle to disable moderation — pastor review is mandatory for every church. (If a church wants unmoderated prayer requests later, that's a separate proposal.)
- No change to who can create prayer requests (any authenticated member, as today).
- No change to anonymous-authorship masking — `isAnonymous` behavior is preserved as-is on top of the new status field.

## Decisions

**1. Add a `status` enum field to `PrayerRequest` rather than a separate `PrayerRequestModeration` table.**
The existing model is small (title, body, isAnonymous, isAnswered) and moderation state is 1:1 with the request, not a history of multiple review events. A `status String @default("PENDING")` column (values `PENDING` | `APPROVED` | `REJECTED`, validated at the application layer the same way this codebase already validates other string-as-enum fields, e.g. `ChurchMembership.role`) keeps `listPrayerRequests` a single indexed query instead of a join. Alternative considered: a full `PrayerRequestReview` audit table with reviewer/timestamp/reason — rejected as over-engineering for a single-pastor-decision workflow; `reviewedBy` / `reviewedAt` / `rejectionReason` are added directly to `PrayerRequest` instead, following the `decline-reason-input` precedent (`ScheduleAssignment.declineReason`) of storing the reason inline on the record it applies to.

**2. `listPrayerRequests` filters to `status: "APPROVED"` for everyone, including pastors.**
Pastors get a *separate* endpoint (`GET /api/church/prayer-requests/pending`) for the review queue rather than an `includePending` query flag on the existing endpoint. Keeping the endpoints separate means the member-facing contract never accidentally leaks pending content (no risk of a missing/forgotten query param exposing unapproved requests), and it matches the existing pattern of dedicated manager-only reads elsewhere in the codebase (e.g. `churchDepartmentAdapters` separates member and manager views). The frontend's "Pendentes" tab (pastor-only, driven by the existing `isChurchManager` computed) calls the new endpoint.

**3. Notification fires synchronously inside `createPrayerRequest`, after the DB write, via `pushNotificationService.sendToUsers`.**
Matches how `announcementAdapters.ts` already notifies on publish — no queue/job infra exists in this codebase (`docker-compose.yml` has no worker/queue service), so introducing one for a single notify-N-pastors call would be new infrastructure for no real gain at this scale. `sendToUsers` already degrades gracefully (push is best-effort try/catch per subscription; the `AppNotification` row is unconditional), so a slow/broken push provider doesn't affect the API response. Alternative considered: fire-and-forget the notification (don't `await`) — rejected, `sendToUsers` is already used un-awaited nowhere else in the codebase and awaiting keeps failure visible in logs via the existing `controllerHandler` 500 path if the DB write itself fails; the push-sending inner loop already swallows its own per-subscription errors so this doesn't risk the request failing due to a dead push endpoint.

**4. Approve/reject endpoints are pastor-only, using the same `isManager`-style role check already in `PrayerAdapters`, but narrowed to `PASTOR` only (not `ADMIN`/`SUPER_ADMIN`).**
The proposal's premise is specifically "the pastor authorizes." `ADMIN`/`SUPER_ADMIN` are platform-level roles (per `CLAUDE.md`'s role table) and don't inherently have pastoral authority over a specific church's congregation content. This narrows `isManager` for this one action rather than reusing it as-is — a new private helper `isPastor(user)` checks `role === "PASTOR"` only, called from `listPendingPrayerRequests`, `approvePrayerRequest`, and `rejectPrayerRequest`. `markAsAnswered` keeps using the existing broader `isManager` check, unchanged.

**5. Notification payload routes to `prayer.vue`'s pending tab via the existing `url` field on `AppNotification`.**
`type: "prayer_request_pending"` and `url: "/prayer?tab=pending"` follow the same `{title, body, url, type}` shape every other `sendToUsers` call already sends (e.g. `churchDepartmentAdapters`). `prayer.vue` reads a `tab` query param on mount to auto-select the "Pendentes" tab, consistent with how notification deep-links already work elsewhere (`useNotifications.ts` navigates to `notification.url`).

## Risks / Trade-offs

- **[Risk]** A church with zero active `PASTOR` memberships (data inconsistency, or a pastor who deactivated their own membership) would mean submitted prayer requests get stuck in `PENDING` forever with nobody notified. → **Mitigation**: not blocking for this change (churches are required to have a founding pastor per `userAdapters.ts` onboarding flow), but `createPrayerRequest` logs a warning via `console.warn` if the pastor list resolved empty, so it's visible in server logs rather than silently vanishing.
- **[Risk]** Multiple pastors could approve/reject the same request in a race (double action). → **Mitigation**: `approvePrayerRequest`/`rejectPrayerRequest` guard with `where: { id, crunchId, status: "PENDING" }` on the update — a second action on an already-decided request throws `DomainError("Pedido já foi revisado")` instead of silently double-applying.
- **[Risk]** **BREAKING** change to `listPrayerRequests` response — any existing pending/unapproved requests created before this migration ships would vanish from members' view until reviewed. → **Mitigation**: migration backfills `status: "APPROVED"` for all pre-existing rows (they were already publicly visible under the old behavior, so grandfathering them in as approved preserves current visible state — only newly created requests go through the gate).
- **[Trade-off]** Pastors must act on every single request; there's no bulk-approve. Acceptable for MVP given typical per-church volume implied by existing pagination (`pageSize = 20`).

## Migration Plan

1. Prisma migration: add `status String @default("PENDING")`, `reviewedBy String?`, `reviewedAt DateTime?`, `rejectionReason String?` to `PrayerRequest`; backfill existing rows to `status = 'APPROVED'` in the same migration (SQL `UPDATE` after `ALTER TABLE`, before the default takes effect for new rows).
2. Ship API changes (adapters + routes) — backward compatible at the HTTP layer since it's additive endpoints plus a filter on an existing one.
3. Ship web changes (composable methods, pending tab, notification deep link).
4. No feature flag / rollback beyond a standard revert — the migration's backfill makes the "before" and "after" data states compatible in both directions (rolling back the column is safe since all pre-migration rows are already marked `APPROVED`).

## Open Questions

- Should a rejected request's author be notified of the rejection (and reason)? Not in the original ask ("autoriza ou não aparecer" implies silent non-appearance); left out of scope but flagged here in case the user wants it as a fast-follow.
