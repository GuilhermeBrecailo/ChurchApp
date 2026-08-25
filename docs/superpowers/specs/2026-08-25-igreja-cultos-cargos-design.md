# Igreja, Cultos Manuais e Cargos Granulares

## Contexto

O app adicionou o hub de cultos como uma lista de ocorrencias calculadas a partir de horarios recorrentes (`ServiceTime`). Na pratica, o usuario nao encontra onde criar um culto, porque o cadastro ficou escondido em Admin > Configuracoes > Horarios de culto. A navegacao inferior tambem leva direto para Ministerios, enquanto o usuario espera uma area mais ampla de Igreja.

Os cargos ja usam permissoes customizadas por igreja ou ministerio, mas "cultos" ainda reaproveita `ANNOUNCEMENT_PUBLISH`, misturando avisos com gestao de culto.

## Objetivos

- Trocar a entrada central da navegacao de `Ministerios` para `Igreja`, com icone de cruz.
- Criar uma pagina `/igreja` com cards de acesso para Cultos, Ministerios e areas relacionadas.
- Transformar `/cultos` em uma tela visual de cultos manuais, com foto, titulo, data e hora.
- Permitir criar culto manual agora, sem depender de horario recorrente.
- Dar mais controle em cargos com permissoes especificas de culto.
- No detalhe do culto, expor escalas vinculadas, atalho para adicionar escala de ministerio e gestao de presenca.

## Nao Objetivos

- Remover `ServiceTime` ou os horarios recorrentes existentes.
- Migrar todos os cultos antigos ou escalas antigas.
- Criar storage novo para imagem. A foto do culto usa o upload de imagem ja existente em `/api/church/uploads/image`.
- Implementar recorrencia automatica nesta etapa.

## Modelo

`ServiceOccurrence` passa a representar um culto manual. Ele ganha campos proprios:

- `title: string`
- `time: string`
- `description?: string`
- `imageUrl?: string`
- `imageKey?: string`

`serviceTimeId` vira opcional para manter compatibilidade com ocorrencias geradas por horarios recorrentes. As respostas da API devem sempre expor titulo/data/hora usando os campos manuais quando existirem, e cair para `serviceTime.label/time` quando vier de um horario recorrente antigo.

## Permissoes

Novas permissoes de escopo `CHURCH`:

- `CULT_CREATE`: criar cultos manuais.
- `CULT_EDIT`: editar cultos.
- `CULT_DELETE`: apagar cultos.
- `CULT_ATTENDANCE_MANAGE`: gerenciar presenca do culto.

Pastor/admin continuam podendo tudo. Membros precisam do cargo correspondente.

## Interfaces

API:

- `GET /api/church/service-occurrences?daysAhead=30`: lista cultos futuros/recentes.
- `POST /api/church/service-occurrences`: cria culto manual ou resolve culto legado quando `serviceTimeId` for enviado.
- `GET /api/church/service-occurrences/:id`: detalhe do culto.
- `PATCH /api/church/service-occurrences/:id`: edita dados manuais do culto.
- `DELETE /api/church/service-occurrences/:id`: remove culto manual sem escalas vinculadas.
- Rotas de presenca nominal continuam sob `/attendees`, agora exigindo `CULT_ATTENDANCE_MANAGE`.

Web:

- Bottom nav: item `Igreja` aponta para `/igreja`.
- `/igreja`: cards de navegacao.
- `/cultos`: lista visual e botao de novo culto.
- `/cultos/:id`: detalhe visual, abas/acoes para escalas e presenca.

## Validacao

- Testes Jest para permissoes de culto, criacao manual, edicao, exclusao bloqueada com escalas e presenca por cargo.
- `npm run api:typecheck`
- `npm run api:test`
- `npm run web:build`

