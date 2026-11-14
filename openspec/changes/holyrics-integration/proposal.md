## Why

Holyrics is the projection software most Brazilian churches already use to display lyrics/chords on the telão during the service. Today a church's repertoire lives twice: once in ChurchApp (`Department` "Louvor" → `MediaItem` songs, attached to a `Schedule`/escala via `ScheduleMediaItem`, with title/artist/lyrics/chords/key already captured — see `churchDepartment/cifraClub.ts` and `song.ts`), and a second time re-typed or re-imported by hand into Holyrics before every culto. This duplicate entry is exactly the "Planilhas difíceis de manter" pain already named on the public landing page — except here it's ChurchApp itself causing the duplication for churches that don't want to abandon Holyrics for projection.

Holyrics ships an official REST API (`holyrics/API-Server`) with a cloud relay (`api.holyrics.com.br`) that accepts authenticated remote requests without requiring the church's network to be reachable from the internet — the church only has to enable "internet access" in Holyrics' own settings and hand ChurchApp a token. This makes a one-way push (ChurchApp → Holyrics) practical without a local agent/bridge.

## What Changes

- New optional per-church integration: a Holyrics access token, entered by the church admin in settings (same opt-in shape as the existing WhatsApp integration — `WhatsAppRoutes.ts`/`whatsappAdapters.ts` — status/connect/disconnect).
- On an escala's ("Schedule") repertoire view, a new action "Montar playlist no Holyrics": for each song in that schedule's ordered list (`ScheduleMediaItem` → `MediaItem`), the system searches the church's own Holyrics song library by title/artist (`SearchLyrics`) and, for each match, adds it to the Holyrics playlist for that culto (`AddLyricsToPlaylist`) in the escala's order. Songs with no match are reported back to the operator (name shown, not added) so they know to register that song in Holyrics themselves first.
- **Corrected from the original draft of this proposal**: Holyrics' remote/cloud API (`api.holyrics.com.br`) has no way to create or import new song lyrics — the only action that creates a song (`popup-createsong`) only accepts requests from `localhost` on the church's own machine, and even then it just opens a pre-filled popup for a human to confirm. So this change cannot eliminate re-typing a song's lyrics/chords into Holyrics the first time; it only eliminates manually re-building the playlist for songs the church has already registered there before. A true "zero re-typing" version would require a local agent running on the church's PC (same network as Holyrics) — deliberately out of scope here, see design.md.
- Explicitly NOT in scope now: pushing avisos/daily verse to Holyrics' alert/communication-panel actions, reading anything back from Holyrics, creating new songs in Holyrics (see above), or replacing the existing `presentation-mode` ("Modo Telão") feature.

## Capabilities

### New Capabilities

- `holyrics-integration`: per-church opt-in Holyrics connection (token entry, status, disconnect) and a one-way sync of an escala's repertoire into a Holyrics playlist.

### Modified Capabilities

<!-- Nenhuma spec existente com mudança de requisitos -->

## Impact

- **Database**: new optional fields on `Crunch` (`holyricsToken String?`, `holyricsPlaylistName String?`) — same shape as existing simple per-church settings (`accentColor`, `fontFamily`), no new table. Token stored as-is for now (see Open Questions in design.md re: encryption).
- **Backend**: new `api/src/interfaces/adapters/holyricsAdapters.ts` (direct-adapter pattern, matches newer features per `CLAUDE.md`) + `api/src/interfaces/routes/HolyricsRoutes.ts` mirroring `WhatsAppRoutes.ts`'s `status`/`connect`/`disconnect` shape, plus a `sync` route that takes a `scheduleId`, calls `SearchLyrics` per song, then `AddLyricsToPlaylist` for matches.
- **Frontend (web)**: new "Integrações" section (or extend existing church settings) for the token field; new "Montar playlist no Holyrics" button on the escala repertoire view, disabled/hidden when no token is configured; result feedback must show which songs were added vs. not found.
- **External dependency**: `api.holyrics.com.br` (Holyrics' own cloud relay) — outbound HTTPS call from the API only, no inbound exposure required.
