## Context

`prayerAdapters.ts` already has a working `notifyPastors(crunchId, prayer)` helper that targets only active `PASTOR` memberships via `pushNotificationService.sendToUsers(...)`. `announcementAdapters.ts` already solves "notify everyone" the same way churches expect, via `pushNotificationService.sendPublicChurchContent(crunchId, payload)`, which fans out to every active `ChurchMembership` plus anonymous public subscriptions. Authorization for pending/approve/reject currently checks `request.churchContext.role !== "PASTOR"` (or equivalent) instead of the church-manager set (`PASTOR`/`ADMIN`/`SUPER_ADMIN`) already used elsewhere (e.g. announcements creation).

## Goals / Non-Goals

**Goals:**
- Let `ADMIN` and `SUPER_ADMIN` do everything a `PASTOR` currently can in the prayer moderation flow (list pending, approve, reject).
- Notify every active member of the church when a request transitions to `APPROVED`, reusing `sendPublicChurchContent`.

**Non-Goals:**
- No new roles, permissions model, or `ChurchRole` changes — this only widens an existing hardcoded role check to match the set `announcementAdapters.ts` already uses.
- No change to rejection: rejected requests stay silent and permanently hidden, per current spec.
- No change to member-facing submission flow or to `notifyPastors` (still fires on submission, unchanged).

## Decisions

- **Reuse `sendPublicChurchContent` as-is** rather than writing a bespoke "notify church" helper — it already does exactly this (query active memberships + push), and `announcementAdapters.ts` proves the pattern in production. Calling it from `approvePrayerRequest` keeps prayer requests consistent with how the rest of the app broadcasts new public content.
- **Widen the role check to a shared allow-list**, matching the `["PASTOR", "ADMIN", "SUPER_ADMIN"]` set already used for announcement creation, instead of introducing a new permission flag. Keeps prayer moderation consistent with how other church-wide content (announcements, appearance) is gated.
- **Frontend gate switches from `isPastor` to the existing `isChurchManager` computed** in `prayer.vue` (already defined, already `PASTOR/ADMIN/SUPER_ADMIN`) — no new computed property needed.
- **Notification only fires on approval, not rejection** — rejection is meant to stay silent per the current spec's "Rejecting an already-reviewed request" scenarios; broadening that is out of scope here.

## Risks / Trade-offs

- [Notifying the whole church on every approval could be noisy for high-volume churches] → Mitigation: this matches existing behavior for announcements; no rate limiting exists there either, so this is consistent with current product behavior rather than a new risk class.
- [Widening role checks touches an authorization boundary] → Mitigation: reuses the exact same role set already trusted for announcements in the same codebase, not a new trust decision.
