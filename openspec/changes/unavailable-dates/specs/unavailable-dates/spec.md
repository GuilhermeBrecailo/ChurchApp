## ADDED Requirements

### Requirement: Voluntário registra datas de indisponibilidade

O sistema SHALL permitir que o voluntário adicione e remova datas em que não poderá ser escalado, visíveis na seção de perfil em `/user`.

#### Scenario: Adicionar data de indisponibilidade

- **WHEN** o voluntário seleciona uma data no date picker e clica em "Adicionar"
- **THEN** a data é salva em `UserUnavailableDate` e aparece na lista de indisponibilidades

#### Scenario: Data duplicada

- **WHEN** o voluntário tenta adicionar uma data já cadastrada
- **THEN** o sistema SHALL exibir mensagem de erro "Essa data já está marcada"

#### Scenario: Remover data de indisponibilidade

- **WHEN** o voluntário clica no ícone de remoção ao lado de uma data
- **THEN** a data é deletada e some da lista imediatamente

---

### Requirement: Aviso de conflito ao criar escala

O sistema SHALL exibir um aviso visual (não bloqueante) quando um membro selecionado para uma escala tem aquela data marcada como indisponível.

#### Scenario: Membro indisponível na data da escala

- **WHEN** o líder seleciona um membro no modal de nova escala e esse membro tem `UserUnavailableDate` para a data da escala
- **THEN** um chip de aviso amarelo com ícone `AlertTriangle` SHALL aparecer ao lado do nome do membro

#### Scenario: Membro disponível

- **WHEN** o membro não tem indisponibilidade na data da escala
- **THEN** nenhum aviso é exibido — comportamento normal
