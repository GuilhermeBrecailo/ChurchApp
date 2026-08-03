## Why

A igreja já escolhe a cor de destaque, mas o pastor quer personalizar mais a identidade da página pública: **subir a foto/logo da igreja** num lugar claro, e **mudar a cor da letra e o estilo da fonte** para a página ficar com a cara dela.

> Status: proposta (spec + tarefas). Ainda não implementado.

## What Changes

- Um lugar claro para **subir a foto/logo da igreja** (o endpoint de upload já existe; falta a UI num lugar óbvio, junto dos dados de aparência).
- A igreja pode escolher a **cor do texto** e um **estilo de fonte** (a partir de um conjunto curado de fontes já carregadas — ex.: Fraunces, Inter, uma alternativa), aplicados à página pública.
- Todas as opções de aparência (logo, cor de destaque, cor do texto, fonte) ficam juntas numa seção de **Aparência da igreja**.

## Capabilities

### New Capabilities

- `church-appearance`: Personalização da identidade visual da página pública — foto/logo, cor de destaque, cor do texto e estilo de fonte.

### Modified Capabilities

<!-- Sem specs arquivadas; nada a modificar em nível de spec. -->

## Impact

- **Banco de dados (Prisma)**: novas colunas em `Crunch`: `textColor` e `fontFamily` (chave de um conjunto curado). `logo` e `accentColor` já existem. Migração aditiva.
- **Backend (api)**: `updateOwnChurch` aceita `textColor`/`fontFamily`; validar `fontFamily` contra a lista permitida; `publicChurchAdapters`/`GetPublicChurchBySlug` retornam os campos.
- **Frontend (web)**: seção "Aparência" no admin com upload de logo (reusar `uploadChurchPhoto`), seletor de cor de destaque (já existe), cor do texto e uma lista curada de fontes; a página pública (`c/[slug].vue`) aplica `--church-accent`, cor do texto e a família de fonte via variáveis, mantendo contraste e legibilidade (limitar a fontes já carregadas para não quebrar o CSP/rede).
- **Cuidado**: restringir a um conjunto curado de fontes e validar contraste do texto para não deixar a página ilegível.
