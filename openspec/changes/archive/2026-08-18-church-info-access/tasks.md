## 1. Public page link in admin

- [ ] 1.1 Add "Ver página pública" button in `admin.vue`'s Geral tab, bound to the existing `publicLandingUrl` computed value, `target="_blank"`

## 2. Member-facing church info

- [ ] 2.1 Add a "Dados da Igreja" entry point (button/list item) in `settings.vue`
- [ ] 2.2 Build the read-only info panel via `UtilsResponsiveOverlay`: logo, name, assembled address, service times
- [ ] 2.3 Confirm/reuse the composable+endpoint `church-landing-page`'s `/c/[slug].vue` uses for recurring service times; add a minimal read call if not already available on `AuthChurch`
- [ ] 2.4 Add the same "Ver página pública" link inside this panel

## 3. Verification

- [ ] 3.1 Manual smoke test as a `MEMBRO`-role user: can open and view "Dados da Igreja" without manage permissions
- [ ] 3.2 Manual smoke test: "Ver página pública" from both admin and settings opens the correct `/c/:slug` page
- [ ] 3.3 Manual smoke test as a manager: Admin → Geral editing still works unchanged
- [ ] 3.4 Run `npm run web:build`
