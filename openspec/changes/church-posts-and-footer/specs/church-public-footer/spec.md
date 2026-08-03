## ADDED Requirements

### Requirement: Dados de rodapé da igreja
O sistema SHALL manter, no cadastro da igreja, dados de rodapé opcionais: telefone, WhatsApp, e-mail, e links de Instagram, Facebook, YouTube e site. Esses dados SHALL poder ser editados por quem gerencia a igreja (pastor/admin) junto com os demais dados da igreja.

#### Scenario: Salvar contatos e redes
- **WHEN** um pastor/admin salva WhatsApp, e-mail e link de Instagram no cadastro da igreja
- **THEN** os valores são persistidos na igreja

#### Scenario: Campos de rodapé são opcionais
- **WHEN** a igreja é salva sem preencher redes sociais
- **THEN** o salvamento é aceito e os campos ficam vazios

### Requirement: Rodapé exposto na rota pública
A rota pública da igreja SHALL incluir os dados de rodapé — endereço, contatos e redes sociais preenchidos — para a página pública montar o rodapé.

#### Scenario: Rota pública inclui rodapé
- **WHEN** a página pública da igreja é carregada
- **THEN** a resposta inclui endereço, contatos e apenas as redes sociais que foram preenchidas
