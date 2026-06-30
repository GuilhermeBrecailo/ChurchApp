## Context

O app usa Nuxt 4 + Vuetify 4 no frontend e Fastify + Prisma no backend. O model `UserSongPreference { id, personalKey, chords, userId, mediaItemId }` já existe com `@@unique([userId, mediaItemId])`. O model `MediaItem { id, title, url, category, metadata, departmentId }` armazena as músicas. O componente `Music/SongTextRenderer.vue` já renderiza letra/cifra. A nova página `/content/playlist` fica dentro do hub de Conteúdo já criado.

## Goals / Non-Goals

**Goals:**
- Músico vê todas as músicas dos seus ministérios com preferências salvas
- Visualização de letra/cifra no tom pessoal
- Edição inline do tom pessoal

**Non-Goals:**
- Player de áudio
- Criação de músicas novas (isso é feito no ministério)
- Compartilhar playlist com outros membros
- Reordenar playlist

## Decisions

### 1. Listar apenas músicas com preferência salva, não todo o catálogo
A página `/content/playlist` exibe `UserSongPreference` do usuário logado (músicas que ele já interagiu). O catálogo completo de músicas fica dentro de cada ministério. Isso mantém a playlist pessoal focada e rápida.

**Alternativa descartada**: Mostrar todas as músicas dos ministérios do usuário — lista pode ser enorme e sem relevância imediata.

### 2. Endpoint retorna `UserSongPreference` com `mediaItem` expandido
`GET /api/church/my-song-preferences` retorna lista com `mediaItem.title`, `mediaItem.url` (para `SongTextRenderer`) e os campos `personalKey`/`chords`. Uma única chamada.

### 3. Edição de tom inline com `v-select` no card
Tom pessoal é editado direto no card (dropdown de notas musicais: C, C#, D...). Salva via `PATCH` ao selecionar. Sem dialog extra.

### 4. Drawer lateral para letra/cifra
Ao clicar em uma música, um `v-navigation-drawer` ou bottom sheet exibe `SongTextRenderer` no tom pessoal. Mesmo padrão de overlay responsivo já usado em `ResponsiveOverlay.vue`.

## Risks / Trade-offs

- **Músico sem preferências salvas**: Página fica vazia. → Empty state com link para os ministérios onde ele pode salvar preferências.

## Migration Plan

Sem migration. Sem schema novo. Apenas novos endpoints e UI.
