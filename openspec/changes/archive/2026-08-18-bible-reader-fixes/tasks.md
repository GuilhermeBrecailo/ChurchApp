## 1. Backend: cache + provider abstraction

- [ ] 1.1 Add `BibleChapterCache` Prisma model (`version`, `bookAbbrev`, `chapter`, `text` JSON, `sourceProvider`, timestamps) + migration
- [ ] 1.2 Build a per-provider book-abbreviation table (internal abbrev → abibliadigital abbrev, internal abbrev → bible-api.com slug) separate from `BIBLE_BOOKS[].abbrev`, fixing the Job (`jó`) mismatch
- [ ] 1.3 Implement server-side fetch-with-fallback: try cache → try abibliadigital for requested version → try bible-api.com (Almeida) marking `servedVersion !== requestedVersion` → persist successful fetch to cache
- [ ] 1.4 Add `GET /api/bible/:version/:book/:chapter` route + adapter (direct-adapter pattern, no auth required — confirm with `publicRoutes` in `TenantHandler.ts` whether this needs to be public or behind auth)
- [ ] 1.5 Add `GET /api/bible/availability` returning which of the 4 versions currently have a working provider (based on recent fetch outcomes)

## 2. Frontend: consume the new route, fix silent fallback UX

- [ ] 2.1 Point `useBible.ts` at the new internal `/api/bible/...` route instead of calling abibliadigital/bible-api.com directly
- [ ] 2.2 Use the server's `servedVersion`/fallback flag as the source of truth for the fallback chip/alert (replace client-inferred `usedFallback`)
- [ ] 2.3 Fetch `/api/bible/availability` on mount; bind it to `disabled` on each item in the `Versão` `v-select` in `bible.vue`
- [ ] 2.4 Add an explicit "indisponível, tente novamente" error state for cache-miss + all-providers-down, distinct from the existing generic error

## 3. Verification

- [ ] 3.1 Unit test the server fallback logic: requested version available / unavailable-with-fallback / all-unavailable
- [ ] 3.2 Unit test the book-abbreviation mapping, including Job
- [ ] 3.3 Manually verify against live providers once abibliadigital is confirmed back up (or mock it) that a full NVI chapter round-trip works and gets cached
- [ ] 3.4 Confirm cache hit path skips outbound fetches (e.g. via network request assertions in a test or manual check)
