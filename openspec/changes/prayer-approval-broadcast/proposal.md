## Why

The prayer request moderation workflow (`openspec/specs/prayer-request-moderation`) only lets a user with `role: PASTOR` see and act on the pending queue, even though `ADMIN`/`SUPER_ADMIN` already manage every other church-wide content type (announcements, church appearance, members). Churches that delegate day-to-day moderation to an admin currently have no way to review prayer requests. Separately, approving a request only flips its visibility in `GET /api/church/prayer-requests` — the congregation has no signal that a new prayer request is now visible, unlike announcements, which push a notification to every member the moment they're published.

Additionally, `PATCH /api/church/members/:id` (`updateChurchMember`) already accepts a `role` field and is already authorized for `PASTOR`/`ADMIN`/`SUPER_ADMIN` on the backend, but `web/app/pages/admin.vue`'s member-details dialog never exposed a control for it — the "Tipo" field was read-only text, so there was no in-app way for a church admin/pastor to promote a member to `PASTOR` (only the platform-level `SUPER_ADMIN` "manage any church" screen could). This change adds that missing control.

## What Changes

- Backend: `GET /api/church/prayer-requests/pending`, `PATCH .../:id/approve`, and `PATCH .../:id/reject` accept `PASTOR`, `ADMIN`, and `SUPER_ADMIN`, not just `PASTOR` (same authorization set already used by `announcementAdapters.ts`).
- Backend: approving a request now calls `pushNotificationService.sendPublicChurchContent(crunchId, ...)` (the same primitive `announcementAdapters.ts` uses) to notify every active member of the church, with `type: "prayer_request_approved"` deep-linking to `/prayer`.
- Frontend (`web/app/pages/prayer.vue`): the "Pendentes" tab and its approve/reject actions become visible under `isChurchManager` (already computed in the file as `PASTOR/ADMIN/SUPER_ADMIN`) instead of `isPastor`.
- No change to rejection behavior — rejected requests still stay permanently hidden and unnotified.
- Frontend (`web/app/pages/admin.vue`): the member-details dialog's "Tipo" field becomes an editable Membro/Pastor `v-select` (gated by the existing `canAssignSelectedMemberRole` computed) instead of static text, and `handleUpdateMember` now sends `role` to `PATCH /api/church/members/:id` when the caller is allowed to change it.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `prayer-request-moderation`: pending/approve/reject authorization widens from `PASTOR`-only to `PASTOR`/`ADMIN`/`SUPER_ADMIN`; approval gains a new "notify the congregation" side effect.

## Impact

- `api/src/interfaces/adapters/prayerAdapters.ts` — authorization checks on pending/approve/reject; new `notifyChurch` call in the approve path alongside existing `notifyPastors`.
- `api/src/infrastructure/notifications/PushNotificationService.ts` — reused as-is (`sendPublicChurchContent`), no changes expected.
- `web/app/pages/prayer.vue` — tab/action visibility condition (`isPastor` → `isChurchManager`).
- `web/composables/usePrayerRequests.ts` — no signature changes expected; endpoints already generic.
- `web/app/pages/admin.vue` — member-details dialog gains an editable role select (`selectedMemberForm.role`, `memberRoleOptions`), wired into the existing `updateMember` call. No backend change needed — `userAdapters.ts#updateChurchMember` already supported this.
