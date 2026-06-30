## ADDED Requirements

### Requirement: Pastor/adm publica versículo do dia

O sistema SHALL permitir que usuários com role `PASTOR`, `ADMIN` ou `SUPER_ADMIN` publiquem um versículo com referência e comentário opcional pelo painel de administração.

#### Scenario: Publicação com texto e referência

- **WHEN** um pastor/adm preenche texto, referência bíblica e clica em "Publicar" no admin
- **THEN** o versículo é salvo no banco com `publishedAt = NOW()` e `crunchId` da igreja do usuário

#### Scenario: Publicação sem comentário (campo opcional)

- **WHEN** um pastor/adm preenche texto e referência mas deixa o comentário em branco
- **THEN** o versículo é salvo com `commentary: null`

#### Scenario: Membro sem permissão não pode publicar

- **WHEN** um usuário com role `MEMBER` acessa o endpoint `POST /api/church/daily-verse`
- **THEN** o endpoint SHALL retornar 403 Forbidden

---

### Requirement: Versículo do dia exibido no dashboard

O dashboard SHALL exibir o versículo publicado mais recentemente para a igreja do usuário logado.

#### Scenario: Versículo disponível

- **WHEN** o membro acessa o dashboard e existe versículo publicado
- **THEN** o card `DailyVerseCard` SHALL exibir o texto, a referência e o comentário (se houver)

#### Scenario: Nenhum versículo publicado ainda

- **WHEN** o membro acessa o dashboard e não há versículo publicado para a igreja
- **THEN** o card `DailyVerseCard` SHALL exibir um empty state discreto (sem quebrar o layout)

---

### Requirement: Histórico em `/content/verse`

O sistema SHALL exibir o histórico de versículos publicados em `/content/verse`, do mais recente ao mais antigo.

#### Scenario: Lista de versículos anteriores

- **WHEN** o membro acessa `/content/verse`
- **THEN** a página SHALL exibir todos os versículos da igreja em ordem decrescente de `publishedAt`
