# Endpoints de Escalas e Cultos (demo)

Todas as respostas seguem o contrato do `controllerHandler`: sucesso `{ "data": ..., "status": 200 }`;
erro de regra `HTTP 200 { "error": "mensagem", "status": 409 }`.

Formato de uma escala (`Schedule`), usado em todos os exemplos:

```json
{
  "id": "s1",
  "date": "2026-11-15T19:00:00.000Z",
  "description": "Culto da Família · Louvor",
  "arrivalAt": "2026-11-15T18:15:00.000Z",
  "rehearsalAt": "2026-11-13T20:00:00.000Z",
  "rehearsalNotes": "Trazer o pedal do teclado",
  "isCommunionService": false,
  "createdAt": "2026-11-01T12:00:00.000Z",
  "departmentId": "louvor",
  "serviceOccurrenceId": "occ-1",
  "serviceOccurrence": { "id": "occ-1", "serviceTimeId": "st-1" },
  "department": { "id": "louvor", "name": "Louvor", "type": "WORSHIP", "leaderId": "u-1", "scheduleConfig": null },
  "assignments": [
    { "id": "a1", "role": "Teclado", "userId": "u-1", "viewedAt": null, "confirmationStatus": "PENDING", "confirmedAt": null, "declineReason": null, "attendanceStatus": "PENDING", "attendedAt": null, "user": { "id": "u-1", "name": "Carlos Mendes", "email": "carlos@exemplo.com" } },
    { "id": "a2", "role": "Vocal", "userId": "u-1", "viewedAt": null, "confirmationStatus": "PENDING", "confirmedAt": null, "declineReason": null, "attendanceStatus": "PENDING", "attendedAt": null, "user": { "id": "u-1", "name": "Carlos Mendes", "email": "carlos@exemplo.com" } },
    { "id": "a3", "role": "Baixo", "userId": "u-3", "viewedAt": "2026-11-10T10:00:00.000Z", "confirmationStatus": "SWAP_REQUESTED", "confirmedAt": null, "declineReason": "Viagem", "attendanceStatus": "PENDING", "attendedAt": null, "user": { "id": "u-3", "name": "Bruno Alves", "email": "bruno@exemplo.com" } }
  ],
  "mediaItems": [
    {
      "id": "smi-1", "mediaItemId": "song-1", "order": 0, "observation": "Começar só com teclado",
      "startedByUserId": "u-2", "startedBy": { "id": "u-2", "name": "Ana Souza" },
      "mediaItem": { "id": "song-1", "title": "Grande é o Senhor", "url": "", "category": "MUSIC", "departmentId": "louvor",
        "metadata": { "artist": "Adhemar de Campos", "key": "G", "bpm": "72", "lyrics": "Grande é o Senhor…", "chords": "G D Em C" } }
    }
  ],
  "canManage": true,
  "canDelete": true,
  "canNotify": true
}
```

Cada função é uma linha em `assignments` (quem tem Teclado e Vocal tem duas linhas). `canManage`/`canDelete`/
`canNotify` dizem o que a pessoa logada pode fazer (SCHEDULE_EDIT / SCHEDULE_DELETE / MINISTRY_NOTIFY no ministério).

---

## GET /api/church/schedules

- **Sem parâmetros**: resposta antiga — array com todas as escalas da igreja, `date desc`, com letras/cifras. Usada pelo
  Início e Relatórios.
- **Com qualquer um destes parâmetros** a resposta muda para `{ items, nextCursor }`:
  - `scope=mine|managed|all` (padrão `all`): `mine` = escalas em que a pessoa está; `managed` = ministérios que ela
    organiza (pastor/admin: todos).
  - `from=YYYY-MM-DD` (inclui o dia), `to=YYYY-MM-DD` (inclui o dia inteiro). Também aceita ISO.
  - `order=asc|desc` (padrão `asc`; só `to` sem `from` → `desc`, usado no histórico).
  - `limit` (padrão 30, máx. 100), `cursor` (id da última escala da página anterior), `departmentId`.
  - Nos itens, `mediaItem.metadata` vem **sem** `lyrics`, `chords` e `keyboardChords`.

Chamadas que o front faz:

| Tela | Query |
| --- | --- |
| Minhas | `?scope=mine&from=<hoje>&limit=50` |
| Igreja | `?scope=all&from=<hoje>&limit=50[&departmentId=]` |
| Organizar | `?scope=managed&from=<hoje>&limit=50[&departmentId=]` |
| Ver escalas anteriores | `?scope=<mine|all|managed>&to=<hoje>&order=desc&limit=20[&cursor=]` |
| Culto (respostas do dia) | `?scope=all&from=<dia>&to=<dia>&limit=50` |

```json
{ "data": { "items": [ { "id": "s1", "...": "escala sem letras" } ], "nextCursor": null }, "status": 200 }
```

## GET /api/church/schedules/:id

Escala completa (com letras e cifras) + `canManage`/`canDelete`/`canNotify`. Abre a folha (`?schedule=<id>`).
Escala de outra igreja → `{ "error": "Escala não encontrada nesta igreja", "status": 409 }`.

## POST /api/church/schedules  ·  PATCH /api/church/schedules/:id

Corpo (todos opcionais no PATCH):

```json
{
  "title": "Culto da Família · Louvor",
  "date": "2026-11-15",
  "time": "19:00",
  "departmentId": "louvor",
  "serviceOccurrenceId": "occ-1",
  "arrivalTime": "18:15",
  "rehearsalDate": "2026-11-13",
  "rehearsalTime": "20:00",
  "rehearsalNotes": "Trazer o pedal",
  "songIds": ["song-1", "song-2"],
  "resourceIds": ["res-1"],
  "isCommunionService": false,
  "assignments": [
    { "id": "a1", "userId": "u-1", "role": "Teclado" },
    { "userId": "u-1", "role": "Vocal" },
    { "userId": "u-3", "role": "Baixo" }
  ]
}
```

Resposta: a escala salva (formato acima). Efeitos no estado da demo:

- `assignments` (opcional) substitui a equipe: linhas com `id` são mantidas (com resposta e presença), as outras são
  criadas, as ausentes apagadas. `"Teclado · Vocal"` (formato antigo) vira duas linhas.
- Só pessoas do ministério (membros ou líder) → senão `"Um ou mais voluntários não pertencem a este ministério"` e nada
  é gravado.
- Se `date`/`time` mudarem: todas as linhas voltam a `confirmationStatus: "PENDING"`, `viewedAt: null`,
  `declineReason: null`, `confirmedAt: null`.
- Avisos (um por pessoa): entrou → "Nova escala publicada"; saiu → "Você foi removido de uma escala"; continua →
  "Mudou a data da escala" (data/hora mudou) ou "Escala atualizada" (chegada/ensaio mudou); nada se só o título,
  músicas ou equipe mudaram.

`PATCH /api/church/schedules/:id/assignments` continua existindo (`{ assignments: [...] }`), mesma regra de linhas,
avisa só quem entrou e quem saiu.

## POST /api/church/schedules/assignment-conflicts

Avisos do editor para uma escala ainda não salva (nunca bloqueiam).

```json
{ "departmentId": "louvor", "serviceOccurrenceId": "occ-1", "date": "2026-11-15", "time": "19:00",
  "userIds": ["u-1", "u-2", "u-4"], "excludeScheduleId": "s1" }
```

```json
{
  "data": {
    "conflicts": [
      { "userId": "u-2", "userName": "Ana Souza", "departmentName": "Mídia", "role": "Som", "scheduleId": "s2", "scheduleDescription": "Culto da Família · Mídia" }
    ],
    "unavailable": [ { "userId": "u-4", "userName": "Duda Martins" } ]
  },
  "status": 200
}
```

Conflito = mesma pessoa em escala de **outro** ministério no mesmo culto (ou mesma data+hora sem culto).
Indisponível = a pessoa marcou o dia em Perfil › Indisponibilidade.

## PATCH /api/church/schedules/:id/my-assignment

```json
{ "action": "CONFIRMED" }
{ "action": "MAYBE" }
{ "action": "DECLINED", "declineReason": "Viagem: casamento" }
{ "action": "SWAP_REQUESTED", "declineReason": "Trabalho" }
{ "action": "VIEWED" }
```

Atualiza **todas** as linhas da pessoa na escala (`viewedAt` preenchido se vazio; `confirmationStatus` = action;
`declineReason` guardado em DECLINED e SWAP_REQUESTED). Resposta: a primeira linha + `assignments` com todas:

```json
{ "data": { "id": "a1", "role": "Teclado", "confirmationStatus": "CONFIRMED", "...": "...",
  "assignments": [ { "id": "a1", "confirmationStatus": "CONFIRMED" }, { "id": "a2", "confirmationStatus": "CONFIRMED" } ] }, "status": 200 }
```

## POST /api/church/schedules/:id/reminders

Corpo `{ "onlyPending": true }` ("Lembrar quem não respondeu"): avisa só quem tem todas as linhas `PENDING`.
Resposta `{ "success": true, "notifiedCount": 2 }`. Sem pendentes → `{ "error": "Todos da equipe já responderam" }`.
Plano sem `SCHEDULE_REMINDER` → erro de plano.

## Presença do culto

- `GET /api/church/attendance?occurrenceId=occ-1` → array com no máximo 1 registro (vazio para culto avulso):

```json
{ "data": [ { "id": "att-1", "date": "2026-11-15T00:00:00.000Z", "visitorCount": 12, "memberCount": 140, "notes": null,
  "endedAt": null, "serviceTimeId": "st-1", "serviceOccurrenceId": "occ-1",
  "serviceTime": { "id": "st-1", "label": "Culto da Família", "weekday": 0, "time": "19:00" } } ], "status": 200 }
```

  Também aceita `?serviceTimeId=st-1&date=2026-11-15`. Sem esses parâmetros segue `?days=30` (lista).
- `POST /api/church/attendance/:serviceTimeId/finalize` com corpo `{ "occurrenceId": "occ-1" }` ou
  `{ "date": "2026-11-15" }`: grava `endedAt = agora` no registro **do dia do culto** (cria com contagens 0 se não
  existir). Antes do horário do culto → `"Esse culto ainda não começou"`. Sem corpo: hoje (comportamento antigo).
- Permissão de `GET/POST /attendance` e `finalize`: pastor/admin **ou** cargo com `CULT_ATTENDANCE_MANAGE`
  (antes só pastor/admin).
