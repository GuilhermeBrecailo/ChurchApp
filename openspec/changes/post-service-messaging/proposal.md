## Why

Pastors currently have no way to follow up with visitors or members after a service without manually messaging each person on WhatsApp. The church already tracks who's a visitor vs. member (roster) and has a working WhatsApp connection (Task 6) — this change closes the loop by letting a pastor send a templated WhatsApp message to a chosen audience, either on demand or automatically on a recurring schedule tied to a service time.

## What Changes

- Add reusable message templates with a `{nome}` placeholder substituted per recipient.
- Add a manual "send now" flow: pick a template + audience (visitors / members / everyone active), send to every matching roster member's WhatsApp number.
- Add recurring automatic rules: tied to an existing `ServiceTime`, fire N minutes after that service's scheduled time, using a chosen template + audience, without double-firing the same week's occurrence.
- Add a send history log recording template, audience, and success/failure counts per send.
- Extend `WhatsAppServiceClient` with a `sendText` method (microservice already exposes `POST /api/v1/message/send-text`).
- Sends run as a background job per request (not synchronous in the HTTP response), throttled with a delay between messages to reduce WhatsApp ban risk.
- New "Mensagens" tab in Admin (pastor/admin only), alongside the existing "Rol" tab.

## Capabilities

### New Capabilities
- `post-service-messaging`: WhatsApp message templates, manual sends, recurring automatic rules tied to service times, and send history — scoped to a church's roster (visitors/members), pastor/admin only.

### Modified Capabilities
(none — this is additive; it reads from the existing roster and WhatsApp connection capabilities but doesn't change their requirements)

## Impact

- **Database**: 3 new tables (`MessageTemplate`, `MessageRule`, `MessageLog`) via hand-written migration SQL (no `prisma migrate dev`, per project convention).
- **API**: new routes under `/api/church/messages/*` (templates, rules, logs, send), a new adapter class following the existing direct-adapter pattern (see `RosterAdapters`), and a new in-process scheduler (`setInterval`, no external cron) started from `server.ts`.
- **WhatsApp integration**: `api/src/infrastructure/whatsapp/WhatsAppServiceClient.ts` gains a `sendText` method; no changes needed in `microservice-whatsapp` itself.
- **Frontend**: new `web/composables/useMessages.ts`; new "Mensagens" tab and its 4 sections in `web/app/pages/admin.vue`, reusing the `.member-card` visual pattern already established for the Rol tab.
- **No changes** to roster or WhatsApp connection behavior — this only reads from them.
