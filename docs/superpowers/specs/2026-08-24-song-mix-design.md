# Mix de Músicas (Song Mix)

## Why

Worship teams sometimes play two songs back-to-back as a single continuous
piece (medley) — e.g. closing one song straight into the next with no pause.
Today there is no way to read that as one continuous lyric/chord sheet: the
team has to either scroll through two separate songs mid-performance, or
manually retype the combined lyrics into one song's notes.

The user wants a "mix" feature: pick two existing songs from the ministry's
song library and get a new, saved song that reads as their letra/cifra joined
together, reusable in any escala going forward — the same way a regular song
is.

## Goals

- Create a mix from the ministry's song library by picking two existing
  songs.
- The resulting mix is a normal, saved song: it appears in the song list,
  can be added to any escala, and works with every existing song feature
  (single-song reader, sequence reader, personal cifra, quem-começa,
  font/bold/speed controls) with zero changes to those features.
- The mix is a snapshot: joining the two songs' text as it stood at creation
  time, in each song's own key, with no automatic transposition. Editing the
  original songs afterward does not change the mix.

## Non-goals

- No automatic transposition of the second song into the first song's key —
  confirmed with the user as out of scope; the mix keeps each song's text
  exactly as-is, joined.
- No live link back to the source songs. A mix does not update if a source
  song is edited or deleted later.
- No restriction on mixing a mix with another song or with another mix —
  since a mix becomes a plain song afterward, this falls out for free and
  needs no special-casing.
- No schema migration — `MediaItem.metadata` is already a free-form JSON
  column, which is where every mix-specific field lives.

## Approach (chosen: snapshot MediaItem)

Two approaches were considered during brainstorming:

- **Snapshot `MediaItem` (chosen).** Creating a mix inserts a brand-new row
  in the existing `MediaItem` table (`category: "MUSIC"`), whose
  `metadata.lyrics`/`chords`/`keyboardChords` are the two source songs' text
  concatenated with a section-header divider between them. After creation it
  is indistinguishable from any other song to every consumer (song list,
  escala, readers, quem-começa, personal cifra) — those already operate on
  `MediaItem`/`ScheduleMediaItem` and need zero changes. No live relation to
  the sources; matches the user's "só junta como está" (just join it as-is)
  answer.
- **Live composition record (rejected).** A new model referencing the two
  source `mediaItemId`s, rendered by joining at read time. Would stay in
  sync if a source song were edited later, but every place that currently
  reads a "song" (single reader, sequence reader, escala song list, personal
  cifra, PDF import) would need to learn a second, composite song shape.
  Rejected: much larger surface area for a live-sync benefit the user did
  not ask for.

The divider between the two songs' text reuses an already-recognized token:
`SongTextRenderer.vue`'s chord tokenizer already renders a line of the form
`[algum texto]` as a styled "section" segment (see `tokenizeChordLine`,
`song-section` class). Using `[Segunda música: <título>]` as the divider
means the reader already displays it correctly with zero renderer changes.

## Data model

No migration. `MediaItem.metadata` (`Json?`, already free-form) gains two
mix-specific keys, present only on mixes:

```ts
metadata: {
  // ...existing song metadata fields (unset on a mix, see below)
  mixSources?: string[]; // e.g. ["Grande é o Senhor", "Ao Deus Que Habita em Mim"]
                           // display-only label, not a live reference
}
```

Fields on the new `MediaItem` when created from a mix:

| Field | Value |
|---|---|
| `title` | User-editable, pre-filled as `"<título A> + <título B>"` |
| `category` | `"MUSIC"` |
| `metadata.lyrics` | `A.lyrics + "\n\n[Segunda música: <título B>]\n\n" + B.lyrics` — only built if at least one side has lyrics |
| `metadata.chords` | Same join pattern, using `A.chords`/`B.chords` |
| `metadata.keyboardChords` | Same join pattern, using `A.keyboardChords`/`B.keyboardChords` |
| `metadata.key` | `A.key` (starting key of the mix; editable afterward, no transposition) |
| `metadata.mixSources` | `[A.title, B.title]` — powers a "Mix" chip in the song list, cosmetic only |
| `artist`, `bpm`, `notes`, `pdf`, `mediaLink`, `songCategory` | Left unset — not meaningfully inherited from a two-song combination; `songCategory` defaults the same way manual song creation already defaults it |

If a field is absent on both source songs (e.g. neither has `chords`), the
resulting field is simply left unset — same as any song without a chord
sheet today.

## API

New endpoint, mirroring the existing `createChurchDepartmentSong` pattern
(same adapter file, same permission check):

```
POST /api/church/departments/:id/songs/mix
Body: { title: string, primaryMediaItemId: string, secondaryMediaItemId: string }
```

Server:
1. Loads both `MediaItem`s, scoped to the same department (`:id`) and the
   caller's church — 404/`DomainError` if either isn't found in scope.
2. Builds the concatenated `lyrics`/`chords`/`keyboardChords` per the table
   above.
3. Creates the new `MediaItem` via the same `$prismaClient.mediaItem.create`
   path the existing song-creation adapter already uses.
4. Returns the created song in the same shape `createChurchDepartmentSong`
   returns, so the frontend can reuse its existing response handling.

Permission: same check already guarding song creation for a department
(pastor / admin / role with department song-management permission) — no new
permission concept.

## Frontend

- **Entry point**: a "Criar mix" button next to the existing "Nova música"
  button in `Ministery/SongsTab.vue`'s toolbar, visible under the same
  `canManageSongs` gate as song creation, enabled only when the department
  has 2+ songs.
- **New dialog** `Ministery/MixSongDialog.vue`:
  - Two `v-select`s ("Música 1", "Música 2") populated from the tab's
    existing `songs` list; each excludes whatever is currently selected in
    the other, so a song can't be mixed with itself.
  - A title field, pre-filled as `"<título 1> + <título 2>"` once both
    songs are picked, editable before saving.
  - A read-only preview of the combined text, reusing
    `MusicSongTextRenderer` (same component every other song reader already
    uses) fed the same concatenation the backend will produce — the
    `[Segunda música: ...]` divider shows up already styled, no new CSS.
  - "Salvar mix" calls the new endpoint, appends the result to the tab's
    local `songs` list (matching how song creation already updates that
    list), closes the dialog.
- **Song list card**: `Ministery/SongsTab.vue`'s existing card grid gets one
  additional chip, `Mix` (shown when `song.metadata?.mixSources` is
  present) — same chip styling already used for `Letra`/`Cifra`/`PDF`.
- New composable function `createSongMix` in `useDepartments.ts`, mirroring
  `createChurchDepartmentSong`'s shape.

## Testing

- API: new Jest test file (or addition to the existing song adapter test
  suite) covering: successful mix creation with both lyrics and chords
  present, a source song missing chords (mix omits that field), sources from
  a different department rejected, permission check enforced.
- No web test runner exists in this repo (per `CLAUDE.md`) — frontend
  verification is manual: create a mix from two real songs in the local dev
  stack, confirm it appears in the song list with the `Mix` chip, add it to
  an escala, open it in both the single-song reader and "tocar sequência",
  confirm the divider renders as a styled section header.
- `npm run validate` (lint + typecheck + test + web build) before calling
  the change complete, same gate used for every other task in this session.
