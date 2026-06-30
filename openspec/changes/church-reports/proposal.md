## Why

Pastores e administradores tomam decisões sobre escalas e ministérios sem dados históricos. Os models `ScheduleAssignment` (com `confirmationStatus`, `attendanceStatus`) e `Schedule` já armazenam tudo que é necessário para calcular métricas reais. O painel `/admin` existe mas não tem nenhuma seção de relatórios.

## What Changes

- Nova seção "Relatórios" em `/admin` com três visões: **Confirmação** (% confirmados/recusados por escala), **Presença** (% comparecidos por período), **Membros** (ranking de ausências e trocas por voluntário).
- Filtros de período (últimos 30/60/90 dias ou data personalizada) e filtro por ministério.
- Dados exibidos em tabelas e indicadores numéricos (sem biblioteca de gráficos pesada — Vuetify `v-data-table` e cards de stats).
- Os cálculos acontecem no backend via queries de agregação Prisma, não no frontend.

## Capabilities

### New Capabilities

- `church-reports`: Relatórios de confirmação, presença e engajamento de voluntários via agregações do banco de dados.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Novos endpoints `GET /api/church/reports/confirmations`, `GET /api/church/reports/attendance`, `GET /api/church/reports/members` com queries Prisma `groupBy`/`count`; adapter e route seguindo padrão do projeto.
- **Frontend (web)**: Composable `useReports.ts`; componente `Admin/Reports/index.vue` com tabs para cada relatório; integrado em `pages/admin.vue` como nova aba.
- **Banco de dados**: Sem migration — usa dados existentes.
