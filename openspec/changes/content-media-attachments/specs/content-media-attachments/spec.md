## ADDED Requirements

### Requirement: Foto e vídeo em avisos, devocionais e versículos
Avisos, devocionais e versículos/palavras SHALL aceitar uma foto (por upload) e um vídeo (link) opcionais, na criação e na edição, reaproveitando o upload de imagem e o padrão de link de vídeo já existentes.

#### Scenario: Anexar foto a um aviso
- **WHEN** o pastor cria um aviso e envia uma foto
- **THEN** o aviso é salvo com a imagem associada

#### Scenario: Anexar vídeo a um devocional
- **WHEN** o pastor adiciona um link de vídeo a um devocional
- **THEN** o devocional guarda o link e o exibe onde for mostrado

#### Scenario: Mídia é opcional
- **WHEN** o conteúdo é salvo sem foto nem vídeo
- **THEN** o salvamento é aceito normalmente

### Requirement: Mídia aparece na página pública
Quando um aviso, devocional ou versículo público tiver foto ou vídeo, a página pública SHALL exibir essa mídia junto do item.

#### Scenario: Foto do aviso na página pública
- **WHEN** um aviso público tem foto e a página pública é aberta
- **THEN** a foto aparece junto do aviso
