## ADDED Requirements

### Requirement: Publicação simplificada de conteúdo público
O sistema SHALL permitir que o pastor (ou usuário com permissão de comunicação) publique, a partir de `/admin`, um item de conteúdo do tipo Aviso, Palavra do Pastor ou Oração, marcando-o como público para aparecer na landing da igreja.

#### Scenario: Pastor publica uma palavra pública
- **WHEN** o pastor cria um item do tipo "Palavra do Pastor" e marca a opção "público"
- **THEN** o sistema salva o item e ele passa a aparecer na landing pública da igreja

#### Scenario: Pastor publica um item sem marcar como público
- **WHEN** o pastor cria um aviso sem marcar a opção "público"
- **THEN** o item continua visível apenas para membros autenticados, e não aparece na landing pública

#### Scenario: Usuário sem permissão de comunicação tenta publicar
- **WHEN** um membro sem a permissão de gerenciar comunicação tenta criar ou marcar um item como público
- **THEN** o sistema rejeita a ação

### Requirement: Cadastro de horários recorrentes de culto
O sistema SHALL permitir que o pastor cadastre, edite e desative horários recorrentes de culto (dia da semana, horário e rótulo) pela área administrativa da igreja.

#### Scenario: Pastor cadastra um horário de culto
- **WHEN** o pastor cria um horário com dia da semana, horário e rótulo válidos
- **THEN** o sistema salva o horário e ele passa a ser considerado no cálculo de próximos cultos

#### Scenario: Pastor desativa um horário
- **WHEN** o pastor desativa um horário de culto existente
- **THEN** o sistema deixa de considerá-lo no cálculo de próximos cultos, sem excluir o histórico do cadastro

#### Scenario: Dados obrigatórios ausentes
- **WHEN** o pastor tenta salvar um horário sem dia da semana, horário ou rótulo
- **THEN** o sistema rejeita o cadastro e indica os campos obrigatórios
