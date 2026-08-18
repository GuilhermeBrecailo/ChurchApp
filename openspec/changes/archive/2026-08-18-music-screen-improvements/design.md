## Context

`ministery/[id].vue`'s songs tab currently renders, per card: title, artist, up to 5 chips, 2 icon buttons, notes, a conditional "Abrir PDF" button, a conditional embed player, then either 3 manage icon-buttons or a CTA button. There's no search or category filter — `songs.value` renders unfiltered. `scale.vue`'s schedule details sheet independently renders its own song list + inline reader/transposer for the same `song.metadata` shape, duplicating logic that belongs in one place.

## Goals / Non-Goals

**Goals:**
- A song card shows only what's needed to recognize and pick a song from a list; everything else lives behind opening it.
- One shared song-card + song-reader component used by both the ministry repertoire tab and the schedule details sheet.
- Repertoire is searchable/filterable once it grows past a handful of songs.

**Non-Goals:**
- Changing how songs are created/edited (the create/edit dialog's tabs — info/lyrics/chords/PDF — are out of scope here).
- Changing chord transposition logic in `MusicSongTextRenderer`.

## Decisions

- **New `MusicSongCard.vue`** (compact): title, artist, one combined "has content" indicator (e.g. a single chip cycling icon for lyrics/chords/PDF presence, or just relying on the card being tappable — full chip breakdown moves to the detail view), tap target opens `MusicSongViewer.vue`.
  - Why: five independent chips force the reader to parse each one; a single glance-able card scales to a real repertoire size, matching the "menos coisas por tela" ask directly.
- **New `MusicSongViewer.vue`** (shared): consumes the existing `SongTextRenderer.vue` + transposer + auto-scroll controls (currently duplicated between `ministery/[id].vue`'s song viewer dialog and `scale.vue`'s details-sheet inline reader/fullscreen). Both call sites replace their local implementation with this component.
  - Alternative considered: leave the two call sites as-is and only simplify the card. Rejected — the user explicitly asked to improve both the escala and música screens, and the reader duplication is exactly the kind of unnecessary repetition that makes both harder to keep consistent (e.g. a future auto-scroll change would need to be made twice).
- **Search + category filter**: a text field (title/artist substring match, client-side over the already-loaded `songs` array — no new endpoint needed) plus the existing `songCategoryOptions` as filter chips, mirroring the filter-chip pattern already used in `scale.vue`'s ministry filter strip for visual consistency across the app.
- **Manage actions move into the viewer**: edit/delete buttons appear inside `MusicSongViewer.vue` for users with `canManageDepartment`, not on the list card — consistent with the "one button that navigates" rule from `ui-consistency-polish`.

## Risks / Trade-offs

- [Shared component used by two different pages/state models (`ministery/[id].vue`'s local `songs` ref vs. `scale.vue`'s per-schedule `mediaItems`)] → `MusicSongCard`/`MusicSongViewer` take a plain `song: { title, artist?, metadata, url? }`-shaped prop, no coupling to either page's data-fetching, so both can adapt their own data before passing it in.
- [Client-side search misses songs when a department's repertoire is paginated in the future] → Not paginated today (`getDepartmentSongs` returns the full list); revisit if that changes.

## Open Questions

- Should the search/filter state persist across tab switches (leaving and returning to "songs")? Default to resetting on navigation away, matching current behavior for other tabs, unless the user says otherwise during implementation review.
