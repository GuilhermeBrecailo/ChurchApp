## ADDED Requirements

### Requirement: Cargo com alcance de igreja ou ministério
O sistema SHALL permitir que um gestor da igreja (pastor, admin ou super admin) crie cargos com um alcance (`scope`): **igreja** (`CHURCH`), que vale em toda a igreja, ou **ministério** (`MINISTRY`), vinculado a um ministério específico via `departmentId`. Um cargo de ministério SHALL conceder suas permissões apenas dentro do ministério ao qual está vinculado.

#### Scenario: Criar cargo de ministério
- **WHEN** um gestor cria um cargo com `scope = MINISTRY` vinculado ao ministério de Louvor e a permissão de criar músicas
- **THEN** o cargo é salvo com o alcance de ministério e o `departmentId` do Louvor

#### Scenario: Criar cargo de igreja
- **WHEN** um gestor cria um cargo com `scope = CHURCH` e a permissão de gerenciar membros
- **THEN** o cargo é salvo sem `departmentId` e vale para toda a igreja

#### Scenario: Cargo de ministério exige ministério
- **WHEN** um gestor tenta criar um cargo com `scope = MINISTRY` sem informar o `departmentId`
- **THEN** o sistema rejeita a criação com erro de validação

#### Scenario: Cargo de ministério só vale no ministério vinculado
- **WHEN** uma pessoa tem um cargo de ministério do Louvor com permissão de criar música e tenta criar música no ministério Infantil
- **THEN** o sistema rejeita a ação

### Requirement: Permissões granulares por recurso e ação
O sistema SHALL representar permissões no formato `RECURSO_AÇÃO`, permitindo conceder ações independentes por recurso. As permissões de ministério SHALL incluir `SONG_CREATE`, `SONG_EDIT`, `SONG_DELETE`, `SCHEDULE_CREATE`, `SCHEDULE_EDIT`, `SCHEDULE_DELETE`, `MINISTRY_MEMBER_MANAGE`, `MINISTRY_NOTIFY` e `MINISTRY_MANAGE`. As permissões de igreja SHALL incluir `MEMBER_CREATE`, `MEMBER_EDIT`, `MEMBER_DELETE`, `CONTENT_PUBLISH` e `ANNOUNCEMENT_PUBLISH`. O sistema SHALL rejeitar valores de permissão fora dessa lista e SHALL rejeitar permissões de igreja em cargos de ministério e vice-versa.

#### Scenario: Conceder só uma ação de um recurso
- **WHEN** um cargo recebe apenas `SONG_EDIT` (sem `SONG_CREATE` nem `SONG_DELETE`)
- **THEN** quem tem esse cargo consegue editar músicas, mas não consegue criar nem apagar músicas

#### Scenario: Permissão inválida é ignorada
- **WHEN** a criação de um cargo inclui um valor de permissão desconhecido
- **THEN** o sistema descarta o valor inválido e mantém apenas as permissões válidas

#### Scenario: Permissão de escopo incompatível é rejeitada
- **WHEN** um gestor tenta salvar um cargo de ministério com a permissão de igreja `MEMBER_EDIT`
- **THEN** o sistema rejeita essa permissão por ser incompatível com o alcance do cargo

### Requirement: Vários cargos por pessoa
O sistema SHALL permitir que uma pessoa tenha mais de um cargo na mesma igreja, e os poderes de todos os seus cargos SHALL somar. A atribuição SHALL ser feita adicionando ou removendo cargos individualmente, sem substituir os demais.

#### Scenario: Acumular cargos de ministérios diferentes
- **WHEN** uma pessoa recebe o cargo "Ministro" do Louvor e o cargo "Responsável por escala" do Infantil
- **THEN** ela consegue gerenciar músicas do Louvor e escalas do Infantil ao mesmo tempo

#### Scenario: Remover um cargo mantém os outros
- **WHEN** uma pessoa tem dois cargos e um deles é removido
- **THEN** o cargo removido deixa de valer imediatamente e o outro cargo continua ativo

#### Scenario: Somar permissões do mesmo recurso
- **WHEN** uma pessoa tem um cargo com `SONG_CREATE` e outro cargo com `SONG_DELETE` no mesmo ministério
- **THEN** ela consegue tanto criar quanto apagar músicas daquele ministério

### Requirement: Autorização central baseada em cargos
O sistema SHALL decidir toda autorização de ação sensível por um único resolvedor `hasPermission(user, permission, { departmentId })`. Pastor, admin e super admin SHALL ter acesso total. O líder titular de um ministério SHALL ter acesso total às ações daquele ministério. Um cargo de igreja SHALL conceder permissões de igreja independentemente de ministério. Um cargo de ministério SHALL conceder permissões apenas quando o `departmentId` avaliado for igual ao do cargo. Todas as rotas sensíveis (músicas, escalas, membros do ministério, notificações, conteúdo e avisos da igreja) SHALL usar esse resolvedor.

#### Scenario: Cargo com permissão de música consegue adicionar música (correção do bug)
- **WHEN** uma pessoa que não é pastor nem líder recebe um cargo de ministério do Louvor com `SONG_CREATE` e tenta adicionar uma música no Louvor
- **THEN** o sistema autoriza a adição da música

#### Scenario: Pastor tem acesso total
- **WHEN** o pastor tenta qualquer ação sensível em qualquer ministério
- **THEN** o sistema autoriza a ação sem exigir cargo

#### Scenario: Líder do ministério gerencia o próprio ministério
- **WHEN** o líder titular de um ministério gerencia músicas ou escalas do próprio ministério sem ter cargo atribuído
- **THEN** o sistema autoriza a ação

#### Scenario: Sem cargo e sem papel privilegiado
- **WHEN** um membro comum, sem cargo aplicável e sem ser pastor/líder, tenta uma ação sensível
- **THEN** o sistema rejeita a ação

### Requirement: Remoção das permissões por membro no ministério
O sistema SHALL remover a delegação "quem edita o quê" por membro (as flags `canManageSongs` e `canManageSchedule` em `UserDepartmentMembership`) e a respectiva UI, passando toda a delegação de gestão de ministério a acontecer por cargos.

#### Scenario: Delegação passa a ser por cargo
- **WHEN** um líder quer permitir que um membro gerencie o repertório do ministério
- **THEN** ele atribui a esse membro um cargo de ministério com a permissão de músicas, em vez de marcar uma flag individual

#### Scenario: Migração preserva o acesso existente
- **WHEN** a mudança é aplicada e existiam membros com `canManageSongs` ou `canManageSchedule` ligados
- **THEN** cada um desses membros recebe um cargo de ministério equivalente do mesmo ministério, mantendo o acesso que já tinha

### Requirement: Modelos prontos e atalhos na criação de cargos
O sistema SHALL oferecer modelos prontos de cargo (por exemplo "Ministro", "Editor de repertório", "Responsável por escala", "Secretária", "Comunicação") que pré-selecionam um conjunto de permissões, e atalhos para marcar/desmarcar todas as ações de um recurso de uma vez, mantendo o ajuste fino por ação disponível.

#### Scenario: Aplicar um modelo pronto
- **WHEN** o gestor escolhe o modelo "Ministro" ao criar um cargo de ministério
- **THEN** as permissões típicas do ministro (criar/editar/apagar músicas e escalas, gerenciar membros e enviar notificações do ministério) já vêm marcadas, permitindo ajuste antes de salvar

#### Scenario: Marcar todas as ações de um recurso
- **WHEN** o gestor usa o atalho "marcar tudo" do recurso Músicas
- **THEN** `SONG_CREATE`, `SONG_EDIT` e `SONG_DELETE` ficam selecionados de uma vez

### Requirement: Gestão e atribuição de cargos na interface
O sistema SHALL exibir os cargos em duas seções — Cargos da igreja e Cargos por ministério (agrupados por ministério) — descrevendo em linguagem simples o que cada cargo permite e quantas pessoas o possuem. O sistema SHALL permitir atribuir e remover múltiplos cargos de uma pessoa por meio de chips, e cargos de ministério SHALL também poder ser atribuídos a partir da tela do próprio ministério.

#### Scenario: Cargos agrupados por alcance
- **WHEN** o gestor abre a página de Cargos
- **THEN** vê os cargos de igreja separados dos cargos de cada ministério, com a descrição e a contagem de pessoas de cada um

#### Scenario: Atribuir vários cargos a uma pessoa
- **WHEN** o gestor adiciona dois cargos ao perfil de um membro pelos chips de cargo
- **THEN** ambos os cargos ficam atribuídos ao membro e passam a valer imediatamente
