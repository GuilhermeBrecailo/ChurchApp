## Context

O app usa Nuxt 4 + Vuetify 4 no frontend e Fastify + Prisma no backend. A funcionalidade de escala existe em `web/app/pages/scale.vue` (2k linhas), com o composable `web/composables/useDepartments.ts` fazendo as chamadas à API. O endpoint `PATCH /api/church/schedules/:id/my-assignment` em `churchDepartmentAdapters.ts` persiste a resposta no model `ScheduleAssignment`. Atualmente não há campo para motivo de recusa.

## Goals / Non-Goals

**Goals:**
- Capturar motivo de recusa via dialog antes de enviar DECLINED ao backend
- Persistir `declineReason` no `ScheduleAssignment` via migration Prisma
- Exibir motivo no painel de gestão da escala (ministro/pastor/adm) via tooltip
- Incluir motivo na notificação push quando preenchido

**Non-Goals:**
- Tornar o campo obrigatório (o voluntário pode declinar sem motivo)
- Histórico de motivos anteriores
- Edição do motivo após o envio

## Decisions

### 1. Dialog de confirmação inline em `scale.vue`
Usar `v-dialog` do Vuetify com `v-textarea` dentro do próprio `scale.vue`, controlado por uma variável reativa `declineDialog: { open, scheduleId, reason }`. Evita criar novo componente para algo de baixa complexidade já dentro de um arquivo com outros dialogs similares.

**Alternativa descartada**: Novo componente `DeclineReasonDialog.vue` — desnecessário dado que scale.vue já possui padrão de dialogs inline.

### 2. Campo `declineReason String?` na model Prisma
Adicionar campo nullable diretamente em `ScheduleAssignment`. Não impacta registros existentes (null por padrão). Limpar o campo quando o status mudar para CONFIRMED ou outro não-DECLINED.

### 3. Tooltip com ícone `mdi-information-outline` no painel de gestão
Exibir `v-tooltip` ao lado do chip de status "Não pode" quando `declineReason` estiver preenchido. Solução menos invasiva que expandir linhas ou adicionar coluna — preserva o layout atual da lista de assignments.

**Alternativa descartada**: Coluna separada — aumenta a densidade da tabela desnecessariamente.

### 4. Notificação com motivo concatenado
Quando `declineReason` for preenchido, concatenar ao texto da notificação: `"marcou que nao pode ir: <motivo>"`. Simples e não requer mudança de estrutura de notificação.

### 5. Controle de visibilidade por role no frontend
Usar o sistema de roles já existente no app para condicionar a exibição do motivo. Apenas usuários com `isLeader`, `isAdmin` ou `isPastor` enxergam o tooltip. O campo `declineReason` é retornado pelo backend apenas no endpoint de gestão (assignments do líder), não no endpoint do voluntário.

## Risks / Trade-offs

- **Segurança**: O campo `declineReason` deve ser retornado apenas em endpoints de gestão, não exposto para todos os membros. → Verificar selects Prisma nos endpoints de listagem para não incluir o campo desnecessariamente.
- **Performance**: Nenhum impacto — campo nullable simples.
- **UX**: O dialog adiciona um passo ao fluxo de "Não posso". Campo opcional minimiza atrito. → Botão "Confirmar" habilitado sempre (não exige preenchimento).

## Migration Plan

1. Adicionar `declineReason String?` ao model `ScheduleAssignment` no schema.prisma
2. Rodar `npx prisma migrate dev --name add-decline-reason`
3. Deploy backend com campo novo (backwards-compatible — nullable)
4. Deploy frontend com dialog e exibição de motivo

## Open Questions

- O motivo deve aparecer no card resumido da escala (`ScheduleCard.vue`) ou apenas no dialog de detalhes? → Assumido: apenas no dialog de detalhes/gestão (menos ruído no card).
