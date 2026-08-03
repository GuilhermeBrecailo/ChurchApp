## ADDED Requirements

### Requirement: Tela de conteúdo com seletor de tipo
O admin SHALL ter uma tela dedicada de conteúdo onde o usuário escolhe o tipo a publicar (aviso, versículo/palavra, devocional, publicação, horário de culto) e o formulário correspondente é aberto.

#### Scenario: Escolher o tipo
- **WHEN** o pastor abre a tela de Conteúdo e seleciona "Devocional"
- **THEN** o formulário de devocional é exibido para preenchimento

### Requirement: Publicar na página pública em todos os tipos
Todo tipo de conteúdo publicável (aviso, versículo, devocional, publicação) SHALL oferecer um controle "Aparecer na página pública", e o item só SHALL aparecer na página pública quando marcado.

#### Scenario: Marcar como público
- **WHEN** o pastor cria um devocional com "Aparecer na página pública" ligado
- **THEN** o devocional passa a aparecer na página pública

#### Scenario: Conteúdo interno não vaza
- **WHEN** um item é salvo sem marcar público
- **THEN** ele fica só no painel interno e não aparece na página pública

### Requirement: Calendário da semana no mesmo lugar
A tela de Conteúdo SHALL incluir o cadastro dos horários de culto (calendário da semana) junto dos demais conteúdos.

#### Scenario: Cadastrar horário pela tela de conteúdo
- **WHEN** o pastor está na tela de Conteúdo e escolhe "Horário de culto"
- **THEN** ele cadastra dia, horário e nome do culto ali mesmo

### Requirement: Excluir qualquer tipo de conteúdo
O usuário autorizado SHALL poder excluir qualquer tipo de conteúdo (aviso, versículo, devocional, publicação, horário), com confirmação.

#### Scenario: Excluir um aviso
- **WHEN** o pastor exclui um aviso e confirma
- **THEN** o aviso é removido da lista e da página pública

#### Scenario: Excluir um versículo
- **WHEN** o pastor exclui um versículo publicado e confirma
- **THEN** o versículo é removido da lista e da página pública (hoje não existe endpoint de exclusão para versículo — precisa ser criado)

### Requirement: Lista unificada de conteúdo
A tela SHALL mostrar uma lista do que já foi publicado, com filtro por tipo e a indicação de público ou interno.

#### Scenario: Filtrar por tipo
- **WHEN** o pastor filtra a lista por "Publicações"
- **THEN** apenas as publicações aparecem, cada uma marcada como pública ou interna

### Requirement: Tela de conteúdo responsiva no celular
A tela de conteúdo e o controle "Aparecer na página pública" SHALL funcionar bem no celular, sem layout quebrado (campos, toggles e grades empilham corretamente em telas estreitas).

#### Scenario: Cadastro no celular
- **WHEN** o pastor abre a tela de conteúdo num celular
- **THEN** os formulários, o upload de foto e o toggle de publicar aparecem empilhados e legíveis, sem estourar a largura da tela

#### Scenario: Grades empilham
- **WHEN** a tela é vista numa largura estreita
- **THEN** as grades de dois campos passam para uma coluna, sem cortar conteúdo
