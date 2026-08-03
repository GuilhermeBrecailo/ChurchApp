## ADDED Requirements

### Requirement: Cadastro de horários de culto no admin
O admin SHALL oferecer uma tela para cadastrar, editar e desativar horários de culto, cada um com dia da semana, horário e nome. A lista SHALL ser ordenada por dia e horário, e os horários desativados SHALL aparecer marcados como inativos. Salvar SHALL exigir dia, horário e nome preenchidos.

#### Scenario: Cadastrar um horário
- **WHEN** o pastor informa dia, horário e nome e adiciona
- **THEN** o horário passa a aparecer na lista e nos "Próximos cultos" da página pública

#### Scenario: Editar um horário
- **WHEN** o pastor edita um horário existente e salva
- **THEN** a lista reflete a alteração imediatamente

#### Scenario: Desativar um horário
- **WHEN** o pastor desativa um horário
- **THEN** ele fica marcado como inativo e deixa de aparecer na página pública, sem ser apagado

#### Scenario: Campos obrigatórios
- **WHEN** o pastor tenta salvar sem dia, horário ou nome
- **THEN** o sistema mostra um aviso e não salva
