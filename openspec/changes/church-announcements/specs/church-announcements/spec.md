## ADDED Requirements

### Requirement: Pastor/adm cria avisos

O sistema SHALL permitir que usuários com role `PASTOR`, `ADMIN` ou `SUPER_ADMIN` criem avisos com título, texto, flag de fixado e data de expiração opcional.

#### Scenario: Criação de aviso simples

- **WHEN** um pastor/adm preenche título e texto e clica em "Publicar aviso"
- **THEN** o aviso é salvo com `publishedAt = NOW()`, `pinned: false`, `expiresAt: null`

#### Scenario: Aviso fixado

- **WHEN** o pastor/adm marca a opção "Fixar aviso" ao criar
- **THEN** o aviso é salvo com `pinned: true` e aparece antes dos não fixados no dashboard

#### Scenario: Aviso com expiração

- **WHEN** o pastor/adm define uma data de expiração
- **THEN** o aviso deixa de aparecer no dashboard após a data definida

---

### Requirement: Avisos exibidos no dashboard

O dashboard SHALL exibir avisos ativos da igreja do usuário logado (não expirados), ordenados por `pinned DESC, publishedAt DESC`.

#### Scenario: Dashboard com avisos ativos

- **WHEN** o membro acessa o dashboard e existem avisos ativos
- **THEN** a seção "Avisos" SHALL exibir até 3 avisos com título e texto truncado

#### Scenario: Dashboard sem avisos

- **WHEN** não há avisos ativos para a igreja
- **THEN** a seção de avisos SHALL estar oculta (sem seção vazia)

---

### Requirement: Remoção de aviso pelo admin

O sistema SHALL permitir que pastor/adm remova um aviso, tornando-o imediatamente invisível no dashboard.

#### Scenario: Remoção confirmada

- **WHEN** pastor/adm remove um aviso no painel admin
- **THEN** o aviso é deletado do banco e some do dashboard dos membros na próxima carga
