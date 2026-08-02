## 1. Back/close controls

- [ ] 1.1 Add `router.back()` + `ChevronLeft` header control to `register.vue`
- [ ] 1.2 Add back control to `onboarding/church.vue`
- [ ] 1.3 Add back control to `forgot-password.vue`
- [ ] 1.4 Add back control to `content/devotionals.vue`
- [ ] 1.5 Add back control to `content/verse.vue`
- [ ] 1.6 Add back control to `content/index.vue`

## 2. Loading states

- [ ] 2.1 Add `v-skeleton-loader` (form-shaped) to `forgot-password.vue`
- [ ] 2.2 Add `v-skeleton-loader` (card-grid-shaped) to `content/index.vue`
- [ ] 2.3 Add loading state to `c/[slug].vue` public landing page

## 3. Expansion pattern

- [ ] 3.1 Replace the `<details>` song-preference panel in `ministery/[id].vue` with `UtilsResponsiveOverlay`
- [ ] 3.2 Sweep the rest of `web/app` for other native `<details>`/ad-hoc inline-expansion usage and convert (`grep -rn "<details" web/app`)

## 4. Documentation

- [ ] 4.1 Add a "Frontend screen conventions" note to `CLAUDE.md` documenting the three rules (back/close, loading state, shared overlay for expansion) with the canonical examples (`content/bible.vue` for back button, `UtilsResponsiveOverlay` usage in `scale.vue`/`ministery/[id].vue` for expansion)

## 5. Verification

- [ ] 5.1 Manual smoke test: navigate into each of the 6 fixed screens and confirm the back control returns correctly
- [ ] 5.2 Manual smoke test: throttle network (devtools) and confirm each fixed screen shows a loading state before content
- [ ] 5.3 Manual smoke test: open the song-preference panel and confirm it now behaves like other bottom sheets in the app
- [ ] 5.4 Run `npm run web:build`
