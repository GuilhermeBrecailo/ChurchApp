<template>
  <v-navigation-drawer
    v-if="desktop"
    permanent
    width="256"
    class="side-nav"
    aria-label="Navegação principal"
  >
    <nav class="side-nav-content">
      <section class="side-nav-group" aria-labelledby="side-nav-main">
        <h2 id="side-nav-main" class="side-nav-heading">Principal</h2>
        <NuxtLink
          v-for="item in primaryItems"
          :key="item.key"
          :to="item.route"
          class="side-nav-link"
          :class="{ 'side-nav-link--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
          :title="item.title"
        >
          <component :is="navigationIcons[item.icon]" size="18" aria-hidden="true" />
          <span>{{ item.title }}</span>
        </NuxtLink>
      </section>

      <section
        v-for="group in groups"
        :key="group.key"
        class="side-nav-group"
        :aria-labelledby="`side-nav-${group.key}`"
      >
        <h2 :id="`side-nav-${group.key}`" class="side-nav-heading">{{ group.label }}</h2>
        <NuxtLink
          v-for="item in group.items"
          :key="item.key"
          :to="item.route"
          class="side-nav-link"
          :class="{ 'side-nav-link--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
          :title="item.title"
        >
          <component :is="navigationIcons[item.icon]" size="18" aria-hidden="true" />
          <span>{{ item.title }}</span>
        </NuxtLink>
      </section>
    </nav>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { useAuth } from "../../../../composables/useAuth";
import {
  getBottomNavigationItems,
  getMoreNavigationItems,
  isNavigationItemActive,
  type RoleNavigationItem,
} from "../../../utils/roleNavigation";
import { groupNavigationItems } from "../../../utils/navigationGroups";
import { navigationIcons } from "../../../utils/navigationIcons";

const { user } = useAuth();
const route = useRoute();
const { mdAndUp } = useDisplay();
const desktop = computed(() => mdAndUp.value);

// "Principal" repete a ordem da barra inferior do celular, para quem alterna
// entre os dois tamanhos de tela encontrar os mesmos atalhos no topo.
const primaryItems = computed(() =>
  getBottomNavigationItems(user.value).filter((item) => item.key !== "more"),
);

const groups = computed(() => {
  const primaryKeys = new Set(primaryItems.value.map((item) => item.key));
  return groupNavigationItems(
    getMoreNavigationItems(user.value).filter((item) => !primaryKeys.has(item.key)),
  );
});

// Destaca só o atalho mais específico (ex.: /admin/pessoas acende "Pessoas",
// não também "Cargos e permissões" que aponta para a mesma página).
const activeKey = computed(() => {
  const candidates = [...primaryItems.value, ...groups.value.flatMap((group) => group.items)]
    .filter((item) => isNavigationItemActive(item, route.path));
  const exact = candidates.find((item) => item.route === route.fullPath);
  if (exact) return exact.key;

  return candidates.sort(
    (first, second) =>
      Math.max(...second.matchPrefixes.map((prefix) => prefix.length)) -
      Math.max(...first.matchPrefixes.map((prefix) => prefix.length)),
  )[0]?.key;
});

const isActive = (item: RoleNavigationItem) => item.key === activeKey.value;
</script>

<style scoped>
.side-nav {
  background: var(--app-color-shell-bg) !important;
  border-right: 1px solid var(--app-color-shell-border) !important;
}

.side-nav-content {
  box-sizing: border-box;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  padding: 16px 12px 24px;
}

.side-nav-group {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
}

.side-nav-heading {
  margin: 0 0 6px;
  padding: 0 12px;
  color: var(--app-color-text-muted);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.side-nav-link {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  color: var(--app-color-text-soft);
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.side-nav-link svg {
  flex-shrink: 0;
  color: var(--app-color-text-muted);
  transition: color 0.16s ease;
}

.side-nav-link span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-nav-link:hover {
  background: var(--app-color-surface-soft);
  color: var(--app-color-text);
}

.side-nav-link:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.side-nav-link--active,
.side-nav-link--active:hover {
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-weight: 800;
}

.side-nav-link--active svg {
  color: var(--app-color-accent);
}
</style>
