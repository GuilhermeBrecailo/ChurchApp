# Demo endpoints — Pessoas

All responses use the usual envelope `{ "data": <payload>, "status": 200 }`; errors are HTTP 200 `{ "error": "...", "status": 409 }`.
"Person id" is always the **roster id** (`RosterMember.id`). Accounts (`userId`) only appear for viewers with `MEMBER_*` permissions.

Viewer access (used by the demo to filter):
- manager (PASTOR/ADMIN, or `MEMBER_CREATE|EDIT|DELETE`, or legacy `canManageMembers`): everyone incl. FORMER, account data, roles, pending.
- care-only (`PASTORAL_CARE_MANAGE`): VISITOR + MEMBER (no FORMER), `userId/membershipId/role` = null, `roles` = [], `pending` = [].
- `care` block only for `PASTORAL_CARE_MANAGE` (managers have it); otherwise `null`.

## GET /api/church/people (new)

```json
{
  "people": [
    {
      "id": "p-ana", "name": "Ana Paula Souza", "email": "ana@x.com", "phone": "(41) 99999-1111",
      "status": "MEMBER", "joinedAt": "2024-03-02T00:00:00.000Z", "leftAt": null, "createdAt": "2024-03-02T00:00:00.000Z",
      "avatarUrl": null, "userId": "u-ana", "hasAccount": true, "membershipId": "m-ana", "role": "MEMBER",
      "isTitularPastor": false,
      "roles": [{ "id": "role-sec", "name": "Secretária", "scope": "CHURCH", "departmentId": null, "permissions": ["MEMBER_CREATE","MEMBER_EDIT","MEMBER_DELETE"] }],
      "departments": ["Louvor", "Mídia"],
      "followUp": null,
      "care": { "openVisits": 0, "nextVisitAt": null, "absent": false }
    },
    {
      "id": "p-bia", "name": "Beatriz Lopes", "email": null, "phone": "(41) 98888-2222",
      "status": "VISITOR", "joinedAt": null, "leftAt": null, "createdAt": "2026-11-07T00:00:00.000Z",
      "avatarUrl": null, "userId": null, "hasAccount": false, "membershipId": null, "role": null, "isTitularPastor": false,
      "roles": [], "departments": [],
      "followUp": { "stage": "NEW", "consentToContact": true, "nextContactAt": "2026-11-12T00:00:00.000Z", "lastContactAt": null, "responsible": { "id": "user-1", "name": "Carlos Mendes" } },
      "care": { "openVisits": 0, "nextVisitAt": null, "absent": false }
    },
    {
      "id": "p-davi", "name": "Davi Santos", "email": null, "phone": "(41) 96666-4444", "status": "MEMBER",
      "joinedAt": "2019-05-01T00:00:00.000Z", "leftAt": null, "createdAt": "2019-05-01T00:00:00.000Z", "avatarUrl": null,
      "userId": null, "hasAccount": false, "membershipId": null, "role": null, "isTitularPastor": false, "roles": [], "departments": [],
      "followUp": null, "care": { "openVisits": 1, "nextVisitAt": "2026-11-11T21:00:00.000Z", "absent": true }
    }
  ],
  "pending": [
    { "membershipId": "mem-pend", "userId": "u-gabi", "name": "Gabriela Nunes", "email": "gabi@x.com", "phone": null, "avatarUrl": null, "requestedAt": "2026-11-10T14:00:00.000Z" }
  ],
  "responsibles": [{ "id": "user-1", "name": "Carlos Mendes" }, { "id": "user-9", "name": "Marta Lima" }],
  "access": { "canCreate": true, "canEdit": true, "canDelete": true, "canSeeAccounts": true, "canCare": true, "isManager": true }
}
```

`care.absent` is only true when the church takes attendance by name (some attendee was marked in the last 4 services) and this MEMBER was not marked in any of them.

## GET /api/church/people/:rosterId (new)

```json
{
  "person": {
    "...": "same fields as a list item (without followUp/care)",
    "birthDate": "1990-06-15", "notes": "Ajuda na recepção aos domingos.", "mustChangePassword": false, "isSelf": false
  },
  "followUp": {
    "id": "f1", "stage": "CONTACTED", "consentToContact": false, "nextContactAt": "2026-11-09T00:00:00.000Z",
    "lastContactAt": "2026-11-02T15:00:00.000Z", "responsibleId": null, "responsible": null,
    "activities": [
      { "id": "a1", "action": "CONTACT_RECORDED", "note": "Liguei depois do culto.", "stage": "CONTACTED", "createdAt": "2026-11-09T15:00:00.000Z", "actor": { "id": "user-1", "name": "Carlos Mendes" } }
    ]
  },
  "visits": [
    { "id": "v1", "reason": "Está faltando aos cultos", "priority": "HIGH", "status": "SCHEDULED", "scheduledAt": "2026-11-11T21:00:00.000Z", "completedAt": null, "notes": null, "responsible": { "id": "user-1", "name": "Carlos Mendes" }, "rosterMember": { "id": "p-davi", "name": "Davi Santos", "status": "MEMBER", "phone": "(41) 96666-4444", "email": null } }
  ],
  "attendance": { "recentServices": 4, "attended": 3, "tracksAttendance": true, "lastPresentAt": "2026-10-18T00:00:00.000Z" },
  "ministries": [{ "id": "d1", "name": "Louvor", "function": "Teclado", "isLeader": false }, { "id": "d2", "name": "Mídia", "function": null, "isLeader": true }],
  "upcomingAssignments": [
    { "id": "as1", "role": "Teclado", "confirmationStatus": "CONFIRMED", "scheduleId": "s1", "date": "2026-11-15T00:00:00.000Z", "description": "Culto de domingo", "department": { "id": "d1", "name": "Louvor" } }
  ],
  "responsibles": [{ "id": "user-1", "name": "Carlos Mendes" }],
  "permissions": {
    "canEdit": true, "canEditAccount": true, "canChangeStatus": true, "canDelete": true, "canRemoveFromChurch": true,
    "canCare": true, "canRecordConsent": true, "canInvite": false, "canManageRoles": true, "canResetPassword": true, "canSeeAccount": true
  }
}
```

Rules for the demo: `followUp.activities`, `visits`, `attendance`, `responsibles` empty/null unless the viewer has care; care-only viewer gets "Pessoa não encontrada" for FORMER. `canEditAccount`/`canResetPassword` false for ADMIN/SUPER_ADMIN targets, the titular pastor and yourself; `canInvite` = canCreate && !hasAccount && status != FORMER.

## POST /api/church/roster (changed)

Body: `{ name, phone?, email?, birthDate?, notes?, contactConsent?: boolean, status?: "VISITOR" | "MEMBER" }` (default VISITOR).
VISITOR: allowed for MEMBER_CREATE or PASTORAL_CARE_MANAGE; creates follow-up stage NEW. MEMBER: MEMBER_CREATE only; `joinedAt = now`, no follow-up (unless consent given → follow-up stage INTEGRATED, consent true).
Response: the roster row `{ id, name, email, phone, status, joinedAt, leftAt, createdAt, userId: null, ... }`. Mutation: add to `people`.

## POST /api/church/roster/:id/consent (new)

Body `{ consentToContact: boolean }` → `{ "rosterMemberId": "p-caio", "consentToContact": true }`.
Mutation: set/create `followUp.consentToContact` (new follow-up stage: VISITOR→NEW, MEMBER→INTEGRATED, FORMER→CLOSED) and prepend activity `CONSENT_UPDATED`.

## Roster permissions (changed, same paths)

`GET /roster` readable by MEMBER_* and PASTORAL_CARE_MANAGE; `PATCH /roster/:id` MEMBER_EDIT (or care for VISITOR); `promote|leave|restore` MEMBER_EDIT or MEMBER_DELETE; `DELETE /roster/:id` MEMBER_DELETE.

## POST /api/church/members (changed)

Body `{ name, email, phone?, password?, rosterMemberId? }`. Links the new account to `rosterMemberId` (or a roster row without account with the same e-mail/phone) instead of creating another person.
Response:
```json
{ "id": "kc-1", "name": "João da Silva", "email": "joao@x.com", "phone": "(41) 91234-5678", "role": "MEMBER", "canManageMembers": false, "mustChangePassword": true, "createdAt": "2026-11-11T12:00:00.000Z", "rosterMemberId": "p-joao", "temporaryPassword": "k7m3qp9xha" }
```
`temporaryPassword` only when no password was sent. Mutation: person gets `hasAccount: true`, `userId`, `membershipId`, `role: "MEMBER"`.

## PATCH /api/church/members/pending/:membershipId/approve (changed)

Response `{ "success": true, "rosterMemberId": "p-gabi" }`. Mutation: remove from `pending`, add/link a MEMBER person with account.

## PATCH /api/church/members/:userId (changed behaviour)

`role` is only applied when different from the current one; changing the role of an ADMIN/SUPER_ADMIN returns `{ "error": "O tipo de um administrador não pode ser alterado por este formulário", "status": 409 }`.

## DELETE /api/church/members/:userId (changed behaviour)

Also sets the person's roster row to `status: "FORMER"`, `leftAt: now` (the person stays in the list under Desligados, `hasAccount: false`).

## POST /api/church/members/:userId/reset-password (new)

No body. Requires MEMBER_CREATE. Refused for yourself, the titular pastor, ADMIN/SUPER_ADMIN, and (for non-pastors) another PASTOR.
Response `{ "success": true, "temporaryPassword": "h4kzt8mwqe" }`. Mutation: person `mustChangePassword: true`.

## Used as-is by the new screens

`GET /api/church/pastoral/visits`, `POST/PATCH /api/church/pastoral/visits[/:id]`, `GET /api/church/pastoral/dashboard` (only `stats.pendingPrayers` is read by /pessoas/cuidado), `POST /api/church/pastoral/visitors` (care-only "Adicionar pessoa"), `POST /api/church/pastoral/visitors/:rosterId/follow-up`, `GET /api/church/invite-code`, `GET/POST/PATCH/DELETE /api/church/roles`, `POST/DELETE /api/church/members/:userId/roles[/:roleId]`, `GET /api/church/departments`.
