## ADDED Requirements

### Requirement: Líder delega cargos do próprio ministério
O líder titular de um ministério SHALL poder atribuir e remover cargos de ministério vinculados ao seu departamento aos membros. Ele NÃO SHALL poder atribuir cargos de igreja nem cargos de outros ministérios. Criar, editar e apagar cargos SHALL permanecer restrito a pastor/admin.

#### Scenario: Líder atribui cargo do seu ministério
- **WHEN** o líder do Louvor atribui o cargo "Ministro" (de ministério, do Louvor) a um membro
- **THEN** o membro passa a ter o cargo e suas permissões no Louvor

#### Scenario: Líder não atribui cargo de outro ministério
- **WHEN** o líder do Louvor tenta atribuir um cargo de ministério do Infantil
- **THEN** o sistema rejeita a ação

#### Scenario: Líder não atribui cargo de igreja
- **WHEN** o líder tenta atribuir um cargo de igreja (ex: Secretária)
- **THEN** o sistema rejeita a ação

#### Scenario: Líder enxerga os cargos para escolher
- **WHEN** o líder abre a tela do ministério
- **THEN** ele vê os cargos do ministério disponíveis para atribuir

#### Scenario: Criar cargo continua com o pastor
- **WHEN** o líder tenta criar um cargo novo
- **THEN** o sistema rejeita (apenas pastor/admin criam cargos)
