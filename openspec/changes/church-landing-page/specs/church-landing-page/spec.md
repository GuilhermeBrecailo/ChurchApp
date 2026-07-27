## ADDED Requirements

### Requirement: Página pública por igreja
O sistema SHALL disponibilizar uma página pública, sem exigir autenticação, para cada igreja ativa, acessível em `/c/:slug`, exibindo o nome, a logo e a cor de destaque da igreja.

#### Scenario: Visitante acessa a landing de uma igreja existente
- **WHEN** um visitante sem sessão ativa acessa `/c/:slug` com um slug de igreja ativa
- **THEN** o sistema exibe a landing com nome, logo e cor de destaque daquela igreja, sem redirecionar para login

#### Scenario: Slug inexistente
- **WHEN** um visitante acessa `/c/:slug` com um slug que não corresponde a nenhuma igreja
- **THEN** o sistema exibe uma página de "igreja não encontrada", sem expor dados de outras igrejas

#### Scenario: Igreja inativa
- **WHEN** um visitante acessa `/c/:slug` de uma igreja com `isActive = false`
- **THEN** o sistema trata como slug inexistente e não expõe os dados da igreja

### Requirement: Identificador público único por igreja
O sistema SHALL permitir que cada igreja tenha um `slug` único, gerado automaticamente a partir do nome e editável pelo pastor, usado exclusivamente para compor a URL pública.

#### Scenario: Slug gerado automaticamente
- **WHEN** uma igreja é criada sem slug definido
- **THEN** o sistema gera um slug em kebab-case a partir do nome da igreja, garantindo unicidade global

#### Scenario: Colisão de slug
- **WHEN** o slug gerado a partir do nome já existe para outra igreja
- **THEN** o sistema adiciona um sufixo numérico incremental até obter um slug único

#### Scenario: Pastor edita o slug
- **WHEN** o pastor da igreja altera o slug em `/admin` para um valor disponível e válido (somente letras minúsculas, números e hífen)
- **THEN** o sistema atualiza o slug e a landing pública passa a responder no novo endereço

#### Scenario: Pastor tenta usar slug já existente
- **WHEN** o pastor tenta salvar um slug já usado por outra igreja
- **THEN** o sistema rejeita a alteração e informa que o endereço já está em uso

### Requirement: Calendário público de próximos cultos
A landing pública SHALL exibir os próximos cultos da igreja (semana e mês) calculados a partir dos horários recorrentes cadastrados pela igreja.

#### Scenario: Igreja com horários cadastrados
- **WHEN** a igreja tem ao menos um horário de culto ativo cadastrado
- **THEN** a landing exibe as próximas ocorrências desses horários, ordenadas cronologicamente

#### Scenario: Igreja sem horários cadastrados
- **WHEN** a igreja não tem nenhum horário de culto ativo cadastrado
- **THEN** a landing exibe a seção de próximos cultos vazia, sem erro

### Requirement: Feed público de conteúdo do pastor
A landing pública SHALL exibir os avisos, palavras e orações que a igreja marcou como públicos, em ordem cronológica decrescente, com os itens fixados no topo.

#### Scenario: Itens públicos existentes
- **WHEN** a igreja tem avisos marcados como públicos e não expirados
- **THEN** a landing exibe esses itens, com os fixados aparecendo antes dos demais

#### Scenario: Item expira
- **WHEN** um item público tem `expiresAt` no passado
- **THEN** a landing não exibe esse item

### Requirement: Prompt de ativação de notificações no primeiro acesso
A landing pública SHALL solicitar ao visitante, no primeiro acesso, permissão para ativar notificações push daquela igreja, sem exigir criação de conta.

#### Scenario: Primeiro acesso em navegador compatível
- **WHEN** um visitante acessa `/c/:slug` pela primeira vez em um navegador com suporte a push
- **THEN** o sistema exibe um convite para ativar notificações daquela igreja

#### Scenario: Visitante aceita ativar notificações
- **WHEN** o visitante aceita o convite e concede a permissão do navegador
- **THEN** o sistema registra uma inscrição push anônima vinculada àquela igreja, sem exigir login

#### Scenario: Visitante recusa ou navegador sem suporte
- **WHEN** o visitante recusa a permissão, ou o navegador não suporta push
- **THEN** o sistema não repete o convite a cada novo acesso na mesma sessão do navegador

#### Scenario: Visitante já é membro autenticado da igreja
- **WHEN** um usuário autenticado, membro daquela igreja, acessa a landing pública dela
- **THEN** o sistema não exibe o convite de ativação anônima se ele já possui notificações ativadas em sua conta
