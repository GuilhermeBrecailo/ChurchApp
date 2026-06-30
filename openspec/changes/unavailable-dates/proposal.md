## Why

O model `UserUnavailableDate` existe no schema Prisma mas não há UI para o voluntário registrar suas datas de indisponibilidade. Como consequência, o líder não sabe antecipadamente quando alguém não poderá ser escalado, gerando conflitos que só aparecem quando o voluntário clica em "Não posso" — depois que a escala já foi publicada.

## What Changes

- Nova seção "Indisponibilidades" na página `/user` onde o voluntário pode cadastrar datas em que não poderá ser escalado.
- Visualização em lista com opção de adicionar data (date picker), motivo opcional e remover entradas.
- O líder visualiza as indisponibilidades dos membros ao criar/editar escalas em `/ministery/[id]`.

## Capabilities

### New Capabilities

- `unavailable-dates`: Registro e visualização de datas de indisponibilidade do voluntário, integrado à criação de escalas pelo líder.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Endpoints `GET /api/church/my-unavailable-dates`, `POST /api/church/my-unavailable-dates`, `DELETE /api/church/my-unavailable-dates/:id`; adapter e route. Endpoint de membros para líder consultar: `GET /api/church/members/:id/unavailable-dates`.
- **Frontend (web)**: Composable `useUnavailableDates.ts`; seção em `pages/user.vue` com lista + date picker; aviso visual no modal de criação de escala em `ministery/[id].vue` quando um membro tem data indisponível na data da nova escala.
- **Banco de dados**: Sem migration — model `UserUnavailableDate` já existe.
