## Context

O app usa Nuxt 4 + Vuetify 4. O model `ScheduleMediaItem` já relaciona `Schedule` com `MediaItem`. O model `UserSongPreference` armazena `personalKey` e `chords` por usuário/música. O componente `Music/SongTextRenderer.vue` já renderiza letra/cifra. A página `scale.vue` (~2k linhas) exibe escalas com dialog de detalhes. O composable `useDepartments.ts` faz as chamadas de API. O endpoint de detalhe da escala precisa ser verificado para garantir que inclui `mediaItems` no select Prisma.

## Goals / Non-Goals

**Goals:**
- Músico vê a playlist de uma escala no app (músicas + tom pessoal)
- Letra/cifra acessível sem sair do contexto da escala
- Tom pessoal do usuário exibido quando disponível

**Non-Goals:**
- Player de áudio
- Edição da playlist pelo músico (só pelo líder no ministério)
- Arrastar para reordenar músicas na playlist da escala
- Modo de apresentação (letra grande na tela)

## Decisions

### 1. Seção dentro do dialog de escala existente, não nova página
`scale.vue` já usa um sistema de dialogs/sheets para detalhe de escala. Adicionar uma aba "Playlist" dentro desse dialog (padrão `v-tabs`) mantém o fluxo do músico sem navegação extra.

**Alternativa descartada**: Página `/scale/:id/playlist` — fragmenta a navegação e requer rota extra.

### 2. Tom pessoal via `UserSongPreference` filtrado pelo usuário autenticado
O backend já tem o userId via JWT. O endpoint de detalhe da escala deve incluir `mediaItems.mediaItem.userPreferences` filtradas pelo `userId` logado. Assim o frontend recebe o tom pessoal já pronto, sem segunda chamada.

### 3. Reutilizar `SongTextRenderer` para letra/cifra
O componente já existe e funciona. Não criar novo componente de renderização.

## Risks / Trade-offs

- **Tamanho do payload**: Incluir `mediaItems` com `userPreferences` e conteúdo de cifra em cada escala pode aumentar o payload do endpoint de lista de escalas. → Incluir apenas no endpoint de detalhe individual da escala, não na lista.
- **scale.vue já tem 2k linhas**: Adicionar tabs pode aumentar a complexidade. → Extrair a seção de playlist como componente filho `Scale/SchedulePlaylist.vue`.

## Migration Plan

Sem migration. Apenas ajuste de select Prisma no backend e UI nova no frontend.
