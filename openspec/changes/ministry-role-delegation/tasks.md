## 1. Backend

- [x] 1.1 `churchRoleAdapters`: `isChurchManager`, `leadsDepartment`, `assertCanAssignRole`, `assertCanSeeRoles`
- [x] 1.2 `getRoles` permite líderes (que lideram algum ministério); `addMemberRole`/`removeMemberRole` autorizam o líder para cargos de ministério do seu departamento, mantendo as travas de membro
- [x] 1.3 Criar/editar/apagar cargos permanece restrito a pastor/admin

## 2. Frontend

- [x] 2.1 `ministery/[id].vue`: `useChurchRoles`, lista de cargos do ministério, chips de cargo por membro + seletor "Dar um cargo" e remover
- [x] 2.2 Estado local atualizado pela resposta de add/remove

## 3. Validação

- [x] 3.1 `npm run api:typecheck`, `api:test` (107) e `web:build` verdes
- [ ] 3.2 Conferência no app real: um líder (não pastor) atribui um cargo do ministério dele e o membro passa a conseguir a ação
