## 1. Backend — Endpoints

- [x] 1.1 Criado handler `getMyChurchSongPreferences` em `churchDepartmentAdapters.ts` retornando todas as preferências do usuário com `mediaItem` expandido
- [x] 1.2 `PATCH /api/church/songs/:songId/preference` já existia em `updateChurchSongPreference`
- [x] 1.3 Rota `GET /api/church/my-song-preferences` registrada em `ChurchDepartmentRoutes.ts`

## 2. Frontend — Composable

- [x] 2.1 Criado `web/composables/usePersonalPlaylist.ts` com `getMyPlaylist()` e `updateSongPreference()`

## 3. Frontend — Página /content/playlist

- [x] 3.1 Criado `web/app/pages/content/playlist.vue` com busca, cards de música, dropdown de tom inline e empty state
- [x] 3.2 Tom salvo via `updateSongPreference()` com snackbar de confirmação
- [x] 3.3 `MusicSongTextRenderer` integrado em overlay lateral para visualização de letra/cifra
