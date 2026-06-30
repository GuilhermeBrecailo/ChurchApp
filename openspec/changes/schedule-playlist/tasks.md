## 1. Backend — Verificar e atualizar endpoint de detalhe de escala

- [x] 1.1 Localizar o endpoint que retorna detalhe de uma escala individual em `api/src/interfaces/adapters/churchDepartmentAdapters.ts`
- [x] 1.2 `mediaItems` já incluídos no select Prisma (verificado em churchDepartmentAdapters.ts linha ~1575)
- [x] 1.3 Endpoint de lista não inclui mediaItems — confirmado

## 2. Frontend — Componente SchedulePlaylist

- [x] 2.1 Já implementado em `scale.vue` — `selectedDetailSongs` computed e seção de playlist no dialog de detalhes (linha 312)
- [x] 2.2 Tom pessoal e `SongTextRenderer` já integrados em `scale.vue` (songCurrentKey, getSongChordsForCurrentRole)
- [x] 2.3 Expandir/letra já funcionando com `MusicSongTextRenderer` (linha 468)

## 3. Frontend — Integração em scale.vue

- [x] 3.1 Dialog/sheet de detalhe já existe em `scale.vue`
- [x] 3.2 Seção "Músicas" já presente na seção de detalhes (linha 312)
- [x] 3.3 `selectedDetailSongs` calculado a partir de `event.mediaItems`

## 4. Frontend — Tipagem

- [x] 4.1 Tipos já definidos em `scale.vue` via `ScheduleEvent["mediaItems"]`
