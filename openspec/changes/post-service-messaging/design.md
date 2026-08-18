## Context

The church roster (`RosterMember`, added in a prior change) already tracks each person's status (`VISITOR` / `MEMBER` / `FORMER`) with name and phone, independent of app login. The WhatsApp connection (Task 6) already lets a pastor connect their church's number via QR code through `microservice-whatsapp`, and `WhatsAppServiceClient.ts` already knows how to talk to it for connect/status/disconnect. `ServiceTime` already stores each church's recurring service schedule (`weekday`, `time`, `label`). This change is the first feature to actually *send* WhatsApp messages, and the first to combine roster + service times + WhatsApp into one flow.

Constraints: no `prisma migrate dev` (schema drift risk — hand-write SQL); no new external infra (no BullMQ/cron service) for a feature this size; must reuse the existing `isPrivilegedRole` gate and `crunchId` tenant scoping used by every other admin feature; must reuse the established `.member-card` visual pattern in `admin.vue`.

## Goals / Non-Goals

**Goals:**
- Let a pastor send a WhatsApp message to visitors, members, or everyone active, using a reusable template with a `{nome}` placeholder.
- Let a pastor set up recurring rules that fire automatically N minutes after a given service time, without needing to remember to send anything.
- Keep a lightweight audit trail (counts, not full delivery receipts) of every send.
- Avoid getting the church's WhatsApp number banned by sending in bulk without pacing.

**Non-Goals:**
- No delivery/read receipts or per-recipient status tracking — only aggregate success/failure counts.
- No message editing/recall after sending.
- No multi-channel support (SMS/email) — WhatsApp only, matching the existing integration.
- No birthday messaging (separate, already-queued Task 8/9) — this change only covers post-service messaging, though the send/log infrastructure is written generically enough to be reused later.
- No precise-to-the-second scheduling guarantee — a 60s polling scheduler is accurate to within about a minute, which is acceptable for a "a couple hours after church" use case.

## Decisions

**Background sends via fire-and-forget, not a job queue.** A church's active roster is realistically dozens to low hundreds of people, not thousands. Awaiting the full paced loop synchronously in the HTTP handler risks request timeouts; standing up BullMQ/Redis in the main API (the microservice already has its own, but that's a separate deployable) is disproportionate for this volume. Instead, the route creates a `MessageLog` row with `status: PROCESSING` and returns immediately; an un-awaited async function performs the paced send loop and updates the same row's counts as it goes, then flips it to `DONE`. The frontend polls/re-fetches the log list to show progress. Trade-off: if the API process restarts mid-send, that log entry is stuck at `PROCESSING` forever — acceptable for an admin-facing audit log, not a delivery guarantee.

**In-process `setInterval` scheduler, not an external cron.** Matches the project's existing scale (single API process, no worker fleet) and avoids adding infrastructure for a once-a-week-per-rule check. Every 60s, the scheduler loads active `MessageRule`s with their `ServiceTime`, computes today's target fire time (`serviceTime.time + offsetMinutes`), and fires if `now` has just crossed that target and `lastFiredAt` isn't already within the current service occurrence's week. Trade-off: if the API is down during the exact fire minute, that occurrence is silently skipped (not caught up on restart) — acceptable for a "reminder nudge" feature, not critical infrastructure.

**Audience computed live from `RosterMember.status` at send time, not a saved recipient list.** Consistent with how the roster itself works (statuses change over time) and means a rule always targets "whoever is currently a visitor" rather than a stale snapshot from when the rule was created.

**`MessageLog.templateId` is nullable and the log does not snapshot template body text.** Simpler schema; template deletion is rare (pastor-managed, low volume) and losing the exact historical wording on delete is an acceptable trade for not duplicating text into every log row. If this turns out to matter, a snapshot column can be added later without breaking existing rows.

**No "manual vs automatic mode" toggle.** Confirmed with the user: both coexist always. Automatic rules run independently in the background; "Enviar agora" is always available as a manual override. This is simpler than a mode switch and matches the actual mental model (rules are set-and-forget, manual send is for one-off situations).

**Reuse `isPrivilegedRole` + `resolveActiveChurchContext`, direct-adapter pattern.** Matches every other recent admin feature (`RosterAdapters`, `WhatsAppAdapters`) — no new architectural pattern introduced.

## Risks / Trade-offs

- **[Risk] Bulk sending from one WhatsApp number can trigger WhatsApp's spam/ban detection.** → Mitigation: fixed ~1.5s delay between individual sends (constant, not user-configurable in v1); documented as a known constraint. Future work could make this configurable per church.
- **[Risk] `setInterval` drifts or the process restarts, causing a missed or double-fire.** → Mitigation: `lastFiredAt` comparison prevents double-fires within the same week; a missed fire is a silent no-send this occurrence, acceptable for a non-critical reminder feature.
- **[Risk] A roster member has no phone number.** → Mitigation: counted as a failure in the log with an implicit "no phone" cause (not a hard error for the whole send); the rest of the audience still gets the message.
- **[Risk] Church hasn't connected WhatsApp yet when a rule fires or "Enviar agora" is clicked.** → Mitigation: check `WhatsAppServiceClient.isConnected(tenantId)` before starting; manual send returns a clear `DomainError`, automatic rule fire logs a `FAILED` entry and skips silently (no error surfaced to a human who isn't looking).
- **[Trade-off] No retry on individual message failure.** Keeps the send loop simple; a failed recipient is just counted, not retried. Acceptable given this is a "nice to reach out" feature, not transactional.

## Migration Plan

- Additive-only migration: 3 new tables, no changes to existing tables. Hand-written SQL following the `RosterMember` migration's pattern, applied via `prisma migrate deploy`.
- No backfill needed — all new tables start empty.
- Scheduler starts automatically with the API process (registered in `server.ts` like the route modules); no separate deploy step. It only acts on rules a pastor explicitly creates, so it's inert until someone opts in.
- Rollback: drop the 3 new tables and remove the route registrations / scheduler start call — no coupling into existing tables or flows.

## Open Questions

None outstanding — design decisions above were confirmed with the user during brainstorming.
