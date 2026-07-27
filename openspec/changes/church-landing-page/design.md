## Context

O AppChurch hoje é 100% autenticado: `web/app/middleware/auth.global.ts` bloqueia qualquer rota que não esteja em `publicRoutes` (`/login`, `/register`, `/forgot-password`), e no backend `TenantHandler.ts` exige `Authorization: Bearer` em qualquer path que não comece com `/public` ou não esteja no `Set` de rotas públicas. Não existe nenhuma rota realmente pública hoje (a proposta anterior `church-profile-page` nunca foi implementada). `Crunch` não tem `slug` nem cor de identidade — só `logo`. Conteúdo publicável (`Announcement`, `DailyVerse`, `Devotional`, `PrayerRequest`) é sempre interno, visível só para quem tem `crunchId` e token válido. Push notification (`PushSubscription`) é sempre atrelado a `userId` (obrigatório), então hoje é impossível um visitante sem conta se inscrever.

Ministérios (`Department`) têm um único `leaderId`; a edição de escala/repertório hoje é restrita a pastor + esse líder único (não há delegação por ministério).

## Goals / Non-Goals

**Goals:**
- Landing pública por igreja em rota própria (`/c/:slug`), sem exigir login, com identidade visual da igreja.
- Pastor consegue, de forma fácil, publicar avisos/palavras/orações que aparecem na landing.
- Pastor cadastra horários recorrentes de culto, exibidos como "próximos cultos" (semana/mês) na landing e no dashboard interno.
- Visitante que abre a landing pela primeira vez é convidado a ativar notificações push daquela igreja, sem precisar de conta.
- Pastor ou líder titular pode delegar a gestão de escala/repertório de um ministério específico para outras pessoas, além do líder único atual.

**Non-Goals:**
- Não vamos migrar a landing pública para um domínio próprio por igreja (custom domain) — só path `/c/:slug` no mesmo app.
- Não vamos construir um calendário genérico com eventos arbitrários — só horários recorrentes de culto + o que já existe em `Schedule`/`Announcement`.
- Não vamos reformular o sistema de `ChurchRole`/permissões globais existente — a delegação por ministério é aditiva e local ao `Department`.
- Push para visitante anônimo é só broadcast por igreja (não por segmento/ministério) nesta primeira versão.

## Decisions

### 1. Rota pública `/c/:slug` fora do middleware de auth
`web/app/middleware/auth.global.ts` ganha `/c` na lista `publicRoutes` (com match por prefixo, já suportado pelo `startsWith`). A página usa um layout novo `public.vue` (sem bottom nav, sem appbar autenticado), similar ao `notAppBottom.vue` já existente, mas sem nenhuma dependência de sessão.

Alternativa considerada: página fora do diretório `app/pages` roteada manualmente — rejeitada porque quebra o file-based routing do Nuxt sem ganho real.

### 2. `slug` como identificador público, `inviteCode` continua privado
`Crunch.slug` é `String @unique`, gerado a partir do nome no primeiro save (kebab-case, com sufixo numérico em colisão) e editável pelo pastor em `/admin`. Mantemos `inviteCode` como está (uso interno de convite), não reaproveitamos para a URL pública porque `inviteCode` é sensível (dá join direto na igreja) e o `slug` é deliberadamente público.

### 3. Rotas backend públicas usam prefixo literal `/public/...`
`TenantHandler.isPublicRequest` já libera qualquer path que comece com `/public`. Em vez de adicionar cada rota nova ao `Set` de exceções (frágil, fácil esquecer), as rotas novas usam o prefixo que já é tratado como público:
- `GET /public/church/:slug` — dados da igreja (nome, logo, `accentColor`, horários de culto, feed público).
- `POST /public/church/:slug/notifications/subscribe` / `DELETE .../subscribe` — inscrição push anônima.

Isso mantém consistência com o único mecanismo de "rota pública" que o backend já reconhece, em vez de criar um segundo padrão.

### 4. Conteúdo público reaproveita `Announcement`, não cria modelo novo
"Avisos", "palavras do pastor" e "orações" na landing são todos publicados pelo mesmo fluxo simples que já existe para avisos internos (`Announcement`), com dois campos novos:
- `isPublic Boolean @default(false)` — controla se aparece em `/c/:slug`.
- `kind String @default("ANNOUNCEMENT")` — `ANNOUNCEMENT | PASTOR_MESSAGE | PRAYER`, só para diferenciar o rótulo/ícone exibido.

Alternativa considerada: criar `PastorMessage` e `PublicPrayer` como models novos — rejeitada porque duplicaria CRUD, permissão e UI que já existem para `Announcement`, contrariando o pedido do usuário de que a publicação seja "o mais fácil possível" para o pastor. Reaproveitar o formulário de avisos com um seletor de tipo + toggle "público" é a forma mais simples de entregar isso.

### 5. Horários de culto: novo model `ServiceTime`, recorrente e simples
```
model ServiceTime {
  id        String   @id @default(uuid())
  label     String            // "Culto de Celebração", "Culto de Oração"
  weekday   Int               // 0-6 (domingo-sábado)
  time      String            // "19:00"
  isActive  Boolean  @default(true)
  crunchId  String
  crunch    Crunch   @relation(fields: [crunchId], references: [id], onDelete: Cascade)
}
```
A landing e o dashboard calculam as "próximas datas" no frontend/backend a partir de `weekday + time`, projetando os próximos 7/30 dias — não precisamos de um model de calendário completo, nem depender do `Schedule` (que é por ministério e serve outro propósito). Isso evita acoplar a landing pública à complexidade de escalas internas.

### 6. Push para visitante anônimo: `PushSubscription` ganha owner opcional
`PushSubscription.userId` passa a ser opcional; adiciona-se `crunchId String?`. Regra: exatamente um dos dois deve estar preenchido (validado na aplicação, não via constraint de banco — Prisma não suporta XOR nativamente). Broadcast para "todos os inscritos públicos da igreja X" filtra por `crunchId = X AND userId IS NULL`. O envio via `web-push` já existente (`PushNotificationService`) é reaproveitado sem mudança de infraestrutura, só passa a aceitar uma lista de subscriptions vinda de qualquer uma das duas origens.

Alternativa considerada: exigir cadastro leve (nome/e-mail) do visitante antes de assinar — rejeitada por adicionar fricção exatamente onde o pedido era "pede pra ativar as notificações" logo na entrada, sem barreira.

### 7. Delegação de escala por ministério: `UserDepartmentMembership.canManageSchedule`
Em vez de um model novo (`DepartmentManager`), reaproveita-se `UserDepartmentMembership` (já vincula usuário a ministério) com um campo novo:
```
canManageSchedule Boolean @default(false)
```
Regra de permissão nos endpoints de escala/repertório do ministério (`ChurchDepartmentRoutes`/`churchDepartmentAdapters`): pastor **OU** `department.leaderId === user.id` **OU** existe `UserDepartmentMembership` do usuário nesse `departmentId` com `canManageSchedule = true`. UI de gestão fica na tela de detalhe do ministério (`ministery/[id].vue`), visível só para pastor/líder titular.

Alternativa considerada: usar o `ChurchRole` global (`MANAGE_SCHEDULES`) — rejeitada porque esse permission é igreja-wide (dá acesso a escalas de *todos* os ministérios), enquanto o pedido é delegação pontual por ministério.

### 8. Notificação de "novo conteúdo público" para quem já é membro
Quando um `Announcement` público é criado, o fluxo de push existente (`PushNotificationService`) dispara tanto para membros autenticados da igreja (via `PushSubscription.userId`) quanto para inscritos anônimos (via `PushSubscription.crunchId`), evitando dois caminhos de notificação divergentes.

## Risks / Trade-offs

- [Risco] Slug pode colidir com nomes de rota já existentes do app (`/c/login` etc.) → Mitigação: prefixo fixo `/c/` já isola do namespace de rotas internas; validação de slug rejeita valores reservados (`admin`, `login`, `api`, etc.) na criação.
- [Risco] Subscription anônima pode ser usada para spam/abuso (qualquer um assina sem login) → Mitigação: rate limit simples por IP no endpoint de subscribe (reaproveita padrão de outros endpoints públicos se existir; caso não exista, tratar como débito técnico documentado em Open Questions).
- [Risco] Igrejas antigas sem `slug` preenchido quebram links existentes → Mitigação: migration faz backfill do `slug` a partir do `name` (slugify + sufixo incremental em colisão) para todas as igrejas existentes.
- [Trade-off] Calcular "próximos cultos" no momento da requisição (sem persistir datas concretas) é mais simples, mas não permite cancelar/alterar uma ocorrência pontual (ex: culto de um domingo específico cancelado). Aceito para v1; fica como Open Question.

## Migration Plan

1. Migration Prisma: `Crunch.slug` (+ backfill), `Crunch.accentColor`, `Announcement.isPublic`/`kind` (default `false`/`"ANNOUNCEMENT"` — não quebra dados existentes), novo model `ServiceTime`, `PushSubscription.userId` opcional + `PushSubscription.crunchId`, `UserDepartmentMembership.canManageSchedule` (default `false`).
2. Deploy backend com as novas rotas `/public/church/:slug` e `/public/church/:slug/notifications/subscribe`.
3. Deploy frontend com a página `/c/[slug].vue`, ajuste no middleware de auth e nas telas de admin/ministério.
4. Rollback: todas as colunas novas são opcionais/têm default, então reverter é seguro sem perda de dados; a migration de `ServiceTime` e a nova tabela podem ser dropadas sem impacto em outros models.

## Open Questions

- Cancelar/alterar uma ocorrência específica de `ServiceTime` (ex: "não teremos culto neste domingo por reforma") fica para uma iteração futura ou entra nesta mesma change como exceção simples (`ServiceTimeException`)? Proposta: deixar fora do escopo agora, documentar como próximo passo.
- Rate limiting de endpoints públicos (subscribe anônimo, `GET /public/church/:slug`) — o projeto não tem um mecanismo padrão hoje. Vale usar `@fastify/rate-limit` já nesta change ou tratar como débito técnico?
