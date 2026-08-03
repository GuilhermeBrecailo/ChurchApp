## ADDED Requirements

### Requirement: Publicação com foto, texto e vídeo
O sistema SHALL permitir criar publicações da igreja com título, texto opcional, uma foto opcional (por upload), um vídeo opcional (link) e um controle de visibilidade pública. Publicar SHALL ser permitido a pastor/admin ou a quem tiver a permissão de cargo `CONTENT_PUBLISH`.

#### Scenario: Criar publicação completa
- **WHEN** um usuário autorizado cria uma publicação com título, texto, foto e vídeo marcada como pública
- **THEN** a publicação é salva na igreja ativa com o autor registrado e passa a poder aparecer na página pública

#### Scenario: Publicação sem permissão é rejeitada
- **WHEN** um membro sem `CONTENT_PUBLISH` e sem ser pastor/admin tenta criar uma publicação
- **THEN** o sistema rejeita a ação

#### Scenario: Título obrigatório
- **WHEN** um usuário autorizado tenta criar uma publicação sem título
- **THEN** o sistema rejeita com erro de validação

#### Scenario: Alternar visibilidade pública
- **WHEN** o autor autorizado marca uma publicação como não pública
- **THEN** a publicação deixa de aparecer na rota pública, mas continua listada no painel interno

### Requirement: Upload de imagem da publicação
O sistema SHALL oferecer um endpoint autenticado de upload de imagem que aceita apenas JPEG, PNG ou WebP, armazena o arquivo e retorna a URL e a chave para associar à publicação.

#### Scenario: Upload de imagem válida
- **WHEN** um usuário autorizado envia um arquivo PNG para o endpoint de upload de imagem
- **THEN** o sistema armazena o arquivo e retorna `url` e `key`

#### Scenario: Tipo de arquivo inválido
- **WHEN** o usuário envia um arquivo que não é JPEG/PNG/WebP (por exemplo, um PDF)
- **THEN** o sistema rejeita o upload com erro

### Requirement: Publicações públicas na rota pública
A rota pública da igreja SHALL retornar apenas as publicações marcadas como públicas, ordenadas com as fixadas primeiro e depois pela data de publicação (mais recentes primeiro).

#### Scenario: Somente públicas aparecem
- **WHEN** a página pública da igreja é carregada
- **THEN** apenas as publicações com `isPublic = true` são retornadas, as fixadas antes das demais

#### Scenario: Publicação privada não vaza
- **WHEN** existe uma publicação com `isPublic = false`
- **THEN** ela não aparece na resposta da rota pública
