## Context

O app usa Nuxt 4 + Vuetify 4 no frontend e Fastify + Prisma no backend. Os models `ScheduleAssignment` (com `confirmationStatus`, `attendanceStatus`, `attendedAt`, `confirmedAt`, `declineReason`), `Schedule` e `Department` já têm todos os dados necessários. O Prisma suporta queries de agregação (`groupBy`, `count`, `_count`). O painel `/admin` (`pages/admin.vue`) já usa tabs para separar seções.

## Goals / Non-Goals

**Goals:**
- Relatório de confirmação: taxa de confirmados/recusados/pendentes por escala ou período
- Relatório de presença: taxa de presença (attendanceStatus) por período
- Relatório de membros: voluntários com mais ausências ou trocas no período
- Filtros por ministério e período (30/60/90 dias)

**Non-Goals:**
- Gráficos vetoriais (Chart.js, D3) — usar tabelas e cards de stat
- Exportação para CSV/PDF na v1
- Relatório financeiro
- Comparativo entre ministérios em gráfico de barras

## Decisions

### 1. Agregações no backend, não no frontend
As queries de `groupBy` + `count` ficam no backend (Prisma). O frontend recebe dados já agregados e prontos para exibir. Evita enviar registros brutos que o frontend processaria, o que não escala.

### 2. Vuetify `v-data-table` e cards de stats, sem biblioteca de gráficos
O projeto não usa Chart.js ou similar. Instalar uma biblioteca pesada para relatórios em v1 não compensa. `v-data-table` do Vuetify e cards numéricos (mesmo padrão dos `.leader-summary-card` em `scale.vue`) são suficientes.

**Alternativa descartada**: Integração com Chart.js — aumenta bundle size e dependência sem necessidade imediata.

### 3. Nova aba "Relatórios" em `/admin`
O padrão do projeto é adicionar seções no admin como tabs ou cards. Uma aba dedicada mantém a consistência.

### 4. Período em query param, calculado no backend
O endpoint recebe `?days=30` (ou `dateFrom`/`dateTo`) e filtra no banco. Sem lógica de data no frontend.

## Risks / Trade-offs

- **Performance**: Queries de agregação em tabelas grandes podem ser lentas. → Adicionar índice em `ScheduleAssignment(scheduleId, confirmationStatus)` se necessário.
- **Permissão**: Relatórios são sensíveis — apenas pastor/adm devem ver. → Verificar guard de role nos endpoints de relatório.

## Migration Plan

Sem migration de schema. Possível adição de índices em migration separada se necessário após testes de performance.
