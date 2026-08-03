## Why

O sistema de cargos atual não funciona como um pastor/líder espera. Um cargo com a permissão "gerenciar músicas" **não deixa** a pessoa adicionar música: a checagem de autorização (`assertCanManageSongs`) nunca consulta a permissão do cargo — ela só olha se a pessoa é pastor/líder ou se tem uma flag solta por membro (`UserDepartmentMembership.canManageSongs`). Existem, na prática, dois sistemas paralelos e inconsistentes (permissão-por-cargo e flag-por-membro), e a maioria das rotas checa só um deles. Além disso, os cargos são grossos ("gerenciar tudo"), valem sempre na igreja inteira e cada pessoa só pode ter um. O pastor precisa de cargos granulares, presos ao ministério certo, acumuláveis por pessoa, e que realmente concedam o acesso que prometem.

## What Changes

- **Cargo com alcance**: cada cargo passa a ter um `scope` — **igreja** (vale em toda a igreja) ou **ministério** (vale só no ministério vinculado). "Ministro de Louvor" só dá poder no Louvor.
- **Permissões granulares** por recurso e ação (criar / editar / apagar), substituindo as permissões grossas `MANAGE_*`. **BREAKING**: os valores de permissão mudam (`MANAGE_SONGS` → `SONG_CREATE`/`SONG_EDIT`/`SONG_DELETE`, etc.).
- **Vários cargos por pessoa**: **BREAKING** — o vínculo único (`ChurchMembership.churchRoleId` / `User.churchRoleId`) é trocado por uma tabela de ligação `MembershipRole`. Os poderes de todos os cargos da pessoa somam.
- **Autorização centralizada**: um único resolvedor `hasPermission(user, permission, { departmentId? })` consulta os cargos reais. Todas as rotas sensíveis (músicas, escalas, membros, conteúdo, avisos, notificações) passam a usá-lo. Isso corrige o bug e torna o comportamento consistente.
- **Fim das flags por membro**: **BREAKING** — `UserDepartmentMembership.canManageSongs` e `canManageSchedule` são removidos, junto da UI onde o líder marcava "quem edita o quê". A capacidade equivalente passa a vir de um cargo de ministério.
- **Migração sem perda de acesso**: membros que hoje têm `canManageSongs`/`canManageSchedule` ligados recebem um cargo de ministério equivalente; cargos existentes (church-wide) viram `scope = CHURCH` com as permissões mapeadas.
- **Frontend redesenhado**: página de Cargos em duas seções (Cargos da igreja / Cargos por ministério), dialog de criar/editar com seletor de alcance, matriz de permissões agrupada por módulo, atalhos "marcar tudo" e modelos prontos; atribuição de cargos a uma pessoa via múltiplos chips.

## Capabilities

### New Capabilities

- `role-permissions`: Modelo de cargos com alcance (igreja/ministério), permissões granuladas por recurso e ação, múltiplos cargos por membro, resolvedor central de autorização e as telas de gestão/atribuição de cargos.

### Modified Capabilities

<!-- Nenhuma spec arquivada em openspec/specs; nada a modificar em nível de spec. -->

## Impact

- **Banco de dados (Prisma)**: `ChurchRole` ganha `scope` (`CHURCH` | `MINISTRY`) e `departmentId String?` (FK opcional para `Department`); novo model `MembershipRole` (`membershipId`, `churchRoleId`, `@@unique`); remoção de `ChurchMembership.churchRoleId`, `User.churchRoleId`, `UserDepartmentMembership.canManageSongs` e `canManageSchedule`. Migração com data-fix para preservar acesso atual e reescrever os valores de `permissions`.
- **Backend (api)**: novo serviço `AuthorizationService` / util `hasPermission`; reescrita das checagens em `churchDepartmentAdapters.ts` (`assertCanManageSongs`, `canManageDepartmentSchedule`, `assertCanManageDepartmentWithPermission`, upload de PDF, notificações); `churchRoleAdapters.ts` passa a criar/validar cargos com `scope`/`departmentId` e a lista de permissões nova; `assignMemberRole` vira add/remove em `MembershipRole` (múltiplos); `churchContext.ts` (`ActiveChurchContext`) passa a expor a lista de cargos e um agregado de permissões por ministério em vez de um único `churchRole`. Rotas em `ChurchRoleRoutes.ts` para atribuir/remover cargos.
- **Frontend (web)**: `usePermissions.ts` com as chaves granulares novas e `can(permission, departmentId?)`; `useChurchRoles.ts` para o modelo novo (scope, departamento, múltiplos); página/dialog de Cargos redesenhados; UI de atribuição por chips no perfil do membro e dentro do ministério; remoção da UI de delegação "quem edita o quê" por membro.
- **Testes (api)**: novos testes de autorização (`hasPermission`) cobrindo pastor/admin, líder do ministério, cargo de igreja, cargo de ministério (dentro e fora do ministério) e o cenário do bug (cargo com `SONG_CREATE` consegue adicionar música).
