## ADDED Requirements

### Requirement: Líder define o tipo do evento ao criar ou editar uma escala
O sistema SHALL permitir ao líder selecionar o tipo do evento (Culto, Reunião, Retiro, Ensaio Geral, Outro) no formulário de criação e edição de escala. Quando "Outro" é selecionado, um campo de texto livre SHALL ser exibido para o nome do tipo.

#### Scenario: Criar escala com tipo padrão
- **WHEN** o líder cria uma escala sem alterar o tipo
- **THEN** o tipo padrão "Culto" é salvo

#### Scenario: Criar escala com tipo customizado
- **WHEN** o líder seleciona "Outro" e informa "Reunião de Líderes"
- **THEN** a escala é salva com eventType "OUTRO:Reunião de Líderes"

### Requirement: Tipo do evento é exibido no card e no detalhe da escala
O sistema SHALL exibir o tipo do evento como chip ou badge no card da escala na listagem e no cabeçalho do detalhe.

#### Scenario: Exibição do tipo no card
- **WHEN** o membro vê a lista de escalas
- **THEN** cada card exibe o tipo do evento (ex: "Culto", "Retiro")

### Requirement: Listagem de escalas pode ser filtrada por tipo de evento
O sistema SHALL oferecer filtro por tipo de evento na página de escalas, além do filtro por ministério já existente.

#### Scenario: Filtrar por tipo
- **WHEN** o usuário seleciona o filtro "Retiro"
- **THEN** apenas escalas do tipo Retiro são exibidas
