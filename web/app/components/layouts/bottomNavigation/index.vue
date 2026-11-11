<template>
  <v-bottom-navigation
    v-if="tabs.length"
    class="bottom-nav"
    aria-label="Navegação principal"
    height="68"
    bg-color="transparent"
    app
  >
    <v-btn
      v-for="tab in tabs"
      :key="tab.key"
      class="flex-col custom-btn"
      :active="tab.key === ownerTab"
      :aria-current="tab.key === ownerTab ? 'page' : undefined"
      :to="tab.route"
    >
      <component :is="navigationIcons[tab.icon]" class="nav-icon" aria-hidden="true" />
      <span class="nav-label">{{ tab.label }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "../../../../composables/useAuth";
import { getOwnerTab, getPrimaryTabs } from "../../../utils/roleNavigation";
import { navigationIcons } from "../../../utils/navigationIcons";

const { user } = useAuth();
const route = useRoute();

const tabs = computed(() => getPrimaryTabs(user.value));
const ownerTab = computed(() => getOwnerTab(user.value, route.path));
</script>

<style scoped>
.bottom-nav {
  width: 100%;
  max-width: 100vw;
  background: var(--app-color-shell-bg) !important;
  border-top: 1px solid var(--app-color-shell-border) !important;
  border-radius: 16px 16px 0 0 !important;
  padding: 4px max(4px, env(safe-area-inset-right)) calc(4px + env(safe-area-inset-bottom))
    max(4px, env(safe-area-inset-left));
  overflow: hidden;
  box-shadow: 0 -4px 18px rgba(31, 30, 29, 0.06) !important;
}

.nav-label {
  display: block;
  width: 100%;
  overflow: hidden;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.05;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.01em;
  transition: font-weight 0.15s ease !important;
}

.custom-btn.v-btn--active .nav-label {
  font-weight: 800;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}

.custom-btn {
  flex: 1 1 0;
  min-width: 0 !important;
  max-width: none;
  color: var(--app-color-text-muted) !important;
  border-radius: 14px !important;
  margin: 0 2px;
  height: 58px !important;
  padding: 4px 2px !important;
  transition:
    color 0.2s ease !important;
  background-color: transparent !important;
}

.custom-btn :deep(.v-btn__content) {
  display: flex;
  min-width: 0;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.custom-btn .nav-icon {
  transition: transform var(--app-motion-duration-base) var(--app-motion-ease-standard) !important;
}

.custom-btn.v-btn--active {
  color: var(--app-color-accent) !important;
  background-color: var(--app-color-accent-tint) !important;
}

.custom-btn.v-btn--active .nav-icon {
  transform: scale(1.06) !important;
}

.custom-btn:hover > .v-btn__overlay {
  opacity: 0 !important;
}

@media (max-width: 390px) {
  .bottom-nav {
    height: 60px !important;
    padding-inline: 2px;
  }

  .custom-btn {
    height: 50px !important;
    padding-inline: 1px !important;
  }

  .nav-label {
    /* 390px é a largura da maioria dos iPhones: 0.62rem (~10px) era pequeno
       demais para ler o nome da aba. */
    font-size: 0.68rem;
  }

  .nav-icon {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 340px) {
  .nav-label {
    font-size: 0.58rem;
  }
}
</style>
