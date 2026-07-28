# Motion UI Polish — Design

## Contexto

O AppChurch (Nuxt 4 + Vue 3 + Vuetify 4 + Tailwind) tem uma interface funcional mas sem
nenhuma animação de entrada, transição de página ou micro-interação. O pedido é deixar o
app mais bonito adicionando animações com a lib Motion (versão oficial para Vue: `motion-v`),
mantendo a base visual atual (Vuetify + Tailwind) em vez de trocar componentes ou tokens
de design.

## Objetivo

Criar uma base reutilizável de animação e aplicá-la nas telas de maior impacto visual
primeiro: autenticação/onboarding, landing pública e painel admin. O restante do app
(ministérios, escalas, conteúdo, perfil) reaplica o mesmo padrão numa passada futura —
fora do escopo deste plano, para não virar um trabalho sem fim.

## Arquitetura

- Dependência nova: `motion-v` (adicionada em `web/package.json`).
- Novos componentes de apresentação em `web/app/components/ui/motion/`:
  - `PageTransition.vue` — fade + leve slide na troca de rota. Plugado nos três layouts
    (`app/layouts/default.vue`, `public.vue`, `notAppBottom.vue`) envolvendo o `<slot />`/`<NuxtPage />`.
  - `FadeInUp.vue` — fade + deslocamento vertical ao montar. Suporta um prop `inView`
    (usa `whileInView` do motion-v) para revelar ao rolar a página.
  - `StaggerGroup.vue` — anima os filhos em cascata (delay incremental), usado em listas
    de cards.
  - `PressableScale.vue` — leve scale no hover/tap, usado em botões e cards clicáveis.
- Todos os primitivos são componentes puros de apresentação: sem store, sem composable,
  sem estado além do que o motion-v já gerencia internamente.
- Acessibilidade: motion-v respeita `prefers-reduced-motion` nativamente — nenhum código
  extra necessário para isso.
- SSR: motion-v suporta SSR/hydration do Nuxt; os primitivos devem renderizar o conteúdo
  normalmente mesmo antes da hidratação (progressive enhancement).

## Rollout (escopo deste plano)

1. **Fundação** — instalar `motion-v`, criar os 4 primitivos, plugar `PageTransition` nos
   3 layouts.
2. **Autenticação/Onboarding** — `login.vue`, `register.vue`, `forgot-password.vue`,
   `onboarding/church.vue`: cards entram com `FadeInUp`, botões principais usam
   `PressableScale`.
3. **Landing pública** (`pages/c/[slug].vue` + `components/Public/*`) — seções (hero,
   próximos cultos, avisos) revelam com `FadeInUp inView`; listas usam `StaggerGroup`.
4. **Painel admin** (`pages/admin.vue` + `components/Dashboard/*`) — cards do dashboard
   revelam em cascata ao carregar (`StaggerGroup`); cards/botões interativos usam
   `PressableScale`.

Fora de escopo (fase futura, não faz parte deste plano): ministérios, escalas,
conteúdo/devocionais, perfil de usuário — reaplicam os mesmos primitivos depois.

## Testes

- `npm run web:build` e `npm run validate` (raiz) continuam passando sem erro.
- Verificação visual manual no `npm run dev` do `web/`: login, onboarding, landing
  pública e admin — confirmar que as animações aparecem e que a navegação normal
  continua funcionando (sem flash de conteúdo, sem quebra de layout).
- Sem testes unitários para os wrappers de animação (não há lógica de negócio a testar).

## Erros e casos de borda

- Se `motion-v` falhar ao carregar/hidratar, o conteúdo dos primitivos deve continuar
  visível (eles envolvem o conteúdo real, nunca o substituem).
- Usuários com `prefers-reduced-motion` ativado recebem as telas sem animação, tratado
  automaticamente pela lib.
