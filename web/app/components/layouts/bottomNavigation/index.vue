<template>
  <v-bottom-navigation
    class="bottom-nav"
    height="68"
    :bg-color="isDark ? 'transparent' : 'transparent'"
    app
  >
    <v-btn to="/" class="flex-col custom-btn" exact>
      <House class="nav-icon" />
      <span class="nav-label">Início</span>
    </v-btn>

    <v-btn v-if="hasChurch" to="/content" class="flex-col custom-btn">
      <BookOpen class="nav-icon" />
      <span class="nav-label">Conteúdo</span>
    </v-btn>

    <v-btn
      v-if="hasChurch"
      to="/ministery"
      class="flex-col custom-btn"
      :active="$route.path.startsWith('/ministery')"
    >
      <Users class="nav-icon" />
      <span class="nav-label">Ministérios</span>
    </v-btn>
    <v-btn
      to="/user"
      class="flex-col custom-btn"
      :active="$route.path.startsWith('/user')"
    >
      <User class="nav-icon" />
      <span class="nav-label">Usuário</span>
    </v-btn>

    <v-btn v-if="showAdmin" to="/admin" class="flex-col custom-btn">
      <Cog class="nav-icon" />
      <span class="nav-label mt-1">{{ adminLabel }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { House, BookOpen, User, Users, Cog } from "lucide-vue-next";
import { computed } from "vue";
import { useAuth } from "../../../../composables/useAuth";

const { user } = useAuth();
const { isDark } = useThemeMode();

const hasChurch = computed(() => user.value?.hasChurch === true);
const isPlatformAdmin = computed(
  () =>
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const showAdmin = computed(() => hasChurch.value || isPlatformAdmin.value);
const adminLabel = computed(() => "Admin");
</script>

<style scoped>
.bottom-nav {
  width: 100%;
  max-width: 100vw;
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(229, 231, 235, 0.6) !important;
  border-radius: 20px 20px 0 0 !important;
  padding: 4px max(4px, env(safe-area-inset-right)) calc(4px + env(safe-area-inset-bottom))
    max(4px, env(safe-area-inset-left));
  overflow: hidden;
  box-shadow: 0 -4px 24px rgba(17, 24, 39, 0.06) !important;
}

:global(.app-theme-dark) .bottom-nav {
  background: rgba(21, 27, 35, 0.92) !important;
  border-top-color: rgba(45, 55, 70, 0.5) !important;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.2) !important;
}

.nav-label {
  display: block;
  width: 100%;
  overflow: hidden;
  font-size: 0.68rem;
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
  color: #9ca3af !important;
  border-radius: 14px !important;
  margin: 0 2px;
  height: 58px !important;
  padding: 4px 2px !important;
  transition:
    color 0.2s ease !important;
  background-color: transparent !important;
}

:global(.app-theme-dark) .custom-btn {
  color: var(--app-color-text-muted) !important;
}

:global(html.app-theme-dark) :deep(.custom-btn) {
  color: var(--app-color-text-muted) !important;
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
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.custom-btn.v-btn--active {
  color: #4f46e5 !important;
  background-color: transparent !important;
}

.custom-btn.v-btn--active .nav-icon {
  transform: scale(1.18) !important;
}

:global(.app-theme-dark) .custom-btn.v-btn--active {
  color: var(--app-color-accent) !important;
  background-color: transparent !important;
}

:global(html.app-theme-dark) :deep(.custom-btn.v-btn--active) {
  color: var(--app-color-accent) !important;
  background-color: transparent !important;
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
    font-size: 0.62rem;
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
