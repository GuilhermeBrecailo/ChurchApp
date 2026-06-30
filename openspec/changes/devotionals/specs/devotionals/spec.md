## ADDED Requirements

### Requirement: Pastor/adm cria devocional com capítulos

O sistema SHALL permitir que usuários com role `PASTOR`, `ADMIN` ou `SUPER_ADMIN` criem devocionais com múltiplos capítulos ordenados.

#### Scenario: Criação de devocional com capítulos

- **WHEN** o pastor/adm preenche título, descrição e adiciona ao menos um capítulo com título e texto
- **THEN** o devocional é salvo com seus capítulos e `publishedAt = NOW()`

#### Scenario: Adicionar capítulo com referência bíblica

- **WHEN** o pastor/adm adiciona um capítulo e preenche o campo de referência bíblica
- **THEN** o capítulo é salvo com `bibleRef` preenchido e exibido no leitor

---

### Requirement: Membros listam e leem devocionais

O sistema SHALL exibir em `/content/devotionals` os devocionais publicados pela igreja do usuário, do mais recente ao mais antigo.

#### Scenario: Lista de devocionais

- **WHEN** o membro acessa `/content/devotionals`
- **THEN** a página SHALL exibir cards com título, descrição e número de capítulos de cada devocional

#### Scenario: Leitura de capítulo

- **WHEN** o membro acessa `/content/devotionals/:id` e seleciona um capítulo
- **THEN** o texto do capítulo e a referência bíblica (se houver) SHALL ser exibidos

---

### Requirement: Progresso de leitura salvo por membro

O sistema SHALL registrar o último capítulo lido por cada membro em `DevotionalProgress`.

#### Scenario: Progresso salvo automaticamente

- **WHEN** o membro abre um capítulo
- **THEN** `DevotionalProgress` é upserted com `lastChapterId` e `updatedAt = NOW()`

#### Scenario: Retomar leitura

- **WHEN** o membro reabre um devocional já iniciado
- **THEN** o último capítulo lido SHALL estar destacado visualmente
