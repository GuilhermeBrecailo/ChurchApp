## 1. Avatar Dinâmico no AppBar

- [x] 1.1 Em `web/app/components/layouts/appBar/index.vue`, criar computed `userInitials` que extrai as iniciais do `user.value.name` (primeira + última parte, max 2 letras, fallback `"U"`)
- [x] 1.2 Substituir o texto hardcoded `"GB"` no template pelo `{{ userInitials }}`

## 2. Gradiente no Fundo do Login

- [x] 2.1 Em `web/app/pages/login.vue`, atualizar o background da `.auth-page` no `<style scoped>` de `#f8fafc` sólido para `linear-gradient(150deg, #eef2ff 0%, #f5f3ff 60%, #fdf4ff 100%)`
- [x] 2.2 Override no dark mode: `:global(.app-theme-dark) .auth-page` usa `background: var(--app-color-background)`

## 3. Ícones nos Cards de Stats (Escalas)

- [x] 3.1 Em `web/app/pages/scale.vue`, `Clock`, `EyeOff` e `Repeat2` já importados de `lucide-vue-next`
- [x] 3.2 Ícone `Clock`, `EyeOff`, `Repeat2` já presentes nos `.leader-summary-card` (Pendentes, Não viram, Trocas)
- [x] 3.3 Ícones estilizados com `color="#A855F7"` e `size="20"`

## 4. CTA no Empty State do NextScheduleCard

- [x] 4.1 `<NuxtLink to="/scale">` com `v-btn` já existe em `web/app/components/Dashboard/NextScheduleCard/index.vue`
- [x] 4.2 Botão com `color="purple-darken-3"`, `variant="tonal"`, `size="small"`, label "Ver escalas"

## 5. Documentação do Padrão de Design Tokens (próximos passos)

- [ ] 5.1 Ao criar novos componentes com cor de accent em CSS customizado, usar sempre `var(--app-color-accent)` em vez de hex inline — conforme spec `ui-design-tokens`
- [ ] 5.2 Em um change futuro dedicado, varrer o codebase e migrar os usos de `#A855F7` e `#6d28d9` em `<style scoped>` para `var(--app-color-accent)` onde não há restrição de props Vuetify
