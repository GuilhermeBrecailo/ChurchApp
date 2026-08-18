## 1. Shared components

- [ ] 1.1 Create `web/app/components/Music/MusicSongCard.vue` (compact: title, artist, one indicator) consuming a plain song-shaped prop
- [ ] 1.2 Create `web/app/components/Music/MusicSongViewer.vue` wrapping `SongTextRenderer.vue` + transposer + auto-scroll + PDF/notes/embed-player details + manage actions (edit/delete slot for `canManageDepartment`)

## 2. Ministry repertoire tab

- [ ] 2.1 Replace the current song card markup in `ministery/[id].vue`'s songs section with `MusicSongCard`
- [ ] 2.2 Replace the existing song viewer dialog with `MusicSongViewer`, wiring `openSongEditDialog`/`handleDeleteSong` into it
- [ ] 2.3 Add search text field (title/artist substring, client-side) above the song list
- [ ] 2.4 Add category filter chips above the song list, reusing `songCategoryOptions`

## 3. Schedule details integration (coordinates with schedule-screen-improvements)

- [ ] 3.1 Replace `scale.vue`'s inline song list + reader in the details sheet with `MusicSongCard`/`MusicSongViewer`
- [ ] 3.2 Confirm drag-reorder (`startSongDrag`/`persistSongOrder`) still works with the shared card component

## 4. Verification

- [ ] 4.1 Manual smoke test: repertoire tab shows compact cards, opening one reveals full detail + manage actions
- [ ] 4.2 Manual smoke test: search and category filter narrow the visible list correctly
- [ ] 4.3 Manual smoke test: schedule details sheet song list uses the same reader with working transposition/auto-scroll
- [ ] 4.4 Run `npm run web:build`
