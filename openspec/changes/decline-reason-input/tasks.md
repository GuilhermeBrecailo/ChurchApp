## 1. Backend — Migration e Schema

- [x] 1.1 Adicionar campo `declineReason String?` ao model `ScheduleAssignment` em `api/src/infrastructure/database/prisma/schema.prisma`
- [x] 1.2 Rodar `npx prisma migrate dev --name add-decline-reason` dentro de `api/`

## 2. Backend — Endpoint de atualização

- [x] 2.1 Atualizar tipo do body em `updateMyChurchScheduleAssignment` (`churchDepartmentAdapters.ts`) para aceitar campo opcional `declineReason?: string`
- [x] 2.2 No bloco de update Prisma, incluir `declineReason: body.declineReason ?? null` quando a ação for `DECLINED`, e `declineReason: null` quando for `CONFIRMED`
- [x] 2.3 Incluir `declineReason` no `select` do update para retornar o campo na resposta
- [x] 2.4 Atualizar mensagem da notificação push: quando `declineReason` estiver preenchido, concatenar ao texto `"marcou que nao pode ir: <motivo>"`

## 3. Backend — Endpoint de listagem para gestão

- [x] 3.1 Verificar o(s) endpoint(s) que retornam assignments para líderes/adm e incluir `declineReason` no `select` Prisma correspondente

## 4. Frontend — Composable

- [x] 4.1 Atualizar a interface `UpdateMyScheduleAssignmentDTO` em `web/composables/useDepartments.ts` adicionando `declineReason?: string`
- [x] 4.2 Garantir que `updateMyScheduleAssignment` passa o campo `declineReason` no corpo da requisição

## 5. Frontend — Dialog de motivo em `scale.vue`

- [x] 5.1 Adicionar estado reativo `declineDialog: { open: boolean, scheduleId: string | null, reason: string }` no setup de `scale.vue`
- [x] 5.2 Substituir a chamada direta de `handleDeclineSchedule` para abrir o dialog em vez de enviar imediatamente
- [x] 5.3 Criar o template do `v-dialog` com título "Por que você não pode ir?", `v-textarea` para o motivo, botão "Cancelar" (fecha dialog sem ação) e botão "Confirmar" (chama `handleDeclineSchedule` com o motivo e fecha o dialog)
- [x] 5.4 Atualizar `handleDeclineSchedule` (ou `updateMyScheduleResponse`) para receber e passar `declineReason` ao composable

## 6. Frontend — Exibição do motivo no painel de gestão

- [x] 6.1 Identificar onde os assignments são listados para ministro/pastor/adm em `scale.vue` (dialog de detalhes/gestão da escala)
- [x] 6.2 Ao lado do chip/label de status "Não pode", exibir `v-tooltip` com ícone `mdi-information-outline` quando `assignment.declineReason` estiver preenchido
- [x] 6.3 Condicionar a exibição do motivo à role do usuário (apenas `isLeader`, `isAdmin` ou `isPastor`)
