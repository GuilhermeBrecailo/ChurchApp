## Context

O ChurchApp tem hoje dois mecanismos de autorização paralelos e desalinhados:

1. **Cargos (`ChurchRole`)** — church-wide, com permissões grossas (`MANAGE_MEMBERS`, `MANAGE_SCHEDULES`, `MANAGE_DEPARTMENTS`, `MANAGE_SONGS`, `SEND_NOTIFICATIONS`). Vinculados por FK único a `User.churchRoleId` e `ChurchMembership.churchRoleId`.
2. **Flags por membro** — `UserDepartmentMembership.canManageSongs` e `canManageSchedule`, além de `department.leaderId`.

As checagens estão espalhadas em `churchDepartmentAdapters.ts` e são inconsistentes: `assertCanManageDepartmentWithPermission` consulta a permissão do cargo, mas `assertCanManageSongs` e `canManageDepartmentSchedule` consultam **só** líder + flag por membro, ignorando o cargo. Resultado: um cargo com `MANAGE_SONGS` **não** libera adicionar música — o bug relatado.

Restrições do repo: Fastify + Prisma + PostgreSQL no backend; `controllerHandler` com contrato de erro não-padrão (`DomainError` → HTTP 200 com `{ error, status: 409 }`); multi-tenant via `request.churchContext` resolvido em `churchContext.ts`; multi-igreja via `ChurchMembership`. Frontend Nuxt/Vue/Vuetify, com API só nas composables. App em estágio MVP (pouco/nenhum dado de produção), o que dá folga para uma migração com data-fix.

## Goals / Non-Goals

**Goals:**
- Cargos com alcance (igreja/ministério) e permissões granulares por ação (criar/editar/apagar).
- Uma pessoa pode acumular vários cargos; os poderes somam.
- Uma única fonte de verdade para autorização (`hasPermission`), usada por todas as rotas sensíveis.
- Corrigir o bug de músicas e alinhar o comportamento de escalas/membros/conteúdo.
- Remover as flags por membro e a UI de "quem edita o quê", preservando o acesso atual via migração.
- Tela de cargos clara: seções por alcance, matriz por módulo, modelos prontos, chips de atribuição.

**Non-Goals:**
- Não introduzir permissões por evento/escala individual (granularidade para no recurso, não na linha).
- Não mexer no fluxo de autenticação/Keycloak nem no modelo de multi-igreja.
- Não criar UI de auditoria/histórico de permissões.
- Não dividir "conteúdo" em versículo vs devocional (fica um `CONTENT_PUBLISH`); avisos ficam em `ANNOUNCEMENT_PUBLISH`.

## Decisions

### 1. Alcance no próprio `ChurchRole` (em vez de dois models separados)
`ChurchRole` recebe `scope: "CHURCH" | "MINISTRY"` e `departmentId String?` (FK opcional para `Department`, `onDelete: Cascade`). Um cargo de ministério tem `departmentId` obrigatório; um de igreja tem `departmentId = null`.
- **Alternativa descartada**: models `ChurchScopedRole` e `MinistryScopedRole` separados. Dobraria o CRUD, os adapters e a UI sem ganho — o alcance é um atributo, não um tipo diferente de entidade.

### 2. Permissões como strings `RECURSO_AÇÃO`, validadas por alcance
Lista canônica única no backend (fonte de verdade) e espelhada em `usePermissions.ts`. Cada permissão declara o alcance a que pertence; a validação de cargo rejeita permissões incompatíveis com o `scope`.
- Ministério: `SONG_CREATE/EDIT/DELETE`, `SCHEDULE_CREATE/EDIT/DELETE`, `MINISTRY_MEMBER_MANAGE`, `MINISTRY_NOTIFY`, `MINISTRY_MANAGE`.
- Igreja: `MEMBER_CREATE/EDIT/DELETE`, `CONTENT_PUBLISH`, `ANNOUNCEMENT_PUBLISH`.
- PDFs/cifras entram sob `SONG_*` (repertório).
- **Alternativa descartada**: bitmask/enum numérico — ilegível no banco e no debug; `String[]` já é o padrão atual.

### 3. Multi-cargo via tabela de ligação `MembershipRole`
Novo model `MembershipRole { id, membershipId, churchRoleId, @@unique([membershipId, churchRoleId]) }`. O cargo é ancorado na **membership** (não no `User`), coerente com multi-igreja. Removemos `ChurchMembership.churchRoleId` e `User.churchRoleId`.
- **Alternativa descartada**: array `churchRoleIds String[]` na membership — perde integridade referencial e cascata; a join table dá `onDelete` correto quando um cargo é apagado.

### 4. Resolvedor único `hasPermission(user, permission, { departmentId? })`
Novo `AuthorizationService` (ou util em `interfaces/utils/`) que decide na ordem:
1. `role ∈ {PASTOR, ADMIN, SUPER_ADMIN}` → `true`.
2. permissão é de ministério **e** `departmentId` informado **e** a pessoa é `leaderId` desse `Department` → `true`.
3. varre os cargos ativos da membership na igreja ativa:
   - cargo `CHURCH` cuja `permissions` contém a permissão (para permissões de igreja) → `true`;
   - cargo `MINISTRY` com `departmentId === departmentId` cuja `permissions` contém a permissão → `true`.
4. caso contrário → `false`.

`churchContext.ts` passa a carregar `memberships → membershipRoles → churchRole` e a expor no `ActiveChurchContext` a lista de cargos (`roles`) em vez de um único `churchRole`. As funções `assertCanManageSongs`, `canManageDepartmentSchedule` e `assertCanManageDepartmentWithPermission` são reescritas como finas chamadas a `hasPermission`, escolhendo a permissão certa pela ação (ex.: adicionar música → `SONG_CREATE`; editar → `SONG_EDIT`; remover → `SONG_DELETE`).
- **Alternativa descartada**: manter as três funções e só adicionar a checagem de cargo em cada — perpetua a duplicação e o risco de nova divergência.

### 5. Frontend agnóstico de origem via `can(permission, departmentId?)`
`usePermissions.ts` expõe `can(permission, departmentId?)`. O `user` da sessão passa a trazer os cargos (com scope/departmentId/permissions) para o cálculo client-side; a decisão final continua no backend. A página de Cargos usa a mesma lista canônica de módulos/permissões para montar a matriz, os atalhos "marcar tudo" e os modelos prontos.

## Risks / Trade-offs

- **Migração apaga colunas com dados** (`canManageSongs`, `canManageSchedule`, `churchRoleId`) → o passo de data-fix roda **antes** do drop, criando/atribuindo cargos equivalentes; a migração é escrita à mão (não só `prisma migrate diff`) e testada em `prisma migrate reset` no dev.
- **Cargos church-wide antigos com permissões de ministério** (`MANAGE_SONGS` etc.) não têm equivalente direto no novo modelo (permissão de ministério exige um ministério) → mapeamos o que é de igreja (`MANAGE_MEMBERS` → `MEMBER_*`; publicar → `CONTENT_PUBLISH`/`ANNOUNCEMENT_PUBLISH`) e registramos no log da migração os cargos que precisarem de revisão manual do pastor. Aceitável no estágio MVP.
- **Divergência client/servidor** no `can()` → tratamos o client como dica de UI; toda rota revalida no `hasPermission`. Nunca confiar só no front.
- **Explosão de checkboxes deixa a tela feia** (contraria o pedido de "bonito e fácil") → mitigado por agrupamento por módulo, atalho por recurso e modelos prontos; ação fina fica recolhida por padrão.
- **N+1 ao resolver permissões** → os cargos da membership são carregados de uma vez no `resolveActiveChurchContext` (um include), então `hasPermission` opera em memória sem query extra por checagem.

## Migration Plan

1. Schema Prisma: adicionar `scope`/`departmentId` em `ChurchRole`; criar `MembershipRole`; manter temporariamente as colunas antigas.
2. Migration SQL manual com data-fix, em ordem:
   a. Preencher `ChurchRole.scope = 'CHURCH'` nos cargos existentes e reescrever `permissions` pelo mapa de compatibilidade.
   b. Copiar vínculos atuais (`ChurchMembership.churchRoleId`) para `MembershipRole`.
   c. Para cada `UserDepartmentMembership` com `canManageSongs`/`canManageSchedule = true`, garantir (get-or-create) um cargo de ministério do respectivo `departmentId` com as permissões de música/escala e criar o `MembershipRole` para a membership da igreja correspondente.
   d. Dropar `UserDepartmentMembership.canManageSongs`, `canManageSchedule`, `ChurchMembership.churchRoleId`, `User.churchRoleId`.
3. Backend: resolvedor, reescrita das checagens, adapters de cargo (scope/permissões/multi), rotas de atribuição.
4. Frontend: `usePermissions.ts`, `useChurchRoles.ts`, página/dialog de Cargos, chips de atribuição, remoção da UI de flags por membro.
5. Testes de autorização (inclui o cenário do bug) + `npm run validate`.

**Rollback**: como é MVP sem dado crítico, o rollback é `prisma migrate reset` no dev ou reverter a migration; não há estratégia de rollback online prevista para este estágio.

## Open Questions

- Nenhuma bloqueante. Os defaults acordados no brainstorming (membros com CRUD separado; conteúdo agrupado em `CONTENT_PUBLISH`; PDFs sob `SONG_*`) estão fixados acima e podem ser refinados na revisão da spec.
