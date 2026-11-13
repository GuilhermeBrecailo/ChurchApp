<template>
  <v-navigation-drawer
    v-if="desktop && tabs.length"
    permanent
    width="256"
    class="side-nav"
    aria-label="Navegação principal"
  >
    <div class="side-nav-shell">
      <nav class="side-nav-content">
        <template v-for="tab in mainTabs" :key="tab.key">
          <NuxtLink
            :to="tab.route"
            class="side-nav-link"
            :class="{ 'side-nav-link--active': tab.key === ownerTab && !activeSubKey }"
            :aria-current="tab.key === ownerTab && !activeSubKey ? 'page' : undefined"
            :title="tab.title"
          >
            <component :is="navigationIcons[tab.icon]" size="20" aria-hidden="true" />
            <span>{{ tab.label }}</span>
          </NuxtLink>

          <!-- Gestão: uma seção com seta para abrir/fechar (padrão da barra
               lateral da Apple: no máximo dois níveis, grupos recolhíveis). -->
          <section v-if="tab.key === 'management'" class="side-nav-section" aria-label="Gestão">
            <button
              type="button"
              class="side-nav-disclosure"
              :aria-expanded="managementOpen"
              aria-controls="side-nav-management"
              @click="toggleManagement"
            >
              <span>Ferramentas de gestão</span>
              <ChevronDown size="16" aria-hidden="true" :class="{ 'side-nav-chevron--closed': !managementOpen }" />
            </button>
            <div v-show="managementOpen" id="side-nav-management" class="side-nav-sub">
              <NuxtLink
                v-for="item in managementFlat"
                :key="item.key"
                :to="item.route"
                class="side-nav-link side-nav-link--sub"
                :class="{ 'side-nav-link--active': activeSubKey === item.key }"
                :aria-current="activeSubKey === item.key ? 'page' : undefined"
                :title="item.description"
              >
                <component :is="navigationIcons[item.icon]" size="17" aria-hidden="true" />
                <span>{{ item.label }}</span>
              </NuxtLink>
            </div>
          </section>

          <!-- Líder: os ministérios dele, um clique cada. -->
          <div v-if="tab.key === 'ministries' && leaderMinistries.length > 1" class="side-nav-sub side-nav-sub--list">
            <NuxtLink
              v-for="ministry in leaderMinistries"
              :key="ministry.id"
              :to="`/ministery/${ministry.id}`"
              class="side-nav-link side-nav-link--sub"
              :class="{ 'side-nav-link--active': activeSubKey === `ministry:${ministry.id}` }"
              :aria-current="activeSubKey === `ministry:${ministry.id}` ? 'page' : undefined"
            >
              <span class="side-nav-dot" aria-hidden="true" />
              <span>{{ ministry.name }}</span>
            </NuxtLink>
          </div>
        </template>
      </nav>

      <NuxtLink
        v-if="profileTab"
        :to="profileTab.route"
        class="side-nav-profile"
        :class="{ 'side-nav-profile--active': ownerTab === 'profile' }"
        :aria-current="ownerTab === 'profile' ? 'page' : undefined"
        title="Meu perfil"
      >
        <v-avatar size="38" class="accent-avatar side-nav-profile-avatar">
          <v-img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="" cover />
          <span v-else>{{ initials }}</span>
        </v-avatar>
        <span class="side-nav-profile-copy">
          <span class="side-nav-profile-name">{{ user?.name || "Meu perfil" }}</span>
          <span class="side-nav-profile-hint">Perfil e preferências</span>
        </span>
      </NuxtLink>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ChevronDown } from "lucide-vue-next";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { useState } from "#app";
import { useAuth } from "../../../../composables/useAuth";
import { useDepartments } from "../../../../composables/useDepartments";
import { isChurchManager, ministryIdsWithPermissions } from "../../../utils/churchAccess";
import { getInitials } from "../../../utils/initials";
import {
  getManagementItems,
  getOwnerTab,
} from "../../../utils/roleNavigation";
import { navigationIcons } from "../../../utils/navigationIcons";

const { user } = useAuth();
const route = useRoute();
const { mdAndUp } = useDisplay();
const { getDepartments } = useDepartments();
const desktop = computed(() => mdAndUp.value);

// Líder de um ministério só: a aba vira o nome dele e abre direto.
const { tabs } = usePrimaryTabs();
const mainTabs = computed(() => tabs.value.filter((tab) => tab.key !== "profile"));
const profileTab = computed(() => tabs.value.find((tab) => tab.key === "profile"));
const ownerTab = computed(() => getOwnerTab(user.value, route.path));
const hasManagementTab = computed(() => tabs.value.some((tab) => tab.key === "management"));
const hasMinistriesTab = computed(() => tabs.value.some((tab) => tab.key === "ministries"));
const managementGroups = computed(() =>
  hasManagementTab.value ? getManagementItems(user.value) : [],
);
const initials = computed(() => getInitials(user.value?.name));
const managementFlat = computed(() => managementGroups.value.flatMap((group) => group.items));

// Seção de gestão aberta/fechada: lembrada neste aparelho.
const MANAGEMENT_OPEN_KEY = "side-nav-management-open";
const readManagementOpen = () => {
  try {
    return localStorage.getItem(MANAGEMENT_OPEN_KEY) !== "0";
  } catch {
    return true;
  }
};
const managementOpen = ref(import.meta.client ? readManagementOpen() : true);
const toggleManagement = () => {
  managementOpen.value = !managementOpen.value;
  try {
    localStorage.setItem(MANAGEMENT_OPEN_KEY, managementOpen.value ? "1" : "0");
  } catch {
    /* sem storage: só não lembra */
  }
};

// Ministérios do líder: buscados uma vez por sessão/igreja.
const leaderMinistries = useState<Array<{ id: string; name: string }>>(
  "nav-leader-ministries",
  () => [],
);
const leaderMinistriesKey = useState<string | null>("nav-leader-ministries-key", () => null);

const loadLeaderMinistries = async () => {
  const key = `${user.value?.id}:${user.value?.activeChurchId ?? user.value?.crunchId}`;
  if (!hasMinistriesTab.value || !desktop.value || leaderMinistriesKey.value === key) return;
  leaderMinistriesKey.value = key;

  const { data } = await getDepartments();
  const ids = new Set(ministryIdsWithPermissions(user.value as never));
  // Na pré-visualização "como líder" o pastor não tem cargo de ministério:
  // mostra os que ele lidera.
  const previewing = isChurchManager(user.value as never);
  leaderMinistries.value = (data ?? [])
    .filter((ministry) => ministry.isActive !== false)
    .filter((ministry) => ids.has(ministry.id) || (previewing && ministry.leaderId === user.value?.id))
    .map((ministry) => ({ id: ministry.id, name: ministry.name }))
    .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));
};

watch([hasMinistriesTab, desktop, () => user.value?.id], loadLeaderMinistries, { immediate: true });

const pathOf = (target: string) => target.split("?")[0] ?? target;

// Destaca o subitem mais específico (ex.: /pessoas/cuidado acende "Cuidado",
// não "Pessoas"); na falta de um, a aba dona fica acesa.
const activeSubKey = computed(() => {
  const path = route.path;

  const ministryMatch = leaderMinistries.value.find(
    (ministry) => path === `/ministery/${ministry.id}` || path.startsWith(`/ministery/${ministry.id}/`),
  );
  if (hasMinistriesTab.value && ministryMatch) return `ministry:${ministryMatch.id}`;

  const candidates = managementGroups.value
    .flatMap((group) => group.items)
    .filter((item) => {
      const itemPath = pathOf(item.route);
      const matches = path === itemPath || path.startsWith(`${itemPath}/`);
      if (!matches) return false;
      const query = item.route.split("?")[1];
      return !query || route.fullPath.includes(query);
    })
    .sort((first, second) => second.route.length - first.route.length);

  return candidates[0]?.key ?? null;
});
</script>

<style scoped>
/* Barra lateral no padrão Apple (Mac/iPad): fundo cinza translúcido,
   linhas simples, ícones na cor de destaque, item ativo com realce suave. */
.side-nav {
  background: var(--app-color-shell-bg) !important;
  border-right: 1px solid var(--app-color-shell-border) !important;
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
}

.side-nav :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}

.side-nav-shell {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  width: 100%;
}

.side-nav-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 2px;
  padding: 14px 10px;
  flex: 1 1 auto;
}

.side-nav-section {
  display: grid;
  margin-top: 14px;
}

.side-nav-disclosure {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  width: 100%;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: left;
}

.side-nav-disclosure:hover {
  color: var(--app-color-text);
}

.side-nav-disclosure:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.side-nav-disclosure svg {
  transition: transform 0.2s ease;
}

.side-nav-chevron--closed {
  transform: rotate(-90deg);
}

.side-nav-sub {
  display: grid;
  gap: 0;
}

.side-nav-sub--list {
  margin: 2px 0 6px 20px;
}

.side-nav-link {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 10px;
  border-radius: 8px;
  color: var(--app-color-text);
  font-size: 0.94rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.side-nav-link--sub {
  min-height: 44px;
  font-size: 0.9rem;
}

.side-nav-link svg {
  flex-shrink: 0;
  color: var(--app-color-accent);
}

.side-nav-link span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-nav-dot {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--app-color-border-strong);
}

.side-nav-link:hover {
  background: color-mix(in srgb, var(--app-color-text) 6%, transparent);
}

.side-nav-link:focus-visible,
.side-nav-profile:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.side-nav-link--active,
.side-nav-link--active:hover {
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-weight: 600;
}

.side-nav-link--active .side-nav-dot {
  background: var(--app-color-accent);
}

.side-nav-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 10px 12px;
  padding: 8px 10px;
  border-radius: 10px;
  color: var(--app-color-text);
  text-decoration: none;
  transition: background-color 0.16s ease;
}

.side-nav-profile:hover {
  background: color-mix(in srgb, var(--app-color-text) 6%, transparent);
}

.side-nav-profile--active {
  background: var(--app-color-accent-tint);
}

.side-nav-profile-avatar {
  flex: 0 0 auto;
  font-size: 0.82rem;
  font-weight: 700;
}

.side-nav-profile-copy {
  display: grid;
  min-width: 0;
}

.side-nav-profile-name,
.side-nav-profile-hint {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-nav-profile-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.side-nav-profile-hint {
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
}
</style>
