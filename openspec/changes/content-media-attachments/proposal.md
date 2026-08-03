## Why

Só as Publicações (`Post`) aceitam foto e vídeo. O pastor quer poder anexar **foto e vídeo** também nos **avisos, devocionais e na palavra/versículo**, para deixar esses conteúdos mais ricos — na página pública e no app.

> Status: proposta (spec + tarefas). Ainda não implementado.

## What Changes

- **Aviso** (`Announcement`), **Devocional** (`Devotional`) e **Versículo/Palavra** (`DailyVerse`) passam a aceitar uma **foto** (upload) e um **vídeo** (link), como já acontece nas Publicações.
- Reaproveita o **upload de imagem** (`POST /api/church/uploads/image`) já criado, e o padrão de `videoUrl` (link YouTube/Instagram) que versículo e devocional já têm.
- A página pública exibe a foto/vídeo desses conteúdos onde eles aparecem.

## Capabilities

### New Capabilities

- `content-media-attachments`: Anexos de foto e vídeo em avisos, devocionais e versículos/palavras, na criação/edição e na exibição pública.

### Modified Capabilities

<!-- Sem specs arquivadas; nada a modificar em nível de spec. -->

## Impact

- **Banco de dados (Prisma)**: adicionar `imageUrl`/`imageKey` em `Announcement` e `DailyVerse` (o `Devotional` e o `DailyVerse` já têm `videoUrl`; `Announcement` precisa de `videoUrl` também). Migração aditiva.
- **Backend (api)**: `announcementAdapters`, `devotionalAdapters`, `dailyVerseAdapters` passam a aceitar/persistir `imageUrl`/`imageKey`/`videoUrl`; `publicChurchAdapters` inclui esses campos no que já retorna.
- **Frontend (web)**: os formulários desses conteúdos ganham upload de foto (reusando `usePosts().uploadImage` ou um upload compartilhado) e campo de vídeo; a página pública (`c/[slug].vue`) exibe a mídia nesses itens.
