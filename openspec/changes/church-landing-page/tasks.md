## 1. Banco de dados (Prisma)

- [x] 1.1 Adicionar `slug String @unique` e `accentColor String?` ao model `Crunch`
- [x] 1.2 Adicionar `isPublic Boolean @default(false)` e `kind String @default("ANNOUNCEMENT")` ao model `Announcement`
- [x] 1.3 Criar model `ServiceTime` (`id`, `label`, `weekday`, `time`, `isActive`, `crunchId`) com relação em `Crunch`
- [x] 1.4 Tornar `PushSubscription.userId` opcional e adicionar `crunchId String?` + relação opcional com `Crunch`
- [x] 1.5 Adicionar `canManageSchedule Boolean @default(false)` ao model `UserDepartmentMembership`
- [x] 1.6 Criar migration com backfill de `slug` para igrejas existentes (slugify do `name`, sufixo incremental em colisão)
- [x] 1.7 Rodar `prisma migrate dev` e `prisma generate` localmente e validar migration (`prisma generate` ok; `migrate dev` não rodou por falta de banco local acessível no ambiente do agente — aplicar manualmente contra o Postgres real)

## 2. Backend: igreja pública e slug

- [x] 2.1 Adicionar validação e geração de `slug` no `CreateCrunchUseCase` (kebab-case, unicidade, sufixo em colisão)
- [x] 2.2 Adicionar suporte a atualizar `slug` e `accentColor` no `UpdateCrunchUseCase`/`UpdateCrunchService` (rejeitar slug em uso, validar formato e lista de valores reservados)
- [x] 2.3 Criar `GetPublicChurchBySlugUseCase` retornando apenas os campos públicos (nome, logo, accentColor, isActive)
- [x] 2.4 Criar rota `GET /public/church/:slug` (novo `PublicChurchRoutes.ts` + adapter), retornando 404 para slug inexistente ou igreja inativa
- [x] 2.5 Registrar `PublicChurchRoutes` em `server.ts`

## 3. Backend: horários de culto (ServiceTime)

- [x] 3.1 Criar entidade de domínio `ServiceTime` + repositório (`IServiceTimeRepository`, `ServiceTimeRepository`)
- [x] 3.2 Criar use-cases: criar, listar por igreja, atualizar, ativar/desativar
- [x] 3.3 Criar rotas autenticadas `GET/POST/PATCH /api/church/service-times` (pastor/permissão de comunicação) em `ChurchDepartmentRoutes.ts` ou novo `ServiceTimeRoutes.ts`
- [x] 3.4 Criar rota pública `GET /public/church/:slug/service-times` retornando horários ativos + próximas ocorrências calculadas (semana/mês)
- [x] 3.5 Testes unitários do cálculo de próximas ocorrências (casos: sem horários, múltiplos horários, virada de semana/mês)

## 4. Backend: conteúdo público (Announcement)

- [x] 4.1 Atualizar `announcementAdapters`/use-cases para aceitar `isPublic` e `kind` na criação e edição
- [x] 4.2 Validar `kind` (`ANNOUNCEMENT | PASTOR_MESSAGE | PRAYER`) com Zod
- [x] 4.3 Adicionar rota pública `GET /public/church/:slug` (ou endpoint dedicado) para retornar itens `isPublic = true` e não expirados, ordenados por `pinned` e `publishedAt`
- [x] 4.4 Garantir que a permissão de criar/editar `isPublic` segue a mesma regra de `SEND_NOTIFICATIONS`/comunicação já existente (pastor ou permissão equivalente)

## 5. Backend: push notification anônimo por igreja

- [x] 5.1 Atualizar `PushSubscription` no repositório/serviço para aceitar subscription por `crunchId` (sem `userId`)
- [x] 5.2 Criar rotas públicas `POST /public/church/:slug/notifications/subscribe` e `DELETE /public/church/:slug/notifications/subscribe`
- [x] 5.3 Atualizar `PushNotificationService` para, ao notificar sobre novo conteúdo público, enviar tanto para `PushSubscription` de membros (`userId`) quanto de visitantes anônimos (`crunchId`) daquela igreja
- [x] 5.4 Disparar notificação push quando um `Announcement` público (`isPublic = true`) é publicado

## 6. Backend: delegação de escala por ministério

- [x] 6.1 Adicionar `canManageSchedule` ao DTO/entidade de `UserDepartmentMembership` e ao use-case de atualização de membership
- [x] 6.2 Criar endpoint para o líder/pastor listar membros do ministério e alternar `canManageSchedule`
- [x] 6.3 Atualizar checagem de permissão nos endpoints de escala e repertório (`churchDepartmentAdapters`: create/update/delete schedule, songs, reorder, assignments) para aceitar pastor OU `department.leaderId` OU membership com `canManageSchedule = true`
- [x] 6.4 Testes cobrindo: líder titular, gestor delegado, gestor de outro ministério (deve falhar), membro comum (deve falhar)

## 7. Frontend: infraestrutura de rota pública

- [x] 7.1 Adicionar `/c` à lista `publicRoutes` em `web/app/middleware/auth.global.ts` (match por prefixo)
- [x] 7.2 Criar layout `web/app/layouts/public.vue` sem appbar autenticado nem bottom nav
- [x] 7.3 Criar composable `useChurchLanding.ts` para buscar dados públicos (`GET /public/church/:slug`, `GET /public/church/:slug/service-times`)

## 8. Frontend: página da landing

- [x] 8.1 Criar página `web/app/pages/c/[slug].vue` usando o layout `public`
- [x] 8.2 Construir seção de identidade (logo, nome, cor de destaque aplicada via CSS var)
- [x] 8.3 Construir seção "Próximos cultos" (lista/calendário semana e mês) a partir do composable
- [x] 8.4 Construir feed público (avisos, palavra do pastor, orações) com ícone/rótulo por `kind`
- [x] 8.5 Tratar estado "igreja não encontrada" (404) com página amigável
- [x] 8.6 Garantir responsividade mobile-first e visual moderno (gradiente/hero com logo + cor de destaque)

## 9. Frontend: prompt de notificação para visitante

- [x] 9.1 Estender `usePushNotifications.ts` (ou criar variante) para suportar fluxo anônimo por `crunchId`, usando `localStorage`/`sessionStorage` para não repetir o convite após recusa
- [x] 9.2 Criar componente de prompt (banner/modal) exibido no primeiro acesso à landing, condicionado a suporte do navegador e permissão ainda não decidida
- [x] 9.3 Não exibir o prompt anônimo quando o visitante já está autenticado e é membro da igreja com push já ativado

## 10. Frontend: admin - publicação de conteúdo

- [x] 10.1 Adicionar seletor de tipo (Aviso/Palavra do Pastor/Oração) e toggle "Público (aparece na landing)" ao formulário de avisos em `pages/admin.vue`
- [x] 10.2 Atualizar `useAnnouncements.ts` para enviar/receber `isPublic` e `kind`
- [x] 10.3 Adicionar seção "Horários de culto" em `/admin` (listar, criar, editar, desativar) usando novo composable `useServiceTimes.ts`
- [x] 10.4 Adicionar campo de edição de `slug` (com preview da URL pública) e `accentColor` na tela de dados da igreja em `/admin`

## 11. Frontend: admin - delegação por ministério

- [x] 11.1 Adicionar seção "Gestores de escala" no detalhe do ministério (`pages/ministery/[id].vue`), visível para pastor/líder titular
- [x] 11.2 Listar membros do ministério com toggle de `canManageSchedule`
- [x] 11.3 Atualizar `usePermissions.ts`/composable de ministério para considerar `canManageSchedule` ao habilitar botões de editar escala/repertório na UI

## 12. Documentação e fechamento

- [x] 12.1 Atualizar `docs/backend` e `docs/frontend` relevantes (rotas, entidades, páginas) com os novos itens
- [x] 12.2 Atualizar `README.md` (Destaques, Perfis e permissões) mencionando landing pública, gestor delegado e visitante público
- [x] 12.3 Rodar `npm run validate` na raiz e corrigir eventuais quebras (corrigido 1 erro de lint em `serviceTimeAdapters.ts`; lint, typecheck, testes da API e build da web passaram)
- [ ] 12.4 Testar manualmente o fluxo completo: pastor edita slug → publica palavra/oração → cadastra horário → visitante abre `/c/:slug` sem login → ativa notificação → líder delega gestor de ministério → gestor edita escala (requer ambiente local com Docker/Keycloak/Postgres rodando — não disponível neste agente; pendente para o usuário)


