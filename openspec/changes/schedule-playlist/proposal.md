## Why

O model `ScheduleMediaItem` já armazena as músicas vinculadas a cada escala e `UserSongPreference` guarda o tom pessoal e cifra de cada membro por música. Toda a informação existe no banco, mas não há UI para o voluntário ver a playlist da sua escala antes ou durante o culto. Músicos precisam consultar o tom e a letra fora do app.

## What Changes

- Dentro do detalhe de uma escala (modal/dialog em `scale.vue`), aparece uma aba ou seção "Playlist" com as músicas vinculadas àquela escala.
- Cada música exibe título, tom original e — se o usuário tiver preferência salva — o tom pessoal.
- O membro pode expandir cada música para ver a letra/cifra (componente `SongTextRenderer` já existe).
- O endpoint de detalhe da escala precisa incluir `mediaItems` com `userPreferences` no select Prisma.

## Capabilities

### New Capabilities

- `schedule-playlist`: Visualização das músicas de uma escala com tom pessoal do voluntário.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Backend**: Verificar e atualizar o select Prisma do endpoint de detalhe de escala para incluir `mediaItems.mediaItem` com `userPreferences` filtradas pelo `userId` autenticado.
- **Frontend (web)**: Nova seção/aba "Playlist" dentro do dialog de detalhe de escala em `scale.vue`; reutiliza `Music/SongTextRenderer.vue` para exibir letra/cifra; lógica de tom pessoal usando `userPreference.personalKey`.
- **Banco de dados**: Sem migration — dados já existem.
