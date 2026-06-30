## Context

O app usa Nuxt 4 + Vuetify 4 no frontend e Fastify + Prisma no backend. O model `UserUnavailableDate { id, date, reason?, userId }` já existe no schema com constraint `@@unique([userId, date])`. A página `/user` (`pages/user.vue`) exibe dados do perfil do membro e é o local natural para gerenciar indisponibilidades pessoais. O modal de criação de escala em `ministery/[id].vue` é onde o líder define quem entra na escala — é onde o aviso de conflito deve aparecer.

## Goals / Non-Goals

**Goals:**
- Voluntário cadastra e remove datas de indisponibilidade em `/user`
- Líder vê aviso de conflito ao selecionar membro com data indisponível na criação de escala

**Non-Goals:**
- Período de indisponibilidade (intervalo de datas) — apenas datas individuais na v1
- Aprovação de indisponibilidade pela liderança
- Calendário visual (usar lista com date picker)
- Sincronizar com Google Calendar

## Decisions

### 1. Date picker + lista em `/user`, sem calendário visual
Usar `v-date-picker` do Vuetify (já disponível no projeto) para selecionar a data e uma lista das datas cadastradas com botão de remoção. Calendário visual completo seria over-engineering para v1.

### 2. Aviso não bloqueante na criação de escala
Ao selecionar um membro para uma escala, se ele tem `UserUnavailableDate` para aquela data, um chip de aviso amarelo aparece ao lado do nome. Não bloqueia a adição — o líder decide. Apenas informa.

**Alternativa descartada**: Bloquear a seleção — muito rígido para a realidade de igrejas onde situações de exceção são frequentes.

### 3. CRUD simples sem soft delete
Remoção é física. Não há histórico de indisponibilidades passadas necessário para a v1.

### 4. Endpoint de consulta do líder filtrado por data da escala
`GET /api/church/members/:id/unavailable-dates?date=YYYY-MM-DD` retorna se o membro tem aquela data marcada. O frontend do modal de escala faz essa chamada ao selecionar cada membro.

## Risks / Trade-offs

- **N+1 no modal de escala**: Se o líder consultar indisponibilidade membro a membro no modal, pode gerar muitas chamadas. → Carregar todas as indisponibilidades dos membros da escala de uma vez em endpoint batch.

## Migration Plan

Sem migration — model `UserUnavailableDate` já existe. Apenas endpoints e UI novos.
