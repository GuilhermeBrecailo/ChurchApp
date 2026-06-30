## 1. Backend — Endpoints de Relatório

- [x] 1.1 Criar adapter `reportAdapters.ts` em `api/src/interfaces/adapters/` com guard de role pastor/adm em todos os handlers
- [x] 1.2 Handler `getConfirmationReport`: query `prisma.scheduleAssignment.groupBy({ by: ['confirmationStatus', 'scheduleId'], where: { schedule: { crunchId, date: { gte: dateFrom } } }, _count: true })`; retornar agrupado por escala com totais por status
- [x] 1.3 Handler `getAttendanceReport`: query similar com `attendanceStatus`; calcular taxa de presença (attendedAt / total) por período
- [x] 1.4 Handler `getMembersReport`: `prisma.scheduleAssignment.groupBy({ by: ['userId'], where: {...}, _count: { confirmationStatus: true } })` agrupado por usuário; incluir nome via join com `User`
- [x] 1.5 Criar `ReportRoutes.ts` registrando `GET /api/church/reports/confirmations`, `GET /api/church/reports/attendance`, `GET /api/church/reports/members` — todos aceitando query params `?days=30&departmentId=...`
- [x] 1.6 Registrar rotas no `server.ts`

## 2. Frontend — Composable

- [x] 2.1 Criar `web/composables/useReports.ts` com `getConfirmationReport(params)`, `getAttendanceReport(params)`, `getMembersReport(params)` e states reativos `loading`, `error`

## 3. Frontend — Componente Admin/Reports

- [x] 3.1 Criar componente `web/app/components/Admin/Reports/index.vue` com:
  - Filtros no topo: `v-select` "Período" (30/60/90 dias) e `v-select` "Ministério" (todos ou específico)
  - `v-tabs` com 3 abas: "Confirmação", "Presença", "Membros"
  - Aba Confirmação: `v-data-table` com colunas Escala, Data, Confirmados, Recusados, Pendentes
  - Aba Presença: cards de stat (%) + tabela de detalhes
  - Aba Membros: `v-data-table` com colunas Nome, Total, Confirmados, Recusados, Ausentes, ordenável por ausências

## 4. Frontend — Integração no Admin

- [x] 4.1 Adicionar nova aba "Relatórios" em `web/app/pages/admin.vue` renderizando `<AdminReports />`
- [x] 4.2 Condicionar à role pastor/adm
