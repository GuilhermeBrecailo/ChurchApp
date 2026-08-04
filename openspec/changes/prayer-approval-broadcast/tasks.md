## 1. Backend authorization

- [x] 1.1 In `api/src/interfaces/adapters/prayerAdapters.ts`, swap `this.isPastor(user)` for `this.isManager(user)` in `listPendingPrayerRequests` (line 103), `approvePrayerRequest` (line 154), and `rejectPrayerRequest` (line 169). `isManager` already checks `PASTOR`/`ADMIN`/`SUPER_ADMIN`.
- [x] 1.2 Update the three `DomainError` messages from "Apenas o pastor..." to reflect that admins are included too (e.g. "Apenas pastor ou admin pode ...").

## 2. Congregation notification on approval

- [x] 2.1 Add a `notifyChurch(crunchId, prayer)` helper in `prayerAdapters.ts` (next to `notifyPastors`) that calls `pushNotificationService.sendPublicChurchContent(crunchId, { title, body, url: "/prayer", type: "prayer_request_approved" })`, mirroring the call already made in `announcementAdapters.ts`.
- [x] 2.2 Call `notifyChurch` from `approvePrayerRequest` after the `updateMany` succeeds (`count > 0`), using the request's `title`/`body` fetched via the existing `findUnique` at the end of the method.
- [x] 2.3 Confirm `rejectPrayerRequest` makes no notification call (unchanged).

## 3. Frontend visibility

- [x] 3.1 In `web/app/pages/prayer.vue`, change `v-if="isPastor"` to `v-if="isChurchManager"` on the "Pendentes" tab trigger (line 11) and the corresponding `v-window-item` (line 111).
- [x] 3.2 Change the guard in `loadPendingPrayers()` (line 333, `if (!isPastor.value) return;`) to check `isChurchManager.value` instead, so admins actually fetch the pending list when the tab becomes visible.
- [ ] 3.3 Manually verify in the browser: log in as an `ADMIN` user, confirm the "Pendentes" tab appears, and that approve/reject buttons work end-to-end.

## 5. Admin can promote a member to Pastor (UI gap found during exploration)

- [x] 5.1 In `web/app/pages/admin.vue`, add `role` to `selectedMemberForm`, populate it in `openMemberDetails`/reset in `closeMemberDetails`.
- [x] 5.2 Replace the read-only "Tipo" text in the member-details dialog with a `v-select` (Membro/Pastor), editable only when `canAssignSelectedMemberRole` is true (same gate already used for the "Cargos" chips).
- [x] 5.3 Send `role` in the `updateMember` payload from `handleUpdateMember`, only when `canAssignSelectedMemberRole` is true (backend `updateChurchMember` already accepts and authorizes this — no API change needed).
- [ ] 5.4 Manually verify in the browser: as PASTOR/ADMIN, open a member, change Tipo to Pastor, save, confirm it persists and the member gains pastor-level access.

## 4. Verification

- [x] 4.1 Run `npm run api:typecheck` and `npm run api:lint` from repo root.
- [x] 4.2 Run `npm run api:test` (add/adjust a Jest test under `api/tests` covering: admin can list/approve/reject pending requests; approval triggers `sendPublicChurchContent`; rejection does not).
- [x] 4.3 Run `npm run validate` before considering the change done. — ran the individual steps it composes (typecheck, lint, test, web build) directly; all passed.
