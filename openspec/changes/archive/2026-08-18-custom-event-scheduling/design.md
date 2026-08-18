## Context

O model `Schedule` tem `description` (título), `date`, `departmentId`, `rehearsalAt`, `rehearsalNotes`. Não há campo de tipo. As escalas são sempre de um ministério — o `departmentId` é obrigatório hoje.

## Goals / Non-Goals

**Goals:**
- Campo `eventType` no model Schedule com valores pré-definidos + "Outro" com texto livre
- Exibição do tipo no card e no detalhe da escala
- Filtro por tipo na listagem

**Non-Goals:**
- Escala sem ministério (departmentId continua obrigatório — o evento ainda pertence a um ministério)
- Permissões diferentes por tipo de evento

## Decisions

**`eventType` como String com default "CULTO"**: evita enum Prisma que requer migration mais complexa em produção. Valores esperados: `"CULTO"`, `"REUNIAO"`, `"RETIRO"`, `"ENSAIO"`, `"OUTRO:<texto>"`. O prefixo `OUTRO:` permite texto livre sem campo adicional.

**Formato `OUTRO:<texto>`**: armazena o nome customizado no mesmo campo sem adicionar coluna extra. O frontend faz split por `:` para exibir o texto.

**Filtro por tipo no frontend**: os tipos são extraídos dos dados já carregados em `schedules.value` — sem chamada adicional ao backend.

## Risks / Trade-offs

- [Migration com default] → Campo nullable com default não quebra registros existentes. Aceitável.
- [Formato `OUTRO:<texto>` acoplado] → Simples e suficiente para MVP; pode ser normalizado depois se necessário.
