# Demo — endpoints de Ministérios

Todas as respostas seguem o contrato do `controllerHandler`: sucesso
`{ "data": …, "status": 200 }`; erro de regra (DomainError) volta com HTTP 200 e
`{ "error": "mensagem", "status": 409 }`.

## Endpoint alterado

### `PATCH /api/church/departments/:departmentId/tasks/:taskId`

Mudou só a autorização: além de quem tem `MINISTRY_MANAGE` (pastor, admin,
líder titular, cargo com a permissão), **o responsável pela tarefa**
(`assigneeId === usuário logado`) pode mandar **apenas** `status`.

Body (responsável):

```json
{ "status": "DONE" }
```

Body (quem gerencia — todos opcionais):

```json
{
  "title": "Comprar copos descartáveis",
  "description": "200 unidades",
  "status": "OPEN",
  "priority": "HIGH",
  "dueDate": "2026-11-20",
  "assigneeId": "user-7"
}
```

Resposta:

```json
{
  "data": {
    "id": "t1",
    "title": "Comprar copos descartáveis",
    "description": "200 unidades",
    "status": "DONE",
    "priority": "HIGH",
    "dueDate": "2026-11-20T00:00:00.000Z",
    "createdAt": "2026-11-01T12:00:00.000Z",
    "assigneeId": "user-7",
    "assignee": { "id": "user-7", "name": "Joana Lima", "email": "joana@ex.com" }
  },
  "status": 200
}
```

Erros: responsável mandando outro campo além de `status`, ou alguém que não é
o responsável → `{ "error": "Apenas pastores, admins, lideres ou cargos com permissao podem gerenciar este ministerio", "status": 409 }`.

Estado na demo: troca `status` da tarefa (`"OPEN"` ↔ `"DONE"`); as demais
chaves só mudam para quem gerencia. `dueDate` chega como `AAAA-MM-DD` e é
guardado como meia-noite UTC.

## Endpoints já existentes que as telas novas usam

Nada mudou neles, mas a demo precisa respondê-los para Ministérios funcionar.

| Tela | Chamada | Observação |
| --- | --- | --- |
| Lista (`/ministery`) | `GET /api/church/departments` | lista com `canManageSchedule`, `canManageSongs`, `isMember`, `membersCount`, `schedulesCount`, `tasksCount`, `resourcesCount`, `songsCount`, `modules`, `isActive`, `leader` |
| Lista — linha de cada cartão | `GET /api/church/departments/:id/schedules` | uma chamada por cartão (só ministérios com a aba Escalas). A ordem da API não importa: o front ordena por data |
| Assistente / atalho "Criar os mais comuns" | `POST /api/church/departments` | body `{ name, type, leaderId, modules, scheduleConfig }`; atalho cria Louvor (`WORSHIP`), Recepção (`RECEPTION`) e Infantil (`KIDS`) em sequência, com o usuário como líder |
| Configurar / Desativar | `PATCH /api/church/departments/:id` | body parcial `{ name?, type?, leaderId?, isActive?, modules?, scheduleConfig? }`; a resposta não traz `canManage*`/`isMember` (o front mantém os de antes) |
| Excluir | `DELETE /api/church/departments/:id` | só pastor/admin |
| Pessoas | `GET /api/church/departments/:id/schedule-managers` | membros do ministério `[{ id, function, isPrimary, user: { id, name, email } }]` |
| Pessoas — adicionar várias | `POST /api/church/departments/:id/members` | uma chamada por pessoa, body `{ userId }`; "Desfazer" de remover chama de novo |
| Pessoas — tirar | `DELETE /api/church/departments/:id/members/:userId` | |
| Pessoas — lista da igreja | `GET /api/church/members` | só para quem gerencia membros; para os demais a demo deve devolver `{ error, status: 409 }` e a janela mostra o aviso |
| Pessoas — cargos | `GET /api/church/roles`, `POST /api/church/members/:id/roles`, `DELETE /api/church/members/:id/roles/:roleId` | cargos `scope: "MINISTRY"` com `departmentId` deste ministério |
| Página (`/ministery/:id`) | `GET /api/church/departments/:id` | igual ao item da lista |
| Início (líder) | `GET /api/church/departments/:id/tasks` | só quando a aba Tarefas está ligada, para contar atrasadas |
| Escalas | `GET …/schedules`, `PATCH /api/church/schedules/:id/assignments`, `POST /api/church/schedules/:id/reminders` (→ `{ success, notifiedCount }`), `DELETE /api/church/schedules/:id`, `POST /api/church/schedules/:id/assignment-conflicts` | |
| Editor de escala | `POST /api/church/departments/:id/schedules`, `PATCH /api/church/schedules/:id`, `GET /api/church/service-occurrences?…`, `GET /api/church/service-occurrences/:id` | `?culto=<id>` usa o GET por id |
| Repertório | `GET/POST …/songs`, `PATCH/DELETE …/songs/:songId`, `POST …/songs/mix`, `POST …/songs/import-pdf/preview`, `POST …/songs/import-pdf/confirm`, `GET/PATCH /api/church/songs/:id/preference` | |
| Materiais / Aulas | `GET/POST …/resources`, `PATCH/DELETE …/resources/:resourceId`, `POST …/uploads/pdf` | Aulas = `category: "ACTIVITY"` |
| Crianças | endpoints de `useChildrenMinistry` (sem mudança) | |

Exemplo de ministério na lista:

```json
{
  "id": "louvor",
  "name": "Louvor",
  "type": "WORSHIP",
  "isActive": true,
  "modules": ["SCHEDULES", "SONGS", "RESOURCES"],
  "scheduleConfig": null,
  "leaderId": "user-1",
  "leader": { "id": "user-1", "name": "Carlos Mendes", "email": "carlos@ex.com" },
  "canManageSchedule": true,
  "canManageSongs": true,
  "isMember": true,
  "membersCount": 6,
  "schedulesCount": 4,
  "tasksCount": 0,
  "resourcesCount": 3,
  "songsCount": 24
}
```
