## Why

Depois da reforma de cargos (`scoped-role-permissions`), só pastor/admin criavam e atribuíam cargos. O líder de um ministério continuava com controle total do próprio ministério, mas não conseguia **entregar um cargo** a outra pessoa — tinha que pedir para o pastor. O pastor pediu que o líder também consiga delegar cargos dentro do ministério dele. Esta mudança libera essa delegação (implementada).

## What Changes

- O **líder titular** de um ministério pode **atribuir e remover cargos de ministério do próprio ministério** aos membros (cargos com `scope = MINISTRY` vinculados ao departamento que ele lidera).
- O líder passa a **ver a lista de cargos** (para escolher qual entregar). Criar/editar/apagar cargos continua com pastor/admin.
- Na tela do ministério, cada membro mostra seus cargos daquele ministério como chips, com um seletor para o líder atribuir um novo.

## Capabilities

### New Capabilities

- `ministry-role-delegation`: Delegação de cargos de ministério pelo líder titular — atribuir/remover cargos do próprio ministério aos membros.

### Modified Capabilities

<!-- Nenhuma spec arquivada em openspec/specs; nada a modificar em nível de spec. -->

## Impact

- **Backend (api)**: `churchRoleAdapters` ganha `isChurchManager`, `leadsDepartment`, `assertCanAssignRole` e `assertCanSeeRoles`; `getRoles` passa a permitir líderes; `addMemberRole`/`removeMemberRole` autorizam o líder quando o cargo é de ministério do departamento que ele lidera (mantendo as travas de membro: próprio cargo, pastor titular, super admin).
- **Frontend (web)**: `ministery/[id].vue` usa `useChurchRoles` para listar os cargos do ministério e, por membro, exibir os cargos (chips) e um seletor "Dar um cargo" / remover. Estado local atualizado pela resposta do backend.
- **Segurança**: criar/editar/apagar cargos permanece restrito a pastor/admin.
