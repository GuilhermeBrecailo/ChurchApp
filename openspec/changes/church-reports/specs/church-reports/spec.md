## ADDED Requirements

### Requirement: Relatório de confirmação de escala

O sistema SHALL exibir para pastor/adm a taxa de confirmação (confirmados, recusados, pendentes) por escala e por período.

#### Scenario: Relatório de confirmações no período

- **WHEN** o pastor/adm acessa a aba "Relatórios" em `/admin` e seleciona "Últimos 30 dias"
- **THEN** o sistema SHALL exibir uma tabela com cada escala, total de assignments e contagem por `confirmationStatus`

#### Scenario: Filtro por ministério

- **WHEN** o pastor/adm filtra por um ministério específico
- **THEN** apenas as escalas daquele ministério SHALL aparecer no relatório

---

### Requirement: Relatório de presença

O sistema SHALL exibir a taxa de presença real (attendanceStatus) dos voluntários por período.

#### Scenario: Relatório de presença no período

- **WHEN** o pastor/adm seleciona "Relatório de Presença" e o período
- **THEN** o sistema SHALL exibir total de assignments com `attendanceStatus = ATTENDED` vs total esperado

---

### Requirement: Relatório de membros

O sistema SHALL exibir um ranking de voluntários com mais ausências ou recusas no período selecionado.

#### Scenario: Ranking de ausências

- **WHEN** o pastor/adm acessa "Relatório de Membros"
- **THEN** o sistema SHALL exibir tabela com nome do voluntário, total de escalas, confirmados, recusados e ausentes, ordenado por ausências descendente

#### Scenario: Acesso restrito a pastor/adm

- **WHEN** um membro com role `MEMBER` tenta acessar os endpoints de relatório
- **THEN** o sistema SHALL retornar 403 Forbidden
