## ADDED Requirements

### Requirement: Delegação de gestão de escala por ministério
O sistema SHALL permitir que o pastor ou o líder titular de um ministério designe outros membros do próprio ministério como gestores de escala e repertório, sem exigir que sejam o líder titular.

#### Scenario: Líder designa um gestor de escala
- **WHEN** o líder titular do ministério concede a permissão de gestão de escala a outro membro do mesmo ministério
- **THEN** esse membro passa a poder criar, editar e excluir escalas e repertório daquele ministério

#### Scenario: Pastor designa um gestor de escala
- **WHEN** o pastor concede a permissão de gestão de escala a um membro de um ministério, mesmo sem ser o líder titular dele
- **THEN** esse membro passa a poder gerenciar a escala e o repertório daquele ministério

#### Scenario: Gestor delegado tenta gerenciar outro ministério
- **WHEN** um membro com permissão de gestão delegada em um ministério tenta editar a escala de outro ministério onde não tem essa permissão
- **THEN** o sistema rejeita a ação

#### Scenario: Revogação da permissão
- **WHEN** o líder titular ou o pastor revoga a permissão de gestão de escala de um membro
- **THEN** esse membro deixa de conseguir editar a escala e o repertório daquele ministério imediatamente

#### Scenario: Membro comum sem delegação
- **WHEN** um membro do ministério sem permissão de gestão de escala tenta editar a escala
- **THEN** o sistema rejeita a ação, mantendo o comportamento atual
