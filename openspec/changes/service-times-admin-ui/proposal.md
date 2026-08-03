## Why

O backend de horários de culto (`service-times`) e toda a lógica de tela no admin (form, salvar, editar, desativar) já existiam, mas **a UI nunca foi montada no template** — não havia como cadastrar um horário pela interface. Sem isso, os "Próximos cultos" da página pública ficavam sempre vazios. Esta mudança monta a tela que faltava.

## What Changes

- Nova tela **"Horários de culto"** no admin (dentro da seção Página Pública): cadastrar, editar e desativar horários (dia da semana + horário + nome do culto), listados e ordenados por dia/hora.
- Os horários passam a ser carregados junto com o resto dos dados do admin (`loadServiceTimes`).
- A tela usa o mesmo tratamento editorial (papel + cor da igreja + Fraunces) das demais telas de cadastro.
- Reaproveita 100% da lógica e do composable que já existiam — sem mudança de backend.

## Capabilities

### New Capabilities

- `service-times-admin`: Tela de cadastro de horários de culto no admin, que alimenta os "Próximos cultos" da página pública.

### Modified Capabilities

<!-- Nenhuma spec arquivada em openspec/specs; nada a modificar em nível de spec. -->

## Impact

- **Frontend (web)**: `admin.vue` ganha o card "Horários de culto" (form + lista) na seção Página Pública, o helper `weekdayName`, o `sortedServiceTimes`, e passa a chamar `loadServiceTimes()` no carregamento do admin. CSS do formulário e da lista, responsivo.
- **Backend**: nenhuma mudança — usa as rotas existentes `GET/POST/PATCH /api/church/service-times`.
