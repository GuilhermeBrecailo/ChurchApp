# Culto Hub

## Why

Today, "escala" (worship/serving team roster) and "culto" (the church service
it serves) have no relationship in the data model — `Schedule` only carries
a free `date` and `description`. Finding out who's serving at a given
service, who showed up, and how many visitors attended means checking three
disconnected screens (`/scale`, Admin > Relatórios > presença, and each
department's own escala list), none of which know about each other.

The user wants "culto" to become a real hub: create an escala and it's tied
to a specific culto occurrence from the start; open that culto and see every
escala serving it, who's confirmed, who actually showed up (both a quick
head-count and, new, person-by-person), and a "Finalizar culto" action that
can't be pressed before the service has actually started.

## Goals

- A culto occurrence (a specific `ServiceTime` on a specific date — e.g.
  "Culto de Domingo, 30/08/2026") becomes a first-class row in the database,
  not a computed/virtual concept.
- Creating an escala requires picking which culto occurrence it serves.
- A new `/cultos` screen, reachable as its own destination in the main
  navigation, lists upcoming and recently-active culto occurrences.
- Opening a culto occurrence shows three tabs: **Escalas** (every escala
  tied to it, across every ministry), **Visitantes** (the existing
  aggregate attendance count + "Finalizar culto"), **Membros** (who's
  scheduled, and new: who from the whole congregation actually attended).
- "Finalizar culto" is disabled until the occurrence's actual date+time has
  arrived.
- New person-by-person attendance tracking, covering the whole congregation
  (not just the serving team), coexists with the existing aggregate
  head-count — neither replaces or recalculates the other.

## Non-goals

- Not migrating `ServiceAttendance`'s existing `serviceTimeId`+`date` key,
  the "Finalizar culto" endpoint's contract, or `messageRuleScheduler`'s
  read path — all three are in production today and stay exactly as they
  are. The new `ServiceOccurrence` relation is additive only (see Approach).
- Not backfilling `serviceOccurrenceId` onto existing `Schedule` rows —
  escalas created before this ships keep working with `serviceOccurrenceId:
  null`; only new escalas require it.
- Not deriving the aggregate visitor/member count from nominal attendance,
  or vice versa — confirmed with the user as two independent, coexisting
  records.
- Not reworking how `ServiceTime` itself is created/edited (recurring
  service definitions) — out of scope, unchanged.

## Approach (chosen: real `ServiceOccurrence` row, additive to existing attendance)

Two structural approaches were discussed during brainstorming:

- **Virtual occurrence (rejected).** Treat "culto" as the existing
  `(serviceTimeId, date)` composite key `ServiceAttendance` already uses —
  no new table, `Schedule` just gets a `serviceTimeId` and reuses its own
  `date`. Lower migration risk, but the user's actual goal — "quero que o
  culto tenha as escalas, quem foi quem não foi e tudo mais" — wants a real
  entity that things hang off of, not a key pattern repeated across models.
- **Real `ServiceOccurrence` row (chosen).** A culto occurrence is a genuine
  row, created (or reused, if one already exists for that
  `serviceTimeId`+date) the first time it's needed — when an escala is
  created against it, or when someone opens it from the `/cultos` list
  before anything else exists yet. `Schedule` and the new nominal-attendance
  table reference it directly by id.

  To keep this safe against the already-shipped attendance/messaging
  feature, `ServiceAttendance` is **not** migrated to key off
  `ServiceOccurrence` — it keeps its existing `serviceTimeId`+`date`
  columns and every existing code path (the `/finalize` endpoint, the
  aggregate report, `messageRuleScheduler`) untouched. It only gains an
  additive `serviceOccurrenceId` column, populated going forward, purely so
  the culto hub's Visitantes tab can link the existing attendance UI into
  the new hub page. Nothing that already reads `serviceTimeId`+`date`
  changes.

  Occurrence discovery (which culto occurrences exist to list/open) reuses
  `calculateUpcomingServiceOccurrences` (`api/src/application/Services/
  ServiceTime/ServiceTimeOccurrences.ts`), already shipped and used by the
  public church page — no new date-math is written for this.

## Data model

```prisma
model ServiceOccurrence {
  id            String   @id @default(uuid())
  date          DateTime
  createdAt     DateTime @default(now())

  crunchId      String
  crunch        Crunch      @relation(fields: [crunchId], references: [id], onDelete: Cascade)

  serviceTimeId String
  serviceTime   ServiceTime @relation(fields: [serviceTimeId], references: [id], onDelete: Cascade)

  schedules  Schedule[]
  attendees  ServiceOccurrenceAttendee[]

  @@unique([serviceTimeId, date])
  @@index([crunchId, date])
}

model ServiceOccurrenceAttendee {
  id                  String   @id @default(uuid())
  markedAt            DateTime @default(now())

  serviceOccurrenceId String
  serviceOccurrence   ServiceOccurrence @relation(fields: [serviceOccurrenceId], references: [id], onDelete: Cascade)

  rosterMemberId String
  rosterMember   RosterMember @relation(fields: [rosterMemberId], references: [id], onDelete: Cascade)

  @@unique([serviceOccurrenceId, rosterMemberId])
}
```

Changes to existing models (both additive, both nullable — no backfill):

- `Schedule` gains `serviceOccurrenceId String?` +
  `serviceOccurrence ServiceOccurrence? @relation(...)`. The API requires it
  on create for new escalas (see API section); existing rows stay null.
- `ServiceAttendance` gains `serviceOccurrenceId String?` + relation, set
  whenever a new attendance record is created or updated through the culto
  hub's Visitantes tab going forward. Every existing field, the unique
  `[serviceTimeId, date]` key, and every existing query/mutation on this
  model are untouched.
- `RosterMember` gains the inverse relation `serviceAttendances
  ServiceOccurrenceAttendee[]`.

## API

**Resolve-or-create an occurrence** — used by escala creation and by
opening a culto from the `/cultos` list that doesn't have a row yet:

```
POST /api/church/service-occurrences
Body: { serviceTimeId: string, date: string }
```
Finds the existing row for `(serviceTimeId, date)` scoped to the caller's
church, or creates it. Idempotent — safe to call every time an escala
targeting that occurrence is created, since concurrent escalas for the same
culto reuse the same row via the unique constraint.

**List occurrences for `/cultos`:**

```
GET /api/church/service-occurrences?daysAhead=30
```
Returns: every active `ServiceTime`'s computed upcoming occurrences (via
`calculateUpcomingServiceOccurrences`) for the next `daysAhead` days, each
merged with its real `ServiceOccurrence` row when one exists (so the list
can show "2 escalas" on an occurrence that already has activity, without
creating rows for occurrences nobody has touched yet) — plus every existing
`ServiceOccurrence` row from the past 30 days, for the ones still worth
opening after the fact (register presence, mark attendees, review escalas).

**Culto hub detail:**

```
GET /api/church/service-occurrences/:id
```
Returns the occurrence (service time, date), its `Schedule`s grouped by
department with each department's escalados, and its
`ServiceOccurrenceAttendee`s (roster member id + name).

**Mark/unmark nominal attendance:**

```
POST   /api/church/service-occurrences/:id/attendees   Body: { rosterMemberId: string }
DELETE /api/church/service-occurrences/:id/attendees/:rosterMemberId
```
Same permission gate as the existing aggregate attendance
(`assertCanManageAttendance` — pastors/admins/privileged roles, mirrored
from `attendanceAdapters.ts`).

**Escala creation** (existing `createChurchSchedule`/`updateChurchSchedule`
endpoints) requires `serviceOccurrenceId` in the body for new escalas — the
frontend obtains it by calling the resolve-or-create endpoint above right
before submitting. Missing it on create is a `DomainError` ("Escolha o
culto antes de criar a escala").

**Finalize gating**: the existing `POST /api/church/attendance/:serviceTimeId/finalize`
endpoint gains one check before its current logic — reject with a
`DomainError` ("Esse culto ainda não começou") if `now` is earlier than the
occurrence's `date` combined with its `ServiceTime.time`. Everything else in
that endpoint (the upsert, the `endedAt` write) is unchanged.

## Frontend

- **`MinisteryScheduleFormDialog`** gains two required fields at the top —
  "Culto" (`v-select` of the department's church's active `ServiceTime`s)
  and "Data" (defaults to that service's next computed occurrence, editable)
  — before the existing título/data/observações fields. On submit, the
  dialog first calls `POST /service-occurrences` to resolve the id, then
  includes `serviceOccurrenceId` in the escala payload.
- **New page `web/app/pages/cultos/index.vue`** — the `/cultos` nav
  destination. Cards per occurrence (service label, weekday+time, date,
  escala/attendance counts when present), grouped Upcoming / Recent.
  Tapping a card without a real `ServiceOccurrence` yet calls the
  resolve-or-create endpoint, then navigates to the detail page by id.
- **New page `web/app/pages/cultos/[id].vue`** — the hub itself, three
  `v-tabs`:
  - **Escalas** — list grouped by department; each row links to the
    existing `Scale/DetailSheet.vue` flow (opened the same way `/scale`
    already opens it) — no new escala-management UI.
  - **Visitantes** — the existing "Registrar presença" form and "Finalizar
    culto" button, moved here from `admin/relatorios.vue` and scoped to
    this occurrence's `serviceTimeId`; the button is disabled with a
    tooltip ("Disponível a partir de HH:mm") until gating passes.
  - **Membros**, two sub-tabs: **Escalados** (dedup of every
    `ScheduleAssignment.user` across the occurrence's schedules, with
    department + role) and **Presença nominal** (search-and-tap over the
    church's `RosterMember` list, backed by the mark/unmark endpoints
    above).
- **New nav entry** "Cultos" alongside Início/Conteúdo/Ministérios/Usuário.
- **`admin/relatorios.vue`** stays exactly as it is — its "Público do culto"
  card is a cross-occurrence history/report (every recurring service +
  30-day aggregate), a different purpose from the hub's Visitantes tab
  (one specific occurrence's action panel). Not a duplication; both stay.
  `useAttendance.ts`'s `saveAttendance`/`finalizeService` are reused as-is
  by the new Visitantes tab — no changes to that composable.

## Testing

- API: new Jest suite for the `service-occurrences` adapter — resolve-or-
  create idempotency (same `serviceTimeId`+date twice returns the same row),
  listing merges computed-upcoming with real rows correctly, mark/unmark
  attendee round-trip, and the finalize-gating check (before vs. after the
  occurrence's date+time, using injectable "now" the way existing scheduler
  tests already do).
- API: extend `churchDepartmentSchedule.test.ts` (or add a case) confirming
  escala creation rejects a missing `serviceOccurrenceId`.
- Regression: `attendanceAdapters`/`messageRuleScheduler` existing test
  suites must stay green unmodified — proves the additive-only approach
  didn't touch their contract.
- Frontend: no test runner in this repo — manual verification: create an
  escala (culto required), confirm it appears under the culto's Escalas
  tab; register aggregate presence and mark two roster members present
  nominally in the same occurrence, confirm both persist independently;
  confirm "Finalizar culto" is disabled before the scheduled time and
  enabled after.
- `npm run validate` before calling any implementation task done.
