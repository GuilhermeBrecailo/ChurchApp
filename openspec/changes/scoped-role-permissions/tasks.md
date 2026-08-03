## 1. Banco de dados (Prisma)

- [x] 1.1 Em `ChurchRole`: adicionar `scope String @default("CHURCH")` e `departmentId String?` com relação opcional para `Department` (`onDelete: Cascade`)
- [x] 1.2 Criar model `MembershipRole` (`id`, `membershipId`, `churchRoleId`, `@@unique([membershipId, churchRoleId])`, `@@index`) com relações para `ChurchMembership` e `ChurchRole`
- [x] 1.3 Adicionar back-relations: `membershipRoles MembershipRole[]` em `ChurchMembership`, `membershipRoles MembershipRole[]` em `ChurchRole`, `roles ChurchRole[]` em `Department`
- [x] 1.4 Escrever migration manual com data-fix ANTES dos drops: (a) `scope='CHURCH'` nos cargos existentes + reescrever `permissions` pelo mapa de compatibilidade; (b) copiar `ChurchMembership.churchRoleId` para `MembershipRole`; (c) para cada `UserDepartmentMembership` com `canManageSongs`/`canManageSchedule=true`, get-or-create cargo de ministério do `departmentId` com as permissões correspondentes e criar `MembershipRole`
- [x] 1.5 Na mesma migration, dropar `UserDepartmentMembership.canManageSongs`, `UserDepartmentMembership.canManageSchedule`, `ChurchMembership.churchRoleId`, `User.churchRoleId` e as relações órfãs
- [x] 1.6 `prisma generate` ok; `migrate` não rodou (Postgres local `localhost:5434` inacessível no ambiente do agente) — aplicar via `prisma migrate deploy` contra o Postgres real. Data-fix escrito e revisado à mão para preservar o acesso.

## 2. Backend: lista canônica de permissões

- [x] 2.1 `api/src/domain/permissions.ts` com a lista canônica (`key`, `scope`, `resource`, `action`, label) e helpers `isChurchPermission`/`isMinistryPermission`/`sanitizePermissions`
- [x] 2.2 `ROLE_PRESETS` no mesmo módulo (Ministro, Editor de repertório, Responsável por escala, Secretária, Comunicação)

## 3. Backend: resolvedor de autorização

- [x] 3.1 Estender `ActiveChurchContext` (`churchContext.ts`) para carregar `memberships → membershipRoles → churchRole` (com `scope`, `departmentId`, `permissions`) e expor `roles: {id,name,scope,departmentId,permissions}[]`
- [x] 3.2 Criar `hasPermission(user, permission, { departmentId? })` (`AuthorizationService`) com a ordem: pastor/admin/super → líder do ministério → cargo de igreja → cargo de ministério com `departmentId` igual
- [x] 3.3 Testes unitários de `hasPermission` (11 casos, verdes): pastor, líder do próprio/de outro ministério, cargo de igreja, cargo de ministério dentro/fora, sem cargo, soma de cargos, granularidade de ação, e o cenário do bug (`SONG_CREATE` adiciona música)

## 4. Backend: aplicar o resolvedor nas rotas sensíveis

- [x] 4.1 `assertCanManageSongs` substituído por `assertDepartmentPermission` com `SONG_CREATE`/`SONG_EDIT`/`SONG_DELETE` por ação, via `hasPermission` (corrige o bug)
- [x] 4.2 Escalas: `SCHEDULE_CREATE/EDIT/DELETE` por ação; removido `DepartmentSchedulePermission.ts`
- [x] 4.3 Upload de PDF → `SONG_CREATE`, notificações → `MINISTRY_NOTIFY`, gestão do ministério e recursos/tarefas → `MINISTRY_MANAGE`
- [x] 4.4 Rotas de igreja com `hasPermission`: convites/membros (`MEMBER_CREATE`), conteúdo (`CONTENT_PUBLISH`), avisos e horários de culto (`ANNOUNCEMENT_PUBLISH`)
- [x] 4.5 Removidas as leituras de `canManageSongs`/`canManageSchedule`; `canManage*` nos payloads agora derivam dos cargos (`departmentCapabilities`); endpoint de delegação por membro removido

## 5. Backend: gestão e atribuição de cargos

- [x] 5.1 `createRole`/`updateRole`: validam `scope`/`departmentId` (ministério exige departamento da igreja) e `permissions` contra a lista canônica e o escopo (`sanitizePermissions`)
- [x] 5.2 `getRoles`: retorna `scope`, `departmentId`, ministério e `userCount` via `MembershipRole`
- [x] 5.3 `assignMemberRole` trocado por `addMemberRole`/`removeMemberRole` em `MembershipRole` (múltiplos), mantendo as travas (próprio cargo, pastor titular, super admin)
- [x] 5.4 `ChurchRoleRoutes.ts` com `POST/DELETE /members/:id/roles`
- [x] 5.5 `/me` e listagens expõem `roles` (scope/departmentId/permissions) + `permissions` achatado para o `can()`

## 6. Frontend: permissões e composables

- [x] 6.1 `usePermissions.ts` reescrito: chaves granulares, `PERMISSION_MODULES` por alcance, `ROLE_PRESETS`, `modulesForScope` e `can(permission, departmentId?)`
- [x] 6.2 `useChurchRoles.ts` no modelo novo (scope, departmentId, permissions, `addMemberRole`/`removeMemberRole`); `useAuth`/`useMembers`/`useAdmin` expõem `roles`

## 7. Frontend: telas

- [x] 7.1 Página de Cargos com chip de alcance por cargo (Igreja / nome do ministério) + contagem de pessoas; ordenada por escopo
- [x] 7.2 Dialog de cargo: seletor de alcance (btn-toggle), seletor de ministério, dropdown de modelos prontos, matriz por módulo filtrada por alcance com atalho "Tudo/Limpar" por recurso
- [x] 7.3 Atribuição via chips (múltiplos) no painel do membro e no dialog de detalhe (add/remove imediatos)
- [x] 7.4 Atribuição de cargos de ministério cobre o fluxo (cargos de ministério aparecem no seletor com o nome do ministério); UI do ministério passou a delegar por cargo
- [x] 7.5 Removida a UI de delegação "quem edita o quê" (toggles `canManageSongs`/`canManageSchedule`) e todas as leituras dessas flags no front

## 8. Validação

- [x] 8.1 `npm run api:test` verde (107 testes, inclui 11 de `hasPermission`); teste obsoleto de `DepartmentSchedulePermission` substituído
- [x] 8.2 `npm run validate` completo verde (lint + typecheck + 107 testes + web build), EXIT 0
- [ ] 8.3 Teste manual do fluxo do bug (requer app rodando com banco): criar cargo de ministério com música, atribuir a um membro, confirmar adição; e bloqueio fora do ministério
