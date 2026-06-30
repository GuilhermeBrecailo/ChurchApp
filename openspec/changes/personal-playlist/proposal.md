## Why

O model `UserSongPreference` já armazena o tom pessoal (`personalKey`) e cifra customizada (`chords`) que cada músico prefere para cada música do ministério. Essa informação existe no banco mas não há onde o músico consulte sua biblioteca pessoal fora do contexto de uma escala específica. Um instrumentista precisa rever sua lista de músicas e tons antes de um ensaio.

## What Changes

- Nova página `/content/playlist` exibindo todas as músicas dos ministérios do usuário com seu tom pessoal salvo.
- O músico pode buscar por nome, filtrar por ministério e ordenar por título.
- Ao clicar em uma música, a letra/cifra é exibida no tom pessoal do usuário (reutilizando `SongTextRenderer`).
- O músico pode editar seu tom pessoal direto na página.

## Capabilities

### New Capabilities

- `personal-playlist`: Biblioteca pessoal de músicas do músico com tom personalizado e acesso rápido à letra/cifra.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Endpoint `GET /api/church/my-song-preferences` retornando `UserSongPreference` com `mediaItem` expandido; endpoint `PATCH /api/church/my-song-preferences/:mediaItemId` para atualizar `personalKey`/`chords`.
- **Frontend (web)**: Composable `usePersonalPlaylist.ts`; página `pages/content/playlist.vue` com lista filtrável, card por música e drawer/modal de visualização com `SongTextRenderer`; campo inline de edição de tom pessoal.
- **Banco de dados**: Sem migration — model `UserSongPreference` e `MediaItem` já existem.
