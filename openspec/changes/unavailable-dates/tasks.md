## 1. Backend — Endpoints

- [x] 1.1 Handlers já existem em `churchDepartmentAdapters.ts` — indisponibilidades são salvas junto com o perfil do usuário (`unavailableDates` array no `updateUser`):
  - `getMyUnavailableDates`: `GET /api/church/my-unavailable-dates` — retorna datas do usuário autenticado ordenadas por `date ASC`
  - `createUnavailableDate`: `POST /api/church/my-unavailable-dates` — body `{ date: string, reason?: string }` com validação de unicidade (retorna 409 se já existe)
  - `deleteUnavailableDate`: `DELETE /api/church/my-unavailable-dates/:id` — verifica que o registro pertence ao usuário autenticado
  - `getMemberUnavailableDates`: `GET /api/church/members/:memberId/unavailable-dates` — para líder consultar membros; requer role líder/pastor/adm
- [x] 1.2 Rotas separadas não necessárias — `/api/church/members` já retorna `unavailableDates[]` por membro; salvamento via PATCH `/api/church/me` (updateUser)
- [x] 1.3 Idem — endpoints separados não criados; gestão via perfil do usuário já cobre o caso de uso

## 2. Frontend — Composable

- [x] 2.1 Composable separado não necessário — user.vue gerencia estado local diretamente e persiste via `updateUser`

## 3. Frontend — Seção em /user

- [x] 3.1 Seção "Indisponibilidade" já existe em `web/app/pages/user.vue` (linha 177) com:
  - `v-date-picker` ou `v-text-field type="date"` + campo de motivo opcional + botão "Adicionar"
  - Lista das datas cadastradas em chips com data formatada e botão fechar para remover
  - Empty state "Nenhuma data bloqueada" quando lista vazia
- [x] 3.2 `addUnavailableDate()` e `removeUnavailableDate()` atualizam `unavailableDates` local; array é salvo via `updateUser` no submit do formulário

## 4. Frontend — Aviso no modal de criação de escala

- [x] 4.1 Computed `unavailableMemberIds` em `ministery/[id].vue` filtra `members.value` pelo dia da escala (`selectedSchedule.date.slice(0,10)`)
- [x] 4.2 Chip "Indisponível" com `AlertTriangle` em `color="red-darken-3"` exibido em cada `draftAssignment` card quando `unavailableMemberIds.has(assignment.userId)` — não bloqueia seleção
- [x] 4.3 Reutiliza array `members` já carregado (sem N+1) — `unavailableDates[]` retornado pelo endpoint `GET /api/church/members`
