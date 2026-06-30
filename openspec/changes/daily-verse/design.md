## Context

O app usa Nuxt 4 + Vuetify 4 no frontend e Fastify + Prisma no backend. O dashboard (`pages/index.vue`) já exibe `DashboardNextScheduleCard`, `DashboardQuickAccess` e `DashboardUpcomingEvents`. A autenticação usa JWT com o usuário disponível via `useAuth()`. O painel `/admin` (`pages/admin.vue`) gerencia membros, ministérios e roles — é o lugar natural para publicação de conteúdo pela liderança. Notificações push (`PushNotificationService`) já existem e podem ser aproveitadas para notificar a publicação de um novo versículo.

## Goals / Non-Goals

**Goals:**
- Pastor/adm publica versículo com referência e comentário opcional
- Card do versículo aparece no dashboard de todos os membros da igreja
- Histórico de versículos acessível em `/content/verse`
- Formulário de publicação em `/admin`

**Non-Goals:**
- Agendamento de versículos para datas futuras
- Múltiplos versículos no mesmo dia
- Comentários ou reações dos membros
- Integração com API de Bíblia para autocomplete de referência

## Decisions

### 1. Model simples, sem scheduling
`DailyVerse` armazena `publishedAt` como a data de publicação manual. O "versículo do dia" é sempre o registro com `publishedAt` mais recente para a `crunchId` do usuário. Não há fila ou agendamento — pastor publica quando quiser.

**Alternativa descartada**: Campo `scheduledFor: DateTime` para agendamento — adiciona complexidade de estado (publicado/agendado) desnecessária neste momento.

### 2. Escopo por `crunchId` (multi-tenant)
Cada versículo pertence a uma igreja (`crunchId`). O endpoint GET filtra pelo `crunchId` do usuário autenticado, seguindo o padrão já usado em `Schedule`, `Department` e `Announcement`.

### 3. Form de publicação em `/admin`, seção "Conteúdo"
O admin já centraliza operações da liderança. Criar uma sub-seção "Conteúdo" (aba ou card) em `admin.vue` mantém a consistência do padrão do projeto em vez de criar nova página.

**Alternativa descartada**: Página `/admin/content` separada — fragmenta a navegação do admin sem ganho proporcional.

### 4. Notificação push ao publicar (opcional na v1)
O `PushNotificationService` já existe. Ao publicar versículo, pode enviar push para todos os membros da igreja. Implementar como opt-in (checkbox no form do admin) para não sobrecarregar notificações.

## Risks / Trade-offs

- **Sobrecarga de push**: Se a notificação push for automática ao publicar, membros podem desativar notificações. → Implementar como checkbox opt-in.
- **Multi-tenant**: Garantir que o endpoint GET nunca retorne versículos de outra igreja. → Sempre filtrar por `crunchId` extraído do JWT.

## Migration Plan

1. Adicionar model `DailyVerse` ao `schema.prisma`
2. Rodar `npx prisma migrate dev --name add-daily-verse` dentro de `api/`
3. Implementar endpoints e adapters
4. Deploy backend (backwards-compatible — nova tabela isolada)
5. Deploy frontend com card no dashboard e form no admin
