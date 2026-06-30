## Context

O app usa Nuxt 4 + Vuetify 4 no frontend e Fastify + Prisma no backend. O dashboard (`pages/index.vue`) já tem seções de cards empilhadas verticalmente. O painel `/admin` já gerencia recursos da igreja. `AppNotification` existe para notificações in-app por usuário, mas não serve para avisos coletivos com texto longo e expiração — daí a necessidade de um model dedicado.

## Goals / Non-Goals

**Goals:**
- Pastor/adm cria avisos com título, corpo e expiração opcional
- Avisos aparecem no dashboard de todos os membros
- Aviso pode ser fixado (`pinned`) para aparecer antes dos demais
- Avisos expirados somem automaticamente (filtro por `expiresAt`)
- Remoção manual pelo admin

**Non-Goals:**
- Destinatários específicos (aviso vai para toda a igreja)
- Edição de aviso após publicação (v1: remover e recriar)
- Leitura confirmada por membro
- Histórico de avisos expirados na visão do membro

## Decisions

### 1. Model `Announcement` separado de `AppNotification`
`AppNotification` é 1:1 com usuário e serve para eventos individuais (escala confirmada, etc.). `Announcement` é 1:N — uma entrada, visível para todos da igreja. Modelos com responsabilidades distintas.

### 2. Filtragem de expiração no backend
O endpoint `GET /api/church/announcements` retorna apenas avisos onde `expiresAt IS NULL OR expiresAt > NOW()`, ordenados por `pinned DESC, publishedAt DESC`. O frontend não precisa fazer lógica de filtro de data.

**Alternativa descartada**: Filtrar no frontend — cria inconsistência se o dispositivo tiver fuso diferente.

### 3. `pinned` como boolean simples
Não há ordem entre avisos fixados — todos os `pinned: true` aparecem no topo em ordem cronológica. Suficiente para o volume esperado (igrejas raramente têm mais de 2-3 avisos fixados simultâneos).

### 4. Remoção lógica vs física
Remoção é física (DELETE no banco) para simplicidade. Não há auditoria de avisos na v1.

## Risks / Trade-offs

- **Spam**: Adm pode publicar muitos avisos. → Limitar exibição no dashboard a 3 avisos e link "ver todos".
- **Multi-tenant**: Avisos devem ser sempre filtrados por `crunchId`. → Verificar em todos os endpoints.

## Migration Plan

1. Adicionar model `Announcement` ao `schema.prisma`
2. Rodar migration
3. Implementar endpoints
4. Deploy backend e frontend
