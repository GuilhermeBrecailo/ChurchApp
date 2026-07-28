# Motion UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reusable Motion (`motion-v`) animation primitives to the AppChurch Nuxt frontend and apply them to the highest-impact screens (auth/onboarding, public church landing, admin/dashboard) without changing the existing Vuetify/Tailwind visual base.

**Architecture:** Install `motion-v` and its Nuxt module (auto-imports `motion.*` tags and `AnimatePresence`). Build five small presentational wrapper components under `web/app/components/motion/`: `PageTransition`, `FadeInUp`, `StaggerGroup`, `StaggerItem`, `PressableScale`. Wire `PageTransition` into the three layouts and `MotionConfig` into `app.vue` for reduced-motion support. Then apply the primitives page-by-page in small, independently reviewable tasks.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, `motion-v` (Motion for Vue), Vuetify 4, Tailwind CSS.

## Global Constraints

- Root working directory for all `npm` commands unless stated otherwise: `C:\Users\user\Documents\dev\ChurchApp`.
- Every task's verification step is `npm run web:build` (root script, runs `nuxt build` in `web/`) — the repo's frontend has no component test framework (`web/package.json` has no `vitest`/`@vue/test-utils`), so there is no unit-test cycle to run. This matches the approved design spec (`docs/superpowers/specs/2026-07-28-motion-ui-polish-design.md`), which explicitly scoped out unit tests for these presentational wrappers.
- Do not change Vuetify theme tokens, Tailwind config, or any non-animation styling.
- Do not touch files outside the ones listed per task.
- The raw `motion.div` tag (auto-imported globally by the `motion-v/nuxt` module, no per-file `import` needed once Task 1 is done) is used directly only in `PressableScale.vue` and `PageTransition.vue`. Everywhere else, use the custom primitives below, which pick their own underlying tag via a `tag` prop.
- Custom primitive component files live in `web/app/components/motion/` and are consumed via Nuxt's auto-import naming: `motion/FadeInUp.vue` → `<MotionFadeInUp>`, `motion/StaggerGroup.vue` → `<MotionStaggerGroup>`, `motion/StaggerItem.vue` → `<MotionStaggerItem>`, `motion/PressableScale.vue` → `<MotionPressableScale>`, `motion/PageTransition.vue` → `<MotionPageTransition>`.

---

### Task 1: Install `motion-v` and register the Nuxt module

**Files:**
- Modify: `web/package.json` (via `npm install`)
- Modify: `web/nuxt.config.ts:5`

**Interfaces:**
- Produces: the `motion-v/nuxt` Nuxt module active, which globally auto-imports `motion.*` tags, `AnimatePresence`, and `MotionConfig` for every later task.

- [ ] **Step 1: Install the dependency**

Run from `web/`:

```bash
npm install motion-v
```

- [ ] **Step 2: Register the Nuxt module**

In `web/nuxt.config.ts`, the `modules` array currently reads:

```ts
  modules: ["@nuxtjs/tailwindcss", "vuetify-nuxt-module"],
```

Change it to:

```ts
  modules: ["@nuxtjs/tailwindcss", "vuetify-nuxt-module", "motion-v/nuxt"],
```

- [ ] **Step 3: Verify the build**

Run from the repo root:

```bash
npm run web:build
```

Expected: build succeeds with no errors (no visual change yet — this task only wires up the module).

- [ ] **Step 4: Commit**

```bash
git add web/package.json web/package-lock.json web/nuxt.config.ts
git commit -m "chore(web): install motion-v and register nuxt module"
```

---

### Task 2: Create the reusable motion primitives

**Files:**
- Create: `web/app/components/motion/FadeInUp.vue`
- Create: `web/app/components/motion/StaggerGroup.vue`
- Create: `web/app/components/motion/StaggerItem.vue`
- Create: `web/app/components/motion/PressableScale.vue`

**Interfaces:**
- Consumes: global `motion.div` (from Task 1's `motion-v/nuxt` module).
- Produces:
  - `<MotionFadeInUp :tag="string" :delay="number" :in-view="boolean">` — fades/slides its default slot in. `tag` is the underlying HTML tag to render (e.g. `"div"`, `"header"`, `"section"`), defaults to `"div"` — use it to animate a semantic element in place instead of adding an extra wrapper `<div>`. `delay` defaults to `0`. `in-view` defaults to `false` (animates on mount); when `true`, animates when scrolled into view instead, once.
  - `<MotionStaggerGroup :tag="string" :stagger="number" :delay="number">` — parent container; must wrap one or more `<MotionStaggerItem>` children directly. `tag` defaults to `"div"`. `stagger` (seconds between each child) defaults to `0.08`. `delay` (seconds before the first child starts) defaults to `0`.
  - `<MotionStaggerItem :tag="string">` — a single animated child of `<MotionStaggerGroup>`. `tag` defaults to `"div"`.
  - `<MotionPressableScale :scale="number">` — wraps its default slot in a block-level `<div>` that scales down on press/tap and up slightly on hover. Always renders a wrapper `<div>` (no `tag` prop) because it's only ever used around existing components (`v-btn`, `v-card`) that can't be replaced by a motion tag directly. `scale` (press scale factor) defaults to `0.97`.

- [ ] **Step 1: Create `FadeInUp.vue`**

```vue
<script setup lang="ts">
import { computed } from "vue";
import { motion } from "motion-v";

const props = withDefaults(
  defineProps<{
    tag?: keyof HTMLElementTagNameMap;
    delay?: number;
    inView?: boolean;
  }>(),
  {
    tag: "div",
    delay: 0,
    inView: false,
  },
);

const motionTag = computed(() => motion[props.tag]);
</script>

<template>
  <component
    :is="motionTag"
    :initial="{ opacity: 0, y: 16 }"
    :animate="inView ? undefined : { opacity: 1, y: 0 }"
    :while-in-view="inView ? { opacity: 1, y: 0 } : undefined"
    :viewport="inView ? { once: true, margin: '-80px' } : undefined"
    :transition="{ duration: 0.4, ease: 'easeOut', delay }"
  >
    <slot />
  </component>
</template>
```

- [ ] **Step 2: Create `StaggerGroup.vue`**

```vue
<script setup lang="ts">
import { computed } from "vue";
import { motion } from "motion-v";

const props = withDefaults(
  defineProps<{
    tag?: keyof HTMLElementTagNameMap;
    stagger?: number;
    delay?: number;
  }>(),
  {
    tag: "div",
    stagger: 0.08,
    delay: 0,
  },
);

const motionTag = computed(() => motion[props.tag]);

const containerVariants = computed(() => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: props.stagger,
      delayChildren: props.delay,
    },
  },
}));
</script>

<template>
  <component :is="motionTag" :variants="containerVariants" initial="hidden" animate="show">
    <slot />
  </component>
</template>
```

- [ ] **Step 3: Create `StaggerItem.vue`**

```vue
<script setup lang="ts">
import { computed } from "vue";
import { motion } from "motion-v";

const props = withDefaults(
  defineProps<{
    tag?: keyof HTMLElementTagNameMap;
  }>(),
  {
    tag: "div",
  },
);

const motionTag = computed(() => motion[props.tag]);

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};
</script>

<template>
  <component :is="motionTag" :variants="itemVariants">
    <slot />
  </component>
</template>
```

- [ ] **Step 4: Create `PressableScale.vue`**

```vue
<script setup lang="ts">
withDefaults(
  defineProps<{
    scale?: number;
  }>(),
  {
    scale: 0.97,
  },
);
</script>

<template>
  <motion.div
    :while-hover="{ scale: 1.02 }"
    :while-press="{ scale }"
  >
    <slot />
  </motion.div>
</template>
```

- [ ] **Step 5: Verify the build**

Run from the repo root:

```bash
npm run web:build
```

Expected: build succeeds. These components aren't used anywhere yet, so there's still no visual change — this only proves they compile.

- [ ] **Step 6: Commit**

```bash
git add web/app/components/motion/FadeInUp.vue web/app/components/motion/StaggerGroup.vue web/app/components/motion/StaggerItem.vue web/app/components/motion/PressableScale.vue
git commit -m "feat(web): add reusable motion-v animation primitives"
```

---

### Task 3: Wire page transitions and reduced-motion support

**Files:**
- Create: `web/app/components/motion/PageTransition.vue`
- Modify: `web/app/app.vue`
- Modify: `web/app/layouts/default.vue:11` (the `<NuxtPage />` line)
- Modify: `web/app/layouts/public.vue:3` (the `<NuxtPage />` line)
- Modify: `web/app/layouts/notAppBottom.vue:3` (the `<NuxtPage />` line)

**Interfaces:**
- Consumes: global `motion.div`, `AnimatePresence` (from Task 1).
- Produces: `<MotionPageTransition />` — drop-in replacement for a bare `<NuxtPage />` inside a layout; fades/slides the page content on route change.

- [ ] **Step 1: Create `PageTransition.vue`**

```vue
<template>
  <NuxtPage v-slot="{ Component, route }">
    <AnimatePresence mode="wait">
      <motion.div
        :key="route.fullPath"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -8 }"
        :transition="{ duration: 0.18, ease: 'easeOut' }"
      >
        <component :is="Component" />
      </motion.div>
    </AnimatePresence>
  </NuxtPage>
</template>
```

- [ ] **Step 2: Wrap the app with `MotionConfig` for reduced-motion support**

In `web/app/app.vue`, currently:

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

Change to:

```vue
<template>
  <MotionConfig reduced-motion="user">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </MotionConfig>
</template>
```

- [ ] **Step 3: Swap `<NuxtPage />` for `<MotionPageTransition />` in the three layouts**

In `web/app/layouts/default.vue`, replace:

```vue
          <NuxtPage />
```

with:

```vue
          <MotionPageTransition />
```

In `web/app/layouts/public.vue`, replace:

```vue
      <NuxtPage />
```

with:

```vue
      <MotionPageTransition />
```

In `web/app/layouts/notAppBottom.vue`, replace:

```vue
      <NuxtPage />
```

with:

```vue
      <MotionPageTransition />
```

- [ ] **Step 4: Verify the build**

Run from the repo root:

```bash
npm run web:build
```

Expected: build succeeds.

- [ ] **Step 5: Manual visual check**

Run `npm run dev` inside `web/`, open `http://localhost:3000`, and navigate between at least two routes (e.g. `/login` → `/register`). Expected: page content fades/slides on route change instead of popping in instantly; no layout shift or duplicated content.

- [ ] **Step 6: Commit**

```bash
git add web/app/components/motion/PageTransition.vue web/app/app.vue web/app/layouts/default.vue web/app/layouts/public.vue web/app/layouts/notAppBottom.vue
git commit -m "feat(web): animate route transitions and respect reduced-motion"
```

---

### Task 4: Animate the auth pages (login, register, forgot-password)

**Files:**
- Modify: `web/app/pages/login.vue:2-3`, `:56-66`
- Modify: `web/app/pages/register.vue:2-3`, `:100-110`
- Modify: `web/app/pages/forgot-password.vue:2-3`, `:19-27`

**Interfaces:**
- Consumes: `<MotionFadeInUp>`, `<MotionPressableScale>` (from Task 2).

- [ ] **Step 1: Animate `login.vue`**

Replace the opening two lines:

```vue
  <div class="auth-page flex items-center justify-center min-h-screen p-4">
    <v-card class="auth-card w-full max-w-md" elevation="0">
```

with:

```vue
  <div class="auth-page flex items-center justify-center min-h-screen p-4">
    <MotionFadeInUp class="w-full max-w-md">
    <v-card class="auth-card w-full max-w-md" elevation="0">
```

Add the matching close right before the outer `</div>` at the end of the template (currently):

```vue
    </v-card>
  </div>
</template>
```

becomes:

```vue
    </v-card>
    </MotionFadeInUp>
  </div>
</template>
```

Wrap the submit button. Currently:

```vue
          <v-btn
            type="submit"
            block
            color="purple-darken-3"
            size="x-large"
            class="auth-btn text-none font-bold"
            rounded="xl"
            elevation="2"
            :loading="loading"
            :disabled="loading"
          >
            Entrar
          </v-btn>
```

becomes:

```vue
          <MotionPressableScale>
          <v-btn
            type="submit"
            block
            color="purple-darken-3"
            size="x-large"
            class="auth-btn text-none font-bold"
            rounded="xl"
            elevation="2"
            :loading="loading"
            :disabled="loading"
          >
            Entrar
          </v-btn>
          </MotionPressableScale>
```

- [ ] **Step 2: Animate `register.vue`**

Apply the identical pattern from Step 1: wrap the outer `<v-card class="auth-card ...">...</v-card>` in `<MotionFadeInUp class="w-full max-w-md">...</MotionFadeInUp>`, and wrap the `Cadastrar` submit `<v-btn type="submit" ...>` in `<MotionPressableScale>...</MotionPressableScale>`.

- [ ] **Step 3: Animate `forgot-password.vue`**

Wrap the outer `<v-card class="auth-card ...">...</v-card>` in `<MotionFadeInUp class="w-full max-w-md">...</MotionFadeInUp>`, and wrap the `Voltar para login` `<v-btn to="/login" ...>` in `<MotionPressableScale>...</MotionPressableScale>`.

- [ ] **Step 4: Verify the build**

```bash
npm run web:build
```

Expected: build succeeds.

- [ ] **Step 5: Manual visual check**

`npm run dev` in `web/`, open `/login`, `/register`, `/forgot-password`. Expected: the card fades/slides up on load, and the primary button scales slightly on hover/press.

- [ ] **Step 6: Commit**

```bash
git add web/app/pages/login.vue web/app/pages/register.vue web/app/pages/forgot-password.vue
git commit -m "feat(web): animate auth pages with fade-in card and pressable button"
```

---

### Task 5: Animate the onboarding church page

**Files:**
- Modify: `web/app/pages/onboarding/church.vue:1-4`

**Interfaces:**
- Consumes: `<MotionFadeInUp>` (from Task 2).

- [ ] **Step 1: Animate the page content wrapper**

Currently:

```vue
<template>
  <div class="min-h-screen bg-gray-50 px-4 py-8">
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
```

becomes (the plain wrapper `<div>` is replaced in place by `<MotionFadeInUp>`, which defaults to rendering a `<div>` itself — no extra nesting):

```vue
<template>
  <div class="min-h-screen bg-gray-50 px-4 py-8">
    <MotionFadeInUp class="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
```

Find the matching closing `</div>` for the wrapper (the second-to-last `</div>` before the final `</div></template>` at the end of the file) and replace it with `</MotionFadeInUp>`:

```vue
    </MotionFadeInUp>
  </div>
</template>
```

- [ ] **Step 2: Verify the build**

```bash
npm run web:build
```

Expected: build succeeds.

- [ ] **Step 3: Manual visual check**

`npm run dev` in `web/`, log in as a non-pastor user (or a pastor without a church) and open `/onboarding/church`. Expected: the whole card column fades/slides up on load.

- [ ] **Step 4: Commit**

```bash
git add web/app/pages/onboarding/church.vue
git commit -m "feat(web): animate onboarding church page entrance"
```

---

### Task 6: Animate the public church landing page

**Files:**
- Modify: `web/app/pages/c/[slug].vue:16-113`

**Interfaces:**
- Consumes: `<MotionFadeInUp>`, `<MotionStaggerGroup>`, `<MotionStaggerItem>` (from Task 2).

- [ ] **Step 1: Reveal the hero on load**

Currently (around line 16):

```vue
      <header class="landing-hero">
```

becomes (`tag="header"` keeps the real `<header>` element — no extra wrapper `<div>`):

```vue
      <MotionFadeInUp tag="header" class="landing-hero">
```

Replace its closing `</header>` (right before `<main class="landing-main">`) with `</MotionFadeInUp>`.

- [ ] **Step 2: Reveal "Próximos cultos" on scroll**

Currently:

```vue
        <section id="proximos-cultos" class="schedule-board-section">
```

becomes:

```vue
        <MotionFadeInUp id="proximos-cultos" tag="section" class="schedule-board-section" in-view>
```

Find this section's closing `</section>` (right before `<section class="feed-section">`) and replace it with `</MotionFadeInUp>`.

- [ ] **Step 3: Stagger the schedule list items**

Currently:

```vue
            <div v-if="visibleOccurrences.length" class="schedule-board-list">
              <article
                v-for="occurrence in visibleOccurrences"
                :key="occurrenceKey(occurrence)"
                class="schedule-board-row"
              >
                <time>{{ occurrence.time }}</time>
                <strong>{{ occurrence.label }}</strong>
                <span>{{ weekdayLabel(occurrence.weekday) }}</span>
              </article>
            </div>
```

becomes (the list `<div>` and each `<article>` are animated in place, no extra wrapper elements):

```vue
            <MotionStaggerGroup v-if="visibleOccurrences.length" class="schedule-board-list">
              <MotionStaggerItem
                v-for="occurrence in visibleOccurrences"
                :key="occurrenceKey(occurrence)"
                tag="article"
                class="schedule-board-row"
              >
                <time>{{ occurrence.time }}</time>
                <strong>{{ occurrence.label }}</strong>
                <span>{{ weekdayLabel(occurrence.weekday) }}</span>
              </MotionStaggerItem>
            </MotionStaggerGroup>
```

- [ ] **Step 4: Reveal the feed section on scroll**

Currently:

```vue
        <section class="feed-section">
```

becomes:

```vue
        <MotionFadeInUp tag="section" class="feed-section" in-view>
```

This section's closing `</section>` is the last one in the file, right before `</main>`. Replace it with `</MotionFadeInUp>`.

- [ ] **Step 5: Stagger the feed list items**

Currently:

```vue
          <div v-if="feedItems.length" class="feed-list">
            <article
              v-for="item in feedItems"
              :key="item.id"
              class="feed-card"
              :class="{ pinned: item.pinned }"
            >
              <span v-if="item.pinned" class="pinned-fold" aria-label="Fixado" />
              <div class="feed-card-meta">
                <span>{{ kindLabel(item.kind) }}</span>
                <time>{{ relativeDate(item.publishedAt) }}</time>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.body }}</p>
            </article>
          </div>
```

becomes:

```vue
          <MotionStaggerGroup v-if="feedItems.length" class="feed-list">
            <MotionStaggerItem
              v-for="item in feedItems"
              :key="item.id"
              tag="article"
              class="feed-card"
              :class="{ pinned: item.pinned }"
            >
              <span v-if="item.pinned" class="pinned-fold" aria-label="Fixado" />
              <div class="feed-card-meta">
                <span>{{ kindLabel(item.kind) }}</span>
                <time>{{ relativeDate(item.publishedAt) }}</time>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.body }}</p>
            </MotionStaggerItem>
          </MotionStaggerGroup>
```

- [ ] **Step 6: Verify the build**

```bash
npm run web:build
```

Expected: build succeeds.

- [ ] **Step 7: Manual visual check**

`npm run dev` in `web/`, open a valid `/c/:slug` URL for a seeded church. Expected: hero fades in on load; scrolling down reveals the "Próximos cultos" and feed sections; list rows/cards appear one after another instead of all at once.

- [ ] **Step 8: Commit**

```bash
git add "web/app/pages/c/[slug].vue"
git commit -m "feat(web): animate public church landing hero, sections and lists"
```

---

### Task 7: Animate the platform admin stats

**Files:**
- Modify: `web/app/pages/admin.vue:43-72`
- Modify: `web/app/components/Admin/StatCard.vue:1-2`

**Interfaces:**
- Consumes: `<MotionStaggerGroup>`, `<MotionStaggerItem>`, `<MotionPressableScale>` (from Task 2).

- [ ] **Step 1: Stagger the stats grid in `admin.vue`**

Currently:

```vue
    <div class="stats-grid mb-6">
      <AdminStatCard
        title="Igrejas"
        :value="adminChurches.length"
        :icon="Church"
        iconColor="#B5472A"
        bgColor="#F7E2D3"
      />
      <AdminStatCard
        title="Usuários"
        :value="platformTotals.users"
        :icon="Users"
        iconColor="#14B8A6"
        bgColor="#F0FDFA"
      />
      <AdminStatCard
        title="Ministérios"
        :value="platformTotals.departments"
        :icon="Building"
        iconColor="#C2542C"
        bgColor="#F7E2D3"
      />
      <AdminStatCard
        title="Ativas"
        :value="platformTotals.activeChurches"
        :icon="UserCheck"
        iconColor="#EAB308"
        bgColor="#FEFCE8"
      />
    </div>
```

becomes (the grid `<div>` is replaced in place by `<MotionStaggerGroup>`, which defaults to rendering a `<div>` itself; each `<AdminStatCard>` is a Vuetify-backed component so it's wrapped, not replaced):

```vue
    <MotionStaggerGroup class="stats-grid mb-6">
      <MotionStaggerItem>
        <AdminStatCard
          title="Igrejas"
          :value="adminChurches.length"
          :icon="Church"
          iconColor="#B5472A"
          bgColor="#F7E2D3"
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <AdminStatCard
          title="Usuários"
          :value="platformTotals.users"
          :icon="Users"
          iconColor="#14B8A6"
          bgColor="#F0FDFA"
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <AdminStatCard
          title="Ministérios"
          :value="platformTotals.departments"
          :icon="Building"
          iconColor="#C2542C"
          bgColor="#F7E2D3"
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <AdminStatCard
          title="Ativas"
          :value="platformTotals.activeChurches"
          :icon="UserCheck"
          iconColor="#EAB308"
          bgColor="#FEFCE8"
        />
      </MotionStaggerItem>
    </MotionStaggerGroup>
```

- [ ] **Step 2: Make each stat card pressable**

In `web/app/components/Admin/StatCard.vue`, currently:

```vue
<template>
  <v-card class="stat-card rounded-xl pa-4 elevation-1 d-flex flex-column">
    <v-avatar size="40" :color="computedBgColor" class="mb-3 rounded-lg">
      <component :is="icon" size="20" :color="computedIconColor" />
    </v-avatar>
    <h2
      class="text-h5 font-weight-bold text-grey-darken-4 mb-0"
      style="line-height: 1.2"
    >
      {{ value }}
    </h2>
    <p class="text-caption text-grey-darken-1 mb-0 mt-1">
      {{ title }}
    </p>
  </v-card>
</template>
```

becomes:

```vue
<template>
  <MotionPressableScale>
  <v-card class="stat-card rounded-xl pa-4 elevation-1 d-flex flex-column">
    <v-avatar size="40" :color="computedBgColor" class="mb-3 rounded-lg">
      <component :is="icon" size="20" :color="computedIconColor" />
    </v-avatar>
    <h2
      class="text-h5 font-weight-bold text-grey-darken-4 mb-0"
      style="line-height: 1.2"
    >
      {{ value }}
    </h2>
    <p class="text-caption text-grey-darken-1 mb-0 mt-1">
      {{ title }}
    </p>
  </v-card>
  </MotionPressableScale>
</template>
```

- [ ] **Step 3: Verify the build**

```bash
npm run web:build
```

Expected: build succeeds.

- [ ] **Step 4: Manual visual check**

`npm run dev` in `web/`, log in as a platform admin and open `/admin`. Expected: the four stat cards reveal one after another on load, and each scales slightly on hover/press.

- [ ] **Step 5: Commit**

```bash
git add web/app/pages/admin.vue web/app/components/Admin/StatCard.vue
git commit -m "feat(web): animate platform admin stats grid"
```

---

### Task 8: Animate the member/pastor dashboard

**Files:**
- Modify: `web/app/pages/index.vue:16-42`

**Interfaces:**
- Consumes: `<MotionStaggerGroup>`, `<MotionStaggerItem>` (from Task 2).

- [ ] **Step 1: Stagger the dashboard card sequence**

Currently:

```vue
      <template v-else>
        <DashboardTodayCard />

        <DashboardMyNextAssignmentCard />

        <DashboardNextScheduleCard :schedule="nextSchedule" />

        <DashboardDailyVerseCard />

        <DashboardAnnouncementsSection />

        <DashboardQuickAccess />

        <DashboardPrayerPreviewCard />

        <v-alert
          v-if="schedulesError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ schedulesError }}
        </v-alert>

        <DashboardUpcomingEvents :schedules="upcomingSchedules" />
      </template>
```

becomes:

```vue
      <template v-else>
        <MotionStaggerGroup>
        <MotionStaggerItem>
        <DashboardTodayCard />
        </MotionStaggerItem>

        <MotionStaggerItem>
        <DashboardMyNextAssignmentCard />
        </MotionStaggerItem>

        <MotionStaggerItem>
        <DashboardNextScheduleCard :schedule="nextSchedule" />
        </MotionStaggerItem>

        <MotionStaggerItem>
        <DashboardDailyVerseCard />
        </MotionStaggerItem>

        <MotionStaggerItem>
        <DashboardAnnouncementsSection />
        </MotionStaggerItem>

        <MotionStaggerItem>
        <DashboardQuickAccess />
        </MotionStaggerItem>

        <MotionStaggerItem>
        <DashboardPrayerPreviewCard />
        </MotionStaggerItem>

        <v-alert
          v-if="schedulesError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ schedulesError }}
        </v-alert>

        <MotionStaggerItem>
        <DashboardUpcomingEvents :schedules="upcomingSchedules" />
        </MotionStaggerItem>
        </MotionStaggerGroup>
      </template>
```

- [ ] **Step 2: Verify the build**

```bash
npm run web:build
```

Expected: build succeeds.

- [ ] **Step 3: Manual visual check**

`npm run dev` in `web/`, log in as a member/pastor whose church setup is complete and open `/`. Expected: the dashboard cards reveal one after another on load instead of appearing all at once.

- [ ] **Step 4: Commit**

```bash
git add web/app/pages/index.vue
git commit -m "feat(web): animate member dashboard card sequence"
```
