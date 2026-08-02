## Why

The repertoire ("songs") tab in `web/app/pages/ministery/[id].vue` renders every song as a card exposing everything at once: title, artist, up to 5 chips (category, key, BPM, "Letra", "Cifra", "PDF"), a maximize icon, an external-link icon, notes text, an "Abrir PDF" button, an embedded media player, and then either 3 manage icons (view/edit/delete) or a "Ver letra e cifra" button — all visible simultaneously on every card in the list. This is the concrete case behind "melhorar tela de música" and "deixar menos coisas em cada tela": scanning a repertoire of more than a few songs means parsing a wall of chips and buttons per item instead of a title a leader can recognize at a glance.

## What Changes

- Collapse each song card to its essentials for scanning — title, artist, and at most one or two indicator chips (e.g. category + whether it has lyrics/chords/PDF as a single compact indicator, not five separate chips) — with everything else (notes, embed player, PDF link, key/BPM detail) moved behind opening the song, per the "one button that goes to that screen" pattern.
- Make the "Ver letra e cifra" / maximize action the single primary entry point per card; manage actions (edit/delete) move into that same detail view for leaders instead of sitting inline on every list card.
- Reuse this simplified song card and the fullscreen song reader (`MusicSongTextRenderer`, transposer, auto-scroll) as the shared music surface referenced by `schedule-screen-improvements`' details sheet, so there is one music UI, not two divergent ones (ministry repertoire vs. schedule song list).
- Add basic scan aids appropriate for a growing repertoire: search-by-title/artist and category filter chips at the top of the songs tab (today there is none — the full unfiltered list always renders).

## Capabilities

### New Capabilities
- `music-repertoire`: song list scanability (compact cards, search/filter) and a single shared song detail/reader surface.

### Modified Capabilities
- none (the `schedule-management` spec from `schedule-screen-improvements` already requires reusing this shared song component from the schedule details sheet; no separate requirement change needed here)

## Impact

- `web/app/pages/ministery/[id].vue` — songs tab card markup, search/filter state.
- `web/app/components/Music/SongTextRenderer.vue`, `web/app/components/Music/EmbedPlayer.vue` — reused, not restructured.
- Coordinates with `schedule-screen-improvements` (`ScheduleDetailsSheet.vue` extraction) to share the song card/reader component instead of each screen keeping its own copy.
- No backend/API changes — `song.metadata` shape is unchanged.
