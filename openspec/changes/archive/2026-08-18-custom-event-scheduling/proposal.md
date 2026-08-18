## Why

Hoje só é possível criar escalas vinculadas a um ministério específico. Reuniões de líderes, retiros, ensaios gerais e outros eventos da igreja não se encaixam nesse modelo. A liderança precisa escalar pessoas para qualquer tipo de evento sem amarrar ao contexto de um ministério.

## What Changes

- Ao criar uma escala, o líder pode escolher o tipo do evento: Culto, Reunião, Retiro, Ensaio Geral ou Outro (texto livre).
- O tipo do evento é exibido no card da escala e no detalhe.
- Filtro na página de escalas permite filtrar por tipo de evento além do ministério.
- Evento do tipo "Outro" exige que o líder informe o nome do tipo.

## Capabilities

### New Capabilities

- `custom-event-scheduling`: Criação de escalas com tipo de evento customizável, com filtro por tipo na listagem.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Adicionar campo `eventType String @default("CULTO")` ao model `Schedule`; migration; atualizar endpoint de criação e edição para aceitar `eventType`; retornar `eventType` no `scheduleSelect`.
- **Frontend (web)**: Seletor de tipo no form de criação/edição de escala; exibição do tipo no card e detalhe; filtro adicional por tipo na página de escalas.
- **Banco de dados**: Migration com campo nullable `eventType` com default `"CULTO"`.
