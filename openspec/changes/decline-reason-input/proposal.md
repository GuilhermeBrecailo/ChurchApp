## Why

Atualmente, quando um voluntário clica em "Não posso" na escala, o sistema apenas registra o status `DECLINED` sem capturar o motivo. Ministros, pastores e administradores ficam sem informação sobre o porquê da ausência, dificultando a gestão e substituição do voluntário.

## What Changes

- Ao clicar em "Não posso", um dialog/modal é exibido com um campo de texto para o voluntário descrever o motivo da ausência.
- O motivo é enviado junto com a ação `DECLINED` e salvo no banco de dados no registro `ScheduleAssignment`.
- No painel de gestão da escala (visível para ministro/pastor/adm), o motivo é exibido ao lado do status "Não pode" (via tooltip ou expansão inline).
- O campo motivo é opcional — o voluntário pode declinar sem preencher.

## Capabilities

### New Capabilities

- `decline-reason`: Captura, armazenamento e exibição do motivo de recusa de escala por parte do voluntário.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Adicionar campo `declineReason String?` na model `ScheduleAssignment` do Prisma; atualizar endpoint `PATCH /api/church/schedules/:id/my-assignment` para aceitar e persistir o campo.
- **Frontend (web)**: Novo dialog de confirmação ao clicar em "Não posso" em `scale.vue`; atualizar `useDepartments.ts` para enviar o campo; exibir motivo no painel de gestão (lista de assignments do ministro/pastor/adm).
- **Notificações**: Incluir o motivo no texto da notificação push enviada ao líder/adm quando alguém declina.
- **Banco de dados**: Nova migration Prisma com campo nullable `declineReason`.
